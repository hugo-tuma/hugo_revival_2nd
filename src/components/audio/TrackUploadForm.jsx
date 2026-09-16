import { useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { supabase, audioStoragePath, getPublicAudioUrl, AUDIO_BUCKET } from '../../lib/supabase';
import { decodeAudioMetadata } from '../../utils/audioDecode';
import { useCreateTrack } from '../../hooks/useSpacesQueries';
import { toastError } from '../../stores/toastStore';

const STAGES = {
  idle: null,
  decoding: 'Decoding audio (Web Audio API)...',
  uploading: 'Uploading to storage...',
  saving: 'Saving track...',
};

export default function TrackUploadForm({ userId, isWip = false, onUploaded }) {
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('idle');
  const createTrack = useCreateTrack(userId);

  const busy = stage !== 'idle';

  const reset = () => {
    setTitle('');
    setFile(null);
    setStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim() || !userId) return;

    try {
      setStage('decoding');
      const { duration, peaks } = await decodeAudioMetadata(file);

      setStage('uploading');
      const path = audioStoragePath(userId, file);
      const { error: uploadError } = await supabase.storage.from(AUDIO_BUCKET).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type || 'audio/mpeg',
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const audioUrl = getPublicAudioUrl(path);

      setStage('saving');
      await createTrack.mutateAsync({
        title: title.trim(),
        duration,
        audio_url: audioUrl,
        waveform_data: peaks,
        is_wip: isWip,
      });

      onUploaded?.();
      reset();
    } catch (err) {
      toastError(err.message || 'Upload failed');
      setStage('idle');
    }
  };

  return (
    <form onSubmit={submit} className="border-2 border-black bg-white p-3 flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-black/50">
        {isWip ? 'Upload a WIP stem' : 'Upload a track'}
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Track title"
        disabled={busy}
        className="border-2 border-black px-2 py-1.5 text-sm font-mono disabled:opacity-50"
        required
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        disabled={busy}
        className="text-xs file:mr-2 file:border-2 file:border-black file:bg-cream file:px-2 file:py-1 file:text-[10px] file:font-bold file:uppercase disabled:opacity-50"
        required
      />
      <button
        type="submit"
        disabled={busy || !file || !title.trim()}
        className="border-2 border-black bg-spark px-3 py-1.5 text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-black hover:text-cream disabled:opacity-40 disabled:hover:bg-spark disabled:hover:text-black transition-colors"
      >
        {busy ? (
          <>
            <Loader2 size={13} className="animate-spin" /> {STAGES[stage]}
          </>
        ) : (
          <>
            <UploadCloud size={13} /> Upload
          </>
        )}
      </button>
    </form>
  );
}
