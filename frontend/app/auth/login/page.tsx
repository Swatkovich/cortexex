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
    <div className="flex min-h-screen items-center justify-center bg-dark">
      <div className="w-full max-w-md rounded-lg bg-dark p-8 shadow-[0_0px_60px_rgba(249,249,223,0.25)]">
        <h1 className="mb-6 text-3xl font-bold text-light">
          Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
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
              className="mt-1 w-full rounded-md border border-light bg-dark px-3 py-2 text-light focus:border-light-hover focus:outline-none focus:ring-1 focus:ring-dark"
            />
          </div>

          <div>
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
              className="mt-1 w-full rounded-md border border-light bg-dark px-3 py-2 text-light focus:border-light-hover focus:outline-none focus:ring-1 focus:ring-dark"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full rounded-md bg-light px-4 py-2 font-medium text-dark hover:bg-light-hover focus:outline-none focus:ring-2 focus:ring-dark focus:ring-offset-2 disabled:opacity-50"
          >
            {formLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-light">
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            className="font-medium text-light hover:text-light-hover"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

