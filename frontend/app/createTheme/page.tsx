"use client";

import { FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import * as api from '@/lib/api';

export default function CreateThemePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeId = searchParams.get('id');
  const isEditMode = !!themeId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load theme data if editing
  useEffect(() => {
    if (isEditMode && themeId) {
      const loadTheme = async () => {
        try {
          setLoading(true);
          const theme = await api.fetchTheme(themeId);
          setTitle(theme.title);
          setDescription(theme.description);
          setDifficulty(theme.difficulty);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load theme');
        } finally {
          setLoading(false);
        }
      };
      loadTheme();
    }
  }, [isEditMode, themeId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && themeId) {
        await themeStore.updateTheme(themeId, {
          title: title.trim(),
          description: description.trim(),
          difficulty,
        });
      } else {
        await themeStore.addTheme({
          title: title.trim(),
          description: description.trim(),
          difficulty,
        });
      }
      router.push('/user');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theme');
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-light/60">
          {isEditMode ? 'Edit Theme' : 'Create Theme'}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
          {isEditMode ? 'Update your learning track' : 'Design a new learning track'}
        </h1>
        <p className="max-w-2xl text-lg text-light/70">
          {isEditMode
            ? 'Modify the theme details and save your changes.'
            : 'Define the essentials and immediately make it available on your dashboard.'}
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading && isEditMode && !title ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-lg text-light/70">Loading theme...</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-light/10 bg-dark/50 p-8 backdrop-blur-sm"
        >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-light">
            Theme title
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light placeholder:text-light/40 focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
            placeholder="Neuro Linguistics"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-light">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={4}
            className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light placeholder:text-light/40 focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
            placeholder="Outline why this topic matters and what to expect."
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-light">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as 'Easy' | 'Medium' | 'Hard')}
              className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

        </div>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-light px-8 py-4 text-base font-semibold text-dark hover:bg-light-hover hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!title.trim() || !description.trim() || loading}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update theme' : 'Save theme'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/user')}
            className="flex-1 rounded-xl border border-light/20 bg-transparent px-8 py-4 text-base font-semibold text-light hover:border-light/40 hover:bg-light/5"
          >
            Cancel
          </button>
        </div>
      </form>
      )}
    </main>
  );
}

