import { useMemo, useRef, useState } from 'react';
import { Pause, Pin, Play, Send } from 'lucide-react';
import WaveformPlayer from '../WaveformPlayer';
import { formatTime, timeAgo } from '../../utils/format';
import { useAddTrackNote, useTrackNotes } from '../../hooks/useSpacesQueries';
import { initialsOf } from '../../utils/format';

/**
 * A fully independent WaveSurfer instance (deliberately not routed through
 * the global audio store — this is a producer's work-in-progress stem, not
 * the persistent "now playing" track) with Regions-plugin pins rendered
 * directly on the canvas for each top-level track_note, and a reply thread
 * underneath the pin a fan clicks.
 */
export default function WipStemPlayer({ track, currentUserId }) {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [newNoteDraft, setNewNoteDraft] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const { data: notes = [] } = useTrackNotes(track.id);
  const addNote = useAddTrackNote(track.id, currentUserId);

  const topLevelNotes = useMemo(() => notes.filter((n) => !n.parent_id), [notes]);
  const activeNote = topLevelNotes.find((n) => n.id === activeNoteId) ?? null;
  const replies = useMemo(
    () => notes.filter((n) => n.parent_id === activeNoteId),
    [notes, activeNoteId]
  );

  const submitReply = () => {
    if (!replyDraft.trim() || !activeNote) return;
    addNote.mutate(
      { timestamp_sec: activeNote.timestamp_sec, content: replyDraft.trim(), parent_id: activeNote.id },
      { onSuccess: () => setReplyDraft('') }
    );
  };

  const submitNewNote = () => {
    if (!newNoteDraft.trim()) return;
    const t = playerRef.current?.getCurrentTime() ?? 0;
    addNote.mutate(
      { timestamp_sec: t, content: newNoteDraft.trim() },
      {
        onSuccess: (created) => {
          setNewNoteDraft('');
          setAddingNote(false);
          setActiveNoteId(created.id);
        },
      }
    );
  };

  return (
    <div className="space-card border-2 border-dashed border-black bg-cream p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => playerRef.current?.playPause()}
          className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-black text-cream hover:bg-spark hover:text-black transition-colors"
        >
          {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{track.title}</p>
          <p className="text-[10px] text-black/50">{topLevelNotes.length} pinned note{topLevelNotes.length === 1 ? '' : 's'}</p>
        </div>
        <button
          onClick={() => setAddingNote((v) => !v)}
          className="shrink-0 border-2 border-black px-2 py-1 text-[10px] font-bold uppercase hover:bg-black/5 flex items-center gap-1"
        >
          <Pin size={11} /> Pin note here
        </button>
      </div>

      <div className="mt-3">
        <WaveformPlayer
          ref={playerRef}
          track={track}
          height={64}
          notes={topLevelNotes}
          onNoteClick={(note) => setActiveNoteId(note.id)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onFinish={() => setIsPlaying(false)}
          onTimeUpdate={setCurrentTime}
          onReady={(d) => setDuration(d)}
        />
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-black/50">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {addingNote && (
        <div className="mt-2 flex gap-1">
          <input
            autoFocus
            value={newNoteDraft}
            onChange={(e) => setNewNoteDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitNewNote()}
            placeholder={`Pin a note at ${formatTime(playerRef.current?.getCurrentTime() ?? currentTime)}...`}
            className="flex-1 border-2 border-black px-2 py-1 text-xs font-mono"
          />
          <button
            onClick={submitNewNote}
            className="space-btn border-2 border-black bg-spark px-2 hover:bg-black hover:text-cream"
          >
            <Send size={13} />
          </button>
        </div>
      )}

      {activeNote && (
        <div className="mt-3 border-2 border-black bg-white p-2">
          <div className="flex items-start gap-2">
            <Pin size={12} className="mt-0.5 shrink-0 text-spark" />
            <div className="min-w-0 flex-1">
              <p className="text-xs">
                <span className="font-bold">{activeNote.author?.display_name}</span>{' '}
                <span className="text-black/50">@ {formatTime(activeNote.timestamp_sec)}</span>
              </p>
              <p className="text-xs mt-0.5">{activeNote.content}</p>
            </div>
          </div>

          {replies.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5 border-t-2 border-black/10 pt-2 pl-4">
              {replies.map((r) => (
                <div key={r.id} className="text-xs">
                  <span className="font-bold">{initialsOf(r.author?.display_name)}</span>{' '}
                  <span className="text-black/70">{r.content}</span>{' '}
                  <span className="text-[9px] text-black/40">{timeAgo(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 flex gap-1">
            <input
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitReply()}
              placeholder="Reply to this note..."
              className="flex-1 border-2 border-black px-2 py-1 text-xs font-mono"
            />
            <button onClick={submitReply} className="border-2 border-black px-2 hover:bg-black hover:text-cream">
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
