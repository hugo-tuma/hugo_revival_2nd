import { cn } from '../lib/cn';

export default function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-neutral-200', className)} />;
}
