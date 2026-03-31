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
      
      // For JavaScript, append a wrapper that auto-invokes the candidate's function
      if (language === 'javascript' && params.stdin) {
        const wrapperPath = path.join(__dirname, 'js-wrapper.js');
        const wrapperCode = await fs.readFile(wrapperPath, 'utf8');
        finalSrc += '\n' + wrapperCode;
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
        
        const execProcess = exec(cmd, { timeout: 10000 }, async (error, stdout, stderr) => {
          try { await fs.unlink(filepath); } catch { /* Ignore cleanup errors */ }

          let statusId = 3;
          let statusDesc = 'Accepted';

          const isError = !!error || !!stderr;

          if (isError) {
            statusId = 11;
            statusDesc = 'Runtime Error';
          }

          // If we got an expected output to compare against
          if (params.expectedOutput && !isError) {
             const cleanStdout = (stdout || '').trim().replace(/\s/g, '');
             const cleanExpected = (params.expectedOutput || '').trim().replace(/\s/g, '');
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
