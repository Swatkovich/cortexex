'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import * as api from '@/lib/api';
import { Button, Card, Checkbox, FormField, Input, Select, Textarea } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { useT } from '@/lib/i18n';
import { resolveErrorMessage } from '@/lib/i18n/errorMap';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function CreateThemePage() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeId = searchParams.get('id');
  const isEditMode = !!themeId;
  const canAccess = useProtectedRoute('/');

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

          // Set import URL for reference and show the form
          const shareableUrl = typeof window !== 'undefined' ? window.location.href : importParam;
          setImportUrl(shareableUrl);
          setShowImportForm(true);
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

      // Refresh themeStore to show the new imported theme
      await themeStore.fetchThemes();

      // Redirect to the user page to see the updated state
      router.push('/user');
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

  if (!canAccess) {
    return (
      <PageContainer fullHeight centered className="max-w-3xl">
        <p className="text-light/70">{t('createTheme.loading')}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer fullHeight className="max-w-3xl">
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
          <p className="text-red-400 text-sm">
            {resolveErrorMessage(error, ERROR_MAP, t) ?? error}
          </p>
        </div>
      )}

      {!isEditMode && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-light">{t('createTheme.import.label')}</h2>
            <Button variant="outline" size="sm" onClick={() => setShowImportForm(!showImportForm)}>
              {showImportForm ? t('createTheme.cancel') : t('createTheme.import.button')}
            </Button>
          </div>
          {importError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 mb-4">
              <p className="text-red-400 text-sm">
                {resolveErrorMessage(importError, ERROR_MAP, t) ?? importError}
              </p>
            </div>
          )}

          {showImportForm && (
            <div className="space-y-4">
              <FormField label={t('createTheme.import.placeholder')} required>
                <Input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder={t('createTheme.import.placeholder')}
                  className="w-full"
                />
              </FormField>

              <Button
                onClick={() => handleImport()}
                disabled={!importUrl.trim() || importing}
                size="fluid"
                isLoading={importing}
              >
                {t('createTheme.import.button')}
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
            <FormField label={t('createTheme.label.title')} htmlFor="themeTitle" required>
              <Input
                id="themeTitle"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder={t('createTheme.placeholder.title')}
              />
            </FormField>

            <FormField
              label={t('createTheme.label.description')}
              htmlFor="themeDescription"
              required
            >
              <Textarea
                id="themeDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                rows={4}
                placeholder={t('createTheme.placeholder.description')}
              />
            </FormField>

            <FormField label={t('createTheme.label.difficulty')} htmlFor="themeDifficulty" required>
              <Select
                id="themeDifficulty"
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as 'Easy' | 'Medium' | 'Hard')
                }
              >
                <option value="Easy">{t('createTheme.diff.easy')}</option>
                <option value="Medium">{t('createTheme.diff.medium')}</option>
                <option value="Hard">{t('createTheme.diff.hard')}</option>
              </Select>
            </FormField>

            {!isEditMode && (
              <FormField
                label={t('createTheme.label.languageTopic')}
                description={
                  <>
                    <span className="block">{t('createTheme.languageTopic.helper')}</span>
                    <span className="block text-amber-200/80">
                      {t('createTheme.languageTopic.note')}
                    </span>
                  </>
                }
              >
                <Checkbox
                  checked={isLanguageTopic}
                  onChange={(event) => setIsLanguageTopic(event.target.checked)}
                  label={t('createTheme.languageTopic.toggle')}
                />
              </FormField>
            )}

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Button
                type="submit"
                size="fluid"
                disabled={!title.trim() || !description.trim()}
                isLoading={loading}
                className="sm:flex-1"
              >
                {isEditMode ? t('createTheme.save.update') : t('createTheme.save.create')}
              </Button>
              <Button
                variant="outline"
                size="fluid"
                onClick={() => router.push('/user')}
                className="sm:flex-1"
              >
                {t('createTheme.cancel')}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </PageContainer>
  );
}
