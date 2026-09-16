export default function SectionHeading({ children, icon: Icon, right }) {
  return (
    <div className="flex items-center gap-2 border-b-2 border-black bg-black px-3 py-2 text-cream">
      {Icon && <Icon size={14} />}
      <h2 className="flex-1 text-xs font-bold uppercase tracking-widest">{children}</h2>
      {right}
    </div>
  );
}
