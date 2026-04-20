import { COLLEGE_LOGO_URL } from '../utils/brand';

export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  action,
  showLogo = true,
}) {
  return (
    <div className="relative text-center py-16 px-6 overflow-hidden">
      {showLogo && (
        <img
          src={COLLEGE_LOGO_URL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 m-auto w-56 h-56 object-contain opacity-[0.04] pointer-events-none"
        />
      )}

      <div className="relative">
        {Icon && (
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(6,182,212,0.25)]">
            <Icon size={26} className="text-primary-light" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        {description && <p className="text-text-muted text-sm">{description}</p>}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
