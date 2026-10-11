import React, { useState } from 'react';
import { Eye, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, RotateCcw, X, ZoomIn } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

export interface ColorVisionPlate {
  id: string;
  plateNumber: number;
  answer: string;
  imagePath: string;
  fallbackUrl?: string;
}

interface ColorVisionModalProps {
  plates: ColorVisionPlate[];
  examTitle?: string;
  onClose: () => void;
  onComplete?: (passed: boolean, score: number, total: number) => void;
}

export const ColorVisionModal: React.FC<ColorVisionModalProps> = ({
  plates,
  examTitle = '2026 UBT Mock Test',
  onClose,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userInputs, setUserInputs] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // If no plates passed from exam, provide default standard HRD Korea Ishihara plates
  const effectivePlates: ColorVisionPlate[] = plates.length > 0 ? plates : [
    {
      id: 'cv-1',
      plateNumber: 1,
      answer: '97',
      imagePath: '/bank/exams/2026_UBT_Mock_Tests/03_2026_UBT_-_01/images/color_vision_1.png',
    },
    {
      id: 'cv-2',
      plateNumber: 2,
      answer: '15',
      imagePath: '/bank/exams/2026_UBT_Mock_Tests/03_2026_UBT_-_01/images/color_vision_2.png',
    },
    {
      id: 'cv-3',
      plateNumber: 3,
      answer: '8',
      imagePath: '/bank/exams/2026_UBT_Mock_Tests/03_2026_UBT_-_01/images/color_vision_3.png',
    },
    {
      id: 'cv-4',
      plateNumber: 4,
      answer: '69',
      imagePath: '/bank/exams/2026_UBT_Mock_Tests/03_2026_UBT_-_01/images/color_vision_4.png',
    },
    {
      id: 'cv-5',
      plateNumber: 5,
      answer: '12',
      imagePath: '/bank/exams/2026_UBT_Mock_Tests/03_2026_UBT_-_01/images/color_vision_5.png',
    },
  ];

  const currentPlate = effectivePlates[currentIndex] || effectivePlates[0];
  const currentAnswer = userInputs[currentPlate.plateNumber] || '';

  const handleKeypadPress = (val: string) => {
    soundFX.playSelect();
    setUserInputs((prev) => {
      const existing = prev[currentPlate.plateNumber] || '';
      if (val === 'DEL') {
        return { ...prev, [currentPlate.plateNumber]: existing.slice(0, -1) };
      }
      if (val === 'CLEAR') {
        return { ...prev, [currentPlate.plateNumber]: '' };
      }
      if (existing.length >= 3) return prev; // max 3 digits
      return { ...prev, [currentPlate.plateNumber]: existing + val };
    });
  };

  const handleFinish = () => {
    soundFX.playComplete();
    setIsCompleted(true);
    let correctCount = 0;
    effectivePlates.forEach((p) => {
      const userVal = (userInputs[p.plateNumber] || '').trim();
      if (userVal === p.answer.trim()) {
        correctCount += 1;
      }
    });
    const passed = correctCount >= 4; // HRD Korea standard: 4 out of 5 minimum
    onComplete?.(passed, correctCount, effectivePlates.length);
  };

  // Evaluation calculations
  let correctTotal = 0;
  effectivePlates.forEach((p) => {
    if ((userInputs[p.plateNumber] || '').trim() === p.answer.trim()) {
      correctTotal += 1;
    }
  });
  const isPassed = correctTotal >= 4;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>색각 검사 (Ishihara Color Test)</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 font-semibold">
                  HRD 필수
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

        {!isCompleted ? (
          <>
            {/* Step & Progress Dots */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span>
                도판 {currentIndex + 1} / {effectivePlates.length} (Plate #{currentPlate.plateNumber})
              </span>
              <div className="flex items-center gap-1.5">
                {effectivePlates.map((p, idx) => {
                  const hasAnswer = Boolean(userInputs[p.plateNumber]);
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        soundFX.playNav();
                        setCurrentIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        isCurrent
                          ? 'w-6 bg-blue-500'
                          : hasAnswer
                          ? 'w-2 bg-emerald-500'
                          : 'w-2 bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-400">💡 안내:</span> 원 안의 색 점들 사이에 보이는
              숫자를 아래 키패드로 입력하세요. 숫자가 보이지 않으면 빈칸으로 넘어가세요.
            </div>

            {/* Ishihara Circular Plate Box */}
            <div className="relative group bg-slate-950 border border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-slate-800 shadow-inner flex items-center justify-center bg-slate-900">
                <img
                  src={currentPlate.imagePath}
                  alt={`Ishihara Plate ${currentPlate.plateNumber}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
                  onClick={() => setIsZoomed(true)}
                  onError={(e) => {
                    if (currentPlate.fallbackUrl && e.currentTarget.src !== currentPlate.fallbackUrl) {
                      e.currentTarget.src = currentPlate.fallbackUrl;
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="absolute bottom-3 right-3 bg-slate-900/80 p-1.5 rounded-full text-white/80 hover:text-white border border-slate-700 shadow-md backdrop-blur-sm"
                  title="확대 (Zoom)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Current Input Display */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">입력된 숫자:</span>
                <div className="min-w-24 h-11 px-4 rounded-xl bg-slate-900 border-2 border-blue-500/60 flex items-center justify-center font-mono font-black text-2xl text-blue-400 tracking-wider shadow-inner">
                  {currentAnswer || <span className="text-slate-600 text-sm font-normal">입력 대기</span>}
                </div>
              </div>
            </div>

            {/* Mobile Thumb-Friendly Numeric Keypad */}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeypadPress(digit)}
                    className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 font-bold text-lg text-white border border-slate-700/80 transition-all shadow-sm cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={() => handleKeypadPress('CLEAR')}
                  className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-800 active:scale-95 font-semibold text-xs text-rose-400 border border-slate-700/80 transition-all cursor-pointer"
                >
                  초기화
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 font-bold text-lg text-white border border-slate-700/80 transition-all shadow-sm cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={() => handleKeypadPress('DEL')}
                  className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-800 active:scale-95 font-semibold text-xs text-amber-400 border border-slate-700/80 transition-all cursor-pointer"
                >
                  지우기 ⌫
                </button>
              </div>
            </div>

            {/* Bottom Actions: Previous & Next / Complete */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                disabled={currentIndex === 0}
                onClick={() => {
                  soundFX.playNav();
                  setCurrentIndex((prev) => Math.max(0, prev - 1));
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>이전</span>
              </button>

              {currentIndex < effectivePlates.length - 1 ? (
                <button
                  onClick={() => {
                    soundFX.playNav();
                    setCurrentIndex((prev) => Math.min(effectivePlates.length - 1, prev + 1));
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-900/30 cursor-pointer active:scale-95"
                >
                  <span>다음 도판</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-900/30 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>검사 결과 확인</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* Result Summary Screen */
          <div className="flex flex-col gap-5 text-center animate-in fade-in">
            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-xl ${
                isPassed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {isPassed ? <CheckCircle2 className="w-9 h-9" /> : <AlertTriangle className="w-9 h-9" />}
            </div>

            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  isPassed
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}
              >
                {isPassed ? '정상 판정 (PASS)' : '정밀 검진 권고 (CAUTION)'}
              </span>
              <h3 className="text-xl font-black text-white mt-2">
                정답 {correctTotal} / {effectivePlates.length}개 일치
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {isPassed
                  ? '축하합니다! HRD Korea 색각 검정 기준(5문항 중 4문항 이상 정답)을 완벽히 충족하였습니다.'
                  : 'HRD Korea 규정상 기준 미달 시 취업비자 발급에 제한이 있을 수 있으니 안과 정밀 검진을 권장합니다.'}
              </p>
            </div>

            {/* Answers Table */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-xs">
              <div className="grid grid-cols-4 font-bold text-slate-400 pb-1.5 border-b border-slate-800">
                <span>도판</span>
                <span>정답</span>
                <span>내 답변</span>
                <span>결과</span>
              </div>
              {effectivePlates.map((p) => {
                const userAns = (userInputs[p.plateNumber] || '').trim();
                const matched = userAns === p.answer.trim();
                return (
                  <div key={p.id} className="grid grid-cols-4 items-center text-slate-300 py-1">
                    <span className="font-semibold">도판 {p.plateNumber}</span>
                    <span className="font-mono text-emerald-400 font-bold">{p.answer}</span>
                    <span className="font-mono">{userAns || '-'}</span>
                    <span className={`font-bold ${matched ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {matched ? '✓ 일치' : '✗ 불일치'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  soundFX.playNav();
                  setIsCompleted(false);
                  setCurrentIndex(0);
                  setUserInputs({});
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>다시 검사</span>
              </button>

              <button
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-900/30 cursor-pointer active:scale-95"
              >
                <span>검사 완료 (닫기)</span>
              </button>
            </div>
          </div>
        )}

        {/* Zoom Lightbox */}
        {isZoomed && (
          <div
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="relative max-w-sm w-full">
              <img
                src={currentPlate.imagePath}
                alt="Zoomed Plate"
                className="w-full rounded-full border-4 border-slate-700 shadow-2xl"
              />
              <p className="text-center text-xs text-slate-400 mt-3 font-semibold">
                화면을 탭하여 확대창을 닫습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
