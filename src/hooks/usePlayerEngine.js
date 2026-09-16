import { useCallback, useEffect, useRef, useState } from 'react';

// Every track in this demo shares one bundled audio file (see public/audio and
// README "Known limits") — there's no real per-track audio hosted, so the
// player is honest about playing *a* sound rather than faking a specific
// track's real runtime. Title/artist shown in the transport bar are real
// track metadata; the elapsed/total time is the real position in this file.
const AUDIO_SRC = '/audio/demo-track.wav';

export default function usePlayerEngine() {
  const audioRef = useRef(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = repeat;
  }, [repeat]);

  const playTrack = useCallback((track) => {
    setNowPlaying({ id: track.id, title: track.title, artistName: track.artist?.display_name });
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay can be blocked before the first user gesture on some
      // browsers; the click that triggered this already counts as one, so
      // this only matters if that gesture didn't register in time.
    });
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [nowPlaying]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const audioElementProps = {
    ref: audioRef,
    src: AUDIO_SRC,
    preload: 'metadata',
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onTimeUpdate: (e) => setCurrentTime(e.currentTarget.currentTime),
    onLoadedMetadata: (e) => setDuration(e.currentTarget.duration),
    onEnded: () => setIsPlaying(false),
  };

  return {
    nowPlaying,
    isPlaying,
    currentTime,
    duration,
    repeat,
    volume,
    playTrack,
    togglePlay,
    seek,
    setRepeat,
    setVolume,
    audioElementProps,
  };
}
