import React, { useEffect, useState, useRef } from 'react';
import type { ExamResult } from '../types';
import { useAuth } from '../context/authContext';
import {
  Clock,
  Layers,
  BookOpen,
  Award,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  Sparkles,
  Shield,
  ChevronDown,
  LogOut,
  LogIn,
  User as UserIcon,
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';
import { mobileDevice } from '../utils/hapticsAndWakeLock';

interface HeaderProps {
  currentTab: 'exam' | 'study' | 'vocab' | 'history' | 'admin';
  setCurrentTab: (tab: 'exam' | 'study' | 'vocab' | 'history' | 'admin') => void;
  hasActiveExam: boolean;
  examTitle?: string;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isTimerRunning: boolean;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmitExam: () => void;
  answeredCount: number;
  totalQuestions: number;
  onResetExam: () => void;
  isReviewMode?: boolean;
  onExitReview?: () => void;
  examResult?: ExamResult | null;
  onOpenColorVision?: () => void;
  onOpenQuickVocab?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  hasActiveExam,
  examTitle = '2026 UBT - 01',
  timeLeft,
  setTimeLeft,
  isTimerRunning,
  setIsTimerRunning: _setIsTimerRunning,
  onSubmitExam,
  answeredCount: _answeredCount,
  totalQuestions: _totalQuestions,
  onResetExam: _onResetExam,
  isReviewMode = false,
  onExitReview: _onExitReview,
  examResult: _examResult,
  onOpenColorVision,
  onOpenQuickVocab,
}) => {
  const { currentUser, isAdmin, logout, openAuthModal } = useAuth();
  const [isWakeLockOn, setIsWakeLockOn] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundFX.isMuted());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to device wake lock updates
  useEffect(() => {
    const unsub = mobileDevice.subscribeWakeLock((active) => {
      setIsWakeLockOn(active);
    });
    return unsub;
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0 || currentTab !== 'exam') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          soundFX.playWarning();
          onSubmitExam();
          return 0;
        }
        if (prev === 300) {
          // 5 minutes warning
          soundFX.playWarning();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, currentTab, onSubmitExam, setTimeLeft]);

  const toggleWakeLock = async () => {
    mobileDevice.triggerHaptic('tap');
    if (isWakeLockOn) {
      await mobileDevice.releaseWakeLock();
    } else {
      await mobileDevice.acquireWakeLock();
    }
  };

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundFX.setMuted(nextState);
    if (!nextState) {
      soundFX.playSelect();
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimeCritical = timeLeft < 300; // < 5 mins
  const isTimeWarning = timeLeft < 600 && !isTimeCritical; // < 10 mins

  return (
    <>
      {/* Top Main Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Brand & Mode Indicator */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20 shrink-0">
              UBT
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-sm sm:text-base tracking-tight text-white">
                  EPS-TOPIK
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                  HRD 2026
                </span>
                {isAdmin ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    👑 Admin LPK
                  </span>
                ) : (
                  <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    🎓 Murid
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-xs font-medium">
                {currentTab === 'exam' && hasActiveExam ? examTitle : '한국어능력시험 시뮬레이터'}
              </p>
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => {
                soundFX.playNav();
                setCurrentTab('exam');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'exam'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>UBT 모의시험</span>
            </button>

            <button
              onClick={() => {
                soundFX.playNav();
                setCurrentTab('study');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'study'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>교재 학습</span>
            </button>

            <button
              onClick={() => {
                soundFX.playNav();
                setCurrentTab('vocab');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'vocab'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>단어장 (6,008)</span>
            </button>

            <button
              onClick={() => {
                soundFX.playNav();
                setCurrentTab('history');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isAdmin ? '성적표 (Rekap)' : 'Rapor Saya'}</span>
            </button>

            {/* Admin Panel Tab (Visible only if isAdmin) */}
            {isAdmin && (
              <button
                onClick={() => {
                  soundFX.playNav();
                  setCurrentTab('admin');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-sm'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* Right: Tools & Profile Menu */}
          <div className="flex items-center gap-1.5">
            {/* Live Exam Timer (if exam active) */}
            {currentTab === 'exam' && hasActiveExam && !isReviewMode && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-inner ${
                  isTimeCritical
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                    : isTimeWarning
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-blue-400 border-slate-800'
                }`}
                title="남은 시험 시간 (Remaining Time)"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Quick Ishihara Test Launcher */}
            {onOpenColorVision && (
              <button
                onClick={() => {
                  soundFX.playNav();
                  onOpenColorVision();
                }}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                title="색각 검사 (Ishihara Color Blindness Test)"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>색각검사</span>
              </button>
            )}

            {/* Quick Vocab Drawer Launcher */}
            {onOpenQuickVocab && (
              <button
                onClick={() => {
                  soundFX.playNav();
                  onOpenQuickVocab();
                }}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                title="빠른 단어 검색 (Quick Vocabulary)"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>단어</span>
              </button>
            )}

            {/* Screen WakeLock Button */}
            <button
              onClick={toggleWakeLock}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isWakeLockOn
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
              title={isWakeLockOn ? '화면 켜짐 유지 활성' : '화면 꺼짐 방지 켜기'}
            >
              {isWakeLockOn ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline">
                {isWakeLockOn ? '화면유지 ON' : '화면유지'}
              </span>
            </button>

            {/* Audio Feedback Mute Toggle */}
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? '음향 효과 켜기' : '음향 효과 음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => {
                  soundFX.playNav();
                  setIsProfileMenuOpen((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 py-1 px-2 sm:px-2.5 rounded-xl border transition-all cursor-pointer ${
                  isAdmin
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                    : currentUser
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-300 hover:bg-blue-600/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Profil Pengguna & Switch Demo"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-400'
                      : currentUser
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isAdmin ? '👑' : currentUser ? '🎓' : <UserIcon className="w-3.5 h-3.5" />}
                </div>

                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="font-bold text-xs truncate max-w-[90px] text-white">
                    {currentUser?.name || 'Pengguna'}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    {isAdmin ? 'Admin LPK' : 'Murid'}
                  </span>
                </div>

                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Floating Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 text-white flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Info */}
                  <div className="flex items-start gap-2.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
                        isAdmin
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {isAdmin ? '👑' : '🎓'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white truncate">
                        {currentUser?.name || 'Profil Akun'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {currentUser?.email || ''}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block text-[9px] font-black px-2 py-0.2 rounded-full border ${
                            isAdmin
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {isAdmin ? '👑 Admin LPK' : '🎓 Murid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Panel Direct Link (If Admin) */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        soundFX.playNav();
                        setCurrentTab('admin');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Buka Admin Panel (Dashboard)</span>
                    </button>
                  )}



                  {/* Login / Register / Logout Actions */}
                  <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
                    <button
                      onClick={() => {
                        soundFX.playNav();
                        setIsProfileMenuOpen(false);
                        openAuthModal('login');
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5 text-blue-400" />
                      <span>{currentUser ? 'Ganti Akun Lain / Daftar' : 'Masuk / Daftar Akun'}</span>
                    </button>

                    {currentUser && (
                      <button
                        onClick={() => {
                          soundFX.playNav();
                          logout();
                          setIsProfileMenuOpen(false);
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Keluar (Logout)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Native App Style) - only when not in an active exam session */}
      {!hasActiveExam && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around text-[10px] font-bold text-slate-400 shadow-2xl pb-[env(safe-area-inset-bottom,6px)]">
          <button
            onClick={() => {
              soundFX.playNav();
              setCurrentTab('exam');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'exam'
                ? 'text-blue-400 font-extrabold bg-blue-500/10'
                : 'hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>모의시험</span>
          </button>

          <button
            onClick={() => {
              soundFX.playNav();
              setCurrentTab('study');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'study'
                ? 'text-blue-400 font-extrabold bg-blue-500/10'
                : 'hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>교재학습</span>
          </button>

          <button
            onClick={() => {
              soundFX.playNav();
              setCurrentTab('vocab');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'vocab'
                ? 'text-blue-400 font-extrabold bg-blue-500/10'
                : 'hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>단어장</span>
          </button>

          <button
            onClick={() => {
              soundFX.playNav();
              setCurrentTab('history');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'history'
                ? 'text-blue-400 font-extrabold bg-blue-500/10'
                : 'hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isAdmin ? '성적표' : 'Rapor'}</span>
          </button>

          {/* Admin Panel Tab on Mobile if Admin */}
          {isAdmin && (
            <button
              onClick={() => {
                soundFX.playNav();
                setCurrentTab('admin');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'text-amber-400 font-extrabold bg-amber-500/10'
                  : 'hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Admin</span>
            </button>
          )}
        </nav>
      )}
    </>
  );
};
