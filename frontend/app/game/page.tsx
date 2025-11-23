"use client"

import Link from 'next/link';
import { observer } from 'mobx-react-lite';
import { themeStore } from '@/store/themeStore';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import { Question } from '@/lib/interface';

function shuffle<T>(arr: T[]) {
  return arr
    .map((a) => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value);
}

const PlayPage = observer(() => {
  const selected = themeStore.selectedThemes;

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [count, setCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);

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
  const router = useRouter();

  useEffect(() => {
    // load questions from selected themes
    const load = async () => {
      if (selected.length === 0) {
        setAvailableQuestions([]);
        return;
      }
      setLoading(true);
      try {
        const all: Question[] = [];
        for (const t of selected) {
          const data = await api.fetchTheme(t.id);
          if (data.questions && Array.isArray(data.questions)) {
            all.push(...data.questions);
          }
        }
        setAvailableQuestions(all);
        // default count should be the max available so user sees e.g. "86/86"
        setCount(all.length || 1);
      } catch (err) {
        setAvailableQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selected]);

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
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // ignore storage errors
    }
  }, [playing, questions, index, submitted, inputValue, selectedOption, selectedOptions, userAnswers, passed, showResults, lastWasCorrect]);

  const totalAvailable = availableQuestions.length;

  const startGame = () => {
    const pool = shuffle(availableQuestions).slice(0, Math.min(count, availableQuestions.length));
    setQuestions(pool);
    setIndex(0);
    setPlaying(true);
    setSubmitted(false);
    setLastWasCorrect(null);
    setInputValue('');
    setSelectedOption(null);
    setSelectedOptions({});
    setPassed(0);
  };

  const DifficultyTag = ({ d }: { d: string }) => {
    const base = 'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider';
    if (d === 'Easy') return <span className={`${base} border border-green-500/20 bg-green-500/10 text-green-400`}>Easy</span>;
    if (d === 'Medium') return <span className={`${base} border border-yellow-500/20 bg-yellow-500/10 text-yellow-400`}>Medium</span>;
    if (d === 'Hard') return <span className={`${base} border border-red-500/20 bg-red-500/10 text-red-400`}>Hard</span>;
    return <span className={`${base} border border-light/20 bg-light/5 text-light/60`}>{d}</span>;
  };

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

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-light/60">Play Mode</p>
        <h1 className="text-4xl font-bold tracking-tight text-light sm:text-5xl">
          {(() => {
            const hasSelection = selected.length > 0 || questions.length > 0;
            if (!hasSelection) return 'No themes selected';
            if (playing) return 'Playing';
            return 'Get ready!';
          })()}
        </h1>
        <p className="max-w-2xl text-lg text-light/70">
          {(() => {
            const hasSelection = selected.length > 0 || questions.length > 0;
            if (!hasSelection) return 'Head back and choose at least one theme to unlock play mode.';
            if (playing) return 'Answer questions and progress through the session.';
            return 'Choose how many questions and start the session.';
          })()}
        </p>
      </header>

      {((selected.length === 0) && questions.length === 0) ? (
        <section className="rounded-2xl border border-dashed border-light/20 bg-dark/30 p-12 text-center">
          <p className="text-sm font-medium text-light/50">Nothing to load yet — add themes first.</p>
        </section>
      ) : (
        <section className="space-y-6 rounded-2xl border border-light/10 bg-dark/50 p-8 backdrop-blur-sm">
          {showResults ? (
            <div className="space-y-4 rounded-2xl border border-light/10 bg-dark/50 p-6">
              <h2 className="text-2xl font-bold text-light">Results</h2>
              <p className="text-sm text-light/60">You answered {Object.values(userAnswers).filter(a => a.isCorrect === true).length} correct out of {questions.length} ({Math.round((Object.values(userAnswers).filter(a => a.isCorrect === true).length / Math.max(1, questions.length)) * 100)}%)</p>
              <div className="mt-4 space-y-3">
                {questions.map((q, i) => {
                  const ua = userAnswers[q.id];
                  return (
                    <div key={q.id} className="rounded-md border border-light/10 bg-dark/30 p-3">
                      <div className="font-medium text-light">{i + 1}. {q.question_text}</div>
                      <div className="text-xs text-light/50 mt-1">Your answer: {Array.isArray(ua?.answer) ? ua?.answer.join(', ') : ua?.answer ?? '—'}</div>
                      {q.answer && (
                        <div className="text-xs text-light/50 mt-1">Correct answer: {q.answer}</div>
                      )}
                      {q.correct_options && q.correct_options.length > 0 && (
                        <div className="text-xs text-light/50 mt-1">Correct options: {q.correct_options.join(', ')}</div>
                      )}
                      <div className={`mt-2 text-sm ${ua?.isCorrect === true ? 'text-green-400' : ua?.isCorrect === false ? 'text-red-400' : 'text-light/60'}`}>
                        {ua?.isCorrect === true ? 'Correct' : ua?.isCorrect === false ? 'Incorrect' : 'Recorded'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => { setShowResults(false); startGame(); }} className="rounded-xl bg-light px-6 py-3 text-base font-semibold text-dark">Restart Game</button>
                <button onClick={() => { sessionStorage.removeItem('cortexex_gameState'); router.push('/user'); }} className="rounded-xl border border-light/20 bg-transparent px-6 py-3 text-base font-semibold text-light">Back to Themes</button>
              </div>
            </div>
          ) : !playing ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-light">Selected Themes</label>
                <ul className="mt-2 space-y-2 text-sm text-light/70">
                  {selected.map((t) => (
                    <li key={t.id} className="flex items-center justify-between rounded-md bg-dark/30 px-3 py-2">
                          <div>
                            <div className="font-medium text-light">{t.title}</div>
                            <div className="mt-1 flex items-center gap-3">
                              <div className="text-xs text-light/50">{t.questions} questions</div>
                              <div><DifficultyTag d={t.difficulty} /></div>
                            </div>
                          </div>
                        </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-light">Questions per session</label>
                <div className="mt-6 flex gap-3">
                  <input
                    type="number"
                    min={1}
                    max={totalAvailable}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-32 rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light"
                  />
                  <div className="text-sm text-light/50">{count}/{totalAvailable}</div>
                </div>
                <p className="mt-2 text-xs text-light/50">Total available questions: {totalAvailable}{loading ? ' (loading...)' : ''}</p>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={startGame}
                    disabled={totalAvailable === 0}
                    className="rounded-xl bg-light px-6 py-3 text-base font-semibold text-dark disabled:opacity-50"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          ) : showResults ? (
            <div className="space-y-4 rounded-2xl border border-light/10 bg-dark/50 p-6">
              <h2 className="text-2xl font-bold text-light">Results</h2>
              <p className="text-sm text-light/60">You answered {Object.values(userAnswers).filter(a => a.isCorrect === true).length} correct out of {questions.length} ({Math.round((Object.values(userAnswers).filter(a => a.isCorrect === true).length / Math.max(1, questions.length)) * 100)}%)</p>
              <div className="mt-4 space-y-3">
                {questions.map((q, i) => {
                  const ua = userAnswers[q.id];
                  return (
                    <div key={q.id} className="rounded-md border border-light/10 bg-dark/30 p-3">
                      <div className="font-medium text-light">{i + 1}. {q.question_text}</div>
                      <div className="text-xs text-light/50 mt-1">Your answer: {Array.isArray(ua?.answer) ? ua?.answer.join(', ') : ua?.answer ?? '—'}</div>
                      {q.answer && (
                        <div className="text-xs text-light/50 mt-1">Correct answer: {q.answer}</div>
                      )}
                      {q.correct_options && q.correct_options.length > 0 && (
                        <div className="text-xs text-light/50 mt-1">Correct options: {q.correct_options.join(', ')}</div>
                      )}
                      <div className={`mt-2 text-sm ${ua?.isCorrect === true ? 'text-green-400' : ua?.isCorrect === false ? 'text-red-400' : 'text-light/60'}`}>
                        {ua?.isCorrect === true ? 'Correct' : ua?.isCorrect === false ? 'Incorrect' : 'Recorded'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => { setShowResults(false); startGame(); }} className="rounded-xl bg-light px-6 py-3 text-base font-semibold text-dark">Restart Game</button>
                <button onClick={() => router.push('/user')} className="rounded-xl border border-light/20 bg-transparent px-6 py-3 text-base font-semibold text-light">Back to Themes</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-light/50">Question {index + 1} / {questions.length}</div>
                  <div className="text-lg font-semibold text-light">{current?.question_text}</div>
                </div>
                <div>
                  <button onClick={resetGame} className="rounded-lg border border-light/20 bg-transparent px-4 py-2 text-sm text-light">End</button>
                </div>
              </div>

              <div className="space-y-4">
                {current?.question_type === 'input' && (
                  <div>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full rounded-lg border border-light/20 bg-dark/50 px-4 py-3 text-base text-light"
                      placeholder="Type your answer here..."
                      disabled={canProceed}
                    />
                  </div>
                )}

                {current?.question_type === 'radiobutton' && (
                  <div className="space-y-2">
                    {current.options?.map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 rounded-md px-3 py-2">
                        <input
                          type="radio"
                          name="rb"
                          checked={selectedOption === opt}
                          onChange={() => setSelectedOption(opt)}
                          className="h-4 w-4"
                          disabled={canProceed}
                        />
                        <span className="text-light">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {current?.question_type === 'select' && (
                  <div className="space-y-2">
                    {current.options?.map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 rounded-md px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!!selectedOptions[i]}
                          onChange={() => handleToggleCheckbox(i)}
                          className="h-4 w-4"
                          disabled={canProceed}
                        />
                        <span className="text-light">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={canProceed}
                    className="rounded-xl bg-light px-6 py-3 text-base font-semibold text-dark disabled:opacity-50"
                  >
                    Submit
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="rounded-xl border border-light/20 bg-transparent px-6 py-3 text-base font-semibold text-light disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>

                {submitted && (
                  <div className="mt-4 rounded-md border border-light/10 bg-dark/40 p-3">
                    {lastWasCorrect === true ? (
                      <div className="text-sm text-green-400">Correct</div>
                    ) : lastWasCorrect === false ? (
                      <div className="text-sm text-red-400">Incorrect</div>
                    ) : (
                      <div className="text-sm text-light/60">Answer recorded.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="mt-auto flex items-center justify-between">
        <Link
          href="/user"
          className="inline-flex items-center justify-center rounded-xl border border-light/20 bg-transparent px-8 py-4 text-base font-semibold text-light hover:border-light/40 hover:bg-light/5"
        >
          Back to Themes
        </Link>
      </div>
    </main>
  );
});

export default PlayPage;

