import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Phone, Bot, Megaphone,
  Settings, FileText, LogOut, User, ChevronRight,
} from 'lucide-react';
import { getUser, clearUser } from '../utils/auth';
import { COLLEGE_LOGO_URL, COLLEGE_NAME } from '../utils/brand';
import toast from 'react-hot-toast';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', hint: 'Overview' },
  { to: '/calls', icon: Phone, label: 'Calls', hint: 'Voice sessions' },
  { to: '/transcripts', icon: FileText, label: 'Transcripts', hint: 'Recordings & text' },
  { to: '/assistants', icon: Bot, label: 'Assistants', hint: 'AI agents' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns', hint: 'Bulk calling' },
  { to: '/settings', icon: Settings, label: 'Settings', hint: 'System' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearUser();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || user?.username || 'Guest';
  const displayMeta = user?.email || (user?.provider === 'local' ? 'Local account' : '');

  return (
    <aside className="relative w-64 min-h-screen bg-bg-secondary/80 backdrop-blur-xl border-r border-border flex flex-col">
      {/* Ambient top glow */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      {/* Brand */}
      <div className="relative p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-primary/20">
            <img
              src={COLLEGE_LOGO_URL}
              alt={COLLEGE_NAME}
              className="w-full h-full object-contain"
            />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-success border-2 border-bg-secondary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate tracking-tight">Voice AI</h1>
            <p className="text-[11px] text-text-muted truncate">{COLLEGE_NAME}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold px-3 mt-2 mb-2">
          Navigation
        </p>

        {links.map(({ to, icon: Icon, label, hint }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-white shadow-[inset_0_0_0_1px_rgba(6,182,212,0.35)]'
                  : 'text-text-muted hover:text-white hover:bg-surface/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-gradient-to-b from-primary-light to-accent" />
                )}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary/20 text-primary-light shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'text-text-muted group-hover:bg-surface group-hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <span className="truncate">{label}</span>
                  {hint && (
                    <span className="text-[10px] text-text-muted/70 font-normal truncate">
                      {hint}
                    </span>
                  )}
                </div>
                <ChevronRight
                  size={14}
                  className={`transition-all ${
                    isActive
                      ? 'text-primary-light opacity-100'
                      : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer — user card + logout */}
      <div className="relative p-3 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-surface/60 border border-border/60">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-lg object-cover ring-2 ring-primary/30"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-semibold shadow-lg shadow-primary/25">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            {displayMeta && (
              <p className="text-[11px] text-text-muted truncate">{displayMeta}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="group w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium transition-all border border-danger/10 hover:border-danger/30"
        >
          <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Sign Out
        </button>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/10">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <div className="text-[10px]">
            <p className="text-primary-light font-semibold">Bolna API · India</p>
            <p className="text-text-muted">All systems operational</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
