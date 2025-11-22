"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { themeStore } from '@/store/themeStore';

export default function CreateThemePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [questions, setQuestions] = useState(10);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    themeStore.addTheme({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      questions,
    });
    themeStore.resetSelection();
    router.push('/user');
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-light/60">
          Create Theme
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
          Design a new learning track
        </h1>
        <p className="max-w-2xl text-lg text-light/70">
          Define the essentials and immediately make it available on your dashboard.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-light/10 bg-dark/50 p-8 shadow-[0_0px_60px_rgba(249,249,223,0.15)] backdrop-blur-sm"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-light">
            Theme title
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light placeholder:text-light/40 transition-all focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
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
            className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light placeholder:text-light/40 transition-all focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
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
              className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light transition-all focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-light">
              Questions count
            </label>
            <input
              type="number"
              min={1}
              value={questions}
              onChange={(event) => setQuestions(Number(event.target.value))}
              className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light placeholder:text-light/40 transition-all focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-light px-8 py-4 text-base font-semibold text-dark transition-all hover:bg-light-hover hover:scale-[1.02] hover:shadow-[0_0px_30px_rgba(249,249,223,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!title.trim() || !description.trim()}
          >
            Save theme
          </button>
          <button
            type="button"
            onClick={() => router.push('/user')}
            className="flex-1 rounded-xl border border-light/20 bg-transparent px-8 py-4 text-base font-semibold text-light transition-all hover:border-light/40 hover:bg-light/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

