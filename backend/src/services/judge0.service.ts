import logger from '../utils/logger';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Judge0 language ID mapping
export const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  python3: 71,
  java: 62,
  cpp: 54,
  'c++': 54,
  c: 50,
  csharp: 51,
  'c#': 51,
  go: 60,
  rust: 73,
  ruby: 72,
  php: 68,
  swift: 83,
  kotlin: 78,
};

export interface CodeExecutionResult {
  stdout: string | null;
  stderr: string | null;
  status: { id: number; description: string; };
  time: string;
  memory: number;
  compile_output: string | null;
}

const LOCAL_LANGUAGE_MAP: Record<number, string> = {
  63: 'javascript',
  74: 'javascript', // Handle TS as JS locally
  71: 'python',
  62: 'java',
  54: 'cpp',
  50: 'c',
  51: 'csharp',
  60: 'go',
};

class Judge0Service {
  async executeCode(params: {
    sourceCode: string;
    languageId: number;
    stdin?: string;
    expectedOutput?: string;
    timeLimit?: number;
    memoryLimit?: number;
  }): Promise<CodeExecutionResult> {
    try {
      const language = LOCAL_LANGUAGE_MAP[params.languageId];
      if (!language) {
          throw new Error(`Language ID ${params.languageId} not supported locally`);
      }
      
      const tmpDir = os.tmpdir();
      const uniqueId = crypto.randomBytes(16).toString('hex');
      let ext = 'txt';
      if (language === 'javascript') ext = 'js';
      else if (language === 'python') ext = 'py';
      else if (language === 'java') ext = 'java';
      else if (language === 'cpp') ext = 'cpp';
      else if (language === 'c') ext = 'c';
      else if (language === 'go') ext = 'go';
      else if (language === 'csharp') ext = 'cs';
      const filepath = path.join(tmpDir, `code_${uniqueId}.${ext}`);
      
      let finalSrc = params.sourceCode;
      
      if (language === 'javascript' && params.stdin) {
         finalSrc += `
// --- Auto-Execution Wrapper ---
const fs = require('fs');

class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}

function __arrayToList(arr) {
    if (!Array.isArray(arr) || !arr.length) return null;
    let head = new ListNode(arr[0]);
    let curr = head;
    for (let i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
    }
    return head;
}

function __listToArray(node) {
    if (node === null) return [];
    let res = [];
    while (node && typeof node === 'object' && 'val' in node) {
        res.push(node.val);
        node = node.next;
    }
    return res;
}

try {
    const __stdin = fs.readFileSync(0, 'utf-8').trim();
    if (__stdin) {
        let __parsedArgs = [];
        let __isLinkedList = false;
        
        const __content = fs.readFileSync(__filename, 'utf8');
        const __funcMatch = __content.match(/(?:function\\s+|const\\s+|var\\s+|let\\s+)([a-zA-Z0-9_]+)\\s*(?:=|\\s*\\()/);
        const __funcName = __funcMatch ? (__funcMatch[1] === 'function' ? null : __funcMatch[1]) : null;

        if (__funcName) {
            if (__funcName.toLowerCase().includes('list') || __content.toLowerCase().includes('listnode') || __content.toLowerCase().includes('linked')) __isLinkedList = true;

            if (__stdin.includes('=')) {
                // Parse named variables format: "nums=[2,7], target=9"
                const __pairs = __stdin.split(/,(?![^\\[]*\\])/);
                __pairs.forEach(p => {
                    const parts = p.split('=');
                    if (parts.length >= 2) {
                        try { __parsedArgs.push(JSON.parse(parts.slice(1).join('=').trim())); } catch(e){}
                    }
                });
            } else {
                // Parse flat json structure: "[1,2,3,4,5]"
                try { 
                    let __val = JSON.parse(__stdin); 
                    if (__isLinkedList && Array.isArray(__val)) {
                        __val = __arrayToList(__val);
                    }
                    __parsedArgs.push(__val);
                } catch(e) { __parsedArgs.push(__stdin); }
            }
            
            // Auto invoke the target function with the parsed args
            let __result = eval(__funcName + ".apply(null, __parsedArgs)");
            
            if (__isLinkedList && (__result === null || (typeof __result === 'object' && 'val' in __result))) {
                console.log(JSON.stringify(__listToArray(__result)).replace(/\\s/g, ''));
            } else if (__result !== undefined) {
                console.log(JSON.stringify(__result).replace(/\\s/g, ''));
            }
        }
    }
} catch(e) {
    console.error("Execution error:", e.message);
}
`;
      }
      
      
      await fs.writeFile(filepath, finalSrc);

      return new Promise((resolve) => {
        let cmd = '';
        if (language === 'python') cmd = `python "${filepath}"`;
        else if (language === 'javascript') cmd = `node "${filepath}"`;
        else if (language === 'java') cmd = `java "${filepath}"`;
        else if (language === 'cpp') cmd = `g++ "${filepath}" -o "${filepath}.exe" && "${filepath}.exe"`;
        else if (language === 'c') cmd = `gcc "${filepath}" -o "${filepath}.exe" && "${filepath}.exe"`;
        else cmd = `node "${filepath}"`; // fallback
        
        let execProcess = exec(cmd, { timeout: 10000 }, async (error, stdout, stderr) => {
          try { await fs.unlink(filepath); } catch(e) {} // cleanup

          let statusId = 3;
          let statusDesc = 'Accepted';

          let isError = !!error || !!stderr;

          if (isError) {
            statusId = 11;
            statusDesc = 'Runtime Error';
          }

          // If we got an expected output to compare against
          if (params.expectedOutput && !isError) {
             const cleanStdout = (stdout || '').trim().replace(/\\s/g, '');
             const cleanExpected = (params.expectedOutput || '').trim().replace(/\\s/g, '');
             if (cleanStdout !== cleanExpected) {
                statusId = 4;
                statusDesc = 'Wrong Answer';
             }
          }

          resolve({
            stdout: stdout || null,
            stderr: stderr || (error ? error.message : null),
            status: { id: statusId, description: statusDesc },
            time: '0.1', 
            memory: 0,
            compile_output: null,
          });
        });
        
        if (params.stdin && execProcess.stdin) {
           execProcess.stdin.write(params.stdin);
           execProcess.stdin.end();
        }
      });

    } catch (error: any) {
      logger.error('Local execution failed:', error.message);
      throw new Error('Code execution service unavailable');
    }
  }

  async runTestCases(params: {
    sourceCode: string;
    languageId: number;
    testCases: { input: string; expectedOutput: string }[];
  }): Promise<{
    results: CodeExecutionResult[];
    passed: number;
    total: number;
  }> {
    const results: CodeExecutionResult[] = [];
    let passed = 0;

    for (const testCase of params.testCases) {
      try {
        const result = await this.executeCode({
          sourceCode: params.sourceCode,
          languageId: params.languageId,
          stdin: testCase.input,
          expectedOutput: testCase.expectedOutput,
        });

        results.push(result);
        if (result.status.id === 3) passed++;
      } catch (error) {
        results.push({
          stdout: null,
          stderr: 'Execution failed',
          status: { id: 0, description: 'Error' },
          time: '0',
          memory: 0,
          compile_output: null,
        });
      }
    }

    return { results, passed, total: params.testCases.length };
  }

  async getLanguages(): Promise<any[]> {
    return Object.entries(LANGUAGE_MAP).map(([name, id]) => ({ id, name }));
  }

  getLanguageId(language: string): number {
    const normalized = language.toLowerCase().trim();
    return LANGUAGE_MAP[normalized] || 63;
  }
}

export default new Judge0Service();
