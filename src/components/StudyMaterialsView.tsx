import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, FileText, Music, ExternalLink, Search, CheckCircle, X, Loader2 } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface ChapterFile {
  title: string;
  type: 'PDF' | 'AUDIO';
  path: string;
  fallbackUrl?: string;
}

interface Chapter {
  number: number;
  title: string;
  files: ChapterFile[];
}

interface Material {
  id: string;
  title: string;
  koreanTitle: string;
  totalChapters: number;
  description: string;
  badge: string;
  path: string;
}

interface ChapterMetaFile {
  id?: string;
  title?: string | null;
  fileType?: string;
  orderIndex?: number;
  file?: {
    objectName?: string;
    url?: string;
    presignedUrl?: string;
    contentType?: string;
    size?: number;
  };
}

interface ChapterMetaItem {
  id: string;
  title?: string;
  orderIndex?: number;
  files?: ChapterMetaFile[];
}

function sanitizeFilename(name: string): string {
  const clean = name.replace(/[\\/*?:"<>|]/g, '_').trim();
  return clean.replace(/\s+/g, '_');
}

export const StudyMaterialsView: React.FC = () => {
  const [activeMaterialId, setActiveMaterialId] = useState<'indo' | 'standard_2026' | 'skill' | 'cbt'>('indo');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [activeAudioTrack, setActiveAudioTrack] = useState<string | null>(null);
  const [metaCache, setMetaCache] = useState<Record<string, Chapter[]>>({});
  const loading = !metaCache[activeMaterialId];

  const materials: Material[] = useMemo(() => [
    {
      id: 'indo',
      title: 'Korean to Bahasa Indonesia',
      koreanTitle: '인도네시아어 표준교재 (60과 완결)',
      totalChapters: 60,
      description: 'Bahasa Indonesia lengkap Bab 1 sampai Bab 60 beserta tata bahasa (Grammar), kosakata (Vocab), dan latihan soal.',
      badge: 'Bahasa Indonesia',
      path: '/bank/study_materials/korean_to_Bahasa_Indonesia',
    },
    {
      id: 'standard_2026',
      title: 'EPS TOPIK 2026 (Standard Textbook)',
      koreanTitle: '한국어 표준교재 2026 (음원 포함)',
      totalChapters: 67,
      description: 'Buku teks standar HRD Korea terbaru lengkap dengan 384 file audio listening percakapan dan latihan.',
      badge: 'Audio Included',
      path: '/bank/study_materials/EPS_TOPIK_2026',
    },
    {
      id: 'skill',
      title: 'SKILL TEST 2026',
      koreanTitle: '기능시험 가이드 (제조업 / 건설업)',
      totalChapters: 9,
      description: 'Panduan ujian keterampilan (Skill Test) wawancara, fisik, dan peralatan kerja.',
      badge: 'Skill Test',
      path: '/bank/study_materials/SKILL_TEST_2026',
    },
    {
      id: 'cbt',
      title: 'CBT - Job Related Questions',
      koreanTitle: '업종별 직무 관련 기출문제',
      totalChapters: 8,
      description: 'Kumpulan soal khusus bidang manufaktur, perikanan, pertanian, dan konstruksi.',
      badge: 'CBT Practice',
      path: '/bank/study_materials/CBT_-_Job_releted_questions',
    },
  ], []);

  const currentMat = materials.find((m) => m.id === activeMaterialId) || materials[0];

  // Fetch chapters metadata from disk archive
  useEffect(() => {
    if (metaCache[activeMaterialId]) {
      return;
    }

    fetch(`${currentMat.path}/chapters_meta.json`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ChapterMetaItem[]) => {
        const parsedChapters: Chapter[] = data.map((ch, chIdx) => {
          const chNum = chIdx + 1;
          const chTitle = ch.title || `Chapter_${chNum}`;
          const chClean = sanitizeFilename(chTitle);
          const chDir = `${chNum.toString().padStart(2, '0')}_${chClean}`;

          const files: ChapterFile[] = (ch.files || []).map((fEntry, fIdx) => {
            const fObj = fEntry.file || {};
            const fType = (fEntry.fileType || 'FILE').toUpperCase() as 'PDF' | 'AUDIO';
            const rawTitle = fEntry.title || (fObj.objectName ? fObj.objectName.split('/').pop() : '') || `File_${fIdx + 1}`;
            const ext = fType === 'PDF' ? '.pdf' : (fType === 'AUDIO' ? '.mp3' : '.dat');
            let fClean = sanitizeFilename(rawTitle);
            if (!fClean.toLowerCase().endsWith(ext)) {
              fClean += ext;
            }
            const fileName = `${(fIdx + 1).toString().padStart(2, '0')}_${fClean}`;
            const path = `${currentMat.path}/${chDir}/${fileName}`;

            let displayTitle = fEntry.title;
            if (!displayTitle || /^[0-9]{10,}/.test(displayTitle.trim())) {
              if (activeMaterialId === 'indo') {
                displayTitle = `Bab ${chNum} 교재 PDF (Buku Standar)`;
              } else if (fType === 'PDF') {
                displayTitle = `${ch.title || `Chapter ${chNum}`} 교재 PDF`;
              } else if (fType === 'AUDIO') {
                displayTitle = `${ch.title || `Chapter ${chNum}`} 음원 #${fIdx + 1}`;
              } else {
                displayTitle = fClean.replace(/^[0-9]+_/, '').replace(/\.[^/.]+$/, '');
              }
            }

            return {
              title: displayTitle,
              type: fType === 'AUDIO' ? 'AUDIO' : 'PDF',
              path,
              fallbackUrl: fObj.presignedUrl || fObj.url,
            };
          });

          return {
            number: chNum,
            title: ch.title || (activeMaterialId === 'indo' ? `Bab ${chNum} (과)` : `Chapter ${chNum}`),
            files,
          };
        });

        setMetaCache((prev) => ({ ...prev, [activeMaterialId]: parsedChapters }));
      })
      .catch((err) => {
        console.error('Failed to load chapters_meta.json:', err);
      });
  }, [activeMaterialId, currentMat.path, metaCache]);

  const chapters: Chapter[] = useMemo(() => {
    if (metaCache[activeMaterialId]) {
      return metaCache[activeMaterialId];
    }
    return Array.from({ length: currentMat.totalChapters }, (_, i) => ({
      number: i + 1,
      title: activeMaterialId === 'indo' ? `Bab ${i + 1} (과)` : `Chapter ${i + 1}`,
      files: [],
    }));
  }, [metaCache, activeMaterialId, currentMat.totalChapters]);

  const filteredChapters = useMemo(() => {
    return chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(c.number).includes(searchQuery)
    );
  }, [chapters, searchQuery]);

  const activeChapterData = chapters.find((c) => c.number === selectedChapter) || chapters[0];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Textbook Selector Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            교재 학습 라이브러리 (Study Materials)
          </span>
          <h2 className="text-2xl font-black text-white mt-1">EPS-TOPIK 공식 교재 및 음원</h2>
          <p className="text-xs text-slate-400 mt-1">
            Bahasa Indonesia 60 bab lengkap, buku standar HRD Korea 2026 dengan audio, materi wawancara Skill Test, dan CBT.
          </p>
        </div>

        {/* Material Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {materials.map((mat) => {
            const isActive = activeMaterialId === mat.id;
            return (
              <button
                key={mat.id}
                onClick={() => {
                  soundFX.playNav();
                  setActiveMaterialId(mat.id as 'indo' | 'standard_2026' | 'skill' | 'cbt');
                  setSelectedChapter(1);
                  setActiveAudioTrack(null);
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-blue-900/30 border-blue-500 shadow-md shadow-blue-900/20 ring-2 ring-blue-500/20'
                    : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}
                  >
                    {mat.badge}
                  </span>
                  <h4 className="font-extrabold text-sm text-white mt-2 leading-snug">{mat.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{mat.description}</p>
                </div>
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between border-t border-slate-700/60 pt-2">
                  <span>총 {mat.totalChapters}개 단원</span>
                  {isActive && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapters & Content Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Chapter List Navigation */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-white">단원 목록 ({currentMat.totalChapters}과)</h3>
            <span className="text-xs text-blue-400 font-semibold">{currentMat.badge}</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="단원 검색 (Search Chapter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Scrollable Chapter Grid / List */}
          <div className="max-h-[500px] overflow-y-auto flex flex-col gap-1.5 pr-1">
            {filteredChapters.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                검색된 단원이 없습니다.
              </div>
            ) : (
              filteredChapters.map((chap) => {
                const isSelected = selectedChapter === chap.number;
                return (
                  <button
                    key={chap.number}
                    onClick={() => {
                      soundFX.playNav();
                      setSelectedChapter(chap.number);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 opacity-80" />
                      <span>{chap.title}</span>
                    </span>
                    <span className="text-[10px] opacity-70">
                      {chap.files.length}개 파일
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Chapter Content & Reader / Audio Player */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                {currentMat.title}
              </span>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                {activeChapterData.title}
              </h2>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
              오프라인 파일 연동 (Local Archive)
            </span>
          </div>

          {/* Audio Player if present */}
          {activeAudioTrack && (
            <div className="bg-slate-800/90 border border-blue-500/40 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span>듣기 음원 재생 중: {activeChapterData?.files.find((f) => f.path === activeAudioTrack)?.title || decodeURIComponent(activeAudioTrack.split('/').pop() || '')}</span>
                </span>
                <button
                  onClick={() => setActiveAudioTrack(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  title="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <audio
                controls
                autoPlay
                src={activeAudioTrack}
                className="w-full h-9 rounded-lg mt-1"
                onError={(e) => {
                  const file = activeChapterData?.files.find((f) => f.path === activeAudioTrack);
                  if (file?.fallbackUrl && e.currentTarget.src !== file.fallbackUrl) {
                    e.currentTarget.src = file.fallbackUrl;
                  }
                }}
              />
            </div>
          )}

          {/* Files List */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase">단원 학습 자료 (Chapter Files)</h4>
            {loading && (!activeChapterData || activeChapterData.files.length === 0) ? (
              <div className="flex items-center justify-center p-8 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>단원 자료 목록을 불러오는 중입니다...</span>
              </div>
            ) : activeChapterData && activeChapterData.files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeChapterData.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          file.type === 'PDF'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {file.type === 'PDF' ? <FileText className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {file.type} 문서
                        </span>
                        <h5 className="font-bold text-sm text-white truncate" title={file.title}>
                          {file.title}
                        </h5>
                      </div>
                    </div>

                    {/* Actions */}
                    {file.type === 'PDF' ? (
                      <a
                        href={file.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>PDF 교재 열기 (Open PDF)</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          document.querySelectorAll('audio').forEach((el) => {
                            try {
                              el.pause();
                            } catch {}
                          });
                          setActiveAudioTrack(file.path);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>오디오 듣기 (Play Audio)</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs text-center">
                이 단원에 등록된 파일이 없습니다.
              </div>
            )}
          </div>

          {/* Quick Study Tip Banner */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">💡 EPS-TOPIK 학습 팁:</strong> 인도네시아어 표준교재의 문법(Grammar)과 단어 목록을 먼저 학습한 후, 2026 표준교재의 대화(Dialogue) 음원을 반복해서 2~3회 청취하면 듣기 영역(Listening 20문항)에서 고득점을 받을 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
};
