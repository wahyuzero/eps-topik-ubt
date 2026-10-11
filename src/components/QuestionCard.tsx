import React, { useState, useRef, useEffect } from 'react';
import type { Question } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { Bookmark, BookmarkCheck, ZoomIn, X, CheckCircle, XCircle, Play, Pause } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';
import { mobileDevice } from '../utils/hapticsAndWakeLock';

interface QuestionCardProps {
  question: Question;
  selectedOption?: number;
  onSelectOption: (optionNumber: number) => void;
  isMarkedForReview: boolean;
  onToggleReview: () => void;
  isReviewMode?: boolean; // When viewing results
  correctAnswer?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedOption,
  onSelectOption,
  isMarkedForReview,
  onToggleReview,
  isReviewMode = false,
  correctAnswer,
}) => {
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [playingOption, setPlayingOption] = useState<{ qId: string; optionNumber: number } | null>(null);
  const optionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio on unmount, question change, or when main audio starts
  useEffect(() => {
    const handleStop = () => {
      if (optionAudioRef.current) {
        optionAudioRef.current.pause();
        optionAudioRef.current = null;
      }
      setPlayingOption(null);
    };

    window.addEventListener('ubt-stop-option-audio', handleStop);

    return () => {
      window.removeEventListener('ubt-stop-option-audio', handleStop);
      if (optionAudioRef.current) {
        optionAudioRef.current.pause();
        optionAudioRef.current = null;
      }
      setPlayingOption(null);
    };
  }, [question.id]);

  const activeOptionNumber = playingOption?.qId === question.id ? playingOption.optionNumber : null;

  const handleToggleOptionAudio = (e: React.MouseEvent, optionNumber: number, audioSrc: string, fallbackSrc?: string) => {
    e.stopPropagation();
    mobileDevice.triggerHaptic('tap');

    if (activeOptionNumber === optionNumber) {
      optionAudioRef.current?.pause();
      setPlayingOption(null);
    } else {
      if (optionAudioRef.current) {
        optionAudioRef.current.pause();
      }
      // Pause any other playing audio on the page
      document.querySelectorAll('audio').forEach((el) => {
        try {
          el.pause();
        } catch {}
      });

      const audio = new Audio(audioSrc);
      optionAudioRef.current = audio;
      audio.onended = () => {
        setPlayingOption(null);
      };

      const tryFallback = () => {
        if (fallbackSrc && !audio.src.includes(fallbackSrc)) {
          audio.src = fallbackSrc;
          audio.load();
          audio
            .play()
            .then(() => {
              setPlayingOption({ qId: question.id, optionNumber });
            })
            .catch(() => setPlayingOption(null));
        } else {
          setPlayingOption(null);
        }
      };

      audio.onerror = tryFallback;

      audio
        .play()
        .then(() => {
          setPlayingOption({ qId: question.id, optionNumber });
        })
        .catch((err) => {
          console.warn('Option audio playback error, trying fallback:', err);
          tryFallback();
        });
    }
  };

  const isListening = Boolean(question.audioPath) || Boolean(question.listening) || question.questionType?.code === 'KO_LISTENING' || question.questionNumber > 20;
  const isReading = !isListening;

  // Resolve audio URL
  const audioSrc = question.audioPath || question.listening?.presignedUrl || question.listening?.url || '';

  // Resolve main image URL
  const imageSrc = question.imagePath || question.descriptionFile?.presignedUrl || question.descriptionFile?.url || '';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-5">
      {/* Top Banner: Question number, type badge, marks, and review button */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1 rounded-xl bg-blue-600/20 text-blue-400 font-black text-sm sm:text-base border border-blue-500/30 flex items-center gap-1">
            <span>[문제 {question.questionNumber}]</span>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
              isReading
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
            }`}
          >
            {isReading ? '읽기 (Reading)' : '듣기 (Listening)'}
          </span>

          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
            5.0점
          </span>
        </div>

        {/* Mark for review toggle */}
        {!isReviewMode && (
          <button
            onClick={() => {
              mobileDevice.triggerHaptic('tap');
              soundFX.playNav();
              onToggleReview();
            }}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isMarkedForReview
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {isMarkedForReview ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>검토 중 (Ragu)</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">나중에 검토</span>
                <span className="sm:hidden">검토</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Review Mode Score Callout Banner */}
      {isReviewMode && (
        <div
          className={`flex items-center justify-between p-3 rounded-2xl border text-xs sm:text-sm font-bold ${
            selectedOption === correctAnswer
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50'
              : selectedOption !== undefined
              ? 'bg-rose-950/40 text-rose-300 border-rose-500/50'
              : 'bg-amber-950/40 text-amber-300 border-amber-500/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {selectedOption === correctAnswer ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : selectedOption !== undefined ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">!</span>
            )}
            <span>
              {selectedOption === correctAnswer
                ? '정답입니다! (+5.0점)'
                : selectedOption !== undefined
                ? `오답입니다 (0점) — 내가 고른 답: ${selectedOption}번 / 정답: ${correctAnswer}번`
                : `답안 미작성 (0점) — 정답: ${correctAnswer}번`}
            </span>
          </div>
          <span className="text-[11px] font-semibold opacity-80 hidden sm:inline">
            {isReading ? '읽기 영역' : '듣기 영역'}
          </span>
        </div>
      )}

      {/* Main Instruction Heading */}
      {question.mainHeading && (
        <div className="bg-slate-800/60 border-l-4 border-blue-500 px-3.5 py-2.5 rounded-r-xl text-slate-100 font-bold text-sm sm:text-base leading-relaxed">
          {question.mainHeading}
        </div>
      )}

      {/* Listening Audio Player (for Listening Section) */}
      {isListening && (audioSrc || question.listening?.presignedUrl) && (
        <AudioPlayer
          key={`audio-${question.id}-${question.questionNumber}-${audioSrc}-${isReviewMode ? 'review' : 'exam'}`}
          src={audioSrc}
          fallbackSrc={question.listening?.presignedUrl || question.listening?.url}
          questionNumber={question.questionNumber}
          maxPlays={isReviewMode ? 999 : 2}
        />
      )}

      {/* Question Content Layout: Grid with Image/Passage & Choices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Illustration Image or Reading Passage */}
        <div className={`flex flex-col gap-3 ${imageSrc || question.descriptionText ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {/* Reading text/passage if present */}
          {question.descriptionText && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-slate-100 font-medium text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text">
              {question.descriptionText}
            </div>
          )}

          {/* Question illustration image */}
          {imageSrc && (
            <div className="relative group bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-2.5 max-h-[340px]">
              <img
                src={imageSrc}
                alt={`Question ${question.questionNumber}`}
                onError={(e) => {
                  const fallback = question.descriptionFile?.presignedUrl || question.descriptionFile?.url;
                  if (fallback && e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="max-h-[300px] max-w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02] cursor-zoom-in"
                onClick={() => setZoomImage(imageSrc)}
              />
              <button
                type="button"
                onClick={() => setZoomImage(imageSrc)}
                className="absolute bottom-2.5 right-2.5 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-xl backdrop-blur-sm border border-slate-700 shadow-md opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="이미지 크게 보기 (Zoom In)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Options List (Choices ① ② ③ ④) */}
        <div className={`flex flex-col gap-2.5 ${imageSrc || question.descriptionText ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <div className="text-xs font-bold text-slate-400 mb-0.5 flex items-center justify-between">
            <span>정답 선택 (Pilih Jawaban):</span>
            {isReviewMode && (
              <span className="text-[11px] font-semibold">
                정답: <strong className="text-emerald-400">{correctAnswer}번</strong> | 선택:{' '}
                <strong className={selectedOption === correctAnswer ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedOption ? `${selectedOption}번` : '미선택'}
                </strong>
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {question.options.map((opt) => {
              const isSelected = selectedOption === opt.optionNumber;
              const isCorrect = correctAnswer === opt.optionNumber;

              let cardStyle = 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 text-slate-200';
              let badgeStyle = 'bg-slate-700 text-slate-300 border-slate-600';

              if (isReviewMode) {
                if (isCorrect) {
                  cardStyle = 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200 ring-2 ring-emerald-500/30';
                  badgeStyle = 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold';
                } else if (isSelected && !isCorrect) {
                  cardStyle = 'bg-rose-950/40 border-rose-500/80 text-rose-200 ring-2 ring-rose-500/30';
                  badgeStyle = 'bg-rose-500 text-white border-rose-400 font-extrabold';
                }
              } else if (isSelected) {
                cardStyle = 'bg-blue-900/30 border-blue-500 text-blue-100 ring-2 ring-blue-500/40 shadow-md shadow-blue-950/30';
                badgeStyle = 'bg-blue-600 text-white border-blue-400 font-extrabold';
              }

              const isDummyText = opt.text ? /^File option [A-D]$/i.test(opt.text.trim()) : false;
              const displayText = isDummyText ? '' : opt.text;

              const isAudioOpt = Boolean(opt.audioPath || opt.type === 'audio' || opt.file?.contentType === 'audio/mpeg');
              const isImgOpt = Boolean(opt.imagePath || opt.type === 'img' || opt.file?.contentType === 'image/png');
              const optAudioSrc = opt.audioPath || (isAudioOpt ? (opt.file?.presignedUrl || opt.file?.url) : undefined);
              const optAudioFallback = opt.file?.presignedUrl || opt.file?.url;
              const optImageSrc = opt.imagePath || (isImgOpt ? (opt.file?.presignedUrl || opt.file?.url) : undefined);

              return (
                <div
                  key={opt.id || opt.optionNumber}
                  role="button"
                  tabIndex={isReviewMode ? -1 : 0}
                  onClick={() => {
                    if (isReviewMode) return;
                    mobileDevice.triggerHaptic('select');
                    soundFX.playSelect();
                    onSelectOption(opt.optionNumber);
                  }}
                  onKeyDown={(e) => {
                    if (isReviewMode) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      mobileDevice.triggerHaptic('select');
                      soundFX.playSelect();
                      onSelectOption(opt.optionNumber);
                    }
                  }}
                  className={`w-full min-h-[56px] flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${
                    isReviewMode ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                  } ${cardStyle}`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Circle Option Number Badge */}
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 transition-colors ${badgeStyle}`}>
                      {opt.optionNumber}
                    </div>

                    {/* Option Text, Image, and Mini Audio Player */}
                    <div className="font-semibold text-sm sm:text-base leading-normal flex-1 min-w-0">
                      {displayText && <div className="break-words">{displayText}</div>}
                      {optImageSrc && (
                        <div className="mt-2">
                          <img
                            src={optImageSrc}
                            alt={`Option ${opt.optionNumber}`}
                            className="max-h-24 rounded-lg object-contain bg-slate-950/50 p-1 border border-slate-700"
                            onError={(e) => {
                              const fallback = opt.file?.presignedUrl || opt.file?.url;
                              if (fallback && e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                              }
                            }}
                          />
                        </div>
                      )}
                      {optAudioSrc && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleOptionAudio(e, opt.optionNumber, optAudioSrc, optAudioFallback)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                              activeOptionNumber === opt.optionNumber
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-amber-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-600/20'
                            }`}
                          >
                            {activeOptionNumber === opt.optionNumber ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>일시정지 (Pause)</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                <span>음원 듣기 (Audio)</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Mode Icon Indicator */}
                  {isReviewMode && (
                    <div className="shrink-0 ml-2">
                      {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                      {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lightbox Image Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={zoomImage} alt="Zoomed Question" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
