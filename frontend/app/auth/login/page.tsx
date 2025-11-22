"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      await authStore.login(name, password);
      router.push('/user'); // Перенаправление после успешного логина
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-light/10 bg-dark/50 p-10 shadow-[0_0px_60px_rgba(249,249,223,0.15)] backdrop-blur-sm">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-light">
            Log In
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-light"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-light placeholder:text-light/40 transition-all focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-light"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-light placeholder:text-light/40 transition-all focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full rounded-lg bg-light px-6 py-3 text-base font-semibold text-dark transition-all hover:bg-light-hover hover:scale-[1.02] hover:shadow-[0_0px_30px_rgba(249,249,223,0.3)] focus:outline-none focus:ring-2 focus:ring-light/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {formLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-light/60">
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            className="font-semibold text-light transition-colors hover:text-light-hover"
          >
           Register
          </Link>
        </p>
      </div>
    </div>
  );
}

