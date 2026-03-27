'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { interviewApi } from '@/lib/api';
import type { Interview, CandidateSession } from '@/types';
import styles from './detail.module.css';

export default function InterviewDetail() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [sessions, setSessions] = useState<CandidateSession[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<CandidateSession | null>(null);

  useEffect(() => {
    fetchInterviewDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const fetchInterviewDetails = async () => {
    setIsLoading(true);
    try {
      const response = await interviewApi.get(interviewId);
      if (response.data.success) {
        setInterview(response.data.data.interview);
        setSessions(response.data.data.sessions || []);
        setAnalytics(response.data.data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className="spinner-lg" />
        <p className="text-muted">Loading interview details...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className={styles.loading}>
        <h2 className="heading-lg">Interview Not Found</h2>
        <button className="btn btn-primary" onClick={() => router.push('/admin/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push('/admin/dashboard')}
            aria-label="Back to dashboard"
          >
            ← Back
          </button>
          <h1 className="heading-lg" style={{ marginTop: '0.5rem' }}>
            {interview.title}
          </h1>
          <div className={styles.headerMeta}>
            <span className={`badge ${interview.status === 'active' ? 'badge-success' : 'badge-info'}`}>
              {interview.status}
            </span>
            <span className="text-sm text-muted">ID: {interview.interviewId}</span>
            <span className="text-sm text-muted">{interview.duration} min</span>
          </div>
        </div>
      </header>

      {/* Analytics */}
      {analytics && (
        <div className={styles.analyticsGrid} role="region" aria-label="Analytics">
          <div className="stat-card">
            <span className="stat-label">Total Candidates</span>
            <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
              {analytics.totalCandidates}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>
              {analytics.completed}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">In Progress</span>
            <span className="stat-value" style={{ color: 'var(--warning)' }}>
              {analytics.inProgress}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg Score</span>
            <span className="stat-value" style={{ color: 'var(--accent-secondary)' }}>
              {analytics.averageScore}%
            </span>
          </div>
        </div>
      )}

      {/* Topics & Questions */}
      <section className={styles.section}>
        <h2 className="heading-md">Interview Configuration</h2>
        <div className={styles.configGrid}>
          <div>
            <span className="input-label">Topics</span>
            <div className={styles.tagRow}>
              {interview.topics.map((t) => (
                <span key={t} className="tag active">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="input-label">Languages</span>
            <div className={styles.tagRow}>
              {interview.languages.map((l) => (
                <span key={l} className="tag">{l}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="input-label">Difficulty</span>
            <span className={`badge ${interview.difficulty === 'easy' ? 'badge-success' : interview.difficulty === 'medium' ? 'badge-warning' : 'badge-error'}`}>
              {interview.difficulty}
            </span>
          </div>
          <div>
            <span className="input-label">Questions</span>
            <span>{interview.questions?.length || 0}</span>
          </div>
        </div>
      </section>

      {/* Candidates Table */}
      <section className={styles.section}>
        <h2 className="heading-md">Candidates</h2>
        {sessions.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table} role="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Status</th>
                  <th scope="col">Score</th>
                  <th scope="col">Proctoring</th>
                  <th scope="col">Flags</th>
                  <th scope="col">Duration</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session._id}
                    className={styles.tableRow}
                    onClick={() => setSelectedSession(session)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${session.candidateName}'s details`}
                  >
                    <td>
                      <span className={styles.candidateName}>{session.candidateName}</span>
                      {session.candidateEmail && (
                        <span className="text-xs text-muted">{session.candidateEmail}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${session.status === 'evaluated' ? 'badge-success' : session.status === 'in_progress' ? 'badge-warning' : 'badge-info'}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>
                      <strong>{session.percentageScore}%</strong>
                      <span className="text-xs text-muted"> ({session.totalScore}/{session.maxPossibleScore})</span>
                    </td>
                    <td>
                      <div className="progress-bar" style={{ width: '80px' }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${session.proctoringScore}%`,
                            background: session.proctoringScore > 70 ? 'var(--success)' : session.proctoringScore > 40 ? 'var(--warning)' : 'var(--error)',
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted">{session.proctoringScore}%</span>
                    </td>
                    <td>
                      {session.proctoringFlags.length > 0 ? (
                        <span className="badge badge-error">
                          {session.proctoringFlags.length} flags
                        </span>
                      ) : (
                        <span className="badge badge-success">Clean</span>
                      )}
                    </td>
                    <td className="text-sm text-muted">
                      {session.duration ? `${Math.round(session.duration / 60)} min` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className="text-muted">No candidates have joined yet</p>
          </div>
        )}
      </section>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setSelectedSession(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Candidate details"
        >
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="heading-md">{selectedSession.candidateName}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedSession(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className={styles.sessionDetail}>
                <div className={styles.scoreDisplay}>
                  <span className={styles.bigScore}>{selectedSession.percentageScore}%</span>
                  <span className="text-muted">Overall Score</span>
                </div>

                {selectedSession.feedback && (
                  <>
                    <div>
                      <h4 className="heading-sm">AI Feedback</h4>
                      <p className="text-sm text-muted">{selectedSession.feedback.overallFeedback}</p>
                    </div>

                    {selectedSession.feedback.topicWiseScores?.map((ts, i) => (
                      <div key={i} className={styles.topicScore}>
                        <span>{ts.topic}</span>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${(ts.score / ts.maxScore) * 100}%` }} />
                        </div>
                        <span className="text-sm">{ts.score}/{ts.maxScore}</span>
                      </div>
                    ))}
                  </>
                )}

                {selectedSession.proctoringFlags.length > 0 && (
                  <div>
                    <h4 className="heading-sm" style={{ color: 'var(--error)' }}>Proctoring Flags</h4>
                    <div className={styles.flagsList}>
                      {selectedSession.proctoringFlags.map((flag, i) => (
                        <div key={i} className={styles.flagItem}>
                          <span className={`badge ${flag.severity === 'high' ? 'badge-error' : flag.severity === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                            {flag.type}
                          </span>
                          <span className="text-xs text-muted">
                            {new Date(flag.timestamp).toLocaleTimeString()}
                          </span>
                          {flag.details && <span className="text-xs text-muted">{flag.details}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
