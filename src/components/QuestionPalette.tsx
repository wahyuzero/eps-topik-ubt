import React from 'react';
import type { Question } from '../types';
import { soundFX } from '../utils/soundEffects';
import { Bookmark } from 'lucide-react';

interface QuestionPaletteProps {
  questions: Question[];
  currentQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  answers: Record<number, number>;
  markedForReview: Set<number>;
  isReviewMode?: boolean;
  correctAnswers?: Record<number, number>;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentQuestionIndex,
  onSelectQuestion,
  answers,
  markedForReview,
  isReviewMode = false,
  correctAnswers = {},
}) => {
  const readingQuestions = questions.filter((q) => q.questionNumber <= 20);
  const listeningQuestions = questions.filter((q) => q.questionNumber > 20);

  const isFirstPartListening =
    readingQuestions.length > 0 &&
    readingQuestions.every((q) => Boolean(q.audioPath) || q.questionType?.code === 'KO_LISTENING');
  const firstTitle = isFirstPartListening ? '듣기/면접 1부 (Listening: 1~20)' : '읽기 영역 (Reading: 1~20)';
  const secondTitle = isFirstPartListening ? '듣기/면접 2부 (Listening: 21~40)' : '듣기 영역 (Listening: 21~40)';

  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;

  const renderGrid = (items: Question[], title: string) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
        <span>{title}</span>
        <span className="text-[11px] font-normal text-slate-500">
          {items.filter((q) => answers[q.questionNumber]).length} / {items.length} 완료
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {items.map((q) => {
          const qNum = q.questionNumber;
          const isCurrent = questions[currentQuestionIndex]?.questionNumber === qNum;
          const isAnswered = answers[qNum] !== undefined;
          const isMarked = markedForReview.has(qNum);

          let btnClass = 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500';

          if (isReviewMode) {
            const userAns = answers[qNum];
            const correctAns = correctAnswers[qNum];
            if (userAns === correctAns) {
              btnClass = 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 font-bold';
            } else {
              btnClass = 'bg-rose-600/30 text-rose-300 border-rose-500/60 font-bold';
            }
          } else if (isAnswered) {
            btnClass = 'bg-blue-600 text-white border-blue-400 font-bold shadow-sm shadow-blue-900/30';
          }

          if (isCurrent) {
            btnClass += ' ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-105 z-10';
          }

          return (
            <button
              key={qNum}
              onClick={() => {
                soundFX.playNav();
                const targetIdx = questions.findIndex((item) => item.questionNumber === qNum);
                if (targetIdx !== -1) onSelectQuestion(targetIdx);
              }}
              className={`relative h-10 rounded-xl border flex items-center justify-center font-bold text-sm transition-all active:scale-95 ${btnClass}`}
            >
              <span>{qNum}</span>

              {/* Bookmark badge indicator */}
              {isMarked && !isReviewMode && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                  <Bookmark className="w-2.5 h-2.5 text-slate-950 fill-current" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header and Summary Counters */}
      <div>
        <h3 className="font-extrabold text-sm text-slate-200 tracking-wide uppercase flex items-center justify-between">
          <span>문항 답안 현황 (Question Palette)</span>
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            총 {questions.length}문항
          </span>
        </h3>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-600" />
            <span>답안 작성</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
            <span>미작성</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-400" />
            <span>검토 표시</span>
          </div>
        </div>
      </div>

      {/* Reading / First Grid (1-20) */}
      {renderGrid(readingQuestions, firstTitle)}

      {/* Listening / Second Grid (21-40) */}
      {renderGrid(listeningQuestions, secondTitle)}

      {/* Status Bar */}
      <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-xs flex items-center justify-around font-semibold">
        <div className="text-center">
          <div className="text-slate-400 text-[10px]">답안 작성</div>
          <div className="text-blue-400 font-bold text-sm">{answeredCount}</div>
        </div>
        <div className="h-6 w-px bg-slate-700" />
        <div className="text-center">
          <div className="text-slate-400 text-[10px]">검토 표시</div>
          <div className="text-amber-400 font-bold text-sm">{markedCount}</div>
        </div>
        <div className="h-6 w-px bg-slate-700" />
        <div className="text-center">
          <div className="text-slate-400 text-[10px]">미답변</div>
          <div className="text-rose-400 font-bold text-sm">{questions.length - answeredCount}</div>
        </div>
      </div>
    </div>
  );
};
