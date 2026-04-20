export default function Loader({ size = 'md', label }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className={`${sizes[size]} border-primary/20 border-t-primary rounded-full animate-spin`} />
      {label && <p className="text-xs text-text-muted tracking-wider uppercase">{label}</p>}
    </div>
  );
}
