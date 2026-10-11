import React, { useState, useEffect, useMemo } from 'react';
import type { VocabularyWord } from '../types';
import { Search, Volume2, X, Bookmark, BookmarkCheck, Keyboard, Sparkles } from 'lucide-react';
import {
  extractChoseong,
  romanizeKorean,
  decomposeHangulToJamo,
  appendHangulChar,
  simplifyRomaja,
  extractConsonantSkeleton,
} from '../utils/koreanUtils';
import { soundFX } from '../utils/soundEffects';

interface QuickVocabDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IndexedVocabWord extends VocabularyWord {
  _koreanLower: string;
  _indoLower: string;
  _decompKorean: string;
  _choseong: string;
  _normRomaja: string;
  _simpRomaja: string;
  _cRomaja: string;
}

const HANGUL_CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const HANGUL_VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅔ'];

export const QuickVocabDrawer: React.FC<QuickVocabDrawerProps> = ({ isOpen, onClose }) => {
  const [indexedWords, setIndexedWords] = useState<IndexedVocabWord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [savedVocabIds, setSavedVocabIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('eps_ubt_memorized_vocab');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Load and pre-index 6,008 master vocabulary entries once
  useEffect(() => {
    if (!isOpen || indexedWords.length > 0) return;
    fetch('/bank/vocabulary/all_vocabulary.json')
      .then((res) => res.json())
      .then((data: VocabularyWord[]) => {
        const indexed: IndexedVocabWord[] = data.map((w) => {
          const choseong = extractChoseong(w.korean);
          const decompKorean = decomposeHangulToJamo(w.korean);
          const romaja = romanizeKorean(w.korean);
          const normRomaja = romaja.replace(/[^a-z0-9]/g, '');
          return {
            ...w,
            _koreanLower: w.korean.toLowerCase(),
            _indoLower: (w.indonesian || '').toLowerCase(),
            _decompKorean: decompKorean,
            _choseong: choseong,
            _normRomaja: normRomaja,
            _simpRomaja: simplifyRomaja(normRomaja),
            _cRomaja: extractConsonantSkeleton(normRomaja),
          };
        });
        setIndexedWords(indexed);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load quick vocabulary:', err);
        setLoading(false);
      });
  }, [isOpen, indexedWords.length]);

  const toggleBookmark = (id: string) => {
    soundFX.playSelect();
    setSavedVocabIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      try {
        localStorage.setItem('eps_ubt_memorized_vocab', JSON.stringify(Array.from(copy)));
      } catch {}
      return copy;
    });
  };

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

  const handleKeypadInsert = (char: string) => {
    soundFX.playSelect();
    setQuery((prev) => appendHangulChar(prev, char));
  };

  // Ultra-fast (< 2ms) filtered list with decomposed Hangul, Romaja, Choseong & Indonesian matching
  const filteredWords = useMemo(() => {
    if (!query.trim()) {
      return indexedWords.slice(0, 30);
    }
    const q = query.trim().toLowerCase();
    const decompQ = decomposeHangulToJamo(q);
    const isChoseongQuery = /^[ㄱ-ㅎ]+$/.test(q);
    const normQ = q.replace(/[^a-z0-9]/g, '');
    const simpQ = simplifyRomaja(normQ);
    const cQ = extractConsonantSkeleton(normQ);

    const results: IndexedVocabWord[] = [];
    for (let i = 0; i < indexedWords.length; i++) {
      const w = indexedWords[i];
      let matches = false;

      if (w._koreanLower.includes(q) || w._indoLower.includes(q)) {
        matches = true;
      } else if (decompQ && w._decompKorean.includes(decompQ)) {
        matches = true;
      } else if (isChoseongQuery && w._choseong.includes(q)) {
        matches = true;
      } else if (normQ) {
        if (w._normRomaja.includes(normQ) || w._simpRomaja.includes(simpQ)) {
          matches = true;
        } else if (cQ.length >= 2 && w._cRomaja.includes(cQ)) {
          matches = true;
        }
      }

      if (matches) {
        results.push(w);
        if (results.length >= 50) break;
      }
    }
    return results;
  }, [indexedWords, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end lg:justify-end animate-in fade-in duration-200">
      <div className="bg-slate-900 border-l border-slate-800 w-full sm:w-[420px] h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">빠른 단어 검색 (Quick Vocab)</h3>
              <p className="text-[11px] text-slate-400">로마자 · 초성 · 인도네시아어 검색</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Virtual Keypad Toggle */}
        <div className="p-4 border-b border-slate-800 flex flex-col gap-2.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: bakkuda, ㅂㄲㄷ, 바꾸다, ganti..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-16 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="absolute right-9 text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            ) : null}

            <button
              onClick={() => setShowKeypad(!showKeypad)}
              className={`absolute right-2 p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showKeypad
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="한글 가상 키패드 (Virtual Hangul Keypad)"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Virtual Hangul Keypad */}
          {showKeypad && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-2 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between px-1">
                <span>자음 (Consonants / Choseong)</span>
                <button
                  onClick={() => setQuery((prev) => prev.slice(0, -1))}
                  className="text-amber-400 font-semibold"
                >
                  지우기 ⌫
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {HANGUL_CONSONANTS.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleKeypadInsert(char)}
                    className="h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    {char}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-bold text-slate-400 px-1 mt-1">모음 (Vowels)</div>
              <div className="grid grid-cols-6 gap-1">
                {HANGUL_VOWELS.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleKeypadInsert(char)}
                    className="h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-sky-300 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>
              {query ? `검색 결과: ${filteredWords.length}개` : '추천 기본 단어 (6,008개 수록)'}
            </span>
            <span className="text-[10px] text-slate-500">Romaja & Choseong 지원</span>
          </div>
        </div>

        {/* Word Cards List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {loading ? (
            <div className="my-auto text-center text-xs text-slate-400">단어 로딩 중...</div>
          ) : filteredWords.length === 0 ? (
            <div className="my-auto text-center text-xs text-slate-400 p-6 bg-slate-950/40 rounded-2xl border border-slate-800">
              일치하는 단어가 없습니다.
            </div>
          ) : (
            filteredWords.map((w) => {
              const isSaved = savedVocabIds.has(w.id);
              return (
                <div
                  key={w.id}
                  className="bg-slate-800/70 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white tracking-wide">{w.korean}</span>
                      {w.wordType && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
                          {w.wordType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{w.indonesian}</p>
                    {w.koreanReading && (
                      <span className="text-[10px] text-slate-400 font-mono">[{w.koreanReading}]</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => speakKorean(w.korean)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
                      title="발음 듣기 (Listen TTS)"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleBookmark(w.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isSaved
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                      }`}
                      title={isSaved ? '암기 단어에서 제거' : '암기 단어로 저장'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
