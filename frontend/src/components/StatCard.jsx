export default function StatCard({ icon: Icon, label, value, change, color = 'primary' }) {
  const schemes = {
    primary: {
      bg: 'from-primary/15 via-primary/5 to-transparent',
      border: 'border-primary/20 hover:border-primary/40',
      glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]',
      iconBg: 'bg-primary/10 border-primary/20',
      iconColor: 'text-primary-light',
      accent: 'from-primary to-primary-light',
    },
    success: {
      bg: 'from-success/15 via-success/5 to-transparent',
      border: 'border-success/20 hover:border-success/40',
      glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]',
      iconBg: 'bg-success/10 border-success/20',
      iconColor: 'text-success',
      accent: 'from-success to-emerald-400',
    },
    danger: {
      bg: 'from-danger/15 via-danger/5 to-transparent',
      border: 'border-danger/20 hover:border-danger/40',
      glow: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]',
      iconBg: 'bg-danger/10 border-danger/20',
      iconColor: 'text-danger',
      accent: 'from-danger to-rose-400',
    },
    accent: {
      bg: 'from-accent/15 via-accent/5 to-transparent',
      border: 'border-accent/20 hover:border-accent/40',
      glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]',
      iconBg: 'bg-accent/10 border-accent/20',
      iconColor: 'text-accent',
      accent: 'from-accent to-rose-300',
    },
  };

  const s = schemes[color] || schemes.primary;

  return (
    <div
      className={`group relative bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 ${s.glow} overflow-hidden animate-fade-in`}
    >
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${s.accent} opacity-60`}
      />

      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl border ${s.iconBg} flex items-center justify-center ${s.iconColor} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon size={20} />
        </div>
        {change !== undefined && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              change >= 0
                ? 'bg-success/15 text-success border border-success/20'
                : 'bg-danger/15 text-danger border border-danger/20'
            }`}
          >
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>

      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-sm text-text-muted mt-1">{label}</p>
    </div>
  );
}
