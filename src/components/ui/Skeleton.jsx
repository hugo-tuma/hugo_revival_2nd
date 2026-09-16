export function SkeletonBlock({ className = '', style }) {
  return (
    <div className={`relative overflow-hidden bg-black/[0.06] ${className}`} style={style}>
      <div className="scanline-sweep absolute inset-0" />
    </div>
  );
}

export function SkeletonLine({ width = '100%' }) {
  return <SkeletonBlock className="h-3" style={{ width }} />;
}

export function FeedSkeleton({ rows = 4 }) {
  return (
    <div className="flex flex-col divide-y-2 divide-black/10">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 px-3 py-3">
          <SkeletonBlock className="h-8 w-8 shrink-0 border-2 border-black" />
          <div className="flex flex-1 flex-col gap-2">
            <SkeletonBlock className="h-2.5 w-1/3" />
            <SkeletonBlock className="h-2.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ height = 120 }) {
  return <SkeletonBlock className="w-full border-2 border-black" style={{ height }} />;
}
