"use client"

import Link from 'next/link';
import { observer } from 'mobx-react-lite';
import { themeStore } from '@/store/themeStore';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import { Question } from '@/lib/interface';
import CircularDiagram from '@/components/CircularDiagram';
import DifficultyTag from '@/components/DifficultyTag';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import Card from '@/components/Card';
import GameSetup from '@/components/game/GameSetup';
import QuestionView from '@/components/game/QuestionView';
import ResultsView from '@/components/game/ResultsView';

function shuffle<T>(arr: T[]) {
  return arr
    .map((a) => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value);
}

const PlayPage = observer(() => {
  const selected = themeStore.selectedThemes;
  const selectedIds = themeStore.selectedThemeIds;
  const [isClient, setIsClient] = useState(false);

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [count, setCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [includeNonStrict, setIncludeNonStrict] = useState<boolean>(true);

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
      if (useIds) {
        if (!selectedIds || selectedIds.length === 0) {
          setAvailableQuestions([]);
          return;
        }
      } else {
        if (!selected || selected.length === 0) {
          setAvailableQuestions([]);
          return;
        }
      }

      setLoading(true);
      try {
        const all: Question[] = [];
        if (useIds) {
          for (const id of selectedIds) {
            const data = await api.fetchTheme(id);
            if (data.questions && Array.isArray(data.questions)) {
              all.push(...data.questions);
            }
          }
        } else {
          for (const t of selected) {
            const data = await api.fetchTheme(t.id);
            if (data.questions && Array.isArray(data.questions)) {
              all.push(...data.questions);
            }
          }
        }
        setAvailableQuestions(all);
        setCount(all.length || 1);
      } catch (err) {
        setAvailableQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, selectedIds, selected]);

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
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // ignore storage errors
    }
  }, [playing, questions, index, submitted, inputValue, selectedOption, selectedOptions, userAnswers, passed, showResults, lastWasCorrect, includeNonStrict]);

  const totalAvailable = availableQuestions.length;
  const strictAvailable = availableQuestions.filter((q) => q.is_strict).length;
  const effectiveAvailable = includeNonStrict ? totalAvailable : strictAvailable;

  const startGame = () => {
    const source = includeNonStrict ? availableQuestions : availableQuestions.filter((q) => q.is_strict);
    const pool = shuffle(source).slice(0, Math.min(count, source.length));
    setQuestions(pool);
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
      const correct = current.answer.trim();
      isCorrect = user.toLowerCase() === correct.toLowerCase();
    } else if ((current.question_type === 'radiobutton' || current.question_type === 'select') && current.correct_options && current.correct_options.length > 0) {
      // grade based on correct_options
      if (current.question_type === 'radiobutton') {
        const user = (answerVal as string) || '';
        const correct = current.correct_options[0] || '';
        isCorrect = user.trim().toLowerCase() === correct.trim().toLowerCase();
      } else {
        // select: compare sets (case-insensitive)
        const userArr = Array.isArray(answerVal) ? (answerVal as string[]).map(a => a.trim().toLowerCase()).sort() : [];
        const correctArr = (current.correct_options || []).map(a => a.trim().toLowerCase()).sort();
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

    // compute max correct-in-row based on question order
    let maxStreak = 0;
    let cur = 0;
    for (const q of questions) {
      const ua = userAnswers[q.id];
      if (ua?.isCorrect === true) {
        cur += 1;
        if (cur > maxStreak) maxStreak = cur;
      } else {
        cur = 0;
      }
    }

    const perQuestion = questions.map(q => ({ questionId: q.id, isCorrect: userAnswers[q.id]?.isCorrect ?? null }));

    // fire-and-forget, don't block UI; mark sent whether it succeeds to avoid duplicates
    api.postGameResult({ questionsAnswered, correctAnswers, maxCorrectInRow: maxStreak, perQuestion })
      .catch(() => {})
      .finally(() => setResultSent(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-light/60">Play Mode</p>
        <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
          {(() => {
            const hasSelection = (isClient && selectedIds && selectedIds.length > 0) || questions.length > 0 || selected.length > 0;
            if (!hasSelection) return 'No themes selected';
            if (showResults) return 'Results';
            if (playing) return 'Playing';
            return 'Get ready!';
          })()}
        </h1>
        <p className="max-w-2xl text-lg text-light/70">
          {(() => {
            const hasSelection = (isClient && selectedIds && selectedIds.length > 0) || selected.length > 0 || questions.length > 0;
            if (!hasSelection) return 'Head back and choose at least one theme to unlock play mode.';
            if (showResults) return 'Your session finished — review results or restart the game.';
            if (playing) return 'Answer questions and progress through the session.';
            return 'Choose how many questions and start the session.';
          })()}
        </p>
      </header>

      {((selected.length === 0 && (!isClient || selectedIds.length === 0)) && questions.length === 0) ? (
        <section className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
          <p className="text-sm font-medium text-light/50">Nothing to load yet — add themes first.</p>
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
              count={count}
              setCount={setCount}
              includeNonStrict={includeNonStrict}
              setIncludeNonStrict={(v) => {
                setIncludeNonStrict(v);
                if (!v) {
                  const strictCount = availableQuestions.filter((q) => q.is_strict).length || 1;
                  setCount((c) => Math.min(c, strictCount));
                }
              }}
              effectiveAvailable={effectiveAvailable}
              totalAvailable={totalAvailable}
              strictAvailable={strictAvailable}
              loading={loading}
              startGame={startGame}
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
              canProceed={canProceed}
              handleSubmitAnswer={handleSubmitAnswer}
              handleNext={handleNext}
              resetGame={resetGame}
            />
          )}
        </section>
      )}

      {!playing && !showResults && (
        <div className="mt-auto flex items-center justify-between">
          <Link
            href="/user"
            className="inline-flex items-center justify-center rounded-xl border border-light/20 bg-transparent px-8 py-4 text-base font-semibold text-light hover:border-light/40 hover:bg-light/5"
          >
            Back to Themes
          </Link>
        </div>
      )}
    </main>
  );
});

export default PlayPage;

