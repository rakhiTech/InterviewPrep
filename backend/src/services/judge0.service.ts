import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';

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
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
  compile_output: string | null;
}

class Judge0Service {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.judge0Url;
  }

  /**
   * Submit code for execution
   */
  async executeCode(params: {
    sourceCode: string;
    languageId: number;
    stdin?: string;
    expectedOutput?: string;
    timeLimit?: number;
    memoryLimit?: number;
  }): Promise<CodeExecutionResult> {
    try {
      // Submit the code
      const submitResponse = await axios.post(
        `${this.baseUrl}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: params.sourceCode,
          language_id: params.languageId,
          stdin: params.stdin || '',
          expected_output: params.expectedOutput || null,
          cpu_time_limit: params.timeLimit || 5,
          memory_limit: params.memoryLimit || 128000,
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return submitResponse.data;
    } catch (error: any) {
      logger.error('Judge0 execution failed:', error.message);
      throw new Error('Code execution service unavailable');
    }
  }

  /**
   * Run code against multiple test cases
   */
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

        // Status ID 3 = Accepted
        if (result.status.id === 3) {
          passed++;
        }
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

  /**
   * Get supported languages from Judge0
   */
  async getLanguages(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/languages`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch Judge0 languages:', error.message);
      return [];
    }
  }

  /**
   * Get language ID from language name
   */
  getLanguageId(language: string): number {
    const normalized = language.toLowerCase().trim();
    return LANGUAGE_MAP[normalized] || 63; // Default to JavaScript
  }
}

export default new Judge0Service();
