import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Server, Check, AlertCircle,
  RefreshCw, Zap, Globe, Webhook, Brain, Clock,
  Key, Shield, Cpu,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getHealth } from '../api/client';
import { COLLEGE_LOGO_URL, COLLEGE_NAME } from '../utils/brand';
import { getUser } from '../utils/auth';

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await getHealth();
      setHealth({ status: 'connected', ...res });
    } catch {
      setHealth({ status: 'error', message: 'Cannot reach backend' });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { checkHealth(); }, []);

  const user = getUser();

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="absolute -top-20 left-20 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[130px] pointer-events-none" />

      <PageHeader
        kicker="System"
        title="Settings &"
        highlight="Status"
        icon={SettingsIcon}
        subtitle="Configuration, infrastructure and account"
        action={
          <button
            onClick={checkHealth}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-text-muted hover:text-white hover:border-primary/40 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Hero status card */}
      <div className="relative bg-surface-card border border-border rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-light to-accent" />
        <div className="p-6">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg shadow-primary/20">
              <img src={COLLEGE_LOGO_URL} alt={COLLEGE_NAME} className="w-full h-full object-contain" />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg-secondary ${
                health?.status === 'connected' ? 'bg-success animate-pulse' : health?.status === 'error' ? 'bg-danger' : 'bg-accent'
              }`} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-primary-light font-semibold tracking-widest uppercase mb-1">
                {COLLEGE_NAME}
              </p>
              <h2 className="text-xl font-bold text-white">Voice AI India Dashboard</h2>
              <p className="text-sm text-text-muted mt-0.5">Signed in as {user?.email || user?.username || user?.name || 'Guest'}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              {health?.status === 'connected' ? (
                <>
                  <Check size={16} className="text-success" />
                  <span className="text-sm text-white font-medium">All systems operational</span>
                </>
              ) : health?.status === 'error' ? (
                <>
                  <AlertCircle size={16} className="text-danger" />
                  <span className="text-sm text-white font-medium">Backend unreachable</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-white font-medium">Checking…</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        <StatusCard
          icon={Server}
          title="Backend API"
          subtitle="http://localhost:5000"
          status={health?.status === 'connected' ? 'connected' : health?.status === 'error' ? 'error' : 'checking'}
        />
        <StatusCard
          icon={Zap}
          title="Voice Provider"
          subtitle="Bolna API · India"
          status="connected"
          label="Active"
        />
        <StatusCard
          icon={Globe}
          title="Region"
          subtitle="Asia/Kolkata (IST)"
          status="connected"
          label="IN"
        />
        <StatusCard
          icon={Cpu}
          title="Booking Extraction"
          subtitle="OpenAI GPT-4o Mini"
          status="connected"
          label="Ready"
        />
      </div>

      {/* Environment grid */}
      <div className="relative bg-surface-card border border-border rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <SettingsIcon size={18} className="text-primary-light" />
          Environment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Webhook, label: 'Webhook URL', value: '/webhooks/bolna', mono: true },
            { icon: Clock, label: 'Auto Poller', value: 'Every 30s' },
            { icon: Brain, label: 'Booking Model', value: 'GPT-4o Mini' },
            { icon: Globe, label: 'Timezone', value: 'Asia/Kolkata' },
          ].map(item => (
            <div key={item.label} className="bg-surface/60 border border-border/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-primary-light">
                <item.icon size={14} />
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">
                  {item.label}
                </p>
              </div>
              <p className={`text-sm text-white font-medium ${item.mono ? 'font-mono' : ''}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Setup guide */}
      <div className="relative bg-surface-card border border-border rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} className="text-accent" />
          <h3 className="text-lg font-semibold text-white">Quick Setup Guide</h3>
        </div>
        <ol className="space-y-3">
          {[
            { text: 'Add your', code: 'BOLNA_API_KEY', tail: 'in backend .env file', icon: Key },
            { text: 'Add your', code: 'OPENAI_API_KEY', tail: 'for booking extraction', icon: Key },
            { text: 'Configure Bolna webhook URL to point to', code: 'your-domain/webhooks/bolna', icon: Webhook },
            { text: 'Create an Assistant, then start making calls!', icon: Zap },
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-4 p-3.5 rounded-xl bg-surface/40 border border-border/40 hover:border-primary/30 transition-colors">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-lg shadow-primary/25">
                {i + 1}
              </span>
              <div className="flex-1 text-sm text-text-muted pt-0.5">
                <span>{step.text}</span>
                {step.code && (
                  <>
                    {' '}
                    <code className="px-1.5 py-0.5 bg-bg border border-primary/30 rounded text-primary-light text-xs font-mono">
                      {step.code}
                    </code>
                  </>
                )}
                {step.tail && <span> {step.tail}</span>}
              </div>
              <step.icon size={14} className="text-text-muted/50 mt-1" />
            </li>
          ))}
        </ol>
      </div>

      {/* Brand footer */}
      <div className="relative bg-gradient-to-r from-primary/5 via-surface-card to-accent/5 border border-border rounded-2xl p-5 backdrop-blur-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center">
          <img src={COLLEGE_LOGO_URL} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{COLLEGE_NAME}</p>
          <p className="text-xs text-text-muted">Imparting Value Based Education · Voice AI Project</p>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, title, subtitle, status, label }) {
  const pill = {
    connected: <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/20 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />{label || 'Connected'}</span>,
    error: <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger/15 text-danger border border-danger/20 text-xs font-medium"><AlertCircle size={11} />Disconnected</span>,
    checking: <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/20 text-xs font-medium"><div className="w-2.5 h-2.5 border border-accent border-t-transparent rounded-full animate-spin" />Checking</span>,
  };

  return (
    <div className="group bg-surface-card border border-border rounded-2xl p-5 backdrop-blur-xl hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light flex-shrink-0 group-hover:scale-110 transition-transform">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{title}</p>
            <p className="text-xs text-text-muted truncate font-mono">{subtitle}</p>
          </div>
        </div>
        {pill[status]}
      </div>
    </div>
  );
}
