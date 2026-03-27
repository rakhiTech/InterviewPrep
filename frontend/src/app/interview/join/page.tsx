'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { candidateApi } from '@/lib/api';
import { useInterviewStore } from '@/store';
import toast from 'react-hot-toast';
import styles from './join.module.css';

function JoinInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useInterviewStore();

  const [interviewId, setInterviewId] = useState(searchParams.get('id') || '');
  const [password, setPassword] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await candidateApi.join({
        interviewId: interviewId.trim(),
        password: password.trim(),
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim() || undefined,
      });

      if (response.data.success) {
        const { sessionId, interview, questions } = response.data.data;

        setSession(sessionId, interview, questions);

        toast.success('Successfully joined! Preparing your interview...');
        router.push(`/interview/session/${sessionId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join interview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.joinPage}>
      <div className={styles.ambientBg} aria-hidden="true">
        <div className={styles.orb} />
      </div>

      <div className={styles.joinContainer}>
        <button
          className="btn btn-ghost"
          onClick={() => router.push('/')}
          style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}
          aria-label="Go back to home"
        >
          ← Back to Home
        </button>

        <div className={styles.joinCard}>
          <div className={styles.joinHeader}>
            <div style={{ fontSize: '2.5rem' }} aria-hidden="true">
              💻
            </div>
            <h1 className="heading-lg">Join Interview</h1>
            <p className="text-muted">
              Enter your interview credentials to begin
            </p>
          </div>

          <form onSubmit={handleJoin} className={styles.joinForm} aria-label="Join interview form">
            <div className="input-group">
              <label htmlFor="interviewId" className="input-label">
                Interview ID *
              </label>
              <input
                id="interviewId"
                type="text"
                className="input"
                placeholder="Enter interview ID (e.g., ABC12345)"
                value={interviewId}
                onChange={(e) => setInterviewId(e.target.value.toUpperCase())}
                required
                aria-required="true"
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Password *
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Enter interview password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="input-group">
              <label htmlFor="candidateName" className="input-label">
                Your Name *
              </label>
              <input
                id="candidateName"
                type="text"
                className="input"
                placeholder="Enter your full name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="input-group">
              <label htmlFor="candidateEmail" className="input-label">
                Email (optional)
              </label>
              <input
                id="candidateEmail"
                type="email"
                className="input"
                placeholder="your@email.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Joining...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M7 3L13 9L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Join Interview
                </>
              )}
            </button>
          </form>

          <div className={styles.joinFooter}>
            <p className="text-sm text-muted">
              🔒 No account required. Your session is secured and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JoinInterview() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-lg" />
      </div>
    }>
      <JoinInterviewContent />
    </Suspense>
  );
}
