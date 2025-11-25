"use client"

import { observer } from 'mobx-react-lite';
import { themeStore } from '@/store/themeStore';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import { Question, LanguageEntry } from '@/lib/interface';
import GameSetup from '@/components/game/GameSetup';
import QuestionView from '@/components/game/QuestionView';
import ResultsView from '@/components/game/ResultsView';
import { useT } from '@/lib/i18n';

function shuffle<T>(arr: T[]) {
  return arr
    .map((a) => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value);
}

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(value, max));
};

const normalizeAnswerString = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\u0451/g, 'е'); // treat ё as е to accept both spellings

const summarizeLanguageEntryResults = (
  list: Question[],
  answers: Record<string, { answer: string | string[] | null; isCorrect: boolean | null }>
) => {
  const perEntry: Record<
    string,
    {
      attempted: boolean;
      correct: boolean;
    }
  > = {};

  for (const question of list) {
    if (!question.language_entry_id) continue;
    const entryId = question.language_entry_id;
    if (!perEntry[entryId]) {
      perEntry[entryId] = { attempted: false, correct: true };
    }
    const userAnswer = answers[question.id];
    if (userAnswer) {
      perEntry[entryId].attempted = true;
      if (userAnswer.isCorrect !== true) {
        perEntry[entryId].correct = false;
      }
    } else {
      perEntry[entryId].attempted = true;
      perEntry[entryId].correct = false;
    }
  }

  return Object.entries(perEntry)
    .filter(([, data]) => data.attempted)
    .map(([entryId, data]) => ({ entryId, correct: data.correct }));
};

const buildLanguageQuestionPool = (entries: LanguageEntry[]): Question[] => {
  const sanitized = entries.filter((entry) => entry.word?.trim() && entry.translation?.trim());
  if (sanitized.length === 0) {
    return [];
  }
  const words = sanitized.map((entry) => entry.word);

  const questions: Question[] = [];

  sanitized.forEach((entry) => {
    const hint = entry.description?.trim() || null;
    questions.push({
      id: `${entry.id}-word`,
      theme_id: entry.theme_id,
      question_text: entry.word,
      question_type: 'input',
      is_strict: true,
      options: null,
      answer: entry.translation,
      correct_options: null,
      question_hint: hint,
      language_entry_id: entry.id,
    });

    if (words.length > 1) {
      const distractors = shuffle(words.filter((word) => word !== entry.word)).slice(0, Math.min(3, words.length - 1));
      const options = shuffle([entry.word, ...distractors]);
      questions.push({
        id: `${entry.id}-choice`,
        theme_id: entry.theme_id,
        question_text: entry.translation,
        question_type: 'radiobutton',
        is_strict: true,
        options,
        answer: null,
        correct_options: [entry.word],
        question_hint: hint,
        language_entry_id: entry.id,
      });
    } else {
      questions.push({
        id: `${entry.id}-reverse`,
        theme_id: entry.theme_id,
        question_text: entry.translation,
        question_type: 'input',
        is_strict: true,
        options: null,
        answer: entry.word,
        correct_options: null,
        question_hint: hint,
        language_entry_id: entry.id,
      });
    }
  });

  return questions;
};

const buildClassicLanguageQuestions = (entries: LanguageEntry[]): Question[] => {
  return entries
    .filter((entry) => entry.word?.trim() && entry.translation?.trim())
    .map((entry) => ({
      id: `lang-${entry.id}`,
      theme_id: entry.theme_id,
      question_text: entry.word.trim(),
      question_type: 'input',
      is_strict: true,
      options: null,
      answer: entry.translation.trim(),
      correct_options: null,
      question_hint: entry.description?.trim() || null,
      language_entry_id: entry.id,
    }));
};
const estimateLanguageQuestionCount = (entries: LanguageEntry[]) => {
  if (!entries.length) return 0;
  return entries.length * 2;
};

const PlayPage = observer(() => {
  const selected = themeStore.selectedThemes;
  const selectedIds = themeStore.selectedThemeIds;
  const [isClient, setIsClient] = useState(false);
  const t = useT();

  const [classicQuestions, setClassicQuestions] = useState<Question[]>([]);
  const [languageEntries, setLanguageEntries] = useState<LanguageEntry[]>([]);
  const [classicCount, setClassicCount] = useState<number>(1);
  const [languageCount, setLanguageCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [includeNonStrict, setIncludeNonStrict] = useState<boolean>(true);
  const [blindMode, setBlindMode] = useState<boolean>(false);
  const [mode, setMode] = useState<'classic' | 'language'>('classic');
  const [sessionMode, setSessionMode] = useState<'classic' | 'language'>('classic');
  const [languageModeEligible, setLanguageModeEligible] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);

  const [passed, setPassed] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, { answer: string | string[] | null; isCorrect: boolean | null }>>({});
  const [showResults, setShowResults] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, boolean>>({});

  const [submitted, setSubmitted] = useState(false);
  const [lastWasCorrect, setLastWasCorrect] = useState<boolean | null>(null);
  const [resultSent, setResultSent] = useState(false);
  const router = useRouter();
  const classicCountManualRef = useRef(false);
  const languageCountManualRef = useRef(false);
  const [hasAnyLanguageTopics, setHasAnyLanguageTopics] = useState(false);
  const [hasOnlyLanguageTopics, setHasOnlyLanguageTopics] = useState(false);
  const selectedIdsCount = selectedIds?.length ?? 0;
  const hasSelection =
    (isClient && selectedIdsCount > 0) ||
    (!isClient && selected.length > 0) ||
    questions.length > 0;
  const titleKey = !hasSelection
    ? 'game.title.noSelection'
    : showResults
    ? 'game.title.results'
    : playing
    ? 'game.title.playing'
    : 'game.title.ready';
  const subtitleKey = !hasSelection
    ? 'game.subtitle.noSelection'
    : showResults
    ? 'game.subtitle.results'
    : playing
    ? 'game.subtitle.playing'
    : 'game.subtitle.ready';
  const noSelectionLoaded = selected.length === 0 && (!isClient || selectedIdsCount === 0) && questions.length === 0;

  useEffect(() => {
    // mark client-side hydration
    setIsClient(true);
  }, []);

  useEffect(() => {
    // If we have persisted selected ids but no theme objects loaded yet,
    // fetch themes so `selectedThemes` is populated and the UI can show titles.
    try {
      if (isClient && selectedIds && selectedIds.length > 0 && selected.length === 0) {
        // fetchThemes will populate themeStore.themes and make selectedThemes non-empty
        if ((themeStore as any).fetchThemes) {
          (themeStore as any).fetchThemes().catch(() => {});
        }
      }
    } catch (err) {
      // ignore
    }
  }, [isClient, selectedIds, selected.length]);

  useEffect(() => {
    // load questions from selected themes. During initial server render we rely on `selected` (theme objects)
    // and after hydration we prefer `selectedIds` (persisted ids) to avoid mismatch between server and client.
    const load = async () => {
      const useIds = isClient;
      const idsToLoad = useIds ? selectedIds : selected.map((t) => t.id);
      if (!idsToLoad || idsToLoad.length === 0) {
        setClassicQuestions([]);
        setLanguageEntries([]);
        setLanguageModeEligible(false);
        setHasAnyLanguageTopics(false);
        setHasOnlyLanguageTopics(false);
        return;
      }

      classicCountManualRef.current = false;
      languageCountManualRef.current = false;
      setLoading(true);
      try {
        const payloads = await Promise.all(idsToLoad.map((id) => api.fetchTheme(id)));
        const classicFromThemes = payloads.flatMap((data) => (Array.isArray(data.questions) ? data.questions : []));
        const languageEntriesFromThemes = payloads.flatMap((data) =>
          data.is_language_topic && Array.isArray(data.language_entries) ? data.language_entries : []
        );
        const classicLanguageQuestions = buildClassicLanguageQuestions(languageEntriesFromThemes);
        const allQuestions = [...classicFromThemes, ...classicLanguageQuestions];
        setClassicQuestions(allQuestions);

        const maxClassic = Math.max(1, allQuestions.length || 1);
        setClassicCount((prev) => {
          const base = classicCountManualRef.current && prev > 0 ? prev : maxClassic;
          return clamp(base, 1, maxClassic);
        });

        const hasLanguageTopicsSelected = payloads.some((data) => data.is_language_topic);
        setHasAnyLanguageTopics(hasLanguageTopicsSelected);

        const allLanguage = payloads.length > 0 && payloads.every((data) => data.is_language_topic);
        setHasOnlyLanguageTopics(allLanguage);
        setLanguageModeEligible(allLanguage);
        const usableEntries = allLanguage ? languageEntriesFromThemes : [];
        setLanguageEntries(usableEntries);
        const languageMax = estimateLanguageQuestionCount(usableEntries);
        const defaultLanguageCount = languageMax > 0 ? languageMax : 1;
        setLanguageCount((prev) => {
          const base = languageCountManualRef.current && prev > 0 ? prev : defaultLanguageCount;
          return clamp(base, 1, Math.max(1, languageMax || 1));
        });
      } catch (err) {
        setClassicQuestions([]);
        setLanguageEntries([]);
        setLanguageModeEligible(false);
        setHasAnyLanguageTopics(false);
        setHasOnlyLanguageTopics(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, selectedIds, selected]);

  useEffect(() => {
    if (includeNonStrict) return;
    const strictOnly = classicQuestions.filter((q) => q.is_strict).length;
    const maxStrict = Math.max(1, strictOnly || 1);
    setClassicCount((prev) => clamp(prev, 1, maxStrict));
  }, [includeNonStrict, classicQuestions]);

  useEffect(() => {
    if (!languageModeEligible && mode === 'language') {
      setMode('classic');
    }
  }, [languageModeEligible, mode]);

  // Persist game state to sessionStorage so a reload doesn't kill the session
  const STORAGE_KEY = 'cortexex_gameState';

  // Restore state from storage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          // Basic validation
          if (typeof s.mode === 'string' && (s.mode === 'classic' || s.mode === 'language')) {
            setMode(s.mode);
          }
          if (typeof s.sessionMode === 'string' && (s.sessionMode === 'classic' || s.sessionMode === 'language')) {
            setSessionMode(s.sessionMode);
          } else if (typeof s.mode === 'string' && (s.mode === 'classic' || s.mode === 'language')) {
            setSessionMode(s.mode);
          }
          if (typeof s.classicCount === 'number') {
            setClassicCount(s.classicCount);
          } else if (typeof s.count === 'number') {
            setClassicCount(s.count);
          }
          if (typeof s.languageCount === 'number') {
            setLanguageCount(s.languageCount);
          }
          if (Array.isArray(s.questions) && s.questions.length > 0) {
            setQuestions(s.questions);
            setIndex(typeof s.index === 'number' ? s.index : 0);
            setPlaying(!!s.playing);
            setSubmitted(!!s.submitted);
            setShowResults(!!s.showResults);
            setInputValue(s.inputValue || '');
            setSelectedOption(s.selectedOption || null);
            setSelectedOptions(s.selectedOptions || {});
            setUserAnswers(s.userAnswers || {});
            setPassed(typeof s.passed === 'number' ? s.passed : 0);
            setLastWasCorrect(typeof s.lastWasCorrect === 'boolean' ? s.lastWasCorrect : null);
            setIncludeNonStrict(typeof s.includeNonStrict === 'boolean' ? s.includeNonStrict : true);
            setBlindMode(typeof s.blindMode === 'boolean' ? s.blindMode : false);
            // restore selected theme ids into store so selectedThemes is populated
            if (Array.isArray(s.selectedThemeIds) && s.selectedThemeIds.length > 0) {
              try {
                // set directly on the mobx store
                (themeStore as any).selectedThemeIds = s.selectedThemeIds;
              } catch (err) {
                // ignore
              }
            }
          }
        }
      }
    } catch (err) {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist relevant state on change
  useEffect(() => {
    try {
      const state = {
        playing,
        questions,
        index,
        submitted,
        inputValue,
        selectedOption,
        selectedOptions,
        userAnswers,
        passed,
        showResults,
        lastWasCorrect,
        selectedThemeIds: (themeStore as any).selectedThemeIds || [],
        includeNonStrict,
        blindMode,
        count: classicCount,
        mode,
        classicCount,
        sessionMode,
        languageCount,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // ignore storage errors
    }
  }, [playing, questions, index, submitted, inputValue, selectedOption, selectedOptions, userAnswers, passed, showResults, lastWasCorrect, includeNonStrict, blindMode]);

  const totalClassicAvailable = classicQuestions.length;
  const strictClassicAvailable = classicQuestions.filter((q) => q.is_strict).length;
  const effectiveClassicAvailable = includeNonStrict ? totalClassicAvailable : strictClassicAvailable;
  const languageAvailable = estimateLanguageQuestionCount(languageEntries);
  const activeCount = mode === 'classic' ? classicCount : languageCount;

  const shuffleQuestionOptions = (list: Question[]) =>
    list.map((q) => {
      if (q.options && Array.isArray(q.options) && q.options.length > 1) {
        return { ...q, options: shuffle([...q.options]) };
      }
      return q;
    });

  const startGame = () => {
    let prepared: Question[] = [];

    if (mode === 'language') {
      if (!languageModeEligible) return;
      const pool = buildLanguageQuestionPool(languageEntries);
      if (pool.length === 0) return;
      const limited = shuffle(pool).slice(0, Math.min(languageCount, pool.length));
      prepared = shuffleQuestionOptions(limited);
    } else {
      const source = includeNonStrict ? classicQuestions : classicQuestions.filter((q) => q.is_strict);
      if (source.length === 0) return;
      const limited = shuffle(source).slice(0, Math.min(classicCount, source.length));
      prepared = shuffleQuestionOptions(limited);
    }

    setQuestions(prepared);
    setSessionMode(mode);
    setIndex(0);
    setPlaying(true);
    setSubmitted(false);
    setLastWasCorrect(null);
    setInputValue('');
    setSelectedOption(null);
    setSelectedOptions({});
    setPassed(0);
    setResultSent(false);
  };

  // DifficultyTag and the circular results visualization were extracted to components

  const resetGame = () => {
    setPlaying(false);
    setQuestions([]);
    setIndex(0);
    setSubmitted(false);
    setLastWasCorrect(null);
    setUserAnswers({});
    setShowResults(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
    setResultSent(false);
  };

  const current = questions[index];

  const handleToggleCheckbox = (idx: number) => {
    setSelectedOptions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // After the user's submission we allow proceeding for both strict and non-strict.
  // We'll still record correctness if correct_options/answer exist and show correct answers.
  const canProceed = submitted;

  const handleSubmitAnswer = () => {
    if (!current) return;
    // Determine user's answer representation
    let answerVal: string | string[] | null = null;
    if (current.question_type === 'input') {
      answerVal = inputValue.trim() || null;
    } else if (current.question_type === 'radiobutton') {
      answerVal = selectedOption;
    } else if (current.question_type === 'select') {
      const arr: string[] = [];
      current.options?.forEach((opt, i) => {
        if (selectedOptions[i]) arr.push(opt);
      });
      answerVal = arr.length > 0 ? arr : null;
    }

    // Check correctness where applicable (only input has stored answer currently)
    let isCorrect: boolean | null = null;

    if (current.question_type === 'input' && current.answer) {
      const user = (answerVal as string) || '';
      const normalizedUser = normalizeAnswerString(user);
      const normalizedCorrect = normalizeAnswerString(current.answer);
      isCorrect = normalizedUser === normalizedCorrect;
    } else if ((current.question_type === 'radiobutton' || current.question_type === 'select') && current.correct_options && current.correct_options.length > 0) {
      // grade based on correct_options
      if (current.question_type === 'radiobutton') {
        const user = (answerVal as string) || '';
        const correct = current.correct_options[0] || '';
        isCorrect = normalizeAnswerString(user) === normalizeAnswerString(correct);
      } else {
        // select: compare sets (case-insensitive)
        const normalizeArray = (list: string[]) => list.map(a => normalizeAnswerString(a)).sort();
        const userArr = Array.isArray(answerVal) ? normalizeArray(answerVal as string[]) : [];
        const correctArr = normalizeArray(current.correct_options || []);
        if (userArr.length === 0) {
          isCorrect = false;
        } else {
          isCorrect = userArr.length === correctArr.length && userArr.every((v, i) => v === correctArr[i]);
        }
      }
    } else {
      isCorrect = null;
    }

    // Save user's answer
    setUserAnswers((prev) => ({ ...prev, [current.id]: { answer: answerVal, isCorrect } }));

    // Record correctness (if available) and accept the answer for progression regardless of strict flag.
    setLastWasCorrect(isCorrect === null ? null : isCorrect);
    setSubmitted(true);
  };

  const handleNext = () => {
    // mark current as passed (answered)
    setPassed((p) => p + 1);

    const next = index + 1;
    if (next >= questions.length) {
      // finished -> show results summary instead of immediately resetting
      setShowResults(true);
      setPlaying(false);
      return;
    }
    setIndex(next);
    setSubmitted(false);
    setLastWasCorrect(null);
    setInputValue('');
    setSelectedOption(null);
    setSelectedOptions({});
  };

  // When results view opens, send the session summary to backend once.
  useEffect(() => {
    if (!showResults || resultSent) return;

    const questionsAnswered = questions.length;
    const correctAnswers = Object.values(userAnswers).filter(a => a.isCorrect === true).length;

    // compute max correct-in-row and the ending streak (drops to zero on every wrong answer)
    let maxStreak = 0;
    let currentStreak = 0;
    for (const q of questions) {
      const ua = userAnswers[q.id];
      if (ua?.isCorrect === true) {
        currentStreak += 1;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }
    const endingStreak = currentStreak;

    const perQuestion = sessionMode === 'language'
      ? []
      : questions.map(q => ({ questionId: q.id, isCorrect: userAnswers[q.id]?.isCorrect ?? null }));

    const languageEntryResults = sessionMode === 'language'
      ? summarizeLanguageEntryResults(questions, userAnswers)
      : [];

    // fire-and-forget, don't block UI; mark sent whether it succeeds to avoid duplicates
    api.postGameResult({
        questionsAnswered,
        correctAnswers,
        maxCorrectInRow: maxStreak,
        currentCorrectInRow: endingStreak,
        perQuestion,
        languageEntryResults: sessionMode === 'language' ? languageEntryResults : undefined,
      })
      .catch(() => {})
      .finally(() => setResultSent(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-light/60">{t('game.modeLabel')}</p>
        <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
          {t(titleKey)}
        </h1>
        <p className="max-w-2xl text-lg text-light/70">
          {t(subtitleKey)}
        </p>
      </header>

      {noSelectionLoaded ? (
        <section className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
          <p className="text-sm font-medium text-light/50">{t('game.emptySelection')}</p>
        </section>
      ) : (
        <section className="space-y-6 rounded-2xl border border-light/10 bg-dark/50 p-8 backdrop-blur-sm">
          {showResults ? (
            <ResultsView
              questions={questions}
              userAnswers={userAnswers}
              onRestart={() => { setShowResults(false); startGame(); }}
              onBack={() => { try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {} ; router.push('/user'); }}
            />
          ) : !playing ? (
            <GameSetup
              selected={selected}
              count={activeCount}
              setCount={(value) => {
                if (mode === 'classic') {
                  classicCountManualRef.current = true;
                  setClassicCount(value);
                } else {
                  languageCountManualRef.current = true;
                  setLanguageCount(value);
                }
              }}
              includeNonStrict={includeNonStrict}
              setIncludeNonStrict={(v) => {
                setIncludeNonStrict(v);
                if (!v) {
                  const strictCount = classicQuestions.filter((q) => q.is_strict).length || 1;
                  setClassicCount((c) => Math.min(c, strictCount));
                }
              }}
              blindMode={blindMode}
              setBlindMode={setBlindMode}
              effectiveAvailable={effectiveClassicAvailable}
              totalAvailable={totalClassicAvailable}
              strictAvailable={strictClassicAvailable}
              mode={mode}
              setMode={setMode}
              languageModeEnabled={languageModeEligible}
              languageAvailable={languageAvailable}
              showLanguageMode={hasAnyLanguageTopics}
              hasOnlyLanguageTopics={hasOnlyLanguageTopics}
              loading={loading}
              startGame={startGame}
              onBack={() => { try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {} ; router.push('/user'); }}
            />
          ) : (
            <QuestionView
              current={current}
              index={index}
              total={questions.length}
              inputValue={inputValue}
              setInputValue={setInputValue}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              selectedOptions={selectedOptions}
              handleToggleCheckbox={handleToggleCheckbox}
              submitted={submitted}
              lastWasCorrect={lastWasCorrect}
              blindMode={blindMode}
              canProceed={canProceed}
              handleSubmitAnswer={handleSubmitAnswer}
              handleNext={handleNext}
              resetGame={resetGame}
            />
          )}
        </section>
      )}
    </main>
  );
});

export default PlayPage;

