import React, { useState } from 'react';
import type { Question } from '../types';
import { BookOpen, CheckCircle, XCircle, ArrowRight, Tag, X } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface OdapNoteModalProps {
  examTitle: string;
  questions: Question[];
  answers: Record<number, number>;
  onClose: () => void;
  onJumpToQuestion?: (questionIndex: number) => void;
}

export const OdapNoteModal: React.FC<OdapNoteModalProps> = ({
  examTitle,
  questions,
  answers,
  onClose,
  onJumpToQuestion,
}) => {
  // Find all questions that the user answered incorrectly
  const wrongQuestions = questions.filter((q) => {
    const userAns = answers[q.questionNumber];
    const correctAns = parseInt(q.answer || '1', 10);
    return userAns !== undefined && userAns !== correctAns;
  });

  const [activeTab, setActiveTab] = useState<'all' | 'reading' | 'listening'>('all');
  const [selectedReasons, setSelectedReasons] = useState<Record<number, string>>({});

  const filteredList = wrongQuestions.filter((q) => {
    if (activeTab === 'reading') return q.questionNumber <= 20;
    if (activeTab === 'listening') return q.questionNumber > 20;
    return true;
  });

  const REASONS = [
    { id: 'vocab', label: '단어 모름 (Kosakata Baru)' },
    { id: 'audio', label: '음원 청취 오류 (Kurang Dengar Audio)' },
    { id: 'grammar', label: '문법 트릭 (Terkecoh Tata Bahasa)' },
    { id: 'time', label: '시간 부족 (Kurang Waktu)' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>오답노트 (Buku Soal Salah / Odap Note)</span>
                <span className="text-[11px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30 font-semibold">
                  {wrongQuestions.length}개 오답
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{examTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            전체 ({wrongQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('reading')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'reading'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            읽기 오답 ({wrongQuestions.filter((q) => q.questionNumber <= 20).length})
          </button>
          <button
            onClick={() => setActiveTab('listening')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'listening'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            듣기 오답 ({wrongQuestions.filter((q) => q.questionNumber > 20).length})
          </button>
        </div>

        {/* List of Wrong Questions */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[300px]">
          {filteredList.length === 0 ? (
            <div className="my-auto text-center p-8 bg-slate-950/50 rounded-2xl border border-slate-800/80">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <h4 className="font-bold text-white text-sm">해당 영역에 틀린 문제가 없습니다!</h4>
              <p className="text-xs text-slate-400 mt-1">
                완벽하게 정답을 맞혔거나 아직 응시하지 않았습니다.
              </p>
            </div>
          ) : (
            filteredList.map((q) => {
              const userAns = answers[q.questionNumber];
              const correctAns = parseInt(q.answer || '1', 10);
              const isListening = q.questionNumber > 20;
              const reason = selectedReasons[q.questionNumber];

              const userOpt = q.options.find((o) => o.optionNumber === userAns);
              const correctOpt = q.options.find((o) => o.optionNumber === correctAns);

              return (
                <div
                  key={q.id}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex flex-col gap-3 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs border border-blue-500/30">
                        문제 {q.questionNumber}번
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {isListening ? '듣기 (Listening)' : '읽기 (Reading)'}
                      </span>
                    </div>

                    {onJumpToQuestion && (
                      <button
                        onClick={() => {
                          const idx = questions.findIndex((item) => item.questionNumber === q.questionNumber);
                          if (idx !== -1) {
                            onJumpToQuestion(idx);
                            onClose();
                          }
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        <span>상세 검토</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Heading & description snippet */}
                  {q.mainHeading && (
                    <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                      {q.mainHeading}
                    </p>
                  )}

                  {/* Answer Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-400">내가 고른 답: </span>
                        <span className="text-rose-200">
                          {userAns}번 {userOpt?.text ? `(${userOpt.text})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-400">실제 정답: </span>
                        <span className="text-emerald-200">
                          {correctAns}번 {correctOpt?.text ? `(${correctOpt.text})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mistake categorization tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mr-1">
                      <Tag className="w-3 h-3 text-slate-500" />
                      원인 분류:
                    </span>
                    {REASONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          soundFX.playSelect();
                          setSelectedReasons((prev) => ({
                            ...prev,
                            [q.questionNumber]: prev[q.questionNumber] === r.id ? '' : r.id,
                          }));
                        }}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          reason === r.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>오답 노트를 주기적으로 복습하면 합격선(110점) 돌파 확률이 크게 올라갑니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
