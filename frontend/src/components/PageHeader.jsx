export default function PageHeader({
  kicker,
  title,
  highlight,
  subtitle,
  icon: Icon,
  action,
}) {
  return (
    <div className="relative flex items-start justify-between gap-4 flex-wrap">
      <div>
        {kicker && (
          <div className="flex items-center gap-2 text-xs text-primary-light mb-2 font-medium tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
            {kicker}
          </div>
        )}
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          {Icon && (
            <span className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light">
              <Icon size={20} />
            </span>
          )}
          <span>
            {title}
            {highlight && (
              <>
                {' '}
                <span className="bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
                  {highlight}
                </span>
              </>
            )}
          </span>
        </h1>
        {subtitle && <p className="text-text-muted mt-1.5 text-sm">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
