'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { interviewApi } from '@/lib/api';
import { useAuthStore, useThemeStore } from '@/store';
import CreateInterviewModal from '@/components/CreateInterviewModal';
import toast from 'react-hot-toast';
import styles from './dashboard.module.css';

interface InterviewListItem {
  interviewId: string;
  title: string;
  topics: string[];
  difficulty: string;
  status: string;
  duration: number;
  candidateCount: number;
  createdAt: string;
  questions?: { length: number }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, logout, checkAuth } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalCandidates: 0,
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    fetchInterviews();
  }, [isAuthenticated, router]);

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const response = await interviewApi.list();
      if (response.data.success) {
        const data = response.data.data;
        setInterviews(data.interviews || []);
        const interviewList = data.interviews || [];
        setStats({
          total: data.pagination?.total || interviewList.length,
          active: interviewList.filter((i: InterviewListItem) => i.status === 'active').length,
          completed: interviewList.filter((i: InterviewListItem) => i.status === 'completed').length,
          totalCandidates: interviewList.reduce(
            (acc: number, i: InterviewListItem) => acc + (i.candidateCount || 0),
            0
          ),
        });
      }
    } catch (error: any) {
      // API may not be running yet, show empty state
      console.warn('Failed to fetch interviews:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterviewCreated = () => {
    setShowCreateModal(false);
    fetchInterviews();
    toast.success('Interview created! Share the link with candidates.');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-error';
      default: return 'badge-accent';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'completed': return 'badge-info';
      case 'cancelled': return 'badge-error';
      default: return 'badge-accent';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <aside className={styles.sidebar} role="navigation" aria-label="Admin sidebar">
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="url(#dash-grad)" />
              <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="dash-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#818cf8" />
                  <stop offset="1" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>InterviewPrepAI</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <button className={`${styles.navItem} ${styles.navItemActive}`} aria-current="page">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Dashboard
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            {isDark ? '☀️' : '🌙'} {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { logout(); router.push('/admin/login'); }}
            style={{ width: '100%', justifyContent: 'flex-start' }}
            aria-label="Sign out"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1 className="heading-lg">Dashboard</h1>
            <p className="text-muted">Manage your interviews and view analytics</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            aria-label="Create a new interview"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Interview
          </button>
        </header>

        {/* Stats Grid */}
        <div className={styles.statsGrid} role="region" aria-label="Interview statistics">
          {[
            { label: 'Total Interviews', value: stats.total, color: 'var(--accent-primary)' },
            { label: 'Active', value: stats.active, color: 'var(--success)' },
            { label: 'Completed', value: stats.completed, color: 'var(--info)' },
            { label: 'Total Candidates', value: stats.totalCandidates, color: 'var(--accent-secondary)' },
          ].map((stat, i) => (
            <div key={i} className="stat-card">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value" style={{ color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Interviews List */}
        <section className={styles.interviewsSection} aria-label="Interviews list">
          <div className={styles.sectionHeader}>
            <h2 className="heading-md">Interviews</h2>
          </div>

          {isLoading ? (
            <div className={styles.loadingState}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`skeleton ${styles.skeletonCard}`} />
              ))}
            </div>
          ) : interviews.length > 0 ? (
            <div className={styles.interviewsList}>
              {interviews.map((interview) => (
                <article
                  key={interview.interviewId}
                  className={styles.interviewCard}
                  onClick={() => router.push(`/admin/interview/${interview.interviewId}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/admin/interview/${interview.interviewId}`);
                    }
                  }}
                  aria-label={`View interview ${interview.title}`}
                >
                  <div className={styles.interviewCardHeader}>
                    <h3 className={styles.interviewTitle}>{interview.title}</h3>
                    <span className={`badge ${getStatusColor(interview.status)}`}>
                      {interview.status}
                    </span>
                  </div>
                  <div className={styles.interviewMeta}>
                    <div className={styles.metaItem}>
                      <span className="text-muted text-sm">Topics:</span>
                      <div className={styles.topicTags}>
                        {interview.topics.slice(0, 3).map((topic) => (
                          <span key={topic} className="tag">{topic}</span>
                        ))}
                        {interview.topics.length > 3 && (
                          <span className="tag">+{interview.topics.length - 3}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={`badge ${getDifficultyColor(interview.difficulty)}`}>
                        {interview.difficulty}
                      </span>
                      <span className="text-sm text-muted">
                        {interview.duration} min
                      </span>
                      <span className="text-sm text-muted">
                        {interview.candidateCount || 0} candidates
                      </span>
                      <span className="text-sm text-muted">
                        {formatDate(interview.createdAt)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">📋</div>
              <h3>No interviews yet</h3>
              <p className="text-muted">Create your first interview to get started</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Interview
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Create Interview Modal */}
      {showCreateModal && (
        <CreateInterviewModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleInterviewCreated}
        />
      )}
    </div>
  );
}
