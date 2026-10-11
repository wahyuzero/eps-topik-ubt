import React, { useEffect } from 'react';
import type { ExamResult } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle, XCircle, RotateCcw, ArrowRight, Eye, Clock, Award, X, BookOpen } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface ResultModalProps {
  result: ExamResult;
  onRetake: () => void;
  onReview: () => void;
  onSelectAnother: () => void;
  onClose: () => void;
  onOpenOdapNote?: () => void;
  onOpenColorVision?: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  onRetake,
  onReview,
  onSelectAnother,
  onClose,
  onOpenOdapNote,
  onOpenColorVision,
}) => {
  useEffect(() => {
    soundFX.playComplete();
    if (result.passed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result.passed]);

  const percentage = Math.round((result.correctCount / result.totalQuestions) * 100);
  const minutesSpent = Math.floor(result.timeSpentSeconds / 60);
  const secondsSpent = result.timeSpentSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>
        {/* Certificate Top Banner */}
        <div className="text-center flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
              result.passed
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-rose-500/20'
            }`}
          >
            {result.passed ? <Trophy className="w-9 h-9" /> : <Award className="w-9 h-9" />}
          </div>

          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            EPS-TOPIK UBT 시험 결과 보고서
          </span>
          <h2 className="text-2xl font-black text-white mt-1">{result.examTitle}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold text-slate-300">
              {result.studentName ? `Peserta: ${result.studentName}` : 'Peserta Ujian'}
            </span>
            {result.userEmail && (
              <span className="text-[10px] text-slate-400 font-mono">
                ({result.userEmail})
              </span>
            )}
          </div>

          {/* Pass / Fail Badge */}
          <div className="mt-3">
            <span
              className={`px-4 py-1.5 rounded-full font-black text-sm tracking-wider uppercase border inline-flex items-center gap-1.5 shadow-md ${
                result.passed
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}
            >
              {result.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{result.passed ? '합격 (PASS)' : '불합격 (FAIL)'}</span>
            </span>
          </div>
        </div>

        {/* Big Score Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400">종합 득점 (Total Score)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-5xl font-black text-white tracking-tight">{result.totalScore}</span>
            <span className="text-xl font-bold text-slate-500">/ 200점</span>
          </div>
          <span className="text-xs text-blue-400 font-semibold mt-1">
            정답률: {percentage}% ({result.correctCount} / {result.totalQuestions}문항 정답)
          </span>
        </div>

        {/* Section Score Breakdown */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
            <span className="text-xs font-bold text-sky-400">읽기 (Reading)</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{result.readingScore} / 100점</div>
            <span className="text-[11px] text-slate-400 font-medium">1번 ~ 20번 문항</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
            <span className="text-xs font-bold text-purple-400">듣기 (Listening)</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{result.listeningScore} / 100점</div>
            <span className="text-[11px] text-slate-400 font-medium">21번 ~ 40번 문항</span>
          </div>
        </div>

        {/* Exam Time Spent */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-800">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>소요 시간 (Time Spent):</span>
          </span>
          <span className="font-mono font-bold text-slate-200">
            {minutesSpent}분 {secondsSpent}초
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {/* Review Questions button */}
          <button
            onClick={() => {
              soundFX.playNav();
              onReview();
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-blue-900/30 transition-all active:scale-95 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>오답 확인 및 문제 검토 (Review Answers)</span>
          </button>

          {/* Odap Note Button (if there are incorrect answers) */}
          {result.totalQuestions - result.correctCount > 0 && onOpenOdapNote && (
            <button
              onClick={() => {
                soundFX.playNav();
                onOpenOdapNote();
              }}
              className="w-full flex items-center justify-center gap-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold text-xs py-2.5 rounded-xl border border-rose-500/40 transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-rose-400" />
              <span>오답노트 열기 (Buku Soal Salah: {result.totalQuestions - result.correctCount}문항)</span>
            </button>
          )}

          {/* HRD Korea Ishihara Color Vision Test Button */}
          {onOpenColorVision && (
            <button
              onClick={() => {
                soundFX.playNav();
                onOpenColorVision();
              }}
              className="w-full flex items-center justify-center gap-2 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-bold text-xs py-2.5 rounded-xl border border-amber-500/40 transition-all cursor-pointer shadow-sm"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>색각 이상 검사 (HRD Korea Ishihara Color Test)</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {/* Retake */}
            <button
              onClick={() => {
                soundFX.playNav();
                onRetake();
              }}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>다시 응시하기</span>
            </button>

            {/* Select another */}
            <button
              onClick={() => {
                soundFX.playNav();
                onSelectAnother();
              }}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>다른 시험 선택</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
