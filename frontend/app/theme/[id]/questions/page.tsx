'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as api from '@/lib/api';
import { themeStore } from '@/store/themeStore';
import { Question, CreateQuestionDto, Theme, LanguageEntry } from '@/lib/interface';
import { Button, Card, Input, Textarea } from '@/components/ui';
import DifficultyTag from '@/components/DifficultyTag';
import { useT } from '@/lib/i18n';
import { resolveErrorMessage } from '@/lib/i18n/errorMap';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { PageContainer } from '@/components/layout';

export default function QuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const themeId = params.id as string;

  const [theme, setTheme] = useState<Theme | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [languageEntries, setLanguageEntries] = useState<LanguageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'input' | 'select' | 'radiobutton'>('input');
  const [isStrict, setIsStrict] = useState(true);
  const [options, setOptions] = useState<string[]>(['']);
  const [correctIndices, setCorrectIndices] = useState<Record<number, boolean>>({});
  const [correctRadioIndex, setCorrectRadioIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [entryWord, setEntryWord] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryTranslation, setEntryTranslation] = useState('');
  const [languageSubmitting, setLanguageSubmitting] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [languageEditingId, setLanguageEditingId] = useState<string | null>(null);
  const t = useT();
  const canAccess = useProtectedRoute('/');
  const QUESTION_ERROR_MAP: Record<string, string> = {
    'Failed to save question': 'questions.error.save',
    'Failed to create question': 'questions.error.save',
    'Failed to update question': 'questions.error.update',
    'Failed to delete question': 'questions.error.delete',
    'Failed to fetch theme': 'questions.notFound',
    'questions.error.save': 'questions.error.save',
    'questions.error.update': 'questions.error.update',
    'questions.error.delete': 'questions.error.delete',
    'questions.notFound': 'questions.notFound',
    'Failed to create language entry': 'questions.language.error.save',
    'Failed to update language entry': 'questions.language.error.update',
    'Failed to delete language entry': 'questions.language.error.delete',
    'questions.language.error.save': 'questions.language.error.save',
    'questions.language.error.update': 'questions.language.error.update',
    'questions.language.error.delete': 'questions.language.error.delete',
  };
  const getQuestionTypeLabel = (type: string) => {
    if (type === 'input') return t('questions.form.type.input');
    if (type === 'select') return t('questions.form.type.select');
    if (type === 'radiobutton') return t('questions.form.type.radiobutton');
    return type;
  };

  useEffect(() => {
    loadData();
  }, [themeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const themeData = await api.fetchTheme(themeId);
      setTheme(themeData);
      setQuestions(themeData.questions || []);
      setLanguageEntries(themeData.language_entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'questions.notFound');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
    setFormError(null);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
    // shift correct indices mapping
    const newCorrect: Record<number, boolean> = {};
    Object.keys(correctIndices).forEach((k) => {
      const idx = Number(k);
      if (idx < index) newCorrect[idx] = correctIndices[idx];
      else if (idx > index) newCorrect[idx - 1] = correctIndices[idx];
    });
    setCorrectIndices(newCorrect);
    if (correctRadioIndex !== null) {
      if (correctRadioIndex === index) setCorrectRadioIndex(null);
      else if (correctRadioIndex > index) setCorrectRadioIndex(correctRadioIndex - 1);
    }
    setFormError(null);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    setFormError(null);
  };

  const toggleCorrectIndex = (index: number) => {
    setCorrectIndices((prev) => ({ ...prev, [index]: !prev[index] }));
    setFormError(null);
  };

  const resetForm = () => {
    setQuestionText('');
    setQuestionType('input');
    setIsStrict(false);
    setOptions(['']);
    setCorrectIndices({});
    setCorrectRadioIndex(null);
    setAnswer('');
    setShowAddForm(false);
  };

  const resetLanguageForm = () => {
    setEntryWord('');
    setEntryDescription('');
    setEntryTranslation('');
    setLanguageError(null);
    setShowAddForm(false);
  };

  // Inline edit form component for a single question
  const InlineEditForm = ({ q, onDone }: { q: Question; onDone: (updated: Question) => void }) => {
    const [qText, setQText] = useState(q.question_text);
    const [qType, setQType] = useState<'input' | 'select' | 'radiobutton'>(q.question_type);
    const [qIsStrict, setQIsStrict] = useState(q.is_strict);
    const [qOptions, setQOptions] = useState<string[]>(
      q.options && q.options.length > 0 ? q.options : [''],
    );
    const [qCorrectIndices, setQCorrectIndices] = useState<Record<number, boolean>>(() => {
      const ci: Record<number, boolean> = {};
      (q.correct_options || []).forEach((co) => {
        const idx = q.options?.findIndex((o) => o === co) ?? -1;
        if (idx >= 0) ci[idx] = true;
      });
      return ci;
    });
    const [qCorrectRadioIndex, setQCorrectRadioIndex] = useState<number | null>(() => {
      if (q.question_type === 'radiobutton' && q.correct_options && q.correct_options.length > 0) {
        const idx = q.options?.findIndex((o) => o === q.correct_options![0]) ?? -1;
        return idx >= 0 ? idx : null;
      }
      return null;
    });
    const [qAnswer, setQAnswer] = useState(q.answer || '');
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleAddOptionLocal = () => setQOptions((prev) => [...prev, '']);
    const handleRemoveOptionLocal = (index: number) => {
      setQOptions((prev) => prev.filter((_, i) => i !== index));
      const newCorrect: Record<number, boolean> = {};
      Object.keys(qCorrectIndices).forEach((k) => {
        const idx = Number(k);
        if (idx < index) newCorrect[idx] = qCorrectIndices[idx];
        else if (idx > index) newCorrect[idx - 1] = qCorrectIndices[idx];
      });
      setQCorrectIndices(newCorrect);
      if (qCorrectRadioIndex !== null) {
        if (qCorrectRadioIndex === index) setQCorrectRadioIndex(null);
        else if (qCorrectRadioIndex > index) setQCorrectRadioIndex(qCorrectRadioIndex - 1);
      }
    };

    const handleOptionChangeLocal = (index: number, value: string) => {
      const newOptions = [...qOptions];
      newOptions[index] = value;
      setQOptions(newOptions);
    };

    const toggleCorrectIndexLocal = (index: number) => {
      setQCorrectIndices((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const handleSubmitLocal = async (e?: FormEvent) => {
      e?.preventDefault();
      setSubmittingLocal(true);
      setLocalError(null);
      try {
        const selectedCorrectOptions =
          qType === 'select'
            ? Object.keys(qCorrectIndices)
                .filter((k) => qCorrectIndices[Number(k)])
                .map((k) => qOptions[Number(k)])
            : qType === 'radiobutton' && qCorrectRadioIndex !== null
              ? [qOptions[qCorrectRadioIndex]]
              : undefined;

        if (qType === 'select') {
          const nonEmptySelected = Array.isArray(selectedCorrectOptions)
            ? selectedCorrectOptions.filter((s) => s && s.trim() !== '')
            : [];
          if (nonEmptySelected.length === 0) {
            setLocalError(t('questions.form.validation.select.mustChoose'));
            setSubmittingLocal(false);
            return;
          }
        }

        if (qType === 'radiobutton') {
          if (
            !selectedCorrectOptions ||
            selectedCorrectOptions.length === 0 ||
            !selectedCorrectOptions[0] ||
            selectedCorrectOptions[0].trim() === ''
          ) {
            setLocalError(t('questions.form.validation.radio.mustChoose'));
            setSubmittingLocal(false);
            return;
          }
        }

        const questionData: CreateQuestionDto = {
          question_text: qText.trim(),
          question_type: qType,
          is_strict: qIsStrict,
          options:
            qType === 'select' || qType === 'radiobutton'
              ? qOptions.filter((opt) => opt.trim() !== '')
              : undefined,
          answer: qType === 'input' ? qAnswer.trim() : undefined,
          correct_options:
            Array.isArray(selectedCorrectOptions) && selectedCorrectOptions.length > 0
              ? selectedCorrectOptions
              : undefined,
        };

        const updated = await api.updateQuestion(themeId, q.id, questionData);
        // update parent list in-place via callback to preserve order
        onDone(updated as Question);
        setEditingId(null);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'questions.error.update');
      } finally {
        setSubmittingLocal(false);
      }
    };

    return (
      <form onSubmit={handleSubmitLocal} className="space-y-4">
        <Textarea value={qText} onChange={(e) => setQText(e.target.value)} rows={2} />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={qType}
            onChange={(e) => setQType(e.target.value as any)}
            className="rounded-lg border border-light/20 bg-dark/50 px-4 py-2 text-base text-light"
          >
            <option value="input">{t('questions.form.type.input')}</option>
            <option value="select">{t('questions.form.type.select')}</option>
            <option value="radiobutton">{t('questions.form.type.radiobutton')}</option>
          </select>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={qIsStrict}
              onChange={(e) => setQIsStrict(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-light">{t('questions.tag.strict')}</span>
          </div>
        </div>

        {qType === 'input' && (
          <Input
            type="text"
            value={qAnswer}
            onChange={(e) => setQAnswer(e.target.value)}
            className=""
          />
        )}

        {(qType === 'select' || qType === 'radiobutton') && (
          <div className="space-y-2">
            {qOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {qType === 'radiobutton' ? (
                  <input
                    type="radio"
                    name={`rb-${q.id}`}
                    checked={qCorrectRadioIndex === idx}
                    onChange={() => setQCorrectRadioIndex(idx)}
                    className="h-4 w-4"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={!!qCorrectIndices[idx]}
                    onChange={() => toggleCorrectIndexLocal(idx)}
                    className="h-4 w-4"
                  />
                )}
                <Input
                  value={opt}
                  onChange={(e) => handleOptionChangeLocal(idx, e.target.value)}
                  className="flex-1"
                />
                {qOptions.length > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveOptionLocal(idx)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm text-red-400"
                  >
                    {t('questions.form.remove')}
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              onClick={handleAddOptionLocal}
              className="rounded-lg border border-light/20 px-3 py-1 text-sm"
            >
              {t('questions.form.addOption')}
            </Button>
          </div>
        )}

        {localError && (
          <div className="text-sm text-red-400">
            {resolveErrorMessage(localError, QUESTION_ERROR_MAP, t) ?? localError}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submittingLocal} className="px-4 py-2 text-sm">
            {t('questions.form.save.save')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setEditingId(null);
            }}
            className="px-4 py-2 text-sm"
          >
            {t('questions.form.cancel')}
          </Button>
        </div>
      </form>
    );
  };

  const InlineLanguageEntryForm = ({
    entry,
    onDone,
  }: {
    entry: LanguageEntry;
    onDone: (updated: LanguageEntry) => void;
  }) => {
    const [wordValue, setWordValue] = useState(entry.word);
    const [descriptionValue, setDescriptionValue] = useState(entry.description || '');
    const [translationValue, setTranslationValue] = useState(entry.translation);
    const [submittingLocal, setSubmittingLocal] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmitLocal = async (e?: FormEvent) => {
      e?.preventDefault();
      setSubmittingLocal(true);
      setLocalError(null);
      try {
        if (!wordValue.trim() || !translationValue.trim()) {
          setLocalError(t('questions.language.validation.required'));
          setSubmittingLocal(false);
          return;
        }
        const payload = {
          word: wordValue.trim(),
          translation: translationValue.trim(),
          description: descriptionValue.trim() ? descriptionValue.trim() : undefined,
        };
        const updated = await api.updateLanguageEntry(themeId, entry.id, payload);
        onDone(updated as LanguageEntry);
        setLanguageEditingId(null);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'questions.language.error.update');
      } finally {
        setSubmittingLocal(false);
      }
    };

    return (
      <form onSubmit={handleSubmitLocal} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-light/60">
              {t('questions.language.wordLabel')}
            </label>
            <Input value={wordValue} onChange={(e) => setWordValue(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-light/60">
              {t('questions.language.translationLabel')}
            </label>
            <Input
              value={translationValue}
              onChange={(e) => setTranslationValue(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-light/60">
            {t('questions.language.descriptionLabel')}
          </label>
          <Textarea
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            rows={2}
          />
        </div>
        {localError && (
          <div className="text-sm text-red-400">
            {resolveErrorMessage(localError, QUESTION_ERROR_MAP, t) ?? localError}
          </div>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={submittingLocal} className="px-4 py-2 text-sm">
            {t('questions.form.save.save')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setLanguageEditingId(null);
            }}
            className="px-4 py-2 text-sm"
          >
            {t('questions.form.cancel')}
          </Button>
        </div>
      </form>
    );
  };

  const handleLanguageSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLanguageSubmitting(true);
    setLanguageError(null);

    if (!entryWord.trim() || !entryTranslation.trim()) {
      setLanguageError(t('questions.language.validation.required'));
      setLanguageSubmitting(false);
      return;
    }

    try {
      const payload = {
        word: entryWord.trim(),
        translation: entryTranslation.trim(),
        description: entryDescription.trim() ? entryDescription.trim() : undefined,
      };
      await api.createLanguageEntry(themeId, payload);
      await themeStore.fetchThemes();
      resetLanguageForm();
      await loadData();
    } catch (err) {
      setLanguageError(err instanceof Error ? err.message : 'questions.language.error.save');
    } finally {
      setLanguageSubmitting(false);
    }
  };

  const handleDeleteLanguageEntry = async (entryId: string) => {
    if (!confirm(t('questions.language.deleteConfirm'))) {
      return;
    }
    try {
      await api.deleteLanguageEntry(themeId, entryId);
      await themeStore.fetchThemes();
      await loadData();
    } catch (err) {
      setLanguageError(err instanceof Error ? err.message : 'questions.language.error.delete');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFormError(null);

    try {
      const selectedCorrectOptions =
        questionType === 'select'
          ? Object.keys(correctIndices)
              .filter((k) => correctIndices[Number(k)])
              .map((k) => options[Number(k)])
          : questionType === 'radiobutton' && correctRadioIndex !== null
            ? [options[correctRadioIndex]]
            : undefined;

      // Client-side validation: ensure selects have at least one correct option,
      // and radiobutton has exactly one selected correct option.
      if (questionType === 'select') {
        const nonEmptySelected = Array.isArray(selectedCorrectOptions)
          ? selectedCorrectOptions.filter((s) => s && s.trim() !== '')
          : [];
        if (nonEmptySelected.length === 0) {
          setFormError(t('questions.form.validation.select.mustChoose'));
          setSubmitting(false);
          return;
        }
      }

      if (questionType === 'radiobutton') {
        if (
          !selectedCorrectOptions ||
          selectedCorrectOptions.length === 0 ||
          !selectedCorrectOptions[0] ||
          selectedCorrectOptions[0].trim() === ''
        ) {
          setFormError(t('questions.form.validation.radio.mustChoose'));
          setSubmitting(false);
          return;
        }
      }

      const questionData: CreateQuestionDto = {
        question_text: questionText.trim(),
        question_type: questionType,
        is_strict: isStrict,
        options:
          questionType === 'select' || questionType === 'radiobutton'
            ? options.filter((opt) => opt.trim() !== '')
            : undefined,
        answer: questionType === 'input' ? answer.trim() : undefined,
        correct_options:
          Array.isArray(selectedCorrectOptions) && selectedCorrectOptions.length > 0
            ? selectedCorrectOptions
            : undefined,
      };

      // Top-level form only creates new questions. Editing happens inline per question.
      await api.createQuestion(themeId, questionData);

      // Refresh list of themes (counts) and reload current theme questions
      await themeStore.fetchThemes();
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'questions.error.save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm(t('questions.delete.confirm'))) {
      return;
    }

    try {
      await api.deleteQuestion(themeId, questionId);
      // Refresh theme list counts and reload this theme
      await themeStore.fetchThemes();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'questions.error.delete');
    }
  };

  if (!canAccess || loading) {
    return (
      <PageContainer fullHeight centered>
        <p className="text-lg text-light/70">{t('questions.loading')}</p>
      </PageContainer>
    );
  }

  if (!theme) {
    return (
      <PageContainer fullHeight centered>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-red-400">{t('questions.notFound')}</p>
        </div>
      </PageContainer>
    );
  }

  const isLanguageTopic = Boolean(theme?.is_language_topic);
  const listCount = isLanguageTopic ? languageEntries.length : questions.length;

  return (
    <PageContainer fullHeight>
      <header className="space-y-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push('/user')}
          className="w-fit"
        >
          {t('questions.backToThemes')}
        </Button>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-light sm:text-4xl">
            {theme.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <DifficultyTag d={theme.difficulty} />
            {isLanguageTopic && (
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
                {t('questions.language.tag')}
              </span>
            )}
          </div>
          {theme.description && (
            <p className="max-w-3xl text-sm leading-relaxed text-light/70">
              {theme.description}
            </p>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-red-400 text-sm">
            {resolveErrorMessage(error, QUESTION_ERROR_MAP, t) ?? error}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-base font-medium text-light/80">
          {isLanguageTopic ? t('theme.languageEntries') : t('theme.questions')}:{' '}
          <span className="font-semibold text-light">{listCount}</span>
        </p>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} size="lg" className="w-fit">
            {isLanguageTopic ? t('questions.language.add') : t('questions.add')}
          </Button>
        )}
      </div>

      {showAddForm &&
        (isLanguageTopic ? (
          <form
            onSubmit={handleLanguageSubmit}
            className="space-y-6 rounded-2xl border border-light/10 bg-dark/50 p-8 backdrop-blur-sm"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-light">
                  {t('questions.language.wordLabel')}
                </label>
                <Input
                  value={entryWord}
                  onChange={(e) => setEntryWord(e.target.value)}
                  required
                  placeholder={t('questions.language.wordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-light">
                  {t('questions.language.translationLabel')}
                </label>
                <Input
                  value={entryTranslation}
                  onChange={(e) => setEntryTranslation(e.target.value)}
                  required
                  placeholder={t('questions.language.translationPlaceholder')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-light">
                {t('questions.language.descriptionLabel')}
              </label>
              <Textarea
                value={entryDescription}
                onChange={(e) => setEntryDescription(e.target.value)}
                rows={3}
                placeholder={t('questions.language.descriptionPlaceholder')}
              />
              <p className="text-xs text-light/50">{t('questions.language.descriptionHelper')}</p>
            </div>
            {languageError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-red-400 text-sm">
                  {resolveErrorMessage(languageError, QUESTION_ERROR_MAP, t) ?? languageError}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Button
                type="submit"
                size="fluid"
                disabled={languageSubmitting || !entryWord.trim() || !entryTranslation.trim()}
                className="sm:flex-1"
              >
                {languageSubmitting
                  ? t('questions.language.form.saving')
                  : t('questions.language.form.add')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="fluid"
                onClick={resetLanguageForm}
                className="sm:flex-1"
              >
                {t('questions.form.cancel')}
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-light/10 bg-dark/50 p-8 backdrop-blur-sm"
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-light">
                {t('questions.form.label.text')}
              </label>
              <Textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
                rows={3}
                placeholder={t('questions.form.placeholder.text')}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-light">
                  {t('questions.form.label.type')}
                </label>
                <select
                  value={questionType}
                  onChange={(e) => {
                    const newType = e.target.value as 'input' | 'select' | 'radiobutton';
                    setQuestionType(newType);
                    if (newType === 'input') {
                      setOptions(['']);
                    } else {
                      setAnswer('');
                      if (options.length === 0 || (options.length === 1 && options[0] === '')) {
                        setOptions(['']);
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
                >
                  <option value="input">{t('questions.form.type.input')}</option>
                  <option value="select">{t('questions.form.type.select')}</option>
                  <option value="radiobutton">{t('questions.form.type.radiobutton')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-light">
                  {t('questions.form.label.validation')}
                </label>
                <div className="flex items-center gap-3 pt-3">
                  <input
                    type="checkbox"
                    id="isStrict"
                    checked={isStrict}
                    onChange={(e) => setIsStrict(e.target.checked)}
                    className="h-4 w-4 rounded border-light/20 bg-dark/50 text-light focus:ring-2 focus:ring-light/20"
                  />
                  <label htmlFor="isStrict" className="text-sm text-light">
                    {t('questions.form.strict')}
                  </label>
                </div>
              </div>
            </div>

            {questionType === 'input' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-light">
                  {t('questions.form.label.correctAnswer')}
                </label>
                <Input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required={questionType === 'input'}
                  placeholder={t('questions.form.placeholder.answer')}
                />
                <p className="text-xs text-light/50">{t('questions.form.label.correctAnswer')}</p>
              </div>
            )}

            {(questionType === 'select' || questionType === 'radiobutton') && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-light">
                  {t('questions.form.options.label')}{' '}
                  {questionType === 'select'
                    ? `(${t('questions.form.type.select')})`
                    : `(${t('questions.form.type.radiobutton')})`}
                </label>
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {questionType === 'radiobutton' ? (
                      <input
                        type="radio"
                        name="correctRadio"
                        checked={correctRadioIndex === index}
                        onChange={() => setCorrectRadioIndex(index)}
                        className="h-4 w-4"
                      />
                    ) : questionType === 'select' ? (
                      <input
                        type="checkbox"
                        checked={!!correctIndices[index]}
                        onChange={() => toggleCorrectIndex(index)}
                        className="h-4 w-4"
                      />
                    ) : null}

                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      required={questionType === 'select' || questionType === 'radiobutton'}
                      className="flex-1"
                      placeholder={`${t('questions.form.options.placeholder')} ${index + 1}`}
                    />

                    {options.length > 1 && (
                      <Button
                        variant="ghost"
                        onClick={() => handleRemoveOption(index)}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                      >
                        {t('questions.form.remove')}
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  onClick={handleAddOption}
                  className="rounded-lg border border-light/20 px-4 py-2 text-sm"
                >
                  {t('questions.form.addOption')}
                </Button>
                {formError && (
                  <div className="mt-3 rounded-md bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-sm text-red-400">{formError}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Button
                type="submit"
                size="fluid"
                disabled={
                  submitting ||
                  !questionText.trim() ||
                  (questionType === 'input' && !answer.trim()) ||
                  (questionType !== 'input' &&
                    options.filter((opt) => opt.trim() !== '').length === 0) ||
                  (questionType === 'select' &&
                    Object.keys(correctIndices).filter((k) => correctIndices[Number(k)]).length ===
                      0) ||
                  (questionType === 'radiobutton' && correctRadioIndex === null)
                }
                className="sm:flex-1"
              >
                {submitting ? t('questions.form.save.saving') : t('questions.form.save.add')}
              </Button>
              <Button variant="ghost" size="fluid" onClick={resetForm} className="sm:flex-1">
                {t('questions.form.cancel')}
              </Button>
            </div>
          </form>
        ))}

      <section className="space-y-4">
        {isLanguageTopic ? (
          languageEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
              <p className="text-sm font-medium text-light/50">{t('questions.language.empty')}</p>
            </div>
          ) : (
            languageEntries.map((entry) => (
              <Card key={entry.id} className="bg-dark-hover/50 p-6">
                {languageEditingId === entry.id ? (
                  <InlineLanguageEntryForm
                    entry={entry}
                    onDone={(updated) => {
                      setLanguageEntries((prev) =>
                        prev.map((item) => (item.id === updated.id ? updated : item)),
                      );
                      setLanguageEditingId(null);
                    }}
                  />
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="text-lg font-semibold text-light">{entry.word}</div>
                      <div className="text-sm text-light/70">{entry.translation}</div>
                      {entry.description && (
                        <p className="text-xs text-light/50">{entry.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setLanguageEditingId(entry.id);
                          setShowAddForm(false);
                        }}
                        className="px-4 py-2 text-sm"
                      >
                        {t('questions.button.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteLanguageEntry(entry.id)}
                        className="px-4 py-2 text-sm text-red-400 border-red-500/20"
                      >
                        {t('questions.button.delete')}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
            <p className="text-sm font-medium text-light/50">{t('questions.empty')}</p>
          </div>
        ) : (
          questions.map((question) => (
            <Card key={question.id} className="bg-dark-hover/50 p-6">
              {editingId === question.id ? (
                <InlineEditForm
                  q={question}
                  onDone={(updated) => {
                    setQuestions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    setEditingId(null);
                  }}
                />
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-light/20 bg-light/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-light/60">
                        {getQuestionTypeLabel(question.question_type)}
                      </span>
                      {question.is_strict && (
                        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                          {t('questions.tag.strict')}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-medium text-light">{question.question_text}</p>
                    {question.question_type === 'input' && question.answer && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-light/50">
                          {t('questions.form.label.correctAnswer')}:
                        </p>
                        <p className="text-sm text-light/70 font-mono bg-dark/50 px-3 py-2 rounded border border-light/10">
                          {question.answer}
                        </p>
                      </div>
                    )}
                    {question.options && question.options.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-light/50">
                          {t('questions.form.options.label')}:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-light/70">
                          {question.options.map((option, idx) => (
                            <li key={idx}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId(question.id);
                        setShowAddForm(false);
                      }}
                      className="px-4 py-2 text-sm"
                    >
                      {t('questions.button.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(question.id)}
                      className="px-4 py-2 text-sm text-red-400 border-red-500/20"
                    >
                      {t('questions.button.delete')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </section>
    </PageContainer>
  );
}
