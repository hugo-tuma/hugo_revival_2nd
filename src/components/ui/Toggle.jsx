export default function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 py-2">
      <span className="text-sm font-semibold">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 border-2 border-black transition-colors ${checked ? 'bg-spark' : 'bg-cream'}`}>
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 bg-black transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </span>
    </button>
  );
}
