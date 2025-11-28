'use client';

import { useRef, useState, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  onRequestPlay: (audio: HTMLAudioElement) => void;
  className?: string;
}

const formatTime = (value: number) => {
  if (!value || Number.isNaN(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const toStreamableUrl = (url: string) => {
  if (!url) return url;
  if (url.includes('dropbox.com')) {
    if (url.includes('?dl=0') || url.includes('?dl=1')) {
      return url.replace('?dl=0', '?raw=1').replace('?dl=1', '?raw=1');
    }
    return url.includes('?') ? `${url}&raw=1` : `${url}?raw=1`;
  }
  return url;
};

export default function AudioPlayer({ src, onRequestPlay, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [lastVolume, setLastVolume] = useState(70);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume / 100;
    if (volume === 0) {
      audio.muted = true;
    } else {
      audio.muted = false;
    }
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      onRequestPlay(audio);
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleProgressChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = value;
    setProgress(value);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (value > 0) {
      setLastVolume(value);
    }
  };

  const toggleMute = () => {
    if (volume === 0) {
      const restored = Math.max(lastVolume, 50);
      setVolume(restored);
      return;
    }
    setVolume(0);
  };

  return (
    <div className={`audio-player ${className || ''}`}>
      <audio ref={audioRef} src={toStreamableUrl(src)} preload="metadata" />
      <div className="audio-controls">
        <button
          type="button"
          className="audio-button"
          onClick={togglePlay}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="audio-progress">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="0.1"
            value={progress}
            onChange={(e) => handleProgressChange(Number(e.target.value))}
            disabled={!duration}
          />
          <span className="audio-time">
            {formatTime(progress)} / {formatTime(duration)}
          </span>
        </div>
        <div className="audio-volume">
          <button type="button" className="audio-button" onClick={toggleMute}>
            {volume === 0 ? 'Unmute' : 'Mute'}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
          />
          <span className="audio-volume-label">{volume}%</span>
        </div>
      </div>
    </div>
  );
}

