'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useInterviewStore } from '@/store';
import { candidateApi, codeApi, proctoringApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { LANGUAGE_MAP } from '@/lib/constants';
import type { ExecutionResult, AIEvaluation } from '@/types';
import toast from 'react-hot-toast';
import styles from './session.module.css';

// Dynamic import for Monaco Editor (SSR incompatible)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className={styles.editorLoading}>
      <div className="spinner-lg" />
      <p className="text-muted">Loading code editor...</p>
    </div>
  ),
});

export default function InterviewSession() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const {
    interview,
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining,
    isStarted,
    isCompleted,
    startInterview,
    setCurrentQuestion,
    updateAnswer,
    decrementTime,
    completeInterview,
  } = useInterviewStore();

  const [activeTab, setActiveTab] = useState<'code' | 'text'>('code');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [finalResults, setFinalResults] = useState<{
    totalScore: number;
    maxPossibleScore: number;
    percentageScore: number;
    feedback: any;
  } | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef(getSocket());

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion?.id || '');

  // Start interview
  const handleStartInterview = useCallback(async () => {
    if (!interview) return;

    try {
      if (!hasPermissions) {
        toast.error('You must allow camera and microphone access before starting.');
        return;
      }
      await candidateApi.start(sessionId);
      startInterview(interview.duration);
      setQuestionStartTime(Date.now());

      socketRef.current.emit('join-interview', {
        interviewId: currentQuestion?.id ? interview.title : '',
        sessionId,
      });

      toast.success('Interview started! Good luck!');
    } catch {
      toast.error('Failed to start interview');
    }
  }, [interview, sessionId, startInterview, currentQuestion]);

  // Timer countdown
  useEffect(() => {
    if (!isStarted || isCompleted || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      decrementTime();
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted, isCompleted, timeRemaining, decrementTime]);

  // Request camera and microphone permissions explicitly
  const requestPermissions = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setHasPermissions(true);
      toast.success('Camera and microphone enabled', { icon: '📸' });
    } catch (err: any) {
      console.error('Camera/Mic access error details:', err);
      let errorMessage = 'Failed to access camera and microphone.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Access denied. Please click the site icon left of the browser URL bar, enable Camera and Microphone, and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found! Please connect a webcam/mic.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application (like Zoom/Teams).';
      } else {
        errorMessage = `Error type: ${err.name} - ${err.message}`;
      }
      
      toast.error(errorMessage, { duration: 6000 });
      setHasPermissions(false);
    }
  }, []);

  // Handle Speech Recognition for dictation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript && currentQuestion) {
            const currentText = typeof currentAnswer?.textAnswer === 'string' ? currentAnswer.textAnswer : '';
            updateAnswer(currentQuestion.id, { textAnswer: currentText + (currentText ? ' ' : '') + finalTranscript });
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, [currentQuestion, currentAnswer, updateAnswer]);

  const toggleDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast.success('Dictation started. Speak now...', { icon: '🎤' });
      } catch (err) {
        toast.error('Dictation is already running or unsupported in your browser.');
      }
    }
  };

  // Auto-submit when time runs out
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (timeRemaining === 0 && isStarted && !isCompleted) {
      handleSubmitInterview();
    }
  }, [timeRemaining, isStarted, isCompleted]);

  // Tab switch detection (proctoring)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isStarted && !isCompleted) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);

        proctoringApi.logFlag({
          sessionId,
          type: 'tab_switch',
          details: `Tab switch #${newCount}`,
          severity: newCount > 3 ? 'high' : 'medium',
        });

        socketRef.current.emit('proctoring-event', {
          sessionId,
          type: 'tab_switch',
          details: `Tab switch #${newCount}`,
          severity: newCount > 3 ? 'high' : 'medium',
        });

        toast.error(`⚠️ Tab switch detected (${newCount}/${interview?.settings?.maxTabSwitches || 3})`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isStarted, isCompleted, tabSwitchCount, sessionId, interview]);

  // Format time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Run code
  const handleRunCode = async () => {
    if (!currentAnswer?.code) {
      toast.error('Please write some code first');
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);

    try {
      const langId = LANGUAGE_MAP[selectedLanguage]?.id || 63;
      const response = await codeApi.execute({
        sourceCode: currentAnswer.code,
        languageId: langId,
        stdin: currentQuestion?.testCases?.[0]?.input || '',
      });

      if (response.data.success) {
        setExecutionResult({
          stdout: response.data.data.stdout || '',
          stderr: response.data.data.stderr || response.data.data.compile_output || '',
          status: response.data.data.status?.description || 'Unknown',
          time: response.data.data.time || '0',
          memory: response.data.data.memory || 0,
          testCasesPassed: 0,
          totalTestCases: 0,
        });
      }
    } catch (err: any) {
      setExecutionResult({
        stdout: '',
        stderr: err.response?.data?.message || 'Execution failed',
        status: 'Error',
        time: '0',
        memory: 0,
        testCasesPassed: 0,
        totalTestCases: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

    try {
      const response = await candidateApi.submitAnswer({
        sessionId,
        questionId: currentQuestion.id,
        code: currentAnswer?.code || undefined,
        textAnswer: currentAnswer?.textAnswer || undefined,
        language: selectedLanguage,
        timeTaken,
      });

      if (response.data.success) {
        const data = response.data.data;
        setAiEvaluation(data.aiEvaluation);
        setFollowUpQuestions(data.followUpQuestions || []);

        toast.success(`Answer submitted! Score: ${data.aiEvaluation?.score || 0}/10`);

        socketRef.current.emit('answer-submitted', {
          interviewId: interview?.title,
          sessionId,
          questionId: currentQuestion.id,
          score: data.aiEvaluation?.score || 0,
        });
      }
    } catch {
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
      setExecutionResult(null);
      setAiEvaluation(null);
      setFollowUpQuestions([]);
      setActiveTab('code');
    }
  };

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestion(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
      setExecutionResult(null);
      setAiEvaluation(null);
      setFollowUpQuestions([]);
    }
  };

  // Submit entire interview
  const handleSubmitInterview = async () => {
    if (!confirm('Are you sure you want to submit? You cannot go back.')) return;

    try {
      const response = await candidateApi.submitInterview(sessionId);
      if (response.data.success) {
        completeInterview();
        setFinalResults(response.data.data);
        setShowResults(true);

        socketRef.current.emit('interview-completed', {
          interviewId: interview?.title,
          sessionId,
        });
      }
    } catch {
      toast.error('Failed to submit interview');
    }
  };

  // Redirect if no session data
  if (!interview || !questions.length) {
    return (
      <div className={styles.errorState}>
        <h2 className="heading-lg">Session Not Found</h2>
        <p className="text-muted">Please join an interview first.</p>
        <button className="btn btn-primary" onClick={() => router.push('/interview/join')}>
          Join Interview
        </button>
      </div>
    );
  }

  // Results screen
  if (showResults && finalResults) {
    return (
      <div className={styles.resultsPage}>
        <div className={styles.resultsCard}>
          <div style={{ fontSize: '3rem', textAlign: 'center' }} aria-hidden="true">
            {finalResults.percentageScore >= 70 ? '🎉' : finalResults.percentageScore >= 40 ? '👍' : '📚'}
          </div>
          <h1 className="heading-xl" style={{ textAlign: 'center' }}>
            Interview Complete
          </h1>

          <div className={styles.scoreCircle}>
            <span className={styles.scoreValue}>{finalResults.percentageScore}%</span>
            <span className="text-muted text-sm">
              {finalResults.totalScore}/{finalResults.maxPossibleScore}
            </span>
          </div>

          {finalResults.feedback && (
            <div className={styles.feedbackSection}>
              <h3 className="heading-md">AI Feedback</h3>
              <p className="text-muted">{finalResults.feedback.overallFeedback}</p>

              {finalResults.feedback.strengths?.length > 0 && (
                <div>
                  <h4 className="heading-sm" style={{ color: 'var(--success)' }}>Strengths</h4>
                  <ul className={styles.feedbackList}>
                    {finalResults.feedback.strengths.map((s: string, i: number) => (
                      <li key={i}>✅ {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {finalResults.feedback.weaknesses?.length > 0 && (
                <div>
                  <h4 className="heading-sm" style={{ color: 'var(--warning)' }}>Areas to Improve</h4>
                  <ul className={styles.feedbackList}>
                    {finalResults.feedback.weaknesses.map((w: string, i: number) => (
                      <li key={i}>📌 {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            onClick={() => router.push('/')}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Pre-start screen
  if (!isStarted) {
    return (
      <div className={styles.preStart}>
        <div className={styles.preStartCard}>
          <h1 className="heading-xl text-gradient">{interview.title}</h1>
          {interview.description && (
            <p className="text-muted text-lg">{interview.description}</p>
          )}

          <div className={styles.interviewInfo}>
            <div className={styles.infoItem}>
              <span className="text-muted">Duration</span>
              <strong>{interview.duration} minutes</strong>
            </div>
            <div className={styles.infoItem}>
              <span className="text-muted">Questions</span>
              <strong>{questions.length}</strong>
            </div>
            <div className={styles.infoItem}>
              <span className="text-muted">Topics</span>
              <strong>{interview.topics.join(', ')}</strong>
            </div>
          </div>

          <div className={styles.rules}>
            <h3 className="heading-sm">Before You Begin</h3>
            <ul>
              <li>✅ Ensure stable internet connection</li>
              <li>✅ Camera and microphone must be enabled to start</li>
              <li>⚠️ Tab switching will be recorded</li>
              <li>⏱️ Timer will start once you click Begin</li>
              <li>📝 You can navigate between questions</li>
            </ul>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
            {stream ? (
               <video 
                 autoPlay 
                 muted 
                 playsInline 
                 ref={(video) => { if (video) video.srcObject = stream; }}
                 style={{ width: '100%', maxWidth: '300px', borderRadius: 'var(--radius-md)', border: '2px solid var(--success)' }} 
               />
            ) : (
               <div style={{ width: '100%', maxWidth: '300px', height: '168px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                 <p className="text-muted text-sm text-center px-4">Camera and microphone access required.</p>
                 <button className="btn btn-secondary btn-sm" onClick={requestPermissions}>
                   Enable Camera & Mic
                 </button>
                 <p className="text-xs text-muted text-center" style={{ marginTop: '-0.5rem', opacity: 0.7 }}>
                   (Click the 🔒 icon in your URL bar if blocked)
                 </p>
               </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={handleStartInterview}
            disabled={!hasPermissions}
          >
            {hasPermissions ? 'Begin Interview' : 'Please allow Camera & Mic'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionLayout}>
      {/* Top Bar */}
      <header className={styles.topBar} role="banner">
        <div className={styles.topBarLeft}>
          <span className="heading-sm">{interview.title}</span>
          <span className={`badge badge-accent`}>
            Q{currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
        <div className={styles.topBarCenter}>
          <div
            className={`${styles.timer} ${timeRemaining < 300 ? styles.timerWarning : ''}`}
            role="timer"
            aria-live="polite"
            aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
          >
            ⏱️ {formatTime(timeRemaining)}
          </div>
        </div>
        <div className={styles.topBarRight}>
          {tabSwitchCount > 0 && (
            <span className="badge badge-error">
              ⚠️ {tabSwitchCount} tab switches
            </span>
          )}
          <button
            className="btn btn-danger btn-sm"
            onClick={handleSubmitInterview}
            aria-label="Submit interview"
          >
            Submit Interview
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className={styles.mainArea}>
        {/* Question Panel */}
        <aside className={styles.questionPanel} role="complementary" aria-label="Question">
          
          {/* Ongoing Video Preview */}
          {stream && (
            <div style={{ marginBottom: '1rem', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#000' }}>
               <video 
                 autoPlay 
                 muted 
                 playsInline 
                 ref={(video) => { if (video) video.srcObject = stream; }}
                 style={{ width: '100%', display: 'block' }} 
               />
            </div>
          )}

          {/* Question Navigation */}
          <div className={styles.questionNav}>
            {questions.map((q, i) => (
              <button
                key={q.id}
                className={`${styles.questionDot} ${i === currentQuestionIndex ? styles.questionDotActive : ''} ${answers.has(q.id) ? styles.questionDotAnswered : ''}`}
                onClick={() => {
                  setCurrentQuestion(i);
                  setQuestionStartTime(Date.now());
                  setExecutionResult(null);
                  setAiEvaluation(null);
                }}
                aria-label={`Question ${i + 1}${answers.has(q.id) ? ' (answered)' : ''}`}
                aria-current={i === currentQuestionIndex ? 'step' : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Current Question */}
          {currentQuestion && (
            <div className={styles.questionContent}>
              <div className={styles.questionMeta}>
                <span className={`badge ${currentQuestion.difficulty === 'easy' ? 'badge-success' : currentQuestion.difficulty === 'medium' ? 'badge-warning' : 'badge-error'}`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="badge badge-accent">{currentQuestion.topic}</span>
                <span className="badge badge-info">{currentQuestion.type}</span>
              </div>

              <h2 className="heading-md" style={{ marginTop: '0.75rem' }}>
                {currentQuestion.text}
              </h2>

              {/* Test Cases */}
              {currentQuestion.testCases && currentQuestion.testCases.length > 0 && (
                <div className={styles.testCases}>
                  <h4 className="heading-sm">Test Cases</h4>
                  {currentQuestion.testCases.map((tc, i) => (
                    <div key={i} className={styles.testCase}>
                      <div>
                        <span className="text-xs text-muted">Input:</span>
                        <code>{tc.input}</code>
                      </div>
                      <div>
                        <span className="text-xs text-muted">Expected:</span>
                        <code>{tc.expectedOutput}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Follow-up Questions */}
              {followUpQuestions.length > 0 && (
                <div className={styles.followUps}>
                  <h4 className="heading-sm" style={{ color: 'var(--accent-secondary)' }}>
                    🧠 AI Follow-up Questions
                  </h4>
                  <ul>
                    {followUpQuestions.map((q, i) => (
                      <li key={i} className="text-sm">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Evaluation */}
              {aiEvaluation && (
                <div className={styles.evaluation}>
                  <h4 className="heading-sm" style={{ color: 'var(--success)' }}>
                    AI Evaluation
                  </h4>
                  <div className={styles.evalScores}>
                    <div>Score: <strong>{aiEvaluation.score}/10</strong></div>
                    <div>Code Quality: <strong>{aiEvaluation.codeQuality}/10</strong></div>
                    <div>Correctness: <strong>{aiEvaluation.correctness}/10</strong></div>
                  </div>
                  <p className="text-sm text-muted">{aiEvaluation.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Question Navigation Buttons */}
          <div className={styles.questionActions}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              aria-label="Previous question"
            >
              ← Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              aria-label="Next question"
            >
              Next →
            </button>
          </div>
        </aside>

        {/* Editor Panel */}
        <div className={styles.editorPanel}>
          {/* Editor Tabs */}
          <div className={styles.editorTabs} role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'code'}
              className={`${styles.editorTab} ${activeTab === 'code' ? styles.editorTabActive : ''}`}
              onClick={() => setActiveTab('code')}
            >
              💻 Code
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'text'}
              className={`${styles.editorTab} ${activeTab === 'text' ? styles.editorTabActive : ''}`}
              onClick={() => setActiveTab('text')}
            >
              📝 Text Answer
            </button>

            {/* Language selector */}
            {activeTab === 'code' && (
              <select
                className="select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{ marginLeft: 'auto', width: 'auto', minWidth: '140px' }}
                aria-label="Select programming language"
              >
                {Object.entries(LANGUAGE_MAP).map(([key, lang]) => (
                  <option key={key} value={key}>
                    {lang.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Code Editor */}
          {activeTab === 'code' ? (
            <div className={styles.monacoContainer}>
              <MonacoEditor
                height="100%"
                language={LANGUAGE_MAP[selectedLanguage]?.monacoId || 'javascript'}
                theme="vs-dark"
                value={currentAnswer?.code || currentQuestion?.sampleCode || '// Write your solution here\n'}
                onChange={(value) => {
                  if (currentQuestion) {
                    updateAnswer(currentQuestion.id, { code: value || '', language: selectedLanguage });
                  }
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'var(--font-mono)',
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                }}
              />
            </div>
          ) : (
            <div className={styles.textEditorContainer} style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${isListening ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={toggleDictation}
                >
                  {isListening ? '🛑 Stop Dictation' : '🎤 Start Dictation'}
                </button>
              </div>
              <textarea
                className="textarea"
                style={{ flex: 1, border: 'none', resize: 'none', fontFamily: 'var(--font-sans)', borderRadius: 0 }}
                placeholder="Write your explanation or answer here. Click 'Start Dictation' to use your voice..."
                value={currentAnswer?.textAnswer || ''}
                onChange={(e) => {
                  if (currentQuestion) {
                    updateAnswer(currentQuestion.id, { textAnswer: e.target.value });
                  }
                }}
                aria-label="Text answer"
              />
            </div>
          )}

          {/* Output Panel */}
          <div className={styles.outputPanel}>
            <div className={styles.outputHeader}>
              <span className="heading-sm">Output</span>
              <div className={styles.outputActions}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleRunCode}
                  disabled={isRunning || activeTab !== 'code'}
                  aria-label="Run code"
                >
                  {isRunning ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Running...
                    </>
                  ) : (
                    '▶ Run Code'
                  )}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting}
                  aria-label="Submit answer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Submitting...
                    </>
                  ) : (
                    '✓ Submit Answer'
                  )}
                </button>
              </div>
            </div>

            <div className={styles.outputContent}>
              {executionResult ? (
                <div className={styles.outputResult}>
                  <div className={`${styles.statusBadge} ${executionResult.status === 'Accepted' ? styles.statusSuccess : styles.statusError}`}>
                    {executionResult.status}
                  </div>
                  {executionResult.stdout && (
                    <div>
                      <span className="text-xs text-muted">stdout:</span>
                      <pre className={styles.outputPre}>{executionResult.stdout}</pre>
                    </div>
                  )}
                  {executionResult.stderr && (
                    <div>
                      <span className="text-xs text-muted" style={{ color: 'var(--error)' }}>stderr:</span>
                      <pre className={styles.outputPre} style={{ color: 'var(--error)' }}>{executionResult.stderr}</pre>
                    </div>
                  )}
                  <div className={styles.execMeta}>
                    <span>Time: {executionResult.time}s</span>
                    <span>Memory: {(executionResult.memory / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted text-sm" style={{ padding: '1rem' }}>
                  Run your code to see output here
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer} role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={currentQuestionIndex + 1}>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
