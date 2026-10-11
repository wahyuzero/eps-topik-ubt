import React, { useState } from 'react';
import type { Question } from '../types';
import { soundFX } from '../utils/soundEffects';
import { Bookmark, X } from 'lucide-react';

interface QuestionPaletteBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  currentQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  answers: Record<number, number>;
  markedForReview: Set<number>;
  isReviewMode?: boolean;
  correctAnswers?: Record<number, number>;
}

export const QuestionPaletteBottomSheet: React.FC<QuestionPaletteBottomSheetProps> = ({
  isOpen,
  onClose,
  questions,
  currentQuestionIndex,
  onSelectQuestion,
  answers,
  markedForReview,
  isReviewMode = false,
  correctAnswers = {},
}) => {
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'marked' | 'wrong'>('all');

  if (!isOpen) return null;

  const readingQuestions = questions.filter((q) => q.questionNumber <= 20);
  const listeningQuestions = questions.filter((q) => q.questionNumber > 20);

  const isFirstPartListening =
    readingQuestions.length > 0 &&
    readingQuestions.every((q) => Boolean(q.audioPath) || q.questionType?.code === 'KO_LISTENING');
  const firstTitle = isFirstPartListening ? '듣기/면접 1부 (Listening: 1~20)' : '읽기 영역 (Reading: 1~20)';
  const secondTitle = isFirstPartListening ? '듣기/면접 2부 (Listening: 21~40)' : '듣기 영역 (Listening: 21~40)';

  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const unansweredCount = questions.length - answeredCount;

  const filterQuestions = (items: Question[]) => {
    return items.filter((q) => {
      const qNum = q.questionNumber;
      const isAnswered = answers[qNum] !== undefined;
      const isMarked = markedForReview.has(qNum);
      const isWrong = isReviewMode && answers[qNum] !== correctAnswers[qNum];

      if (filter === 'unanswered') return !isAnswered;
      if (filter === 'marked') return isMarked;
      if (filter === 'wrong') return isWrong;
      return true;
    });
  };

  const renderGridSection = (items: Question[], title: string) => {
    const visible = filterQuestions(items);
    if (visible.length === 0) return null;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
          <span>{title}</span>
          <span className="text-[11px] text-slate-400 font-normal">
            {items.filter((q) => answers[q.questionNumber]).length} / {items.length} 완료
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {visible.map((q) => {
            const qNum = q.questionNumber;
            const isCurrent = questions[currentQuestionIndex]?.questionNumber === qNum;
            const isAnswered = answers[qNum] !== undefined;
            const isMarked = markedForReview.has(qNum);

            let btnClass = 'bg-slate-800 text-slate-200 border-slate-700 active:bg-slate-700';

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
                  if (targetIdx !== -1) {
                    onSelectQuestion(targetIdx);
                    onClose();
                  }
                }}
                className={`relative h-12 rounded-xl border flex items-center justify-center font-bold text-sm transition-all active:scale-95 cursor-pointer ${btnClass}`}
              >
                <span>{qNum}</span>

                {isMarked && !isReviewMode && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                    <Bookmark className="w-2.5 h-2.5 text-slate-950 fill-current" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
      <div
        onClick={onClose}
        className="flex-1"
      />

      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-white">
              {isReviewMode ? '문항 정답/오답 현황' : '답안지 (Lembar Jawab UBT)'}
            </h3>
            <p className="text-xs text-slate-400">
              문항 번호를 탭하면 해당 문제로 즉시 이동합니다.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Status Cards */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block">답안 작성</span>
            <span className="text-blue-400 font-bold text-base">{answeredCount}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block">검토 표시 (Ragu)</span>
            <span className="text-amber-400 font-bold text-base">{markedCount}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block">미작성 (Kosong)</span>
            <span className="text-rose-400 font-bold text-base">{unansweredCount}</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold hide-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            전체 ({questions.length})
          </button>

          {!isReviewMode && (
            <>
              <button
                onClick={() => setFilter('unanswered')}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors cursor-pointer ${
                  filter === 'unanswered'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                미작성 ({unansweredCount})
              </button>
              <button
                onClick={() => setFilter('marked')}
                className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors cursor-pointer ${
                  filter === 'marked'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                검토 표시 ({markedCount})
              </button>
            </>
          )}

          {isReviewMode && (
            <button
              onClick={() => setFilter('wrong')}
              className={`px-3 py-1.5 rounded-xl border whitespace-nowrap transition-colors cursor-pointer ${
                filter === 'wrong'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              오답만 보기
            </button>
          )}
        </div>

        {/* Grids */}
        <div className="flex flex-col gap-4">
          {renderGridSection(readingQuestions, firstTitle)}
          {listeningQuestions.length > 0 && renderGridSection(listeningQuestions, secondTitle)}
        </div>
      </div>
    </div>
  );
};
