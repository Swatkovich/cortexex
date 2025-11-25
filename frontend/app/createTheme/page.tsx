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
import { resolveErrorMessage } from '@/lib/i18n/errorMap';

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
  const [isLanguageTopic, setIsLanguageTopic] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [hasImportData, setHasImportData] = useState(false);
  const ERROR_MAP: Record<string, string> = {
    'Failed to fetch theme': 'createTheme.error.load',
    'Failed to load theme': 'createTheme.error.load',
    'Failed to create theme': 'createTheme.error.save',
    'Failed to update theme': 'createTheme.error.save',
    'Failed to save theme': 'createTheme.error.save',
    'createTheme.error.load': 'createTheme.error.load',
    'createTheme.error.save': 'createTheme.error.save',
  };

  // Load theme data if editing or check for import URL
  useEffect(() => {
    if (isEditMode && themeId) {
      const loadTheme = async () => {
        try {
          setLoading(true);
          const theme = await api.fetchTheme(themeId);
          setTitle(theme.title);
          setDescription(theme.description);
          setDifficulty(theme.difficulty);
          setIsLanguageTopic(!!theme.is_language_topic);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'createTheme.error.load');
        } finally {
          setLoading(false);
        }
      };
      loadTheme();
    } else {
      // Check for import parameter in URL
      const importParam = searchParams.get('import');
      if (importParam) {
        try {
          // Decode the base64 data - handle Unicode characters properly
          const decodedData = decodeURIComponent(escape(atob(importParam)));
          const importData = JSON.parse(decodedData) as api.ExportThemeData;
          
          // Auto-fill the form with imported data
          setTitle(importData.title);
          setDescription(importData.description);
          setDifficulty(importData.difficulty);
          setIsLanguageTopic(importData.is_language_topic);
          
          // Set import URL for reference
          setImportUrl(importParam);
          setHasImportData(true);
        } catch (err) {
          setError(t('createTheme.import.invalid'));
        }
      }
    }
  }, [isEditMode, themeId, searchParams, t]);

  const handleImport = async (importParam?: string) => {
    const paramToUse = importParam || importUrl.trim();
    
    if (!paramToUse) {
      setImportError(t('createTheme.import.invalid'));
      return;
    }

    setImporting(true);
    setImportError(null);

    try {
      // Extract the import parameter from the URL
      let importDataParam = paramToUse;
      
      // If it's a full URL, extract the import parameter
      try {
        const url = new URL(paramToUse);
        importDataParam = url.searchParams.get('import') || paramToUse;
      } catch {
        // If it's not a valid URL, assume it's just the encoded data
        importDataParam = paramToUse;
      }

      // Decode the base64 data - handle Unicode characters properly
      const decodedData = decodeURIComponent(escape(atob(importDataParam)));
      const importData = JSON.parse(decodedData) as api.ExportThemeData;

      // Import the theme directly
      const importedTheme = await api.importTheme(importData);
      
      // Redirect to the theme questions page
      router.push(`/theme/${importedTheme.id}/questions`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'createTheme.import.error');
      setImporting(false);
    }
  };

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
          is_language_topic: isLanguageTopic,
        });
      } else {
        await themeStore.addTheme({
          title: title.trim(),
          description: description.trim(),
          difficulty,
          is_language_topic: isLanguageTopic,
        });
      }
      router.push('/user');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'createTheme.error.save');
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
          <p className="text-red-400 text-sm">{resolveErrorMessage(error, ERROR_MAP, t) ?? error}</p>
        </div>
      )}

      {!isEditMode && hasImportData && (
        <Card className="p-6 bg-blue-500/10 border-blue-500/20">
          <p className="text-sm font-medium text-light mb-4">
            {t('createTheme.import.label')} - {t('createTheme.subtitle.create')}
          </p>
          <p className="text-xs text-light/60 mb-4">
            {t('createTheme.import.loaded')}
          </p>
          {importError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 mb-4">
              <p className="text-red-400 text-sm">{resolveErrorMessage(importError, ERROR_MAP, t) ?? importError}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              onClick={() => handleImport(importUrl)}
              disabled={importing}
              className="flex-1 px-6 py-3"
            >
              {importing ? t('createTheme.save.saving') : t('createTheme.import.button')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setHasImportData(false)}
              className="px-6 py-3"
            >
              {t('createTheme.cancel')}
            </Button>
          </div>
        </Card>
      )}

      {!isEditMode && !hasImportData && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-light">{t('createTheme.import.label')}</h2>
            <Button
              variant="ghost"
              onClick={() => setShowImportForm(!showImportForm)}
              className="px-4 py-2 text-sm border border-light/20"
            >
              {showImportForm ? t('createTheme.cancel') : t('createTheme.import.button')}
            </Button>
          </div>
          
          {showImportForm && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-light">
                  {t('createTheme.import.placeholder')}
                </label>
                <TextInput
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder={t('createTheme.import.placeholder')}
                  className="w-full"
                />
              </div>
              
              {importError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-red-400 text-sm">{resolveErrorMessage(importError, ERROR_MAP, t) ?? importError}</p>
                </div>
              )}
              
              <Button
                onClick={() => handleImport()}
                disabled={!importUrl.trim() || importing}
                className="w-full px-6 py-3"
              >
                {importing ? t('createTheme.save.saving') : t('createTheme.import.button')}
              </Button>
            </div>
          )}
        </Card>
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

        {!isEditMode && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-light">
              {t('createTheme.label.languageTopic')}
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-light/20 bg-dark/40 px-4 py-3">
              <input
                type="checkbox"
                checked={isLanguageTopic}
                onChange={(event) => setIsLanguageTopic(event.target.checked)}
                className="h-4 w-4 rounded border-light/20 bg-dark/50 text-light focus:ring-2 focus:ring-light/20"
                id="languageTopicToggle"
              />
              <label htmlFor="languageTopicToggle" className="text-sm text-light/80">
                {t('createTheme.languageTopic.toggle')}
              </label>
            </div>
            <p className="text-xs text-light/50">
              {t('createTheme.languageTopic.helper')}
            </p>
            <p className="text-xs text-amber-200/80">
              {t('createTheme.languageTopic.note')}
            </p>
          </div>
        )}

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

