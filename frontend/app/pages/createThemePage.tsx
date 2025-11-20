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
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-0">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Create Theme
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Design a new learning track
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Define the essentials and immediately make it available on your dashboard.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="Neuro Linguistics"
            />
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="Outline why this topic matters and what to expect."
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Difficulty
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as 'Easy' | 'Medium' | 'Hard')}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Questions count
            <input
              type="number"
              min={1}
              value={questions}
              onChange={(event) => setQuestions(Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
            disabled={!title.trim() || !description.trim()}
          >
            Save theme
          </button>
          <button
            type="button"
            onClick={() => router.push('/user')}
            className="flex-1 rounded-xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

