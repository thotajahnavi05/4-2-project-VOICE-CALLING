import { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Play, Pause, Trash2, X, Users,
  CheckCircle2, XCircle, Zap,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import {
  getCampaigns, createCampaign, startCampaign,
  pauseCampaign, deleteCampaign, getAssistants,
} from '../api/client';
import toast from 'react-hot-toast';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [assistants, setAssistants] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', assistantId: '', phoneNumbers: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [campRes, assistRes] = await Promise.all([getCampaigns(), getAssistants()]);
      setCampaigns(campRes.data || []);
      setAssistants(assistRes.data || []);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.assistantId) { toast.error('Fill required fields'); return; }
    setCreating(true);
    try {
      const phones = form.phoneNumbers.split('\n').map(p => p.trim()).filter(Boolean);
      await createCampaign({ ...form, phoneNumbers: phones });
      toast.success('Campaign created!');
      setShowCreate(false);
      setForm({ name: '', description: '', assistantId: '', phoneNumbers: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async (id) => {
    try {
      const res = await startCampaign(id);
      toast.success(`Started! ${res.callsInitiated} call${res.callsInitiated === 1 ? '' : 's'} initiated`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePause = async (id) => {
    try {
      await pauseCampaign(id);
      toast.success('Campaign paused');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await deleteCampaign(id);
      toast.success('Campaign deleted');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const statusBadge = (s) => {
    const map = {
      active: { cls: 'bg-success/15 text-success border-success/20', dot: 'bg-success animate-pulse' },
      paused: { cls: 'bg-accent/15 text-accent border-accent/20', dot: 'bg-accent' },
      completed: { cls: 'bg-primary/15 text-primary-light border-primary/20', dot: 'bg-primary-light' },
      draft: { cls: 'bg-surface text-text-muted border-border', dot: 'bg-text-muted' },
    };
    const v = map[s] || map.draft;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5 ${v.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
        {s}
      </span>
    );
  };

  const overallStats = {
    total: campaigns.reduce((a, c) => a + (c.totalCalls || 0), 0),
    completed: campaigns.reduce((a, c) => a + (c.completedCalls || 0), 0),
    failed: campaigns.reduce((a, c) => a + (c.failedCalls || 0), 0),
    active: campaigns.filter(c => c.status === 'active').length,
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />

      <PageHeader
        kicker="Bulk Calling"
        title="Voice"
        highlight="Campaigns"
        icon={Megaphone}
        subtitle="Run automated voice outreach at scale"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            New Campaign
          </button>
        }
      />

      {/* Overall stats */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
          {[
            { label: 'Active', value: overallStats.active, icon: Zap, color: 'text-success', bg: 'from-success/15' },
            { label: 'Total Calls', value: overallStats.total, icon: Users, color: 'text-primary-light', bg: 'from-primary/15' },
            { label: 'Completed', value: overallStats.completed, icon: CheckCircle2, color: 'text-success', bg: 'from-success/15' },
            { label: 'Failed', value: overallStats.failed, icon: XCircle, color: 'text-danger', bg: 'from-danger/15' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.bg} to-transparent border border-border rounded-2xl p-4 backdrop-blur-xl`}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={14} className={s.color} />
                <p className="text-xs text-text-muted font-medium">{s.label}</p>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <Loader label="Loading campaigns" />
      ) : campaigns.length === 0 ? (
        <div className="bg-surface-card border border-border rounded-2xl backdrop-blur-xl relative">
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Run automated voice outreach at scale by creating a campaign."
            action={
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium shadow-lg shadow-primary/25"
              >
                <Plus size={16} />
                Create your first campaign
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3 relative">
          {campaigns.map(c => {
            const progress = c.totalCalls
              ? Math.round(((c.completedCalls || 0) / c.totalCalls) * 100)
              : 0;
            return (
              <div
                key={c._id}
                className="group relative bg-surface-card border border-border rounded-2xl p-5 backdrop-blur-xl hover:border-primary/30 transition-all overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-light to-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Megaphone size={20} className="text-primary-light" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{c.name}</h3>
                      <p className="text-sm text-text-muted truncate">{c.description || 'No description'}</p>
                    </div>
                  </div>
                  {statusBadge(c.status)}
                </div>

                {/* Progress bar */}
                {c.totalCalls > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-text-muted">Progress</span>
                      <span className="text-white font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-light transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Total</p>
                    <p className="text-xl font-bold text-white mt-0.5">{c.totalCalls || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Completed</p>
                    <p className="text-xl font-bold text-success mt-0.5">{c.completedCalls || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Failed</p>
                    <p className="text-xl font-bold text-danger mt-0.5">{c.failedCalls || 0}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {c.status === 'draft' && (
                      <button
                        onClick={() => handleStart(c._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/15 text-success border border-success/20 hover:bg-success/25 transition-colors text-sm font-medium"
                      >
                        <Play size={13} /> Start
                      </button>
                    )}
                    {c.status === 'active' && (
                      <button
                        onClick={() => handlePause(c._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent border border-accent/20 hover:bg-accent/25 transition-colors text-sm font-medium"
                      >
                        <Pause size={13} /> Pause
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-2 rounded-lg border border-transparent hover:border-danger/30 hover:bg-danger/10 text-text-muted hover:text-danger transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-bg-secondary/95 border border-border rounded-3xl w-full max-w-lg animate-fade-in max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="relative px-6 py-5 border-b border-border flex justify-between items-center">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-light to-accent" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">New Campaign</h2>
                  <p className="text-xs text-text-muted">Bulk voice outreach</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-surface text-text-muted hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-widest">Campaign Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Monsoon outreach 2026"
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-white placeholder-text-muted focus:outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-widest">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-white placeholder-text-muted focus:outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-widest">Assistant</label>
                <select
                  value={form.assistantId}
                  onChange={(e) => setForm(f => ({ ...f, assistantId: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary transition"
                >
                  <option value="">Select an assistant…</option>
                  {assistants.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-widest">
                  Phone Numbers <span className="normal-case tracking-normal">(one per line)</span>
                </label>
                <textarea
                  value={form.phoneNumbers}
                  onChange={(e) => setForm(f => ({ ...f, phoneNumbers: e.target.value }))}
                  placeholder={'+919876543210\n+919876543211\n+919876543212'}
                  rows={5}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none font-mono text-sm transition"
                />
                {form.phoneNumbers && (
                  <p className="text-[11px] text-text-muted mt-1.5">
                    {form.phoneNumbers.split('\n').filter(p => p.trim()).length} number
                    {form.phoneNumbers.split('\n').filter(p => p.trim()).length === 1 ? '' : 's'} ready
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={15} />
                    Create Campaign
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
