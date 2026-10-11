import React, { useState } from 'react';
import type { ExamResult } from '../types';
import { useAuth } from '../context/authContext';
import {
  Trophy,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Eye,
  Trash2,
  Sparkles,
  Search,
  BookOpen,
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface ExamHistoryViewProps {
  history: ExamResult[];
  onReviewResult: (result: ExamResult) => void;
  onClearHistory: () => void;
  onOpenOdapNote?: () => void;
}

export const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  history,
  onReviewResult,
  onClearHistory,
  onOpenOdapNote,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');

  // Filter history based on role:
  // - If student: filter to current user's exams (by id or email)
  // - If admin: show all exams (with indicator)
  // - If guest: show guest exams or prompt
  const userHistory = history.filter((item) => {
    if (isAdmin) return true;
    if (currentUser) {
      return (
        item.userId === currentUser.id ||
        (item.userEmail && item.userEmail.toLowerCase() === currentUser.email.toLowerCase())
      );
    }
    // Guest only sees exams taken in guest session
    return !item.userId || item.userId === 'guest' || item.userEmail === 'tamu@epstopik.com';
  });

  // Filter by search & pass/fail
  const filteredHistory = userHistory.filter((item) => {
    const matchesSearch = item.examTitle.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'PASSED') return item.passed;
    if (statusFilter === 'FAILED') return !item.passed;
    return true;
  });

  // Analytics for the current student
  const totalExams = userHistory.length;
  const passedCount = userHistory.filter((h) => h.passed).length;
  const passingRate = totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0;
  const bestScore = totalExams > 0 ? Math.max(...userHistory.map((h) => h.totalScore)) : 0;
  const avgTotal =
    totalExams > 0 ? Math.round(userHistory.reduce((acc, h) => acc + h.totalScore, 0) / totalExams) : 0;
  const avgReading =
    totalExams > 0 ? Math.round(userHistory.reduce((acc, h) => acc + h.readingScore, 0) / totalExams) : 0;
  const avgListening =
    totalExams > 0 ? Math.round(userHistory.reduce((acc, h) => acc + h.listeningScore, 0) / totalExams) : 0;

  // Weakness Analysis Message
  const getWeaknessInsight = () => {
    if (totalExams === 0) {
      return 'Selesaikan minimal 1 sesi ujian untuk melihat diagnosis kelemahan materi.';
    }
    const diff = avgReading - avgListening;
    if (diff < -5) {
      return '💡 Kelemahan Terdeteksi: Nilai Reading Anda lebih rendah dari Listening. Tingkatkan hafalan kosakata umum (단어) dan tata bahasa kalimat panjang.';
    } else if (diff > 5) {
      return '💡 Kelemahan Terdeteksi: Nilai Listening Anda lebih rendah dari Reading. Biasakan mendengar audio percakapan kerja (듣기) berulang kali.';
    } else {
      return '🎯 Performa Seimbang: Kemampuan Reading dan Listening Anda seimbang. Pertahankan ritme pengerjaan soal simulasi UBT!';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">


      {/* Admin View Notice */}
      {isAdmin && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-amber-300">
          <span className="font-semibold">
            👑 Mode Admin LPK: Menampilkan rekap seluruh murid. Akses tab [Admin Panel] untuk fitur manajemen lengkap.
          </span>
        </div>
      )}

      {/* Profile & Score Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20 shrink-0">
            {currentUser ? currentUser.name.charAt(0) : 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {currentUser ? currentUser.name : 'Rapor Peserta Ujian'}
              </h2>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {isAdmin ? '👑 Admin' : '🎓 Murid EPS-TOPIK'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {currentUser ? currentUser.email : 'Simulasi UBT HRD Korea'} · LPK Simulator
            </p>
          </div>
        </div>

        {totalExams > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Hapus seluruh riwayat ujian Anda di browser ini?')) {
                onClearHistory();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Riwayat</span>
          </button>
        )}
      </div>

      {/* Analytics Overview Cards (Reading vs Listening, Passing Rate) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Exams */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
          <span className="text-xs font-bold text-slate-400">Total Ujian Selesai</span>
          <div className="text-2xl font-black text-white">{totalExams}</div>
          <span className="text-[10px] text-slate-500">Sesi latihan dikerjakan</span>
        </div>

        {/* Card 2: Best Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
          <span className="text-xs font-bold text-slate-400">Skor Tertinggi</span>
          <div className="text-2xl font-black text-amber-300 flex items-center gap-1">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>{bestScore}</span>
            <span className="text-xs text-slate-500 font-normal">/ 200</span>
          </div>
          <span className="text-[10px] text-slate-500">Poin maksimal yang diraih</span>
        </div>

        {/* Card 3: Average Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
          <span className="text-xs font-bold text-slate-400">Rata-rata Skor</span>
          <div className="text-2xl font-black text-blue-400">
            {avgTotal} <span className="text-xs text-slate-500 font-normal">/ 200</span>
          </div>
          <span className="text-[10px] text-slate-500">Benchmark kelulusan: 110</span>
        </div>

        {/* Card 4: Passing Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1.5 shadow-md">
          <span className="text-xs font-bold text-slate-400">Tingkat Kelulusan</span>
          <div className="text-2xl font-black text-emerald-400">{passingRate}%</div>
          <span className="text-[10px] text-slate-500">{passedCount} dari {totalExams} lulus</span>
        </div>
      </div>

      {/* Weakness Analytics & Odap Note Insight */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="font-extrabold text-sm sm:text-base text-white">
              Analitik Kelemahan Belajar (Reading vs Listening)
            </h3>
          </div>
          {onOpenOdapNote && (
            <button
              onClick={() => {
                soundFX.playNav();
                onOpenOdapNote();
              }}
              className="text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              <span>Buka Catatan Soal Salah (Odap Note)</span>
            </button>
          )}
        </div>

        {/* Reading vs Listening Visual Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reading */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-sky-300">읽기 (Reading / Membaca)</span>
              <span className="text-white font-black">{avgReading} / 100</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, avgReading)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400">Soal No 1 - 20 (Kosakata, Gambar, Tata Bahasa)</span>
          </div>

          {/* Listening */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigo-300">듣기 (Listening / Mendengar)</span>
              <span className="text-white font-black">{avgListening} / 100</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, avgListening)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400">Soal No 21 - 40 (Audio Soal & Percakapan 2x Putar)</span>
          </div>
        </div>

        {/* Diagnosis Note */}
        <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs text-blue-200 leading-relaxed">
          {getWeaknessInsight()}
        </div>
      </div>

      {/* Filter and Search Bar for Exam History */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari riwayat ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl transition-colors ${
              statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({userHistory.length})
          </button>
          <button
            onClick={() => setStatusFilter('PASSED')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl transition-colors ${
              statusFilter === 'PASSED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lulus ({userHistory.filter((h) => h.passed).length})
          </button>
          <button
            onClick={() => setStatusFilter('FAILED')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl transition-colors ${
              statusFilter === 'FAILED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gagal ({userHistory.filter((h) => !h.passed).length})
          </button>
        </div>
      </div>

      {/* Exam List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
          <Trophy className="w-12 h-12 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-300">Belum ada riwayat ujian yang sesuai</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Buka menu [UBT 모의시험] dan pilih salah satu paket ujian untuk memulai pengerjaan 40 soal.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredHistory.map((item, idx) => {
            const percentage = Math.round((item.correctCount / item.totalQuestions) * 100);
            const mins = Math.floor(item.timeSpentSeconds / 60);
            const secs = item.timeSpentSeconds % 60;

            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      item.passed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {item.passed ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-white">{item.examTitle}</h4>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          item.passed
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {item.passed ? '합격 (LULUS)' : '불합격 (GAGAL)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(item.completedAt).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{mins}분 {secs}초 소요</span>
                      </span>
                      <span className="text-blue-400 font-semibold">
                        정답률: {percentage}% ({item.correctCount}/{item.totalQuestions})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                  {/* Scores breakdown */}
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">
                      {item.totalScore} <span className="text-xs font-bold text-slate-500">/ 200점</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      읽기: {item.readingScore}점 | 듣기: {item.listeningScore}점
                    </div>
                  </div>

                  {/* Review Button */}
                  <button
                    onClick={() => {
                      soundFX.playNav();
                      onReviewResult(item);
                    }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review Jawaban</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
