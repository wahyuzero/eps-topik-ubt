import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import type { ExamManifestItem, ExamResult, UserRole } from '../types';
import {
  Shield,
  Users,
  Award,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Search,
  Download,
  RotateCcw,
  UserCheck,
  GraduationCap,
  Sparkles,
  Eye,
  Trash2,
  Calendar,
  Clock,
  UserPlus,
  TrendingUp,
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface AdminDashboardProps {
  exams: ExamManifestItem[];
  onReviewResult: (result: ExamResult) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  exams,
  onReviewResult,
}) => {
  const {
    currentUser,
    isAdmin,
    users,
    updateUserRole,
    resetStudentProgress,
    deleteUser,
    lockedExamIds,
    toggleLockExam,
    isExamLocked,
    setAllExamsLocked,
    addUser,
  } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<'scores' | 'exams' | 'users'>('scores');

  // Filter & Search states
  const [scoreSearch, setScoreSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');

  const [examSearch, setExamSearch] = useState('');
  const [examLockFilter, setExamLockFilter] = useState<'ALL' | 'LOCKED' | 'UNLOCKED'>('ALL');

  const [userSearch, setUserSearch] = useState('');

  // Add user modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('siswa123');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');
  const [addUserMsg, setAddUserMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Read exam history from localStorage with reactive state
  const [history, setHistory] = useState<ExamResult[]>(() => {
    try {
      const saved = localStorage.getItem('ubt_exam_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const reloadHistory = () => {
    try {
      const saved = localStorage.getItem('ubt_exam_history');
      setHistory(saved ? JSON.parse(saved) : []);
    } catch {
      setHistory([]);
    }
  };

  // Listen to history updates
  React.useEffect(() => {
    const handleUpdate = () => reloadHistory();
    window.addEventListener('ubt-history-updated', handleUpdate);
    return () => window.removeEventListener('ubt-history-updated', handleUpdate);
  }, []);

  // If not admin, render access denied guard with instant switch button
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-6 my-12 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-2xl flex flex-col items-center gap-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Akses Terbatas: Hanya untuk Admin / Guru LPK</h2>
        <p className="text-sm text-slate-400 max-w-md">
          Halaman ini khusus untuk manajemen siswa, pemantauan rapor nilai kelas, dan pengaturan akses paket ujian UBT.
        </p>
        <div className="mt-2 text-xs text-slate-500">
          Silakan hubungi administrator institusi jika Anda membutuhkan hak akses instruktur.
        </div>
      </div>
    );
  }

  // Analytics Computations
  const totalStudents = users.filter((u) => u.role === 'student').length;
  const totalExamsTaken = history.length;
  const passedExams = history.filter((h) => h.passed).length;
  const passingRate = totalExamsTaken > 0 ? Math.round((passedExams / totalExamsTaken) * 100) : 0;
  const averageScore =
    totalExamsTaken > 0
      ? Math.round(history.reduce((acc, h) => acc + h.totalScore, 0) / totalExamsTaken)
      : 0;

  // Filtered Exam History Scores
  const filteredHistory = history.filter((item) => {
    const student = item.studentName || 'Siswa';
    const email = item.userEmail || '';
    const exam = item.examTitle || '';
    const matchSearch =
      student.toLowerCase().includes(scoreSearch.toLowerCase()) ||
      email.toLowerCase().includes(scoreSearch.toLowerCase()) ||
      exam.toLowerCase().includes(scoreSearch.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter === 'PASSED') return item.passed;
    if (statusFilter === 'FAILED') return !item.passed;
    return true;
  });

  // Filtered Exams for Lock Management
  const filteredExams = exams.filter((exam) => {
    const matchSearch = exam.title.toLowerCase().includes(examSearch.toLowerCase());
    if (!matchSearch) return false;

    const isLocked = isExamLocked(exam.id, exam.title);
    if (examLockFilter === 'LOCKED') return isLocked;
    if (examLockFilter === 'UNLOCKED') return !isLocked;
    return true;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  });

  // Export CSV function
  const handleExportCSV = () => {
    soundFX.playSelect();
    const headers = ['Nama Siswa', 'Email', 'Paket Ujian', 'Tanggal', 'Reading', 'Listening', 'Total Skor', 'Status'];
    const rows = filteredHistory.map((h) => [
      `"${h.studentName || 'Siswa'}"`,
      `"${h.userEmail || '-'}"`,
      `"${h.examTitle}"`,
      `"${new Date(h.completedAt).toLocaleString()}"`,
      h.readingScore,
      h.listeningScore,
      h.totalScore,
      h.passed ? 'LULUS' : 'GAGAL',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_nilai_ubt_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSingleHistory = (index: number) => {
    if (!window.confirm('Hapus baris rekap ujian ini?')) return;
    const copy = [...history];
    copy.splice(index, 1);
    setHistory(copy);
    localStorage.setItem('ubt_exam_history', JSON.stringify(copy));
    window.dispatchEvent(new Event('ubt-history-updated'));
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserMsg(null);
    const res = addUser(newUserName, newUserEmail, newUserPass, newUserRole);
    if (res.success) {
      soundFX.playComplete();
      setAddUserMsg({ text: 'Akun berhasil ditambahkan!', error: false });
      setNewUserName('');
      setNewUserEmail('');
      setTimeout(() => {
        setShowAddUserModal(false);
        setAddUserMsg(null);
      }, 1200);
    } else {
      soundFX.playWarning();
      setAddUserMsg({ text: res.error || 'Gagal membuat akun.', error: true });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>ADMIN & INSTRUKTUR PANEL</span>
            </span>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
              LPK EPS-TOPIK
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard Manajemen UBT & Rekap Siswa
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Kelola akses pembukaan paket soal, pantau rekapitulasi nilai seluruh murid, evaluasi passing rate, dan manajemen pengguna.
          </p>
        </div>

        {/* Current Admin Badge */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shrink-0 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black border border-amber-500/30">
            👑
          </div>
          <div>
            <div className="text-xs font-black text-white">{currentUser?.name}</div>
            <div className="text-[11px] text-amber-400 font-semibold">{currentUser?.email}</div>
            <div className="text-[10px] text-slate-400">Instruktur Utama LPK</div>
          </div>
        </div>
      </div>

      {/* 4 Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Siswa Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalStudents}</div>
          <div className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
            <span>Terdaftar di platform</span>
          </div>
        </div>

        {/* Card 2: Exams Completed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Ujian Dikerjakan</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalExamsTaken}</div>
          <div className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
            <span>Sesi latihan selesai</span>
          </div>
        </div>

        {/* Card 3: Passing Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tingkat Kelulusan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{passingRate}%</div>
          <div className="text-[11px] text-slate-400 font-medium">
            {passedExams} dari {totalExamsTaken} lulus (≥ 110 poin)
          </div>
        </div>

        {/* Card 4: Average Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Rata-rata Skor</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {averageScore} <span className="text-xs font-bold text-slate-500">/ 200</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Nilai rata-rata seluruh peserta</div>
        </div>
      </div>

      {/* Admin Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => {
            soundFX.playNav();
            setActiveAdminTab('scores');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
            activeAdminTab === 'scores'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Tabel Rekap Nilai Siswa ({filteredHistory.length})</span>
        </button>

        <button
          onClick={() => {
            soundFX.playNav();
            setActiveAdminTab('exams');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
            activeAdminTab === 'exams'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Manajemen Akses Paket ({lockedExamIds.length} Terkunci)</span>
        </button>

        <button
          onClick={() => {
            soundFX.playNav();
            setActiveAdminTab('users');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Akun Siswa ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: REKAP NILAI SISWA */}
      {activeAdminTab === 'scores' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa atau paket ujian..."
                value={scoreSearch}
                onChange={(e) => setScoreSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status Filter & Export Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('PASSED')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'PASSED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lulus
                </button>
                <button
                  onClick={() => setStatusFilter('FAILED')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'FAILED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gagal
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                title="Unduh Rekap CSV"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {filteredHistory.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Award className="w-10 h-10 text-slate-600" />
              <div className="font-bold text-sm text-slate-300">Tidak ada data rekap nilai</div>
              <div className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau filter status.</div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 font-bold">Nama Siswa</th>
                      <th className="px-4 py-3.5 font-bold">Paket Ujian</th>
                      <th className="px-4 py-3.5 font-bold">Tanggal</th>
                      <th className="px-4 py-3.5 font-bold text-center">Reading</th>
                      <th className="px-4 py-3.5 font-bold text-center">Listening</th>
                      <th className="px-4 py-3.5 font-bold text-center">Total Skor</th>
                      <th className="px-4 py-3.5 font-bold text-center">Status</th>
                      <th className="px-4 py-3.5 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredHistory.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                            <span>{h.studentName || 'Peserta'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {h.userEmail || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-200">{h.examTitle}</td>
                        <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{new Date(h.completedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{Math.round(h.timeSpentSeconds / 60)} menit</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-sky-400">
                          {h.readingScore} <span className="text-[10px] text-slate-500">/ 100</span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-indigo-400">
                          {h.listeningScore} <span className="text-[10px] text-slate-500">/ 100</span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-black text-white text-sm">
                          {h.totalScore}
                          <span className="text-[10px] text-slate-500 font-normal"> / 200</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                              h.passed
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {h.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{h.passed ? 'LULUS' : 'GAGAL'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                soundFX.playNav();
                                onReviewResult(h);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                              title="Review Lembar Jawab"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">Review</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSingleHistory(idx)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] transition-all cursor-pointer"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAJEMEN AKSES PAKET UJIAN (LOCK/UNLOCK) */}
      {activeAdminTab === 'exams' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari paket ujian (contoh: UBT 01)..."
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter & Bulk Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setExamLockFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    examLockFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({exams.length})
                </button>
                <button
                  onClick={() => setExamLockFilter('LOCKED')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    examLockFilter === 'LOCKED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Terkunci ({lockedExamIds.length})
                </button>
                <button
                  onClick={() => setExamLockFilter('UNLOCKED')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    examLockFilter === 'UNLOCKED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Terbuka ({exams.length - lockedExamIds.length})
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundFX.playSelect();
                    setAllExamsLocked(
                      exams.map((e) => e.id),
                      false
                    );
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buka Semua</span>
                </button>

                <button
                  onClick={() => {
                    soundFX.playWarning();
                    setAllExamsLocked(
                      exams.map((e) => e.id),
                      true
                    );
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Kunci Semua</span>
                </button>
              </div>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredExams.map((exam) => {
              const isLocked = isExamLocked(exam.id, exam.title);

              return (
                <div
                  key={exam.id}
                  className={`border rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all ${
                    isLocked
                      ? 'bg-rose-950/20 border-rose-500/30 shadow-rose-950/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                          {exam.category || 'Mock Exam'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {exam.id}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white">{exam.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {exam.questionsCount || 40} Soal · 50 Menit · 200 Poin
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 shrink-0 ${
                        isLocked
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{isLocked ? 'Terkunci' : 'Terbuka'}</span>
                    </div>
                  </div>

                  {/* Toggle Lock Button */}
                  <button
                    onClick={() => {
                      soundFX.playSelect();
                      toggleLockExam(exam.id);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border ${
                      isLocked
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40 shadow-sm shadow-emerald-900/30'
                        : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Buka Akses Siswa (Unlock)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Kunci Paket Ujian (Lock)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MANAJEMEN AKUN SISWA */}
      {activeAdminTab === 'users' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau email siswa..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={() => {
                soundFX.playSelect();
                setShowAddUserModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-900/20 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Siswa / Admin Baru</span>
            </button>
          </div>

          {/* User List Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Profil Pengguna</th>
                    <th className="px-4 py-3.5 font-bold">Role Status</th>
                    <th className="px-4 py-3.5 font-bold">Tanggal Terdaftar</th>
                    <th className="px-4 py-3.5 font-bold text-center">Ujian Dikerjakan</th>
                    <th className="px-4 py-3.5 font-bold text-right">Manajemen Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredUsers.map((u) => {
                    const userExamCount = history.filter(
                      (h) => h.userId === u.id || (h.userEmail && h.userEmail.toLowerCase() === u.email.toLowerCase())
                    ).length;
                    const isSelf = currentUser?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div>{u.name} {isSelf && <span className="text-[10px] text-amber-400 font-normal">(Anda)</span>}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            {u.role === 'admin' ? '👑 Admin LPK' : '🎓 Murid'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-white">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200">
                            {userExamCount} sesi
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Toggle Role Button */}
                            <button
                              onClick={() => {
                                soundFX.playSelect();
                                const nextRole: UserRole = u.role === 'admin' ? 'student' : 'admin';
                                updateUserRole(u.id, nextRole);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                              title="Ubah Role Akun"
                            >
                              <UserCheck className="w-3 h-3 text-amber-400" />
                              <span>{u.role === 'admin' ? 'Jadikan Siswa' : 'Jadikan Admin'}</span>
                            </button>

                            {/* Reset Progress Button */}
                            <button
                              onClick={() => {
                                soundFX.playWarning();
                                if (
                                  window.confirm(
                                    `Reset seluruh riwayat nilai dan ujian untuk ${u.name}? Tindakan ini tidak dapat dibatalkan.`
                                  )
                                ) {
                                  resetStudentProgress(u.id);
                                  reloadHistory();
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                              title="Hapus rapor siswa ini"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-400" />
                              <span>Reset Progres</span>
                            </button>

                            {/* Delete User Button (Disabled for self) */}
                            {!isSelf && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus akun ${u.name}?`)) {
                                    deleteUser(u.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                                title="Hapus Akun Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Tambah Pengguna Baru</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {addUserMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${
                  addUserMsg.error
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {addUserMsg.text}
              </div>
            )}

            <form onSubmit={handleAddNewUser} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dewi Lestari"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="dewi@epstopik.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Peran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserRole('student')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      newUserRole === 'student'
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Murid
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserRole('admin')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      newUserRole === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Admin LPK
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Simpan Akun
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
