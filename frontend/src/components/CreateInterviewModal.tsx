'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { interviewApi } from '@/lib/api';
import { TOPICS, DIFFICULTIES, LANGUAGE_MAP } from '@/lib/constants';
import toast from 'react-hot-toast';
import styles from './CreateInterviewModal.module.css';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateInterviewModal({ onClose, onCreated }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdData, setCreatedData] = useState<{
    interviewId: string;
    password: string;
    joinLink: string;
  } | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    topics: [] as string[],
    languages: ['javascript'] as string[],
    difficulty: 'medium',
    questionsPerTopic: 3,
    customTopics: [] as string[],
    dsaTopics: [] as { topic: string; difficulty: 'easy' | 'medium' | 'hard' }[],
    duration: 60,
    enableProctoring: true,
    enableCodeExecution: true,
    adaptiveDifficulty: true,
  });

  const [customTopicInput, setCustomTopicInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (customTopicInput.trim() === '') {
        setSuggestions([]);
        return;
      }
      try {
        const res = await interviewApi.getTopicSuggestions(customTopicInput);
        if (res.data?.success) {
          setSuggestions(res.data.data.filter((s: string) => !form.customTopics.includes(s)));
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [customTopicInput, form.customTopics]);

  // Focus management
  useEffect(() => {
    firstInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      // Trap focus within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleTopic = (topic: string) => {
    setForm((f) => ({
      ...f,
      topics: f.topics.includes(topic)
        ? f.topics.filter((t) => t !== topic)
        : [...f.topics, topic],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (form.topics.length === 0) {
      toast.error('Please select at least one topic');
      return;
    }

    if (form.languages.length === 0) {
      toast.error('Please select at least one language');
      return;
    }

    setIsLoading(true);

    try {
      const response = await interviewApi.create({
        title: form.title,
        description: form.description || undefined,
        topics: form.topics,
        languages: form.languages,
        difficulty: form.difficulty as 'easy' | 'medium' | 'hard' | 'mixed',
        questionsPerTopic: form.questionsPerTopic,
        customTopics: form.customTopics.length > 0 ? form.customTopics : undefined,
        dsaTopics: form.dsaTopics.length > 0 ? form.dsaTopics : undefined,
        duration: form.duration,
        settings: {
          enableProctoring: form.enableProctoring,
          enableCodeExecution: form.enableCodeExecution,
          adaptiveDifficulty: form.adaptiveDifficulty,
        },
      });

      if (response.data.success) {
        setCreatedData(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create interview');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Success state
  if (createdData) {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Interview created">
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <div className="modal-body" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>
              Interview Created!
            </h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              Share these details with your candidates
            </p>

            <div className={styles.createdDetails}>
              <div className={styles.detailItem}>
                <span className="input-label">Interview ID</span>
                <div className={styles.copyableField}>
                  <code>{createdData.interviewId}</code>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => copyToClipboard(createdData.interviewId, 'ID')}
                    aria-label="Copy interview ID"
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className={styles.detailItem}>
                <span className="input-label">Password</span>
                <div className={styles.copyableField}>
                  <code>{createdData.password}</code>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => copyToClipboard(createdData.password, 'Password')}
                    aria-label="Copy password"
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className={styles.detailItem}>
                <span className="input-label">Join Link</span>
                <div className={styles.copyableField}>
                  <code className="text-xs" style={{ wordBreak: 'break-all' }}>
                    {createdData.joinLink}
                  </code>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => copyToClipboard(createdData.joinLink, 'Link')}
                    aria-label="Copy join link"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={onCreated}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Create new interview"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" ref={modalRef} style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <h2 className="heading-md">Create Interview</h2>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className={styles.formGrid}>
              {/* Title */}
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="title" className="input-label">
                  Interview Title *
                </label>
                <input
                  ref={firstInputRef}
                  id="title"
                  type="text"
                  className="input"
                  placeholder="e.g. Senior Frontend Developer Interview"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  aria-required="true"
                />
              </div>

              {/* Description */}
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="description" className="input-label">
                  Description
                </label>
                <textarea
                  id="description"
                  className="textarea"
                  placeholder="Brief description of the interview..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={1000}
                  rows={2}
                />
              </div>

              {/* Topics */}
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Topics *</label>
                <div className={styles.tagGrid} role="group" aria-label="Select topics">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      className={`tag ${form.topics.includes(topic) ? 'active' : ''}`}
                      onClick={() => toggleTopic(topic)}
                      aria-pressed={form.topics.includes(topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Topics AutoComplete */}
              <div className="input-group" style={{ gridColumn: '1 / -1', position: 'relative' }}>
                <label htmlFor="customTopics" className="input-label">
                  Custom Topics (Search & Add)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {form.customTopics.map(t => (
                    <span key={t} className="tag active" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {t} <button type="button" onClick={() => setForm(f => ({ ...f, customTopics: f.customTopics.filter(x => x !== t) }))} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>✕</button>
                    </span>
                  ))}
                </div>
                <input
                  id="customTopics"
                  type="text"
                  className="input"
                  placeholder="Type to search and add custom tech keywords..."
                  value={customTopicInput}
                  onChange={(e) => {
                    setCustomTopicInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customTopicInput.trim()) {
                      e.preventDefault();
                      setForm(f => ({ ...f, customTopics: [...f.customTopics, customTopicInput.trim()] }));
                      setCustomTopicInput('');
                      setShowSuggestions(false);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && (suggestions.length > 0 || customTopicInput.trim() !== '') && (
                  <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 'var(--z-dropdown, 1000)', background: 'var(--bg-elevated, #22222e)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', listStyle: 'none', margin: '4px 0 0 0', padding: '0', maxHeight: '200px', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                    {customTopicInput.trim() !== '' && !suggestions.includes(customTopicInput.trim()) && !form.customTopics.includes(customTopicInput.trim()) && (
                      <li style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-secondary)', fontStyle: 'italic', color: 'var(--accent-primary)' }}
                          onMouseDown={() => {
                            setForm((f) => ({ ...f, customTopics: [...f.customTopics, customTopicInput.trim()] }));
                            setCustomTopicInput('');
                            setShowSuggestions(false);
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        + Add &quot;{customTopicInput.trim()}&quot;
                      </li>
                    )}
                    {suggestions.map((s, idx) => (
                      <li key={idx} style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}
                          onMouseDown={() => {
                            setForm((f) => ({ ...f, customTopics: [...f.customTopics, s] }));
                            setCustomTopicInput('');
                            setShowSuggestions(false);
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* DSA Topics */}
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">DSA Topics & Difficulty</label>
                <div className={styles.tagGrid} role="group" aria-label="Select DSA topics">
                  {['Array', 'Linked List', 'String', 'Tree', 'Graph', 'DP', 'Recursion', 'Hashing', 'Stack & Queue', 'Sorting & Searching'].map((topic) => {
                    const existing = form.dsaTopics.find((t) => t.topic === topic);
                    return (
                      <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                          <input 
                            type="checkbox" 
                            checked={!!existing}
                            onChange={(e) => {
                              if (e.target.checked) setForm(f => ({ ...f, dsaTopics: [...f.dsaTopics, { topic, difficulty: 'medium' }] }));
                              else setForm(f => ({ ...f, dsaTopics: f.dsaTopics.filter(t => t.topic !== topic) }));
                            }}
                          />
                          {topic}
                        </label>
                        {existing && (
                          <select 
                            className="select" 
                            style={{ padding: '0.2rem 1.5rem 0.2rem 0.5rem', fontSize: '0.75rem', height: 'auto', minHeight: 'unset', width: 'auto' }}
                            value={existing.difficulty}
                            onChange={(e) => {
                              setForm(f => ({
                                ...f,
                                dsaTopics: f.dsaTopics.map(t => t.topic === topic ? { ...t, difficulty: e.target.value as 'easy'|'medium'|'hard' } : t)
                              }));
                            }}
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Programming Languages *</label>
                <div className={styles.tagGrid} role="group" aria-label="Select languages">
                  {Object.entries(LANGUAGE_MAP).map(([key, lang]) => (
                    <button
                      key={key}
                      type="button"
                      className={`tag ${form.languages.includes(key) ? 'active' : ''}`}
                      onClick={() => toggleLanguage(key)}
                      aria-pressed={form.languages.includes(key)}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="input-group">
                <label htmlFor="difficulty" className="input-label">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  className="select"
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Questions per topic */}
              <div className="input-group">
                <label htmlFor="questionsPerTopic" className="input-label">
                  Questions / Topic
                </label>
                <input
                  id="questionsPerTopic"
                  type="number"
                  className="input"
                  min={1}
                  max={20}
                  value={form.questionsPerTopic}
                  onChange={(e) =>
                    setForm({ ...form, questionsPerTopic: Number(e.target.value) })
                  }
                />
              </div>

              {/* Duration */}
              <div className="input-group">
                <label htmlFor="duration" className="input-label">
                  Duration (minutes)
                </label>
                <input
                  id="duration"
                  type="number"
                  className="input"
                  min={5}
                  max={300}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                />
              </div>

              {/* Max candidates removed */}

              {/* Settings Toggles */}
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Settings</label>
                <div className={styles.toggleGrid}>
                  {[
                    { key: 'enableProctoring', label: 'Enable Proctoring' },
                    { key: 'enableCodeExecution', label: 'Enable Code Execution' },
                    { key: 'adaptiveDifficulty', label: 'Adaptive Difficulty' },
                  ].map((setting) => (
                    <label key={setting.key} className={styles.toggleItem}>
                      <input
                        type="checkbox"
                        checked={form[setting.key as keyof typeof form] as boolean}
                        onChange={(e) =>
                          setForm({ ...form, [setting.key]: e.target.checked })
                        }
                        className={styles.checkbox}
                      />
                      <span className={styles.toggleLabel}>{setting.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                'Create Interview'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
