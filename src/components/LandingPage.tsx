import React from 'react';
import { useAuth } from '../context/authContext';
import {
  Layers,
  Sparkles,
  Eye,
  BookOpen,
  Volume2,
  Shield,
  ArrowRight,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

export const LandingPage: React.FC = () => {
  const { openAuthModal } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20 text-sm">
            UBT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight text-white">
                EPS-TOPIK
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                HRD 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              한국어능력시험 시뮬레이터 (Simulator Ujian Resmi)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              soundFX.playNav();
              openAuthModal('login');
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-blue-400" />
            <span>Masuk</span>
          </button>

          <button
            onClick={() => {
              soundFX.playNav();
              openAuthModal('register');
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftar Akun</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-8 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Glow backdrop effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/30 border border-blue-700/40 text-blue-300 text-xs font-bold mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>STANDAR RESMI HRD KOREA EPS-TOPIK 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight sm:leading-tight max-w-4xl">
          Simulasi Ujian <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">UBT & CBT Korea</span> Terlengkap & Presisi
        </h1>

        <p className="mt-5 text-sm sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Platform pembelajaran dan tryout berbasis komputer (UBT/CBT) untuk calon Pekerja Migran Indonesia (PMI). Dilengkapi 89 paket ujian resmi, audio native speaker, 6.008 kosakata Indonesia, dan sistem evaluasi nilai terpusat.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              soundFX.playSelect();
              openAuthModal('login');
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <span>Masuk ke Simulator Ujian</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundFX.playNav();
              openAuthModal('register');
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>Daftar Akun Baru (Siswa / LPK)</span>
          </button>
        </div>

        {/* Highlight Stats Row */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-left">
            <div className="text-2xl sm:text-3xl font-black text-blue-400">89</div>
            <div className="text-xs font-bold text-white mt-1">Paket Soal Ujian</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Mock Test, Chapter & Skill</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-left">
            <div className="text-2xl sm:text-3xl font-black text-sky-400">6.008</div>
            <div className="text-xs font-bold text-white mt-1">Kosakata Terjemah</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Bahasa Korea - Indonesia</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-left">
            <div className="text-2xl sm:text-3xl font-black text-indigo-400">100%</div>
            <div className="text-xs font-bold text-white mt-1">Audio Native Korean</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Listening & Opsi Soal</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-left">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">Multi-Role</div>
            <div className="text-xs font-bold text-white mt-1">Guru LPK & Siswa</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Kunci Paket & Rekap Nilai</div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Fitur Lengkap Sesuai Standar Ujian Asli HRD Korea
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Dirancang khusus dengan antarmuka presisi layar tablet UBT untuk melatih mental dan kecepatan peserta ujian.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">89 Paket Ujian Lengkap</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mencakup 57 paket 2026 UBT Mock Tests, 26 paket Chapter Tests (Bab 1–60), dan 6 paket Ujian Keterampilan Kejuruan (Skill Tests) dengan total 3.560 butir soal.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Volume2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Audio Listening Asli & Seekable</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pemutar audio listening vokal asli penutur bahasa Korea lengkap dengan kontrol volume, timer otomatis, pemutaran ulang per bagian, dan tombol audio opsi soal.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">6.008 Bank Kosakata Indonesia</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Basis data kosakata lengkap dengan arti Bahasa Indonesia murni, filter tingkat kesulitan (Beginner, Intermediate, Advanced), mode Flashcard 3D, dan Mini Kuis.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Tes Buta Warna Ishihara</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              15 Plat Ishihara simulasi seleksi medis pra-ujian HRD Korea untuk memastikan kesiapan fisik calon pekerja sebelum mengikuti ujian resmi di Balai Layanan.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Odap Note (Buku Soal Salah)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pencatatan otomatis seluruh soal yang salah dijawab peserta saat ujian untuk dipelajari kembali (*review mode*) hingga pemahaman materi tuntas sempurna.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Role LPK & Siswa</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Akses khusus instruktur LPK untuk mengunci paket ujian (*lock/unlock*), memantau peringkat nilai siswa, serta mengevaluasi tingkat kelulusan kelas.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-8">
            Alur Pengerjaan Ujian Standar HRD Korea
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
                1
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Masuk Akun</h4>
              <p className="text-xs text-slate-400">
                Login akun Siswa atau Instruktur LPK untuk mengaktifkan sesi.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
                2
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Tes Buta Warna</h4>
              <p className="text-xs text-slate-400">
                Lakukan verifikasi plat warna Ishihara sebelum memulai soal.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
                3
              </div>
              <h4 className="text-sm font-bold text-white mt-1">40 Butir Soal</h4>
              <p className="text-xs text-slate-400">
                Kerjakan 20 soal Reading & 20 soal Listening dalam waktu 50 menit.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
                4
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Rapor & Odap Note</h4>
              <p className="text-xs text-slate-400">
                Nilai langsung keluar, tersimpan di rapor, dan soal salah dapat direview.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-8 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">EPS-TOPIK UBT Simulator</span>
            <span>•</span>
            <span>Standardized Computer Based Testing</span>
          </div>
          <div>
            Dikembangkan untuk LPK & Calon Pekerja Migran Indonesia (PMI) ke Korea Selatan
          </div>
        </div>
      </footer>
    </div>
  );
};
