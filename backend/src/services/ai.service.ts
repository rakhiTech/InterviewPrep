import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';
import { IQuestion } from '../models/Interview';

class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.aiServiceUrl;
  }

  /**
   * Generate interview questions based on topics and difficulty
   */
  async generateQuestions(params: {
    topics: string[];
    difficulty: string;
    questionsPerTopic: number;
    languages: string[];
    customTopics?: string[];
  }): Promise<IQuestion[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/generate-questions`,
        params,
        { timeout: 120000 } // 2 min timeout for AI generation
      );
      return response.data.questions;
    } catch (error: any) {
      logger.error('AI question generation failed:', error.message);
      // Return fallback questions if AI service is unavailable
      return this.getFallbackQuestions(params.topics, params.difficulty);
    }
  }

  /**
   * Evaluate a candidate's answer using AI
   */
  async evaluateAnswer(params: {
    question: string;
    answer: string;
    code?: string;
    language?: string;
    executionResult?: any;
  }): Promise<{
    score: number;
    codeQuality: number;
    correctness: number;
    explanationQuality: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/evaluate-answer`,
        params,
        { timeout: 60000 }
      );
      return response.data.evaluation;
    } catch (error: any) {
      logger.error('AI evaluation failed:', error.message);
      return {
        score: 0,
        codeQuality: 0,
        correctness: 0,
        explanationQuality: 0,
        feedback: 'AI evaluation unavailable. Manual review required.',
        strengths: [],
        improvements: [],
      };
    }
  }

  /**
   * Generate overall feedback for a completed interview
   */
  async generateFeedback(params: {
    questions: any[];
    answers: any[];
    topics: string[];
  }): Promise<{
    overallFeedback: string;
    topicWiseScores: any[];
    strengths: string[];
    weaknesses: string[];
    recommendedTopics: string[];
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/generate-feedback`,
        params,
        { timeout: 60000 }
      );
      return response.data.feedback;
    } catch (error: any) {
      logger.error('AI feedback generation failed:', error.message);
      return {
        overallFeedback: 'AI feedback generation unavailable.',
        topicWiseScores: [],
        strengths: [],
        weaknesses: [],
        recommendedTopics: [],
      };
    }
  }

  /**
   * Generate follow-up questions based on a candidate's response
   */
  async generateFollowUp(params: {
    question: string;
    answer: string;
    topic: string;
    difficulty: string;
  }): Promise<string[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/generate-followup`,
        params,
        { timeout: 30000 }
      );
      return response.data.followUpQuestions;
    } catch (error: any) {
      logger.error('AI follow-up generation failed:', error.message);
      return [];
    }
  }

  /**
   * Fallback questions when AI service is unavailable
   */
  private getFallbackQuestions(topics: string[], difficulty: string): IQuestion[] {
    const fallbackMap: Record<string, IQuestion[]> = {
      'DSA': [
        {
          id: `fallback-dsa-1`,
          text: 'Implement a function to reverse a linked list. Explain your approach and its time/space complexity.',
          type: 'coding',
          topic: 'DSA',
          difficulty: difficulty as any,
          testCases: [
            { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
            { input: '[1]', expectedOutput: '[1]', isHidden: false },
            { input: '[]', expectedOutput: '[]', isHidden: true },
          ],
          maxScore: 10,
          timeLimit: 900,
        },
        {
          id: `fallback-dsa-2`,
          text: 'Given an array of integers, find two numbers that add up to a specific target. Return their indices.',
          type: 'coding',
          topic: 'DSA',
          difficulty: difficulty as any,
          testCases: [
            { input: 'nums=[2,7,11,15], target=9', expectedOutput: '[0,1]', isHidden: false },
            { input: 'nums=[3,2,4], target=6', expectedOutput: '[1,2]', isHidden: false },
          ],
          maxScore: 10,
          timeLimit: 600,
        },
      ],
      'System Design': [
        {
          id: `fallback-sd-1`,
          text: 'Design a URL shortener service like bit.ly. Describe the high-level architecture, database schema, and how you would handle scalability.',
          type: 'system-design',
          topic: 'System Design',
          difficulty: difficulty as any,
          maxScore: 15,
          timeLimit: 1200,
        },
      ],
      'Frontend': [
        {
          id: `fallback-fe-1`,
          text: 'Implement a debounce function in JavaScript. Explain how it works and when you would use it.',
          type: 'coding',
          topic: 'Frontend',
          difficulty: difficulty as any,
          testCases: [
            { input: 'func, 300', expectedOutput: 'debounced function', isHidden: false },
          ],
          maxScore: 10,
          timeLimit: 600,
        },
      ],
      'Backend': [
        {
          id: `fallback-be-1`,
          text: 'Explain the concept of middleware in Express.js. Write a custom middleware that logs request details and measures response time.',
          type: 'coding',
          topic: 'Backend',
          difficulty: difficulty as any,
          maxScore: 10,
          timeLimit: 600,
        },
      ],
    };

    const questions: IQuestion[] = [];
    for (const topic of topics) {
      const topicQuestions = fallbackMap[topic] || [
        {
          id: `fallback-${topic}-1`,
          text: `Explain a key concept in ${topic} and provide a practical example.`,
          type: 'text' as const,
          topic,
          difficulty: difficulty as any,
          maxScore: 10,
          timeLimit: 600,
        },
      ];
      questions.push(...topicQuestions);
    }
    return questions;
  }
}

export default new AIService();
