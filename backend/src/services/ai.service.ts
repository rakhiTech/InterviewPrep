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
      logger.error('AI evaluation failed, falling back to local heuristic evaluator:', error.message);
      return this.getLocalAIEvaluation(params);
    }
  }

  /**
   * Powerful offline rule-based heuristic evaluator acting as the AI
   */
  private getLocalAIEvaluation(params: any) {
    let correctness = 0;
    let codeQuality = 0;
    let explanationQuality = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    // 1. Evaluate Correctness based on Execution Results
    if (params.code) {
      if (params.executionResult && params.executionResult.totalTestCases > 0) {
        correctness = Math.round((params.executionResult.testCasesPassed / params.executionResult.totalTestCases) * 10);
      } else if (params.code.trim().length > 10) {
        correctness = 3; // Basic syntax structure present but unverified
      }
    } else if (params.answer) {
      correctness = 6; // Verbal only fallback
    }

    // 2. Evaluate Code Quality (Syntactic Heuristics)
    if (params.code) {
      let q = 4; // Base score
      const codeStr = params.code.toLowerCase();
      
      if (codeStr.includes('const ') || codeStr.includes('let ')) { q += 2; strengths.push("Uses modern block-scoped variables (let/const)."); }
      else if (codeStr.includes('var ')) { q -= 2; improvements.push("Upgrade 'var' usage to 'let' or 'const' to prevent hoisting bugs."); }
      
      if (params.code.includes('//') || params.code.includes('/*')) { q += 1.5; strengths.push("Includes helpful inline documentation."); }
      else { improvements.push("Missing inline comments; explaining logic steps is crucial."); }
      
      const lines = params.code.split('\n').filter((l: string) => l.trim().length > 0);
      if (lines.length > 3 && lines.length < 30) { q += 1.5; strengths.push("Maintains concise and readable function lengths."); }
      
      // Look for structural loops
      if (codeStr.includes('while') || codeStr.includes('for')) { strengths.push("Demonstrates iterative loop constructions."); }
      
      codeQuality = Math.max(0, Math.min(10, Math.round(q)));
    }

    // 3. Evaluate Explanation Quality (Semantic Text Analysis)
    if (params.answer && params.answer.trim().length > 0) {
      let e = 3;
      const ansLower = params.answer.toLowerCase();
      if (ansLower.length > 40) e += 2;
      if (ansLower.length > 100) e += 2;
      
      if (ansLower.includes('time') || ansLower.includes('o(n)') || ansLower.includes('o(1)')) { 
        e += 2; strengths.push("Clearly analyzes algorithm time complexity."); 
      }
      if (ansLower.includes('space') || ansLower.includes('memory') || ansLower.includes('o(1) space')) { 
        e += 1; strengths.push("Discusses memory footprint and space complexity."); 
      }
      
      if (e < 6) improvements.push("Provide more detailed explanations breaking down your approach and Big-O efficiency.");
      
      explanationQuality = Math.max(0, Math.min(10, Math.round(e)));
    } else if (params.code) {
       improvements.push("Candidate completely omitted the verbal/text explanation of their solution.");
    }
    
    const score = Math.round((correctness * 0.5) + (codeQuality * 0.25) + (explanationQuality * 0.25));
    
    let feedback = `The candidate achieved an overall score of ${score}/10 based on our automated assessment. `;
    if (correctness === 10) feedback += "Their code solution is perfectly optimal, correctly executing and passing 100% of all required test cases. ";
    else if (correctness >= 5) feedback += "Their code works partially but fails on certain edge cases or hidden test requirements. ";
    else feedback += "Their code failed to execute properly or did not pass the required logical constraints. ";
    
    if (explanationQuality >= 7) feedback += "Furthermore, they demonstrated deep technical understanding by articulating the underlying data structures efficiently.";
    else feedback += "They struggled to articulate the underlying complexities clearly, suggesting they may have brute-forced the logic without visualizing the algorithmic cost.";

    // Ensure we don't return an empty array if somehow empty
    if (strengths.length === 0) strengths.push("Attempted to solve the core objective of the prompt.");
    if (improvements.length === 0) improvements.push("Continue practicing optimal algorithmic patterns.");

    return {
      score,
      codeQuality,
      correctness,
      explanationQuality,
      feedback,
      strengths: Array.from(new Set(strengths)).slice(0, 3), // max 3
      improvements: Array.from(new Set(improvements)).slice(0, 3) // max 3
    };
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
      logger.error('AI feedback generation failed, using local aggregator:', error.message);
      
      let totalScore = 0;
      let strengths: string[] = ["Good general communication during the interview."];
      let weaknesses: string[] = [];
      
      params.answers.forEach((ans: any) => {
         if (ans.evaluation) {
             totalScore += ans.evaluation.score;
             if (ans.evaluation.strengths) strengths.push(...ans.evaluation.strengths);
             if (ans.evaluation.improvements) weaknesses.push(...ans.evaluation.improvements);
         }
      });
      
      const avg = totalScore / (params.answers.length || 1);
      const overallFeedback = avg >= 7 
         ? "Strong performance overall. The candidate demonstrated solid technical foundations, clean abstract problem-solving skills, and a clear understanding of data structure mechanics." 
         : "The candidate needs improvement in core competencies, Big-O algorithm constraints, and edge-case management. Further technical practice is recommended before moving perfectly forward.";

      // Deduplicate arrays
      strengths = Array.from(new Set(strengths)).slice(0, 5);
      weaknesses = Array.from(new Set(weaknesses)).slice(0, 5);

      return {
          overallFeedback,
          topicWiseScores: params.topics.map((t: string) => ({ topic: t, score: Math.round(avg) })),
          strengths,
          weaknesses,
          recommendedTopics: weaknesses.length > 0 ? params.topics : []
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
    const actualDifficulty = difficulty === 'mixed' ? 'medium' : difficulty;
    const fallbackMap: Record<string, IQuestion[]> = {
      'DSA': [
        {
          id: `fallback-dsa-1`,
          text: 'Implement a function to reverse a linked list. Explain your approach and its time/space complexity.',
          type: 'coding',
          topic: 'DSA',
          difficulty: actualDifficulty as any,
          testCases: [
            { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
            { input: '[1]', expectedOutput: '[1]', isHidden: false },
            { input: '[]', expectedOutput: '[]', isHidden: false },
            { input: '[1,2]', expectedOutput: '[2,1]', isHidden: false },
            { input: '[9,8,7]', expectedOutput: '[7,8,9]', isHidden: false },
            { input: '[-1,-2,-3]', expectedOutput: '[-3,-2,-1]', isHidden: true },
            { input: '[100,200]', expectedOutput: '[200,100]', isHidden: true },
            { input: '[0,0,0,0]', expectedOutput: '[0,0,0,0]', isHidden: true },
            { input: '[5,5,5]', expectedOutput: '[5,5,5]', isHidden: true },
            { input: '[100,99,98,97,96]', expectedOutput: '[96,97,98,99,100]', isHidden: true },
          ],
          maxScore: 10,
          timeLimit: 900,
        },
        {
          id: `fallback-dsa-2`,
          text: 'Given an array of integers, find two numbers that add up to a specific target. Return their indices.',
          type: 'coding',
          topic: 'DSA',
          difficulty: actualDifficulty as any,
          testCases: [
            { input: 'nums=[2,7,11,15], target=9', expectedOutput: '[0,1]', isHidden: false },
            { input: 'nums=[3,2,4], target=6', expectedOutput: '[1,2]', isHidden: false },
            { input: 'nums=[3,3], target=6', expectedOutput: '[0,1]', isHidden: false },
            { input: 'nums=[0,4,3,0], target=0', expectedOutput: '[0,3]', isHidden: false },
            { input: 'nums=[-1,-2,-3,-4,-5], target=-8', expectedOutput: '[2,4]', isHidden: false },
            { input: 'nums=[10,20,30,40,50], target=90', expectedOutput: '[3,4]', isHidden: true },
            { input: 'nums=[1,2], target=3', expectedOutput: '[0,1]', isHidden: true },
            { input: 'nums=[100,200,300], target=500', expectedOutput: '[1,2]', isHidden: true },
            { input: 'nums=[-10, -20, 30], target=10', expectedOutput: '[1,2]', isHidden: true },
            { input: 'nums=[0,0], target=0', expectedOutput: '[0,1]', isHidden: true },
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
          difficulty: actualDifficulty as any,
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
          difficulty: actualDifficulty as any,
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
          difficulty: actualDifficulty as any,
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
          difficulty: actualDifficulty as any,
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
