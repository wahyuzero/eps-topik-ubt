import React, { useState } from 'react';
import type { ExamManifestItem } from '../types';
import { useAuth } from '../context/authContext';
import { Search, Play, Trophy, Clock, CheckCircle, FileText, Sparkles, Eye, Lock, Unlock } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface ExamSelectorProps {
  exams: ExamManifestItem[];
  selectedExamId: string | null;
  onSelectExam: (exam: ExamManifestItem) => void;
  examScores: Record<string, number>; // examId -> best score
  onOpenColorVision?: () => void;
}

export const ExamSelector: React.FC<ExamSelectorProps> = ({
  exams,
  selectedExamId,
  onSelectExam,
  examScores,
  onOpenColorVision,
}) => {
  const { isExamLocked, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'UBT' | 'CHAPTER' | 'SKILL'>('ALL');

  const filteredExams = exams.filter((ex) => {
    const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategory === 'UBT') return ex.title.includes('UBT');
    if (activeCategory === 'CHAPTER') return ex.title.includes('Chapter');
    if (activeCategory === 'SKILL') return ex.title.toLowerCase().includes('skill');
    return true;
  });

  const ubtCount = exams.filter((e) => e.title.includes('UBT')).length;
  const chapterCount = exams.filter((e) => e.title.includes('Chapter')).length;
  const skillCount = exams.filter((e) => e.title.toLowerCase().includes('skill')).length;

  const handleStartExamClick = (exam: ExamManifestItem) => {
    const locked = isExamLocked(exam.id, exam.title);

    // If locked and not admin, cannot start
    if (locked && !isAdmin) {
      soundFX.playWarning();
      return;
    }

    soundFX.playNav();
    onSelectExam(exam);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-800/40 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 text-xs font-extrabold px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>HRD KOREA 표준 UBT 시뮬레이터</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-500/30">
              Multi-Role Ready
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            EPS-TOPIK UBT 문제은행
          </h1>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            실제 한국산업인력공단(HRD Korea) EPS-TOPIK UBT 시험과 100% 동일한 화면, 배점(200점 만점), 듣기 2회 제한 오디오 및 문항 팔레트를 제공합니다.
          </p>
        </div>

        {/* Stats counter */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 relative z-10">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-blue-400">{exams.length}</div>
            <div className="text-[11px] font-semibold text-slate-400">총 모의고사</div>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-indigo-400">40</div>
            <div className="text-[11px] font-semibold text-slate-400">문항 / 세트</div>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-emerald-400">50분</div>
            <div className="text-[11px] font-semibold text-slate-400">제한시간</div>
          </div>
        </div>
      </div>

      {/* Ishihara Quick Test Banner */}
      {onOpenColorVision && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">HRD Korea 필수 색각 검사 (Ishihara Test)</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                  탈락 주의
                </span>
              </div>
              <p className="text-xs text-slate-400">
                실제 UBT 시험 시작 전 5개 도판을 판독하여 색각 이상 여부를 미리 점검하세요.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playNav();
              onOpenColorVision();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-md shadow-amber-500/20 text-center"
          >
            검사 시작 (Start Test)
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => { soundFX.playNav(); setActiveCategory('ALL'); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            전체 ({exams.length})
          </button>
          <button
            onClick={() => { soundFX.playNav(); setActiveCategory('UBT'); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeCategory === 'UBT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2026 UBT 실전 ({ubtCount})
          </button>
          <button
            onClick={() => { soundFX.playNav(); setActiveCategory('CHAPTER'); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeCategory === 'CHAPTER'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            단원별 평가 ({chapterCount})
          </button>
          <button
            onClick={() => { soundFX.playNav(); setActiveCategory('SKILL'); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              activeCategory === 'SKILL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            기능시험 ({skillCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="시험 검색 (Search e.g. UBT 01)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExams.map((exam) => {
          const isSelected = selectedExamId === exam.id;
          const bestScore = examScores[exam.id] ?? examScores[exam.title];
          const isLocked = isExamLocked(exam.id, exam.title);

          return (
            <div
              key={exam.id}
              className={`border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                isLocked && !isAdmin
                  ? 'bg-slate-900/60 border-rose-500/30'
                  : isSelected
                  ? 'bg-slate-900 border-blue-500 shadow-blue-900/30 ring-2 ring-blue-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    {exam.title.includes('UBT') ? '실전 모의고사' : (exam.title.includes('Chapter') ? '단원별 시험' : '기능 시험')}
                  </span>

                  {/* Lock Badge or Best score badge */}
                  {isLocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30">
                      <Lock className="w-3 h-3 text-rose-400" />
                      <span>{isAdmin ? 'Terkunci (Admin Preview)' : 'Terkunci'}</span>
                    </span>
                  ) : bestScore !== undefined ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                      <Trophy className="w-3 h-3" />
                      <span>최고점: {bestScore}점</span>
                    </span>
                  ) : null}
                </div>

                <h3 className="font-extrabold text-base text-white group-hover:text-blue-400 transition-colors">
                  {exam.title}
                </h3>

                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>{exam.questionsCount || 40}문항</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>50분</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>200점 만점</span>
                  </span>
                </div>

                {/* Locked notice for students */}
                {isLocked && !isAdmin && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
                    <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-tight">
                      <div className="font-bold text-[11px]">Dikunci oleh Guru / Instruktur</div>
                      <div className="text-[10px] text-rose-300/80 mt-0.5">
                        Paket ujian ini belum dibuka oleh pengajar LPK.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {isLocked && !isAdmin ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-500 font-bold text-xs py-2.5 rounded-xl border border-slate-700/50 cursor-not-allowed opacity-70"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Ujian Terkunci (Locked by Instructor)</span>
                </button>
              ) : isLocked && isAdmin ? (
                <button
                  onClick={() => handleStartExamClick(exam)}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 font-bold text-xs py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pratinjau Ujian (Mode Admin)</span>
                </button>
              ) : (
                <button
                  onClick={() => handleStartExamClick(exam)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-blue-900/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>시험 응시하기 (Start UBT)</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
