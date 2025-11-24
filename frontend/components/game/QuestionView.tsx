"use client"

import React from 'react';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import { Question } from '@/lib/interface';

export default function QuestionView(props: {
  current?: Question;
  index: number;
  total: number;
  inputValue: string;
  setInputValue: (s: string) => void;
  selectedOption: string | null;
  setSelectedOption: (s: string | null) => void;
  selectedOptions: Record<number, boolean>;
  handleToggleCheckbox: (idx: number) => void;
  submitted: boolean;
  lastWasCorrect: boolean | null;
  canProceed: boolean;
  handleSubmitAnswer: () => void;
  handleNext: () => void;
  resetGame: () => void;
}) {
  const { current, index, total, inputValue, setInputValue, selectedOption, setSelectedOption, selectedOptions, handleToggleCheckbox, submitted, lastWasCorrect, canProceed, handleSubmitAnswer, handleNext, resetGame } = props;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-light/50">Question {index + 1} / {total}</div>
          <div className="text-lg font-semibold text-light">{current?.question_text}</div>
        </div>
        <div>
          <Button variant="ghost" onClick={resetGame} className="px-4 py-2 text-sm">End</Button>
        </div>
      </div>

      <div className="space-y-4">
        {current?.question_type === 'input' && (
          <div>
            <TextInput
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
          <Button onClick={handleSubmitAnswer} disabled={canProceed} className="px-6 py-3 text-base">Submit</Button>

          <Button variant="ghost" onClick={handleNext} disabled={!canProceed} className="px-6 py-3 text-base">Next</Button>
        </div>

        {submitted && (
          <div className="mt-4 rounded-md border border-light/10 bg-dark/40 p-3">
            {current?.is_strict ? (
              lastWasCorrect === true ? (
                <div className="text-sm text-green-400">Correct</div>
              ) : lastWasCorrect === false ? (
                <div className="text-sm text-red-400">Incorrect</div>
              ) : (
                <div className="text-sm text-light/60">Answer recorded.</div>
              )
            ) : null}

            {current?.question_type === 'input' && current.answer && (
              <div className={`mt-2 text-xs ${current?.is_strict ? 'text-light/50' : 'text-yellow-300'}`}>
                Correct answer: {current.answer}
              </div>
            )}
            {(current?.question_type === 'radiobutton' || current?.question_type === 'select') && current?.correct_options && current.correct_options.length > 0 && (
              <div className={`mt-2 text-xs ${current?.is_strict ? 'text-light/50' : 'text-yellow-300'}`}>
                Correct options: {current.correct_options.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
