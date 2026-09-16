import { cn } from '../lib/cn';

export default function SparkBadge({ value = 0, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-black px-2 py-0.5 font-mono text-xs text-white',
        className
      )}
    >
      &#9889;{value}
    </span>
  );
}
