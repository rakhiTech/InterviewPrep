import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'InterviewPrepAI - AI-Powered Interview Platform',
  description:
    'AI-powered interview preparation platform for developers. Practice coding interviews with intelligent question generation, real-time code execution, and AI-driven feedback.',
  keywords: [
    'interview preparation',
    'coding interview',
    'AI interview',
    'developer tools',
    'technical interview',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content" role="main">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
            },
          }}
        />
      </body>
    </html>
  );
}
