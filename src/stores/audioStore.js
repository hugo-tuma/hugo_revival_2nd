import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Single global playback store. Exactly one WaveSurfer instance is created by
// <GlobalPlayerBar/>, mounted once at the App root, and registered here via
// setWavesurfer — every board reads/controls playback through this store
// instead of owning its own <audio> element, so switching between Your
// Space / Artist Page / Customize never interrupts or restarts a track.
export const useAudioStore = create(
  persist(
    (set, get) => ({
      wavesurfer: null,
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      history: [],
      isPlaying: false,
      isReady: false,
      pendingAutoplay: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      loop: false,

      // Set once by <GlobalPlayerBar/> right after WaveSurfer.create(). The
      // instance itself is never persisted (it isn't serializable) — only
      // the metadata below survives a reload, via `partialize`.
      setWavesurfer: (instance) => set({ wavesurfer: instance }),

      // Pure state update; the actual ws.load() call happens in
      // <WaveformPlayer/>'s effect reacting to `currentTrack` so there is
      // exactly one code path that ever loads audio into the instance.
      loadTrack: (track, queue, autoplay = false) => {
        const resolvedQueue = queue ?? get().queue;
        const prevHistory = get().history.filter((t) => t.id !== track.id);
        set({
          currentTrack: track,
          queue: resolvedQueue,
          queueIndex: resolvedQueue.findIndex((t) => t.id === track.id),
          currentTime: 0,
          isReady: false,
          pendingAutoplay: autoplay,
          history: [track, ...prevHistory].slice(0, 30),
        });
      },

      playTrack: (track, queue) => get().loadTrack(track, queue, true),

      play: () => get().wavesurfer?.play(),
      pause: () => get().wavesurfer?.pause(),
      toggle: () => get().wavesurfer?.playPause(),
      seekToRatio: (ratio) => get().wavesurfer?.seekTo(Math.min(1, Math.max(0, ratio))),
      seekBy: (deltaSeconds) => {
        const ws = get().wavesurfer;
        if (!ws) return;
        const d = ws.getDuration();
        if (!d) return;
        const next = Math.min(d, Math.max(0, ws.getCurrentTime() + deltaSeconds));
        ws.seekTo(next / d);
      },
      setVolume: (v) => {
        set({ volume: v });
        get().wavesurfer?.setVolume(v);
      },
      toggleLoop: () => set((s) => ({ loop: !s.loop })),

      playNext: () => {
        const { queue, queueIndex, loop } = get();
        if (queue.length === 0) return;
        let next = queueIndex + 1;
        if (next >= queue.length) {
          if (!loop) return;
          next = 0;
        }
        get().loadTrack(queue[next], queue, true);
      },
      playPrev: () => {
        const { queue, queueIndex } = get();
        if (queue.length === 0) return;
        const prev = Math.max(0, queueIndex - 1);
        get().loadTrack(queue[prev], queue, true);
      },

      _onReady: (duration) => {
        set({ isReady: true, duration });
        if (get().pendingAutoplay) {
          get().wavesurfer?.play();
          set({ pendingAutoplay: false });
        }
      },
      _onPlay: () => set({ isPlaying: true }),
      _onPause: () => set({ isPlaying: false }),
      _onTimeUpdate: (t) => set({ currentTime: t }),
      _onFinish: () => {
        const { loop, wavesurfer } = get();
        if (loop) {
          wavesurfer?.seekTo(0);
          wavesurfer?.play();
        } else {
          get().playNext();
        }
      },
    }),
    {
      name: 'spaces-audio-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        loop: state.loop,
        queue: state.queue,
        queueIndex: state.queueIndex,
        history: state.history,
      }),
    }
  )
);
