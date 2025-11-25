"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authStore } from '@/store/authStore';
import { register } from '@/lib/api';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import Card from '@/components/Card';
import { useT } from '@/lib/i18n';
import { resolveErrorMessage } from '@/lib/i18n/errorMap';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const isRegister = type === 'register';
  const t = useT();
  const ERROR_MAP: Record<string, string> = {
    'Registration failed': 'auth.error.register',
    'Login failed': 'auth.error.login',
    'Passwords do not match': 'auth.error.passwordMismatch',
    'Password must be at least 6 characters long': 'auth.error.passwordLength',
    'auth.error.passwordMismatch': 'auth.error.passwordMismatch',
    'auth.error.passwordLength': 'auth.error.passwordLength',
    'auth.error.register': 'auth.error.register',
    'auth.error.login': 'auth.error.login',
  };
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // Default to login if no type specified
  useEffect(() => {
    if (!type) {
      router.replace('/auth?type=login');
    }
  }, [type, router]);

  // Reset form when switching between login/register
  useEffect(() => {
    setName('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, [isRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Password confirmation check for register
    if (isRegister) {
      if (password !== confirmPassword) {
        setError('auth.error.passwordMismatch');
        return;
      }
      if (password.length < 6) {
        setError('auth.error.passwordLength');
        return;
      }
    }

    setFormLoading(true);

    try {
      if (isRegister) {
        await register(name, password);
        router.push('/user');
      } else {
        await authStore.login(name, password);
        router.push('/user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (isRegister ? 'auth.error.register' : 'auth.error.login'));
    } finally {
      setFormLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-6 py-12">
      <Card className="w-full max-w-md p-10 backdrop-blur-sm">
        <div className="mb-8">
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-light text-center">
            {isRegister ? t('auth.title.register') : t('auth.title.login')}
          </h1>
          
          {/* Tab Switcher */}
          <div className="flex rounded-lg border border-light/10 bg-dark/30 p-1">
            <button
              type="button"
              onClick={() => router.push('/auth?type=login')}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold cursor-pointer ${
                !isRegister
                  ? 'bg-light text-dark shadow-sm'
                  : 'text-light/60 hover:text-light'
              }`}
            >
              {t('auth.tab.login')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/auth?type=register')}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold cursor-pointer ${
                isRegister
                  ? 'bg-light text-dark shadow-sm'
                  : 'text-light/60 hover:text-light'
              }`}
            >
              {t('auth.tab.register')}
            </button>
          </div>
          
          {isRegister && (
            <p className="mt-4 text-center text-sm text-light/60">
              {t('auth.subtitle.register')}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {resolveErrorMessage(error, ERROR_MAP, t) ?? error}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-light"
            >
              {t('auth.label.name')}
            </label>
            <TextInput
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t('auth.placeholder.name')}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-light"
            >
              {t('auth.label.password')}
            </label>
            <TextInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={isRegister ? t('auth.placeholder.password.create') : t('auth.placeholder.password.enter')}
            />
          </div>

          {isRegister && (
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-light"
              >
                {t('auth.label.confirmPassword')}
              </label>
              <TextInput
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={t('auth.placeholder.confirmPassword')}
              />
            </div>
          )}
          <Button type="submit" disabled={formLoading} className="w-full">
            {formLoading
              ? (isRegister ? t('auth.loading.register') : t('auth.loading.login'))
              : (isRegister ? t('register') : t('login'))}
          </Button>
        </form>

      </Card>
    </div>
  );
}

