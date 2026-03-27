'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';
import styles from './login.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.login(username, password);
      if (response.data.success) {
        login(response.data.data.token, response.data.data.admin);
        toast.success('Welcome back, Admin!');
        router.push('/admin/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.ambientBg} aria-hidden="true">
        <div className={styles.orb} />
      </div>

      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <div className={styles.logoIcon} aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="url(#login-grad)" />
                <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="login-grad" x1="0" y1="0" x2="40" y2="40">
                    <stop stopColor="#818cf8" />
                    <stop offset="1" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="heading-lg">Admin Login</h1>
            <p className="text-muted">Sign in to manage interviews</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm} aria-label="Admin login form">
            <div className="input-group">
              <label htmlFor="username" className="input-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                aria-required="true"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-required="true"
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className={styles.loginFooter}>
            <p className="text-sm text-muted">
              Demo credentials: <strong>admin</strong> / <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
