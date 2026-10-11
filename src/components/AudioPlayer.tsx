import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, FastForward } from 'lucide-react';
import { mobileDevice } from '../utils/hapticsAndWakeLock';
import { soundFX } from '../utils/soundEffects';

interface AudioPlayerProps {
  src: string;
  fallbackSrc?: string;
  questionNumber: number;
  maxPlays?: number;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  fallbackSrc,
  questionNumber: _questionNumber,
  maxPlays = 2,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playCount, setPlayCount] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  const isMidPlayback = currentTime > 0 && (!duration || currentTime < duration - 0.2);
  const canPlay = playCount < maxPlays || isPlaying || (playCount <= maxPlays && isMidPlayback);

  const handlePlay = useCallback(() => {
    if (!audioRef.current) return;
    const isMid = currentTime > 0 && (!duration || currentTime < duration - 0.2);
    if (playCount >= maxPlays && !isPlaying && !isMid) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      mobileDevice.triggerHaptic('tap');
    } else {
      // Pause any option audio if playing
      window.dispatchEvent(new CustomEvent('ubt-stop-option-audio'));
      mobileDevice.triggerHaptic('select');
      mobileDevice.acquireWakeLock();

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          // Only increment play count if starting from near beginning
          if (currentTime < 1) {
            setPlayCount((prev) => prev + 1);
          }
        })
        .catch((err) => {
          console.warn('Audio play prevented:', err);
        });
    }
  }, [isPlaying, playCount, maxPlays, currentTime, duration]);

  // Handle autoPlay on mount
  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => {
        handlePlay();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, handlePlay]);

  // Cleanup audio playback on unmount
  useEffect(() => {
    const el = audioRef.current;
    return () => {
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
    };
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    mobileDevice.triggerHaptic('success');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      mobileDevice.triggerHaptic('tap');
    }
  };

  const handleSpeedChange = () => {
    const rates = [1.0, 0.9, 1.1];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
    soundFX.playSelect();
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex flex-col gap-3">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={(e) => {
          if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
            e.currentTarget.src = fallbackSrc;
            e.currentTarget.load();
          }
        }}
        preload="metadata"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Play / Pause button & Status */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handlePlay}
            disabled={!canPlay}
            className={`w-13 h-13 rounded-2xl flex items-center justify-center font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
              !canPlay
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/60'
                : isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 ring-2 ring-blue-500/40'
            }`}
            title={canPlay ? (isPlaying ? '일시정지 (Pause)' : '듣기 재생 (Play)') : '재생 횟수 초과'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm text-slate-100 truncate">
                {isPlaying ? '음원 재생 중...' : '듣기 평가 음원 (Audio Track)'}
              </span>

              {/* Play count badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  maxPlays >= 999
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : playCount >= maxPlays
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : playCount > 0
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}
              >
                {maxPlays >= 999 ? `검토 무제한 (${playCount}회)` : `재생: ${playCount}/${maxPlays}회`}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {maxPlays >= 999
                ? '오답 검토 모드에서는 반복 청취할 수 있습니다.'
                : playCount >= maxPlays && !isPlaying
                ? '⚠️ 최대 2회 청취가 완료되었습니다.'
                : 'HRD Korea 표준 규정: 문항당 최대 2회 청취.'}
            </p>
          </div>
        </div>

        {/* Audio Wave Bars & Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Waveform / Visualizer bars */}
          <div className="flex items-center gap-1 h-6 px-2.5 py-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {[10, 18, 14, 22, 16, 12, 20, 14].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlaying ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(6, (h * ((currentTime * 3) % 2 + 0.4)) % 22)}px` : '5px',
                }}
              />
            ))}
          </div>

          {/* Speed Selector Button (0.9x / 1.0x / 1.1x) */}
          <button
            onClick={handleSpeedChange}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            title="재생 속도 변경 (Speed)"
          >
            <FastForward className="w-3 h-3 text-blue-400" />
            <span>{playbackRate}x</span>
          </button>

          {/* Time & Volume */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Progress slider */}
      <div className="w-full">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          disabled={!canPlay && !isPlaying}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    </div>
  );
};
