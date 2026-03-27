// Language ID mapping for Judge0
export const LANGUAGE_MAP: Record<string, { id: number; name: string; monacoId: string }> = {
  javascript: { id: 63, name: 'JavaScript', monacoId: 'javascript' },
  typescript: { id: 74, name: 'TypeScript', monacoId: 'typescript' },
  python: { id: 71, name: 'Python 3', monacoId: 'python' },
  java: { id: 62, name: 'Java', monacoId: 'java' },
  cpp: { id: 54, name: 'C++', monacoId: 'cpp' },
  c: { id: 50, name: 'C', monacoId: 'c' },
  csharp: { id: 51, name: 'C#', monacoId: 'csharp' },
  go: { id: 60, name: 'Go', monacoId: 'go' },
  rust: { id: 73, name: 'Rust', monacoId: 'rust' },
  ruby: { id: 72, name: 'Ruby', monacoId: 'ruby' },
  php: { id: 68, name: 'PHP', monacoId: 'php' },
  swift: { id: 83, name: 'Swift', monacoId: 'swift' },
  kotlin: { id: 78, name: 'Kotlin', monacoId: 'kotlin' },
};

export const TOPICS = [
  'DSA',
  'System Design',
  'Frontend',
  'Backend',
  'Database',
  'DevOps',
  'Machine Learning',
  'Security',
  'Networking',
  'Operating Systems',
];

export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'hard', label: 'Hard', color: '#ef4444' },
  { value: 'mixed', label: 'Mixed', color: '#8b5cf6' },
];
