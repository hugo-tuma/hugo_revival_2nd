// Retro scanline placeholder shown while a waveform is decoding.
export default function WaveformSkeleton({ height = 56 }) {
  const bars = 46;
  return (
    <div style={{ height }} className="relative flex items-end gap-[2px] overflow-hidden bg-black/[0.03]">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-black/10"
          style={{ height: `${20 + ((i * 37) % 60)}%` }}
        />
      ))}
      <div className="scanline-sweep absolute inset-0" />
    </div>
  );
}
