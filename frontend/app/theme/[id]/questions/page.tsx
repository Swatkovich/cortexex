"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as api from '@/lib/api';
import { themeStore } from '@/store/themeStore';
import { Question, CreateQuestionDto, Theme } from '@/lib/interface';

export default function QuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const themeId = params.id as string;

  const [theme, setTheme] = useState<Theme | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'input' | 'select' | 'radiobutton'>('input');
  const [isStrict, setIsStrict] = useState(false);
  const [options, setOptions] = useState<string[]>(['']);
  const [correctIndices, setCorrectIndices] = useState<Record<number, boolean>>({});
  const [correctRadioIndex, setCorrectRadioIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme and questions');
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
    Object.keys(correctIndices).forEach(k => {
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
    setCorrectIndices(prev => ({ ...prev, [index]: !prev[index] }));
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
    setEditingQuestion(null);
    setShowAddForm(false);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.question_text);
    setQuestionType(question.question_type);
    setIsStrict(question.is_strict);
    setOptions(question.options && question.options.length > 0 ? question.options : ['']);
    // load correct options
    if (question.question_type === 'radiobutton') {
      if (question.correct_options && question.correct_options.length > 0) {
        const idx = question.options?.findIndex(o => o === question.correct_options![0]) ?? -1;
        setCorrectRadioIndex(idx >= 0 ? idx : null);
      } else {
        setCorrectRadioIndex(null);
      }
    } else {
      const ci: Record<number, boolean> = {};
      (question.correct_options || []).forEach(co => {
        const idx = question.options?.findIndex(o => o === co) ?? -1;
        if (idx >= 0) ci[idx] = true;
      });
      setCorrectIndices(ci);
    }
    setAnswer(question.answer || '');
    setShowAddForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFormError(null);

    try {
      const selectedCorrectOptions = questionType === 'select'
        ? Object.keys(correctIndices).filter(k => correctIndices[Number(k)]).map(k => options[Number(k)])
        : questionType === 'radiobutton' && correctRadioIndex !== null
        ? [options[correctRadioIndex]]
        : undefined;

      // Client-side validation: ensure selects have at least one correct option,
      // and radiobutton has exactly one selected correct option.
      if (questionType === 'select') {
        const nonEmptySelected = Array.isArray(selectedCorrectOptions) ? selectedCorrectOptions.filter(s => s && s.trim() !== '') : [];
        if (nonEmptySelected.length === 0) {
          setFormError('Please select at least one correct option for Select questions.');
          setSubmitting(false);
          return;
        }
      }

      if (questionType === 'radiobutton') {
        if (!selectedCorrectOptions || selectedCorrectOptions.length === 0 || !selectedCorrectOptions[0] || selectedCorrectOptions[0].trim() === '') {
          setFormError('Please choose the correct option for Radio Buttons.');
          setSubmitting(false);
          return;
        }
      }

      const questionData: CreateQuestionDto = {
        question_text: questionText.trim(),
        question_type: questionType,
        is_strict: isStrict,
        options: (questionType === 'select' || questionType === 'radiobutton')
          ? options.filter(opt => opt.trim() !== '')
          : undefined,
        answer: questionType === 'input' ? answer.trim() : undefined,
        correct_options: Array.isArray(selectedCorrectOptions) && selectedCorrectOptions.length > 0 ? selectedCorrectOptions : undefined,
      };

      if (editingQuestion) {
        await api.updateQuestion(themeId, editingQuestion.id, questionData);
      } else {
        await api.createQuestion(themeId, questionData);
      }

      // Refresh list of themes (counts) and reload current theme questions
      await themeStore.fetchThemes();
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.deleteQuestion(themeId, questionId);
      // Refresh theme list counts and reload this theme
      await themeStore.fetchThemes();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
        <div className="flex items-center justify-center py-12">
          <p className="text-lg text-light/70">Loading questions...</p>
        </div>
      </main>
    );
  }

  if (!theme) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-red-400">Theme not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
      <header className="space-y-3">
        <button
          onClick={() => router.push('/user')}
          className="text-sm text-light/60 hover:text-light/80"
        >
          ← Back to Themes
        </button>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-light/60">
            Manage Questions
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
            {theme.title}
          </h1>
          <p className="mt-2 text-lg text-light/70">{theme.description}</p>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-light/60">
          {questions.length} {questions.length === 1 ? 'question' : 'questions'}
        </p>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-xl bg-light px-6 py-3 text-base font-semibold text-dark hover:bg-light-hover"
          >
            Add Question
          </button>
        )}
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-light/10 bg-dark/50 p-8 backdrop-blur-sm"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-light">
              Question Text
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              rows={3}
              className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light placeholder:text-light/40 focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
              placeholder="Enter your question here..."
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-light">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => {
                  const newType = e.target.value as 'input' | 'select' | 'radiobutton';
                  setQuestionType(newType);
                  if (newType === 'input') {
                    setOptions(['']);
                    // Keep answer field for input type
                  } else {
                    setAnswer('');
                    if (options.length === 0 || (options.length === 1 && options[0] === '')) {
                      setOptions(['']);
                    }
                  }
                }}
                className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
              >
                <option value="input">Text Input</option>
                <option value="select">Select (multiple)</option>
                <option value="radiobutton">Radio Buttons</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-light">
                Answer Validation
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
                  Strict matching (exact answer required)
                </label>
              </div>
            </div>
          </div>

          {questionType === 'input' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-light">
                Correct Answer
              </label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required={questionType === 'input'}
                className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light placeholder:text-light/40 focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
                placeholder="Enter the correct answer..."
              />
              <p className="text-xs text-light/50">
                This is the expected answer for this question.
              </p>
            </div>
          )}

          {(questionType === 'select' || questionType === 'radiobutton') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-light">
                Options {questionType === 'select' ? '(for select / multi-select)' : '(for radio buttons)'}
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

                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required={questionType === 'select' || questionType === 'radiobutton'}
                    className="flex-1 rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light placeholder:text-light/40 focus:border-light/40 focus:bg-dark focus:outline-none focus:ring-2 focus:ring-light/20"
                    placeholder={`Option ${index + 1}`}
                  />

                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="rounded-lg border border-light/20 bg-transparent px-4 py-2 text-sm font-semibold text-light hover:border-light/40 hover:bg-light/5"
              >
                + Add Option
              </button>
              {formError && (
                <div className="mt-3 rounded-md bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">{formError}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <button
              type="submit"
              disabled={
                submitting || 
                !questionText.trim() || 
                (questionType === 'input' && !answer.trim()) ||
                (questionType !== 'input' && options.filter(opt => opt.trim() !== '').length === 0) ||
                (questionType === 'select' && Object.keys(correctIndices).filter(k => correctIndices[Number(k)]).length === 0) ||
                (questionType === 'radiobutton' && correctRadioIndex === null)
              }
              className="flex-1 rounded-xl bg-light px-8 py-4 text-base font-semibold text-dark hover:bg-light-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-xl border border-light/20 bg-transparent px-8 py-4 text-base font-semibold text-light hover:border-light/40 hover:bg-light/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="space-y-4">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
            <p className="text-sm font-medium text-light/50">
              No questions yet. Add your first question to get started.
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <article
              key={question.id}
              className="rounded-2xl border border-light/10 bg-dark-hover/50 p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-light/20 bg-light/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-light/60">
                      {question.question_type}
                    </span>
                    {question.is_strict && (
                      <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                        Strict
                      </span>
                    )}
                  </div>
                  <p className="text-base font-medium text-light">{question.question_text}</p>
                  {question.question_type === 'input' && question.answer && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-light/50">Correct Answer:</p>
                      <p className="text-sm text-light/70 font-mono bg-dark/50 px-3 py-2 rounded border border-light/10">
                        {question.answer}
                      </p>
                    </div>
                  )}
                  {question.options && question.options.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-light/50">Options:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-light/70">
                        {question.options.map((option, idx) => (
                          <li key={idx}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(question)}
                    className="rounded-lg border border-light/20 bg-transparent px-4 py-2 text-sm font-semibold text-light hover:border-light/40 hover:bg-light/5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

