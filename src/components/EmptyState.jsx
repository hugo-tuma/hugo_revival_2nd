export default function EmptyState({ children }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center py-6 text-center font-sans text-sm text-neutral-500">
      {children}
    </div>
  );
}
