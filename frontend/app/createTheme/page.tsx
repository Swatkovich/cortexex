"use client";

import { FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import * as api from '@/lib/api';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import TextArea from '@/components/TextArea';
import Card from '@/components/Card';
import { useT } from '@/lib/i18n';

export default function CreateThemePage() {
  const t = useT();
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
          {isEditMode ? t('createTheme.header.edit') : t('createTheme.header.create')}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
          {isEditMode ? t('createTheme.title.edit') : t('createTheme.title.create')}
        </h1>
        <p className="max-w-2xl text-lg text-light/70">
          {isEditMode ? t('createTheme.subtitle.edit') : t('createTheme.subtitle.create')}
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading && isEditMode && !title ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-lg text-light/70">{t('createTheme.loading')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-8">
            <div className="space-y-2">
          <label className="block text-sm font-medium text-light">
            {t('createTheme.label.title')}
          </label>
              <TextInput value={title} onChange={(event) => setTitle(event.target.value)} required placeholder={t('createTheme.placeholder.title')} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-light">
            {t('createTheme.label.description')}
          </label>
              <TextArea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} placeholder={t('createTheme.placeholder.description')} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-light">
              {t('createTheme.label.difficulty')}
            </label>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as 'Easy' | 'Medium' | 'Hard')}
              className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
            >
              <option value="Easy">{t('createTheme.diff.easy')}</option>
              <option value="Medium">{t('createTheme.diff.medium')}</option>
              <option value="Hard">{t('createTheme.diff.hard')}</option>
            </select>
          </div>

        </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Button type="submit" disabled={!title.trim() || !description.trim() || loading} className="flex-1 px-8 py-4 text-base">
                {loading ? t('createTheme.save.saving') : isEditMode ? t('createTheme.save.update') : t('createTheme.save.create')}
              </Button>
              <Button variant="ghost" onClick={() => router.push('/user')} className="flex-1 px-8 py-4 text-base">{t('createTheme.cancel')}</Button>
            </div>
          </Card>
        </form>
      )}
    </main>
  );
}

