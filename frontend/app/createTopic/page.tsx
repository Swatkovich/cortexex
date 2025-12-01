'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { themeStore } from '@/store/themeStore';
import * as api from '@/lib/api';
import { Button, Card, Checkbox, FormField, Input, Select, Textarea, Toast } from '@/components/ui';
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
    'createTheme.import.broken': 'createTheme.import.broken',
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
      // Check for import parameter in URL (now contains theme ID or full URL)
      const importParam = searchParams.get('import');
      if (importParam) {
        // Pre-fill the import input and show the form;
        // actual import happens when the user confirms.
        setImportUrl(importParam);
        setShowImportForm(true);
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
      // Extract the theme ID from the provided value
      let themeIdToImport = paramToUse;

      // If it's a full URL, extract the `import` parameter (which holds the theme ID)
      try {
        const url = new URL(paramToUse);
        themeIdToImport = url.searchParams.get('import') || paramToUse;
      } catch {
        // If it's not a valid URL, assume it's just the theme ID
        themeIdToImport = paramToUse;
      }

      // First, export the theme data by ID, then import it for the current user
      const exportData = await api.exportTheme(themeIdToImport);
      const importedTheme = await api.importTheme(exportData);

      // Refresh themeStore to show the new imported theme
      await themeStore.fetchThemes();

      // Redirect to the user page to see the updated state
      router.push('/user');
    } catch (err) {
      // Show a friendly toast message instead of raw DB error
      setImportError('createTheme.import.broken');
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
      <PageContainer fullHeight centered className="max-w-3xl justify-center">
        <Card className="w-full p-10 backdrop-blur-sm">
          <p className="text-light/70 text-center">{t('createTheme.loading')}</p>
        </Card>
      </PageContainer>
    );
  }

  if (loading && isEditMode && !title) {
    return (
      <PageContainer fullHeight centered className="max-w-3xl justify-center">
        <Card className="w-full p-10 backdrop-blur-sm">
          <div className="flex items-center justify-center py-12">
            <p className="text-lg text-light/70">{t('createTheme.loading')}</p>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <>
      {importError && (
        <Toast
          variant="error"
          onClose={() => setImportError(null)}
          title={t('createTheme.import.label')}
          message={resolveErrorMessage(importError, ERROR_MAP, t) ?? importError}
        />
      )}
      <PageContainer fullHeight centered className="max-w-3xl justify-center">
        <Card className="w-full p-10 backdrop-blur-sm">
        <div className="mb-8">
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-light text-center">
            {isEditMode ? t('createTheme.title.edit') : t('createTheme.title.create')}
          </h1>
        </div>

        {!isEditMode && (
          <div className="mb-6 rounded-2xl border border-light/10 bg-dark/30 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-light/80">{t('createTheme.import.label')}</h2>
              <Button variant="outline" size="sm" onClick={() => setShowImportForm(!showImportForm)}>
                {showImportForm ? t('createTheme.cancel') : t('createTheme.import.button')}
              </Button>
            </div>

            {showImportForm && (
              <div className="space-y-4 ">
                <FormField required className="w-full mt-4">
                  <Input
                    value={importUrl}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      let normalized = raw;

                      // Try to extract ?import=<id> from a full URL or query string
                      try {
                        const url = new URL(raw);
                        const param = url.searchParams.get('import');
                        if (param) {
                          normalized = param;
                        }
                      } catch {
                        // Not a full URL; try to parse "import=" manually
                        const match = raw.match(/(?:\?|&)import=([^&]+)/);
                        if (match?.[1]) {
                          try {
                            normalized = decodeURIComponent(match[1]);
                          } catch {
                            normalized = match[1];
                          }
                        }
                      }

                      setImportUrl(normalized);
                    }}
                    placeholder={t('createTheme.import.placeholder')}
                    className="w-full"
                  />
                </FormField>

                <Button
                  onClick={() => handleImport()}
                  disabled={!importUrl.trim() || importing}
                  size="fluid"
                  isLoading={importing}
                  className="w-full mt-4"
                >
                  {t('createTheme.import.button')}
                </Button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6 pb-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {resolveErrorMessage(error, ERROR_MAP, t) ?? error}
              </div>
            )}

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

            <FormField
              label={t('createTheme.label.difficulty')}
              htmlFor="themeDifficulty"
              required
            >
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
                    <span className="block text-amber-200/80">
                      {t('createTheme.languageTopic.helper')}
                    </span>
                    <span className="mt-2 block text-red-300/80">
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
          </div>

          <div className="sticky bottom-0 -mx-10 flex flex-col gap-4 border-t border-light/10 bg-dark/95 px-10 pb-2 pt-4 sm:flex-row">
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
        </form>
        </Card>
      </PageContainer>
    </>
  );
}
