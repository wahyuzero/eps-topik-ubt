import React, { useState, useEffect, useMemo } from 'react';
import type { VocabularyWord } from '../types';
import { Volume2, Search, Shuffle, ArrowLeft, ArrowRight, RotateCw, CheckCircle, Sparkles, AlertCircle, Keyboard } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';
import { matchesKoreanQuery } from '../utils/koreanUtils';

const STORAGE_KEY_MEMORIZED = 'eps_ubt_memorized_vocab';

export const VocabularyView: React.FC = () => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('ALL');
  const [viewMode, setViewMode] = useState<'flashcard' | 'list' | 'quiz'>('flashcard');

  // Flashcard State
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [memorizedIds, setMemorizedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMORIZED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set<string>(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load memorized vocab from localStorage:', e);
    }
    return new Set<string>();
  });

  // Quiz State & Warning
  const [quizQuestions, setQuizQuestions] = useState<Array<{ word: VocabularyWord; options: string[]; answer: string }>>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizWarning, setQuizWarning] = useState<string | null>(null);

  // Table pagination state
  const [visibleCount, setVisibleCount] = useState<number>(150);

  // Sync memorizedIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIZED, JSON.stringify(Array.from(memorizedIds)));
    } catch (e) {
      console.error('Failed to save memorized vocab to localStorage:', e);
    }
  }, [memorizedIds]);

  // Load vocabulary from /bank/vocabulary/all_vocabulary.json
  useEffect(() => {
    fetch('/bank/vocabulary/all_vocabulary.json')
      .then((res) => res.json())
      .then((data: VocabularyWord[]) => {
        setWords(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load vocabulary:', err);
        setLoading(false);
      });
  }, []);

  // Text-to-speech speaker
  const speakKorean = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  const [showKeypad, setShowKeypad] = useState<boolean>(false);

  // Filtered words with Romaja, Choseong, and Korean/Indonesian matching
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchSearch = !searchQuery.trim() || matchesKoreanQuery(w.korean, w.indonesian, searchQuery);
      const matchDiff = selectedDifficulty === 'ALL' || w.difficulty === selectedDifficulty;
      return matchSearch && matchDiff;
    });
  }, [words, searchQuery, selectedDifficulty]);

  const currentWord = filteredWords[currentCardIndex] || filteredWords[0];

  // Start Mini Quiz
  const startQuiz = () => {
    if (filteredWords.length < 10) {
      soundFX.playSelect();
      setQuizWarning(
        `단어 퀴즈를 시작하려면 최소 10개의 단어가 필요합니다. (Diperlukan minimal 10 kata untuk memulai kuis. Saat ini hanya ada ${filteredWords.length} kata yang cocok)`
      );
      return;
    }
    setQuizWarning(null);
    const shuffled = [...filteredWords].sort(() => 0.5 - Math.random()).slice(0, 10);
    const questions = shuffled.map((target) => {
      const targetAnswer = (target.indonesian || target.korean || 'Arti').trim();
      const seen = new Set<string>([targetAnswer]);
      const wrongOptions: string[] = [];

      // 1. Gather distinct distractors from current filtered pool
      const localCandidates = [...filteredWords].sort(() => 0.5 - Math.random());
      for (const cand of localCandidates) {
        const text = (cand.indonesian || cand.korean || '').trim();
        if (text && !seen.has(text)) {
          seen.add(text);
          wrongOptions.push(text);
          if (wrongOptions.length === 3) break;
        }
      }

      // 2. Fallback to global vocabulary pool if filtered pool has few distinct translations
      if (wrongOptions.length < 3) {
        const globalCandidates = [...words].sort(() => 0.5 - Math.random());
        for (const cand of globalCandidates) {
          const text = (cand.indonesian || cand.korean || '').trim();
          if (text && !seen.has(text)) {
            seen.add(text);
            wrongOptions.push(text);
            if (wrongOptions.length === 3) break;
          }
        }
      }

      const options = [targetAnswer, ...wrongOptions].sort(() => 0.5 - Math.random());
      return {
        word: target,
        options,
        answer: targetAnswer,
      };
    });
    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizScore(0);
    setSelectedQuizOption(null);
    setViewMode('quiz');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>6,000+ 어휘 데이터를 불러오는 중입니다...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              EPS-TOPIK 6,000+ 핵심 어휘장
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30">
              한국어 발음(TTS) 지원
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            필수 단어장 ({words.length.toLocaleString()}단어)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            기초부터 심화까지 전 단원 빈출 어휘 플래시카드, 음성 발음 청취 및 퀴즈 기능.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => { soundFX.playNav(); setViewMode('flashcard'); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              viewMode === 'flashcard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            플래시카드 (Flashcards)
          </button>
          <button
            onClick={() => { soundFX.playNav(); setViewMode('list'); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            전체 단어 목록 (List)
          </button>
          <button
            onClick={() => { soundFX.playNav(); startQuiz(); }}
            title={
              filteredWords.length < 10
                ? `단어 수가 부족합니다 (최소 10개 필요, 현재 ${filteredWords.length}개)`
                : '단어 퀴즈 (10문항)'
            }
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              viewMode === 'quiz'
                ? 'bg-indigo-600 text-white shadow-sm'
                : filteredWords.length < 10
                ? 'text-slate-500 hover:text-slate-400 opacity-75'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>단어 퀴즈 (10Q)</span>
          </button>
        </div>
      </div>

      {/* Quiz Warning Alert */}
      {quizWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{quizWarning}</span>
          </div>
          <button
            onClick={() => setQuizWarning(null)}
            className="text-amber-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="단어 검색 (Romaja: bakkuda, 초성: ㅂㄲㄷ, 한국어, 인도네시아어)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setVisibleCount(150);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg border transition-colors cursor-pointer ${
              showKeypad
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-700 text-slate-400 border-slate-600 hover:text-white'
            }`}
            title="한글 가상 키패드"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Virtual Hangul Keypad */}
        {showKeypad && (
          <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 animate-in fade-in">
            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between px-1">
              <span>한글 가상 키패드 (Virtual Hangul Keypad)</span>
              <button
                type="button"
                onClick={() => setSearchQuery((prev) => prev.slice(0, -1))}
                className="text-amber-400 hover:text-amber-300 font-semibold text-xs cursor-pointer"
              >
                지우기 ⌫
              </button>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
              {['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'].map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => {
                    soundFX.playSelect();
                    setSearchQuery((prev) => prev + char);
                  }}
                  className="h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 mt-1">
              {['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅔ'].map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => {
                    soundFX.playSelect();
                    setSearchQuery((prev) => prev + char);
                  }}
                  className="h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-sky-300 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold hidden sm:inline">난이도:</span>
          {(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => {
                soundFX.playNav();
                setSelectedDifficulty(diff);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setVisibleCount(150);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedDifficulty === diff
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {diff === 'ALL' ? '전체' : diff}
            </button>
          ))}
        </div>
      </div>

      {/* MODE 1: FLASHCARD VIEW */}
      {viewMode === 'flashcard' && (
        !currentWord ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl my-4">
            <Search className="w-10 h-10 text-slate-600 mb-3" />
            <p className="font-bold text-sm text-slate-300">검색 결과가 없습니다.</p>
            <p className="text-xs text-slate-500 mt-1">단어 검색어 또는 난이도 필터를 변경해 보세요.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
          {/* Card counter */}
          <div className="text-xs font-bold text-slate-400">
            카드 {currentCardIndex + 1} / {filteredWords.length} (검색 결과)
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => {
              soundFX.playSelect();
              setIsFlipped(!isFlipped);
            }}
            className="w-full max-w-xl min-h-[300px] bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 hover:border-blue-500/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl cursor-pointer transition-all duration-300 relative select-none"
          >
            {/* Top badges on card */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {currentWord.difficulty && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {currentWord.difficulty}
                </span>
              )}
              {currentWord.wordType && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                  {currentWord.wordType}
                </span>
              )}
            </div>

            {/* Audio pronounce button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundFX.playSelect();
                speakKorean(currentWord.korean);
              }}
              className="absolute top-4 right-4 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white p-2.5 rounded-xl border border-blue-500/30 transition-all shadow-md"
              title="한국어 발음 듣기 (Listen Pronunciation)"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* Front: Korean Word */}
            {!isFlipped ? (
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  한국어 (Korean)
                </span>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  {currentWord.korean}
                </h1>
                <span className="text-xs text-blue-400 font-semibold mt-4 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>카드를 클릭하여 뜻 확인 (Click to flip)</span>
                </span>
              </div>
            ) : (
              /* Back: Meanings */
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  의미 (Arti Bahasa Indonesia)
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  {currentWord.indonesian}
                </h3>
                {(Array.isArray(currentWord.examples) ? currentWord.examples.length > 0 : Boolean(currentWord.examples)) && (
                  <div className="mt-4 p-3 bg-slate-950/60 rounded-xl text-xs text-slate-300 max-w-md border border-slate-800 w-full text-left space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      예문 (Contoh Kalimat):
                    </div>
                    {Array.isArray(currentWord.examples) ? (
                      currentWord.examples.map((ex, idx) => (
                        <div key={idx} className="border-l-2 border-blue-500/50 pl-2.5 py-0.5">
                          <div className="text-white font-medium text-xs">{ex.korean}</div>
                          {ex.indonesian && (
                            <div className="text-emerald-400/90 text-[11px] mt-0.5">{ex.indonesian}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="italic text-slate-300">"{String(currentWord.examples)}"</div>
                    )}
                  </div>
                )}
                {currentWord.notes && (
                  <div className="text-[11px] text-slate-400 italic max-w-md mt-2 px-3 py-1.5 bg-slate-800/40 rounded-lg border border-slate-700/50 text-left w-full">
                    💡 {currentWord.notes}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center gap-4">
            <button
              disabled={currentCardIndex === 0}
              onClick={() => {
                soundFX.playNav();
                setIsFlipped(false);
                setCurrentCardIndex((prev) => Math.max(0, prev - 1));
              }}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-2xl border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                soundFX.playNav();
                const nextId = currentWord.id;
                setMemorizedIds((prev) => {
                  const copy = new Set(prev);
                  if (copy.has(nextId)) copy.delete(nextId);
                  else copy.add(nextId);
                  return copy;
                });
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all ${
                memorizedIds.has(currentWord.id)
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{memorizedIds.has(currentWord.id) ? '암기 완료 (Memorized)' : '암기 체크'}</span>
            </button>

            <button
              onClick={() => {
                soundFX.playNav();
                setIsFlipped(false);
                const rand = Math.floor(Math.random() * filteredWords.length);
                setCurrentCardIndex(rand);
              }}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 transition-colors"
              title="랜덤 섞기 (Shuffle)"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              disabled={currentCardIndex >= filteredWords.length - 1}
              onClick={() => {
                soundFX.playNav();
                setIsFlipped(false);
                setCurrentCardIndex((prev) => Math.min(filteredWords.length - 1, prev + 1));
              }}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-2xl border border-slate-700 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}

      {/* MODE 2: TABLE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-md text-slate-300 uppercase font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">번호</th>
                  <th className="p-3.5">한국어 (Korean)</th>
                  <th className="p-3.5">뜻 (Arti Bahasa Indonesia)</th>
                  <th className="p-3.5">품사</th>
                  <th className="p-3.5">난이도</th>
                  <th className="p-3.5 text-center">음성</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredWords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      검색 결과가 없습니다. (Tidak ada hasil kata yang cocok)
                    </td>
                  </tr>
                ) : (
                  filteredWords.slice(0, visibleCount).map((w, idx) => (
                  <tr key={w.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-sm text-white">{w.korean}</td>
                    <td className="p-3.5 font-semibold text-slate-200">{w.indonesian || '-'}</td>
                    <td className="p-3.5 text-slate-400">{w.wordType || '-'}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {w.difficulty || 'BEGINNER'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => speakKorean(w.korean)}
                        className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                        title="발음 듣기"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Pagination & Load More Controls */}
          {filteredWords.length > 0 && (
            <div className="p-4 bg-slate-800/70 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                표시 중: <strong className="text-white">{Math.min(visibleCount, filteredWords.length).toLocaleString()}</strong> / <strong className="text-slate-300">{filteredWords.length.toLocaleString()}</strong> 단어 (Kata)
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {visibleCount < filteredWords.length ? (
                  <>
                    <button
                      onClick={() => {
                        soundFX.playNav();
                        setVisibleCount((prev) => Math.min(filteredWords.length, prev + 150));
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      단어 더 불러오기 (+150 Muat Lebih Banyak)
                    </button>
                    <button
                      onClick={() => {
                        soundFX.playNav();
                        setVisibleCount(filteredWords.length);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                    >
                      전체 보기 (Tampilkan Semua)
                    </button>
                  </>
                ) : (
                  filteredWords.length > 150 && (
                    <button
                      onClick={() => {
                        soundFX.playNav();
                        setVisibleCount(150);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                    >
                      처음으로 접기 (Tampilkan 150)
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: QUIZ VIEW */}
      {viewMode === 'quiz' && (
        quizQuestions.length > 0 && filteredWords.length >= 10 ? (
          <div className="max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-blue-400 uppercase">
                단어 퀴즈 (Question {quizIndex + 1}/10)
              </span>
              <span className="text-xs font-bold text-emerald-400">
                현재 점수: {quizScore} / 10
              </span>
            </div>

            {quizIndex < 10 ? (
              <div className="flex flex-col gap-5">
                <div className="text-center py-4">
                  <span className="text-xs text-slate-400">다음 단어의 알맞은 뜻을 고르세요:</span>
                  <h2 className="text-4xl font-black text-white mt-2">
                    {quizQuestions[quizIndex].word.korean}
                  </h2>
                </div>

                {/* 4 Choices */}
                <div className="flex flex-col gap-2.5">
                  {quizQuestions[quizIndex].options.map((opt, i) => {
                    const isAnswer = opt === quizQuestions[quizIndex].answer;
                    const isSelected = selectedQuizOption === opt;
                    let style = 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-200';

                    if (selectedQuizOption) {
                      if (isAnswer) {
                        style = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold';
                      } else if (isSelected && !isAnswer) {
                        style = 'bg-rose-600/30 border-rose-500 text-rose-200 font-bold';
                      }
                    }

                    return (
                      <button
                        key={i}
                        disabled={!!selectedQuizOption}
                        onClick={() => {
                          soundFX.playSelect();
                          setSelectedQuizOption(opt);
                          if (isAnswer) {
                            setQuizScore((prev) => prev + 1);
                          }
                        }}
                        className={`w-full p-4 rounded-2xl border text-left font-semibold text-sm transition-all active:scale-[0.99] ${style}`}
                      >
                        {i + 1}. {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Next Question Button */}
                {selectedQuizOption && (
                  <button
                    onClick={() => {
                      soundFX.playNav();
                      setSelectedQuizOption(null);
                      setQuizIndex((prev) => prev + 1);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    {quizIndex === 9 ? '퀴즈 결과 보기 (Finish)' : '다음 문제 (Next Question)'}
                  </button>
                )}
              </div>
            ) : (
              /* Quiz Completed */
              <div className="flex flex-col items-center text-center gap-4 py-6">
                <Sparkles className="w-12 h-12 text-amber-400" />
                <h2 className="text-2xl font-black text-white">단어 퀴즈 완료!</h2>
                <div className="text-4xl font-black text-emerald-400">
                  {quizScore * 10}점 <span className="text-xl text-slate-500">({quizScore}/10)</span>
                </div>
                <button
                  onClick={() => startQuiz()}
                  className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  다시 퀴즈 풀기
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center gap-4 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-amber-400" />
            <h3 className="text-xl font-bold text-white">단어 수가 부족합니다 (Kata Tidak Cukup)</h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              단어 퀴즈를 진행하려면 최소 10개의 단어가 필요합니다. 현재 선택된 필터에 맞는 단어는 {filteredWords.length}개입니다.
            </p>
            <button
              onClick={() => {
                setViewMode('flashcard');
                setSearchQuery('');
                setSelectedDifficulty('ALL');
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setQuizWarning(null);
              }}
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              필터 초기화 및 단어장으로 이동
            </button>
          </div>
        )
      )}
    </div>
  );
};
