import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuestionCard } from './components/QuestionCard';
import { QuestionPalette } from './components/QuestionPalette';
import { QuestionPaletteBottomSheet } from './components/QuestionPaletteBottomSheet';
import { ResultModal } from './components/ResultModal';
import { ExamSelector } from './components/ExamSelector';
import { StudyMaterialsView } from './components/StudyMaterialsView';
import { VocabularyView } from './components/VocabularyView';
import { ExamHistoryView } from './components/ExamHistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/authContext';
import { ColorVisionModal, type ColorVisionPlate } from './components/ColorVisionModal';
import { OdapNoteModal } from './components/OdapNoteModal';
import { QuickVocabDrawer } from './components/QuickVocabDrawer';
import type { Question, ExamOption, ExamManifestItem, ExamResult } from './types';
import { soundFX } from './utils/soundEffects';
import { mobileDevice } from './utils/hapticsAndWakeLock';
import { ArrowLeft, ArrowRight, CheckCircle2, Menu, Eye, Sparkles, BookOpen } from 'lucide-react';

interface RawColorVisionItem {
  id?: string;
  answer?: string;
  imageFile?: {
    presignedUrl?: string;
    url?: string;
  };
}

const UbtApp: React.FC = () => {
  const { currentUser, isAdmin, isExamLocked } = useAuth();

  // Navigation tabs (safe computed tab: if not admin, fallback to 'exam' when 'admin' tab is selected)
  const [selectedTab, setSelectedTab] = useState<'exam' | 'study' | 'vocab' | 'history' | 'admin'>('exam');
  const currentTab = !isAdmin && selectedTab === 'admin' ? 'exam' : selectedTab;

  // Exam list & Active Exam
  const [examList, setExamList] = useState<ExamManifestItem[]>([]);
  const [activeExam, setActiveExam] = useState<ExamManifestItem | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());

  // Timer: 50 mins = 3000 seconds
  const [timeLeft, setTimeLeft] = useState<number>(3000);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Results & Review
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  // Mobile Drawers and Modals
  const [showPaletteSheet, setShowPaletteSheet] = useState<boolean>(false);
  const [showColorVisionModal, setShowColorVisionModal] = useState<boolean>(false);
  const [showOdapNoteModal, setShowOdapNoteModal] = useState<boolean>(false);
  const [showQuickVocabDrawer, setShowQuickVocabDrawer] = useState<boolean>(false);
  const [colorVisionPlates, setColorVisionPlates] = useState<ColorVisionPlate[]>([]);

  // History & Best scores from localStorage
  const [history, setHistory] = useState<ExamResult[]>(() => {
    try {
      const saved = localStorage.getItem('ubt_exam_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Listen to external history sync events
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('ubt_exam_history');
        setHistory(saved ? JSON.parse(saved) : []);
      } catch {
        // ignore
      }
    };
    window.addEventListener('ubt-history-updated', handleSync);
    return () => window.removeEventListener('ubt-history-updated', handleSync);
  }, []);

  function loadFallbackExams() {
    // Generate fallback mock exams list
    const mockExams: ExamManifestItem[] = [];
    for (let i = 1; i <= 57; i++) {
      const numStr = String(i).padStart(2, '0');
      mockExams.push({
        id: `ubt-2026-${numStr}`,
        title: `2026 UBT - ${numStr}`,
        category: '2026_UBT_Mock_Tests',
        duration: 50,
        questionsCount: 40,
        path: `exams/2026_UBT_Mock_Tests/${numStr}_2026_UBT_-_${numStr}`,
        hasAudio: true,
        hasImages: true,
      });
    }
    setExamList(mockExams);
  }

  // Load exam list from bank or fallback
  useEffect(() => {
    fetch('/bank/manifest.json', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.exams && data.exams.length > 0) {
          setExamList(data.exams);
        } else {
          loadFallbackExams();
        }
      })
      .catch(() => {
        loadFallbackExams();
      });
  }, []);

  // Helper to map questions with audio/image options and listening audio
  const mapExamQuestions = (rawQuestions: Question[], examPath: string): Question[] => {
    return rawQuestions.map((q: Question) => {
      const qNum = q.questionNumber;
      const isListening = Boolean(q.listening) || q.questionType?.code === 'KO_LISTENING' || qNum > 20;
      const hasImage = Boolean(q.descriptionFile);
      return {
        ...q,
        imagePath: hasImage ? `/bank/${examPath}/images/q_${String(qNum).padStart(2, '0')}.png` : undefined,
        audioPath: isListening ? `/bank/${examPath}/audio/q_${String(qNum).padStart(2, '0')}.mp3` : undefined,
        options: q.options?.map((opt: ExamOption) => {
          const isAudioOpt = opt.type === 'audio' || opt.file?.contentType === 'audio/mpeg';
          const isImgOpt = opt.type === 'img' || opt.file?.contentType === 'image/png';
          const localPath = opt.file
            ? `/bank/${examPath}/images/q_${String(qNum).padStart(2, '0')}_opt_${opt.optionNumber}.${isAudioOpt ? 'mp3' : 'png'}`
            : undefined;
          return {
            ...opt,
            imagePath: isImgOpt ? localPath : undefined,
            audioPath: isAudioOpt ? localPath : undefined,
          };
        }),
      };
    });
  };

  // Select and load an exam
  const handleSelectExam = (exam: ExamManifestItem) => {
    if (isExamLocked(exam.id, exam.title) && !isAdmin) {
      soundFX.playWarning();
      return;
    }
    setActiveExam(exam);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setMarkedForReview(new Set());
    setTimeLeft(50 * 60);
    setIsTimerRunning(true);
    setIsReviewMode(false);
    setExamResult(null);

    // Auto-acquire wake lock for the 50-minute exam session
    mobileDevice.acquireWakeLock();

    // Try to fetch exam.json from public/bank
    const jsonPath = `/bank/${exam.path}/exam.json`;
    fetch(jsonPath, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Not cached locally yet');
        return res.json();
      })
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(mapExamQuestions(data.questions, exam.path));
        } else {
          generateSampleQuestions(exam.title);
        }

        // Map authentic Ishihara color vision plates from exam data
        if (data.colorVisionQuestions && Array.isArray(data.colorVisionQuestions)) {
          setColorVisionPlates(
            data.colorVisionQuestions.map((cv: RawColorVisionItem, idx: number) => ({
              id: cv.id || `cv-${idx + 1}`,
              plateNumber: idx + 1,
              answer: cv.answer || '',
              imagePath: `/bank/${exam.path}/images/color_vision_${idx + 1}.png`,
              fallbackUrl: cv.imageFile?.presignedUrl || cv.imageFile?.url,
            }))
          );
        } else {
          setColorVisionPlates([]);
        }
      })
      .catch(() => {
        generateSampleQuestions(exam.title);
        setColorVisionPlates([]);
      });
  };

  // Review a previously completed exam from history or results
  const handleReviewExam = async (result: ExamResult) => {
    let currentExamList = examList;
    if (currentExamList.length === 0) {
      try {
        const res = await fetch('/bank/manifest.json', { cache: 'no-store' });
        const data = await res.json();
        if (data.exams && data.exams.length > 0) {
          currentExamList = data.exams;
          setExamList(data.exams);
        }
      } catch (err) {
        console.error('Failed to load manifest for review:', err);
      }
    }

    let targetExam = currentExamList.find(
      (e) => e.id === result.examId || e.title === result.examTitle
    );

    if (!targetExam) {
      const numMatch = result.examTitle?.match(/\d+/) || result.examId?.match(/\d+/);
      const numStr = numMatch ? numMatch[0].padStart(2, '0') : '01';
      const folderNum = String(parseInt(numStr, 10) + 2).padStart(2, '0');
      targetExam = {
        id: result.examId,
        title: result.examTitle,
        category: 'Exams',
        duration: 50,
        questionsCount: result.totalQuestions || 40,
        path: `exams/2026_UBT_Mock_Tests/${folderNum}_2026_UBT_-_${numStr}`,
        hasAudio: true,
        hasImages: true,
      };
    }

    setActiveExam(targetExam);
    setAnswers(result.answers || {});
    setExamResult(result);
    setIsReviewMode(true);
    setIsTimerRunning(false);
    setShowResultModal(false);
    setCurrentQuestionIndex(0);
    setSelectedTab('exam');

    const jsonPath = `/bank/${targetExam.path}/exam.json`;
    try {
      const res = await fetch(jsonPath, { cache: 'no-store' });
      if (!res.ok) throw new Error('Not cached locally yet');
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(mapExamQuestions(data.questions, targetExam.path));
      } else {
        generateSampleQuestions(targetExam.title);
      }

      if (data.colorVisionQuestions && Array.isArray(data.colorVisionQuestions)) {
        setColorVisionPlates(
          data.colorVisionQuestions.map((cv: RawColorVisionItem, idx: number) => ({
            id: cv.id || `cv-${idx + 1}`,
            plateNumber: idx + 1,
            answer: cv.answer || '',
            imagePath: `/bank/${targetExam.path}/images/color_vision_${idx + 1}.png`,
            fallbackUrl: cv.imageFile?.presignedUrl || cv.imageFile?.url,
          }))
        );
      }
    } catch {
      generateSampleQuestions(targetExam.title);
    }
  };

  // Generate standard 40-question UBT dataset
  const generateSampleQuestions = (title: string) => {
    const list: Question[] = [];
    for (let i = 1; i <= 40; i++) {
      const isReading = i <= 20;
      const ans = String((i % 4) + 1);
      list.push({
        id: `q-${i}`,
        questionNumber: i,
        mainHeading: isReading
          ? `[${title}] [${i <= 4 ? '1~4' : `${i}`}] 다음 그림을 보고 맞는 단어나 문장을 고르십시오.`
          : `[${title}] [${i <= 24 ? '21~24' : `${i}`}] 들은 것을 고르십시오. (듣기 평가)`,
        descriptionText: isReading
          ? i > 4
            ? `[보기] 다음 글을 읽고 무엇에 대한 글인지 고르십시오.\n\n한국에서는 식사를 할 때 밥과 국, 그리고 여러 가지 반찬을 함께 먹습니다.`
            : ''
          : '음원을 듣고 알맞은 답을 선택하세요.',
        options: [
          { id: `opt-1`, optionNumber: 1, text: isReading ? '의자입니다.' : '가방' },
          { id: `opt-2`, optionNumber: 2, text: isReading ? '책상입니다.' : '공책' },
          { id: `opt-3`, optionNumber: 3, text: isReading ? '컴퓨터입니다.' : '지갑' },
          { id: `opt-4`, optionNumber: 4, text: isReading ? '연필입니다.' : '볼펜' },
        ],
        answer: ans,
        questionType: {
          id: isReading ? 'reading' : 'listening',
          name: isReading ? 'Reading' : 'Listening',
          code: isReading ? 'KO_READING' : 'KO_LISTENING',
          language: 'ko',
        },
      });
    }
    setQuestions(list);
  };

  // Answer selection
  const handleSelectOption = (optionNumber: number) => {
    if (isReviewMode) return;
    const qNum = questions[currentQuestionIndex]?.questionNumber;
    if (!qNum) return;
    setAnswers((prev) => ({
      ...prev,
      [qNum]: optionNumber,
    }));
  };

  // Toggle review mark
  const handleToggleReview = () => {
    const qNum = questions[currentQuestionIndex]?.questionNumber;
    if (!qNum) return;
    setMarkedForReview((prev) => {
      const copy = new Set(prev);
      if (copy.has(qNum)) copy.delete(qNum);
      else copy.add(qNum);
      return copy;
    });
  };

  // Submit and grade exam
  const handleSubmitExam = () => {
    setIsTimerRunning(false);
    mobileDevice.releaseWakeLock();
    let readingScore = 0;
    let listeningScore = 0;
    let correctCount = 0;

    questions.forEach((q) => {
      const userAns = answers[q.questionNumber];
      const correctAns = parseInt(q.answer || '1', 10);
      if (userAns === correctAns) {
        correctCount += 1;
        if (q.questionNumber <= 20) {
          readingScore += 5; // 20 * 5 = 100
        } else {
          listeningScore += 5; // 20 * 5 = 100
        }
      }
    });

    const totalScore = readingScore + listeningScore; // Max 200
    const passed = totalScore >= 110; // 55% passing benchmark
    const timeSpent = 3000 - timeLeft;

    const result: ExamResult = {
      examId: activeExam?.id || 'exam-1',
      examTitle: activeExam?.title || '2026 UBT Mock Test',
      totalQuestions: questions.length,
      answeredCount: Object.keys(answers).length,
      correctCount,
      totalScore,
      readingScore,
      listeningScore,
      passed,
      timeSpentSeconds: timeSpent,
      answers,
      completedAt: new Date().toISOString(),
      userId: currentUser?.id,
      studentName: currentUser?.name || 'Peserta Tamu',
      userEmail: currentUser?.email || 'tamu@epstopik.com',
    };

    setExamResult(result);
    setShowResultModal(true);

    // Save to history and update best scores
    const newHistory = [result, ...history.slice(0, 49)];
    setHistory(newHistory);
    try {
      localStorage.setItem('ubt_exam_history', JSON.stringify(newHistory));
      window.dispatchEvent(new Event('ubt-history-updated'));
    } catch {
      // Ignore quota error
    }
  };

  // Best scores map
  const examScores = history.reduce((acc, item) => {
    if (!acc[item.examId] || item.totalScore > acc[item.examId]) {
      acc[item.examId] = item.totalScore;
    }
    if (!acc[item.examTitle] || item.totalScore > acc[item.examTitle]) {
      acc[item.examTitle] = item.totalScore;
    }
    return acc;
  }, {} as Record<string, number>);

  const correctAnswersMap = questions.reduce((acc, q) => {
    acc[q.questionNumber] = parseInt(q.answer || '1', 10);
    return acc;
  }, {} as Record<number, number>);

  const currentQ = questions[currentQuestionIndex];
  const wrongCount = questions.filter(
    (q) => answers[q.questionNumber] !== undefined && answers[q.questionNumber] !== correctAnswersMap[q.questionNumber]
  ).length;

  // Guard: If not logged in, render the dedicated public landing / index page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        <LandingPage />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation & Status Bar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (activeExam && !isReviewMode) {
            setIsTimerRunning(tab === 'exam');
          }
          setSelectedTab(tab);
        }}
        hasActiveExam={!!activeExam}
        examTitle={activeExam?.title}
        timeLeft={timeLeft}
        setTimeLeft={setTimeLeft}
        isTimerRunning={isTimerRunning}
        setIsTimerRunning={setIsTimerRunning}
        onSubmitExam={handleSubmitExam}
        answeredCount={Object.keys(answers).length}
        totalQuestions={questions.length}
        onResetExam={() => {
          if (activeExam) handleSelectExam(activeExam);
        }}
        isReviewMode={isReviewMode}
        onExitReview={() => {
          setActiveExam(null);
          setIsReviewMode(false);
        }}
        examResult={examResult}
        onOpenColorVision={() => setShowColorVisionModal(true)}
        onOpenQuickVocab={() => setShowQuickVocabDrawer(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 pb-28 md:pb-8">
        {/* TAB 1: UBT EXAM SIMULATOR */}
        {currentTab === 'exam' && (
          <>
            {!activeExam ? (
              /* Exam Selection List */
              <ExamSelector
                exams={examList}
                selectedExamId={activeExam ? (activeExam as ExamManifestItem).id : null}
                onSelectExam={handleSelectExam}
                examScores={examScores}
                onOpenColorVision={() => setShowColorVisionModal(true)}
              />
            ) : (
              /* Live UBT Testing Screen */
              <div className="flex flex-col gap-4">
                {/* Back to list & review banner */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (isReviewMode || window.confirm('시험을 중단하고 시험 목록으로 돌아가시겠습니까? (Exit test?)')) {
                        setActiveExam(null);
                        setIsReviewMode(false);
                        mobileDevice.releaseWakeLock();
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>나가기 (Exit)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Ishihara quick launcher during exam */}
                    <button
                      onClick={() => setShowColorVisionModal(true)}
                      className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                      title="색각 검사 (Ishihara Test)"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">색각검사</span>
                    </button>

                    {/* Odap Note button in review mode */}
                    {isReviewMode && wrongCount > 0 && (
                      <button
                        onClick={() => setShowOdapNoteModal(true)}
                        className="flex items-center gap-1 text-xs font-bold text-rose-300 bg-rose-950/50 border border-rose-500/40 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                        <span>오답노트 ({wrongCount})</span>
                      </button>
                    )}

                    {isReviewMode && (
                      <span className="hidden sm:inline-block text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        🔍 정답 및 오답 검토 모드
                      </span>
                    )}

                    {/* Mobile Bottom Sheet Trigger Button */}
                    <button
                      onClick={() => {
                        mobileDevice.triggerHaptic('tap');
                        setShowPaletteSheet(true);
                      }}
                      className="lg:hidden flex items-center gap-1.5 text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <Menu className="w-3.5 h-3.5" />
                      <span>
                        문항 {currentQuestionIndex + 1}/{questions.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2-Column UBT Layout: Left Question Card & Right Question Palette (Desktop) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left: Active Question Card */}
                  <div className="lg:col-span-8 flex flex-col gap-4">
                    {currentQ && (
                      <QuestionCard
                        question={currentQ}
                        selectedOption={answers[currentQ.questionNumber]}
                        onSelectOption={handleSelectOption}
                        isMarkedForReview={markedForReview.has(currentQ.questionNumber)}
                        onToggleReview={handleToggleReview}
                        isReviewMode={isReviewMode}
                        correctAnswer={correctAnswersMap[currentQ.questionNumber]}
                      />
                    )}

                    {/* Desktop Inline Navigation Bar */}
                    <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-2xl p-4 items-center justify-between gap-3 shadow-lg">
                      <button
                        disabled={currentQuestionIndex === 0}
                        onClick={() => {
                          soundFX.playNav();
                          setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                        }}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>이전 문제 (Previous)</span>
                      </button>

                      <span className="text-xs font-bold text-slate-400">
                        {currentQuestionIndex + 1} / {questions.length}
                      </span>

                      {currentQuestionIndex < questions.length - 1 ? (
                        <button
                          onClick={() => {
                            soundFX.playNav();
                            setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
                          }}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-900/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <span>다음 문제 (Next)</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : isReviewMode ? (
                        <button
                          onClick={() => {
                            soundFX.playNav();
                            setShowResultModal(true);
                          }}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-900/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>결과표 다시 보기 (Scorecard)</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitExam}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-900/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>시험 최종 제출 (Submit)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Question Palette (Desktop Sticky Dock) */}
                  <div className="hidden lg:block lg:col-span-4 sticky top-20">
                    <QuestionPalette
                      questions={questions}
                      currentQuestionIndex={currentQuestionIndex}
                      onSelectQuestion={(idx) => setCurrentQuestionIndex(idx)}
                      answers={answers}
                      markedForReview={markedForReview}
                      isReviewMode={isReviewMode}
                      correctAnswers={correctAnswersMap}
                    />
                  </div>
                </div>

                {/* Mobile Fixed "Thumb Zone" Bottom Action Bar */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 p-2.5 pb-[env(safe-area-inset-bottom,10px)] flex items-center justify-between gap-2 shadow-2xl">
                  {/* Previous Button */}
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => {
                      mobileDevice.triggerHaptic('nav');
                      soundFX.playNav();
                      setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                    }}
                    className="flex-1 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>이전</span>
                  </button>

                  {/* Center: Lembar Jawab Bottom Sheet Trigger */}
                  <button
                    onClick={() => {
                      mobileDevice.triggerHaptic('tap');
                      setShowPaletteSheet(true);
                    }}
                    className="flex-[1.2] h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 font-black text-xs flex flex-col items-center justify-center border border-blue-500/40 shadow-inner active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="text-[10px] text-slate-400 font-normal">답안지 확인</span>
                    <span className="text-xs">
                      {currentQuestionIndex + 1}번 / {questions.length}문항
                    </span>
                  </button>

                  {/* Next or Submit Button */}
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={() => {
                        mobileDevice.triggerHaptic('nav');
                        soundFX.playNav();
                        setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
                      }}
                      className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-900/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>다음</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : isReviewMode ? (
                    <button
                      onClick={() => {
                        mobileDevice.triggerHaptic('success');
                        soundFX.playNav();
                        setShowResultModal(true);
                      }}
                      className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-900/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>성적표</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitExam}
                      className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-900/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>제출</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: STUDY MATERIALS */}
        {currentTab === 'study' && <StudyMaterialsView />}

        {/* TAB 3: VOCABULARY */}
        {currentTab === 'vocab' && <VocabularyView />}

        {/* TAB 4: EXAM HISTORY / RAPOR SAYA */}
        {currentTab === 'history' && (
          <ExamHistoryView
            history={history}
            onReviewResult={handleReviewExam}
            onClearHistory={() => {
              if (isAdmin) {
                setHistory([]);
                localStorage.setItem('ubt_exam_history', '[]');
              } else if (currentUser) {
                const targetEmail = currentUser.email.toLowerCase();
                const filtered = history.filter(
                  (h) => h.userId !== currentUser.id && (!h.userEmail || h.userEmail.toLowerCase() !== targetEmail)
                );
                setHistory(filtered);
                localStorage.setItem('ubt_exam_history', JSON.stringify(filtered));
              } else {
                setHistory([]);
                localStorage.setItem('ubt_exam_history', '[]');
              }
              window.dispatchEvent(new Event('ubt-history-updated'));
            }}
            onOpenOdapNote={() => {
              if (activeExam) {
                setShowOdapNoteModal(true);
              } else if (history.length > 0) {
                handleReviewExam(history[0]).then(() => {
                  setShowOdapNoteModal(true);
                });
              }
            }}
          />
        )}

        {/* TAB 5: ADMIN DASHBOARD (ADMIN PANEL) */}
        {currentTab === 'admin' && (
          <AdminDashboard
            exams={examList}
            onReviewResult={handleReviewExam}
          />
        )}
      </main>

      {/* Floating Quick Vocab Helper Pill (Visible when not actively taking an exam) */}
      {!showQuickVocabDrawer && !activeExam && (
        <button
          onClick={() => {
            soundFX.playNav();
            setShowQuickVocabDrawer(true);
          }}
          className="fixed bottom-20 md:bottom-6 right-4 z-30 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-sky-400 border border-sky-500/40 shadow-xl shadow-sky-950/40 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="빠른 단어 사전 검색 (Quick Vocab)"
        >
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold">단어 사전</span>
        </button>
      )}

      {/* Slide-Up Mobile Question Palette Sheet */}
      <QuestionPaletteBottomSheet
        isOpen={showPaletteSheet}
        onClose={() => setShowPaletteSheet(false)}
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        onSelectQuestion={(idx) => setCurrentQuestionIndex(idx)}
        answers={answers}
        markedForReview={markedForReview}
        isReviewMode={isReviewMode}
        correctAnswers={correctAnswersMap}
      />

      {/* Ishihara Color Blindness Test Modal */}
      {showColorVisionModal && (
        <ColorVisionModal
          plates={colorVisionPlates}
          examTitle={activeExam?.title || '2026 UBT Mock Test'}
          onClose={() => setShowColorVisionModal(false)}
        />
      )}

      {/* Odap Note (Buku Soal Salah) Modal */}
      {showOdapNoteModal && activeExam && (
        <OdapNoteModal
          examTitle={activeExam.title}
          questions={questions}
          answers={answers}
          onClose={() => setShowOdapNoteModal(false)}
          onJumpToQuestion={(idx) => {
            setCurrentQuestionIndex(idx);
            setIsReviewMode(true);
          }}
        />
      )}

      {/* Quick Bilingual Vocabulary Drawer */}
      <QuickVocabDrawer
        isOpen={showQuickVocabDrawer}
        onClose={() => setShowQuickVocabDrawer(false)}
      />

      {/* Auth Modal (Login / Register / Quick Demo) */}
      <AuthModal />

      {/* Result & Scorecard Modal */}
      {showResultModal && examResult && (
        <ResultModal
          result={examResult}
          onRetake={() => {
            setShowResultModal(false);
            if (activeExam) handleSelectExam(activeExam);
          }}
          onReview={() => {
            if (examResult) {
              handleReviewExam(examResult);
            } else {
              setShowResultModal(false);
              setIsReviewMode(true);
              setSelectedTab('exam');
              setCurrentQuestionIndex(0);
            }
          }}
          onSelectAnother={() => {
            setShowResultModal(false);
            setActiveExam(null);
            setIsReviewMode(false);
            setSelectedTab('exam');
          }}
          onClose={() => setShowResultModal(false)}
          onOpenOdapNote={() => {
            setShowResultModal(false);
            setShowOdapNoteModal(true);
          }}
          onOpenColorVision={() => {
            setShowResultModal(false);
            setShowColorVisionModal(true);
          }}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <UbtApp />
    </AuthProvider>
  );
};
