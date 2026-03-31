import { Request, Response } from 'express';
import { customAlphabet } from 'nanoid';
import bcrypt from 'bcryptjs';
import Interview from '../models/Interview';
import CandidateSession from '../models/CandidateSession';
import aiService from '../services/ai.service';
import judge0Service from '../services/judge0.service';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

/**
 * Create a new interview session
 */
export const createInterview = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      topics,
      languages,
      difficulty,
      questionsPerTopic,
      customTopics,
      duration,
      dsaTopics,
      settings,
      scheduledAt,
    } = req.body;

    // Generate unique interview ID and password
    const interviewId = nanoid();
    const rawPassword = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6)();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Generate questions using AI
    const allTopics = [...topics, ...(customTopics || [])];
    const questions = await aiService.generateQuestions({
      topics: allTopics,
      difficulty,
      questionsPerTopic,
      languages,
      customTopics,
    });

    if (dsaTopics && dsaTopics.length > 0) {
      // Create specific DSA questions
      const dsaStrings = dsaTopics.map((t: any) => `${t.difficulty} ${t.topic} Data Structure`);
      const dsaQuestions = await aiService.generateQuestions({
        topics: dsaStrings,
        difficulty: 'mixed',
        questionsPerTopic: 1,
        languages,
      });
      questions.push(...dsaQuestions);
    }

    const interview = new Interview({
      interviewId,
      password: hashedPassword,
      title,
      description,
      createdBy: req.admin?.id || 'admin',
      topics: allTopics,
      languages,
      difficulty,
      questionsPerTopic,
      customTopics,
      questions,
      duration,
      status: 'active',
      dsaTopics,
      settings: settings || {},
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
    });

    await interview.save();

    logger.info(`Interview created: ${interviewId} by ${req.admin?.id || 'admin'}`);

    res.status(201).json({
      success: true,
      message: 'Interview created successfully',
      data: {
        interviewId,
        password: rawPassword, // Send plaintext password only once
        title,
        questionsCount: questions.length,
        duration,
        joinLink: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/interview/join?id=${interviewId}`,
      },
    });
  } catch (error: any) {
    logger.error('Create interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create interview',
      error: error.message,
    });
  }
};

/**
 * Get interview details (admin view)
 */
export const getInterview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findOne({ interviewId: id });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Get all candidate sessions for this interview
    const sessions = await CandidateSession.find({ interviewId: id });

    res.json({
      success: true,
      data: {
        interview: {
          ...interview.toObject(),
          password: undefined, // Don't expose password
        },
        sessions,
        analytics: {
          totalCandidates: sessions.length,
          completed: sessions.filter((s) => s.status === 'submitted' || s.status === 'evaluated').length,
          inProgress: sessions.filter((s) => s.status === 'in_progress').length,
          averageScore:
            sessions.length > 0
              ? Math.round(
                  sessions.reduce((acc, s) => acc + s.percentageScore, 0) /
                    sessions.length
                )
              : 0,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview',
    });
  }
};

/**
 * List all interviews for admin
 */
export const listInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter: any = { createdBy: req.admin?.id || 'admin' };
    if (status) filter.status = status;

    const interviews = await Interview.find(filter)
      .select('-password -questions.testCases')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Interview.countDocuments(filter);

    // Get session counts for each interview
    const interviewsWithStats = await Promise.all(
      interviews.map(async (interview) => {
        const sessionCount = await CandidateSession.countDocuments({
          interviewId: interview.interviewId,
        });
        return {
          ...interview.toObject(),
          candidateCount: sessionCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        interviews: interviewsWithStats,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    logger.error('List interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list interviews',
    });
  }
};

/**
 * Join an interview as a candidate
 */
export const joinInterview = async (req: Request, res: Response) => {
  try {
    const { interviewId, password, candidateName, candidateEmail, metadata } =
      req.body;

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    if (interview.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Interview is ${interview.status}`,
      });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, interview.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid interview password',
      });
    }

    const existingSessions = await CandidateSession.countDocuments({
      interviewId,
      status: { $in: ['joined', 'in_progress'] },
    });

    // Remove max candidates check or replace with a high limit if needed, skipping for now since property removed
    
    // Create candidate session
    const session = new CandidateSession({
      interviewId,
      candidateName,
      candidateEmail,
      status: 'joined',
      maxPossibleScore: interview.questions.reduce((acc, q) => acc + q.maxScore, 0),
      metadata: metadata || {},
    });

    await session.save();

    logger.info(
      `Candidate ${candidateName} joined interview ${interviewId}`
    );

    // Return questions without hidden test cases
    const questionsForCandidate = interview.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      topic: q.topic,
      difficulty: q.difficulty,
      language: q.language,
      sampleCode: q.sampleCode,
      maxScore: q.maxScore,
      timeLimit: q.timeLimit,
      testCases: q.testCases?.filter((tc) => !tc.isHidden),
    }));

    res.json({
      success: true,
      message: 'Successfully joined interview',
      data: {
        sessionId: session._id,
        interview: {
          title: interview.title,
          description: interview.description,
          duration: interview.duration,
          topics: interview.topics,
          languages: interview.languages,
          settings: interview.settings,
        },
        questions: questionsForCandidate,
        totalQuestions: interview.questions.length,
      },
    });
  } catch (error: any) {
    logger.error('Join interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join interview',
    });
  }
};

/**
 * Start a candidate's interview session
 */
export const startInterview = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await CandidateSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    session.status = 'in_progress';
    session.startedAt = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Interview started',
      data: { startedAt: session.startedAt },
    });
  } catch (error: any) {
    logger.error('Start interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start interview',
    });
  }
};

/**
 * Submit an answer for a question
 */
export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const { sessionId, questionId, code, textAnswer, language, timeTaken } =
      req.body;

    const session = await CandidateSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const interview = await Interview.findOne({
      interviewId: session.interviewId,
    });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    const question = interview.questions.find((q) => q.id === questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    let executionResult;
    // Execute code if it's a coding question
    if (code && language && question.type === 'coding') {
      try {
        const langId = judge0Service.getLanguageId(language);

        if (question.testCases && question.testCases.length > 0) {
          const testResults = await judge0Service.runTestCases({
            sourceCode: code,
            languageId: langId,
            testCases: question.testCases.map((tc) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
            })),
          });

          // Find the first failed test case or use the first one
          const firstFailedIdx = testResults.results.findIndex(r => r.status.id !== 3);
          const reportIdx = firstFailedIdx >= 0 ? firstFailedIdx : 0;
          const reportCase = question.testCases[reportIdx];
          const reportResult = testResults.results[reportIdx];

          executionResult = {
            stdout: reportResult?.stdout || '',
            stderr: reportResult?.stderr || '',
            status: testResults.passed === testResults.total ? 'Accepted' : (reportResult?.status?.description || 'Unknown'),
            time: reportResult?.time || '0',
            memory: reportResult?.memory || 0,
            testCasesPassed: testResults.passed,
            totalTestCases: testResults.total,
            input: reportCase?.input || '',
            expectedOutput: reportCase?.expectedOutput || '',
          };
        } else {
          const result = await judge0Service.executeCode({
            sourceCode: code,
            languageId: langId,
          });
          executionResult = {
            stdout: result.stdout || '',
            stderr: result.stderr || result.compile_output || '',
            status: result.status?.description || 'Unknown',
            time: result.time || '0',
            memory: result.memory || 0,
            testCasesPassed: 0,
            totalTestCases: 0,
            input: '',
            expectedOutput: '',
          };
        }
      } catch (execError: any) {
        logger.warn('Code execution failed:', execError.message);
        executionResult = {
          stdout: '',
          stderr: 'Code execution service unavailable',
          status: 'Error',
          time: '0',
          memory: 0,
          testCasesPassed: 0,
          totalTestCases: 0,
          input: '',
          expectedOutput: '',
        };
      }
    }

    // AI evaluation
    const aiEvaluation = await aiService.evaluateAnswer({
      question: question.text,
      answer: textAnswer || '',
      code,
      language,
      executionResult,
    });

    // Save answer
    const answer = {
      questionId,
      code,
      textAnswer,
      language,
      executionResult,
      aiEvaluation,
      submittedAt: new Date(),
      timeTaken,
    };

    // Update or push answer
    const existingIdx = session.answers.findIndex(
      (a) => a.questionId === questionId
    );
    if (existingIdx >= 0) {
      session.answers[existingIdx] = answer;
    } else {
      session.answers.push(answer);
    }

    // Update score
    session.totalScore = session.answers.reduce(
      (acc, a) => acc + (a.aiEvaluation?.score || 0),
      0
    );
    session.currentQuestionIndex = Math.min(
      session.currentQuestionIndex + 1,
      interview.questions.length - 1
    );

    await session.save();

    // Generate follow-up if adaptive difficulty is enabled
    let followUpQuestions: string[] = [];
    if (interview.settings.adaptiveDifficulty) {
      followUpQuestions = await aiService.generateFollowUp({
        question: question.text,
        answer: textAnswer || code || '',
        topic: question.topic,
        difficulty: question.difficulty,
      });
    }

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        executionResult,
        aiEvaluation,
        followUpQuestions,
        currentScore: session.totalScore,
        questionsAnswered: session.answers.length,
        totalQuestions: interview.questions.length,
      },
    });
  } catch (error: any) {
    logger.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
    });
  }
};

/**
 * Submit the complete interview
 */
export const submitInterview = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    const session = await CandidateSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const interview = await Interview.findOne({
      interviewId: session.interviewId,
    });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Generate overall feedback
    const feedback = await aiService.generateFeedback({
      questions: interview.questions,
      answers: session.answers,
      topics: interview.topics,
    });

    session.status = 'evaluated';
    session.submittedAt = new Date();
    session.duration = session.startedAt
      ? Math.round((Date.now() - session.startedAt.getTime()) / 1000)
      : 0;
    session.feedback = feedback;

    await session.save();

    logger.info(
      `Interview submitted: session ${sessionId}, score: ${session.percentageScore}%`
    );

    res.json({
      success: true,
      message: 'Interview submitted successfully',
      data: {
        totalScore: session.totalScore,
        maxPossibleScore: session.maxPossibleScore,
        percentageScore: session.percentageScore,
        duration: session.duration,
        feedback,
        proctoringFlags: session.proctoringFlags,
        proctoringScore: session.proctoringScore,
      },
    });
  } catch (error: any) {
    logger.error('Submit interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit interview',
    });
  }
};

/**
 * Log a proctoring flag
 */
export const logProctoringFlag = async (req: Request, res: Response) => {
  try {
    const { sessionId, type, details, severity } = req.body;

    const session = await CandidateSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    session.proctoringFlags.push({
      type,
      timestamp: new Date(),
      details,
      severity,
    });

    // Reduce proctoring score based on severity
    const deduction = severity === 'high' ? 10 : severity === 'medium' ? 5 : 2;
    session.proctoringScore = Math.max(0, session.proctoringScore - deduction);

    await session.save();

    logger.warn(
      `Proctoring flag: ${type} for session ${sessionId} (severity: ${severity})`
    );

    res.json({
      success: true,
      message: 'Proctoring flag logged',
      data: {
        proctoringScore: session.proctoringScore,
        totalFlags: session.proctoringFlags.length,
      },
    });
  } catch (error: any) {
    logger.error('Log proctoring flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log proctoring flag',
    });
  }
};

/**
 * Execute code (standalone endpoint)
 */
export const executeCode = async (req: Request, res: Response) => {
  try {
    const { sourceCode, languageId, stdin, expectedOutput, timeLimit, memoryLimit, sessionId, questionId } =
      req.body;

    // If we have questionId, we try to run all its test cases!
    if (sessionId && questionId) {
       const session = await CandidateSession.findById(sessionId);
       if (session) {
          const interview = await Interview.findOne({ interviewId: session.interviewId });
          const question = interview?.questions.find(q => q.id === questionId);
          
           if (question && question.testCases && question.testCases.length > 0) {
             const testResults = await judge0Service.runTestCases({
               sourceCode,
               languageId,
               testCases: question.testCases.map((tc) => ({
                 input: tc.input,
                 expectedOutput: tc.expectedOutput,
               })),
             });

             // Build per-test-case results
             const testCaseResults = question.testCases.map((tc, idx) => {
               const result = testResults.results[idx];
               const actualOutput = (result?.stdout || '').trim();
               const passed = result?.status?.id === 3;
               return {
                 input: tc.input,
                 expectedOutput: tc.expectedOutput,
                 actualOutput: actualOutput,
                 passed,
                 isHidden: tc.isHidden || false,
               };
             });

             // Find the first failed test case for the summary
             const firstFailedIdx = testCaseResults.findIndex(r => !r.passed);
             const reportIdx = firstFailedIdx >= 0 ? firstFailedIdx : 0;
             const reportResult = testResults.results[reportIdx];

             // Determine overall status
             const allPassed = testResults.passed === testResults.total;
             let status = 'Accepted';
             if (!allPassed) {
               status = reportResult?.status?.description || 'Wrong Answer';
               if (status === 'Accepted') status = 'Wrong Answer'; // edge case: individual says accepted but output mismatch
             }
             
             return res.json({
               success: true,
               data: {
                 stdout: reportResult?.stdout || '',
                 stderr: reportResult?.stderr || '',
                 status,
                 time: reportResult?.time || '0',
                 memory: reportResult?.memory || 0,
                 testCasesPassed: testResults.passed,
                 totalTestCases: testResults.total,
                 input: question.testCases[reportIdx]?.input || '',
                 expectedOutput: question.testCases[reportIdx]?.expectedOutput || '',
                 testCaseResults,
               }
             });

          }
       }
    }

    const result = await judge0Service.executeCode({
      sourceCode,
      languageId,
      stdin,
      expectedOutput,
      timeLimit,
      memoryLimit,
    });

    res.json({
      success: true,
      data: {
         ...result,
         input: stdin || '',
         expectedOutput: expectedOutput || ''
      },
    });
  } catch (error: any) {
    logger.error('Execute code error:', error);
    res.status(500).json({
      success: false,
      message: 'Code execution failed',
      error: error.message,
    });
  }
};

/**
 * Get candidate session analytics (admin view)
 */
export const getSessionAnalytics = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await CandidateSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: {
        session,
        analytics: {
          totalQuestions: session.answers.length,
          averageScore:
            session.answers.length > 0
              ? session.answers.reduce(
                  (acc, a) => acc + (a.aiEvaluation?.score || 0),
                  0
                ) / session.answers.length
              : 0,
          topicBreakdown: session.feedback?.topicWiseScores || [],
          proctoringFlags: session.proctoringFlags,
          proctoringScore: session.proctoringScore,
          timeAnalysis: {
            totalDuration: session.duration,
            averageTimePerQuestion:
              session.answers.length > 0
                ? Math.round(
                    session.answers.reduce((acc, a) => acc + a.timeTaken, 0) /
                      session.answers.length
                  )
                : 0,
          },
        },
      },
    });
  } catch (error: any) {
    logger.error('Get session analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};

/**
 * Get topic keyword suggestions for Autocomplete
 */
export const getTopicSuggestions = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').toLowerCase();
    
    // Mock DB list of keywords
    const keywords = [
      'React', 'React.js', 'React Native', 'React Router', 'React Query', 'Redux', 'Zustand', 'Context API',
      'Next.js', 'Gatsby', 'Remix', 'Vue.js', 'Vuex', 'Nuxt.js', 'Angular', 'AngularJS', 'Svelte', 'SvelteKit',
      'JavaScript', 'TypeScript', 'Node.js', 'Express.js', 'NestJS', 'Koa', 'Fastify',
      'Python', 'Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado', 'Celery',
      'Java', 'Spring Boot', 'Hibernate', 'Kotlin', 'Android', 'Swift', 'iOS', 'Objective-C',
      'C#', '.NET', 'ASP.NET Core', 'F#', 'Entity Framework', 'Ruby', 'Ruby on Rails', 'PHP', 'Laravel', 'Symfony',
      'Go', 'Rust', 'C++', 'C', 'Perl', 'Scala', 'Elixir', 'Erlang', 'Phoenix',
      'GraphQL', 'REST API', 'WebSockets', 'gRPC', 'tRPC', 'Apollo', 'Relay',
      'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'MariaDB', 'Oracle', 'SQL Server', 'Cassandra', 'CouchDB', 'DynamoDB',
      'Redis', 'Memcached', 'Elasticsearch', 'Solr', 'Neo4j', 'Firebase', 'Supabase', 'Supabase',
      'AWS', 'Azure', 'GCP', 'Google Cloud', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
      'Docker', 'Kubernetes', 'K8s', 'Docker Swarm', 'Helm', 'Terraform', 'Ansible', 'Puppet', 'Chef',
      'CI/CD', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI', 'Bitbucket CI',
      'Kafka', 'RabbitMQ', 'ActiveMQ', 'Apache Pulsar', 'NATS', 'Redis Pub/Sub',
      'System Design', 'Microservices', 'Serverless', 'Monolith', 'Event-Driven Architecture', 'Clean Architecture',
      'SOLID', 'Design Patterns', 'Design System', 'OOP', 'Functional Programming',
      'Webpack', 'Vite', 'Babel', 'Rollup', 'Parcel', 'esbuild', 'Gulp', 'Grunt',
      'TailwindCSS', 'Sass', 'LESS', 'CSS-in-JS', 'Styled Components', 'Emotion', 'Chakra UI', 'Material-UI',
      'HTML5', 'CSS3', 'WebAssembly', 'WASM', 'WebRTC', 'Service Workers', 'PWA',
      'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'Jest', 'Cypress', 'Mocha', 'Chai', 'Playwright', 'Selenium',
      'Figma', 'Sketch', 'Adobe XD', 'UI/UX', 'Wireframing', 'Prototyping',
      'Machine Learning', 'Deep Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy',
      'Computer Vision', 'NLP', 'LLM', 'Generative AI', 'Prompt Engineering', 'LangChain',
      'Blockchain', 'Web3', 'Ethereum', 'Solidity', 'Smart Contracts', 'Bitcoin',
      'Cybersecurity', 'Penetration Testing', 'Cryptography', 'OAuth', 'JWT', 'Auth0', 'OpenID',
      'Linux', 'Unix', 'Bash', 'Shell Scripting', 'Vim', 'Git', 'Subversion', 'Mercurial'
    ];
    
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    
    const matches = keywords.filter(k => k.toLowerCase().includes(q)).slice(0, 10);
    
    return res.json({ success: true, data: matches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
  }
};
