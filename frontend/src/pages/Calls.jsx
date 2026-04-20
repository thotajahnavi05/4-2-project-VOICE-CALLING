import { useState, useEffect } from 'react';
import {
  Phone, PhoneMissed, PhoneOff, Plus, RefreshCw,
  Clock, Search, StopCircle, Eye, X, Download, Mic,
} from 'lucide-react';
import CallDialog from '../components/CallDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { getCalls, stopCall, getCall, getTranscript } from '../api/client';
import toast from 'react-hot-toast';

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCall, setSelectedCall] = useState(null);

  useEffect(() => { loadCalls(); }, []);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const res = await getCalls(true);
      setCalls(res.data || []);
    } catch {
      toast.error('Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async (id) => {
    try {
      await stopCall(id);
      toast.success('Call stopped');
      loadCalls();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const viewCall = async (id) => {
    try {
      const res = await getCall(id);
      const call = res.data;
      if (call.executionId && (!call.transcript || !call.recordingUrl)) {
        try {
          const tRes = await getTranscript(call.executionId);
          if (tRes.data) {
            if (tRes.data.content) call.transcript = tRes.data.content;
            if (tRes.data.recordingUrl) call.recordingUrl = tRes.data.recordingUrl;
          }
        } catch {}
      }
      setSelectedCall(call);
    } catch {
      toast.error('Failed to load call details');
    }
  };

  const filtered = calls.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.customerPhone?.includes(search) && !c.assistantId?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusBadge = (status) => {
    const map = {
      completed: { bg: 'bg-success/15 text-success border-success/20', dot: 'bg-success' },
      'in-progress': { bg: 'bg-primary/15 text-primary-light border-primary/20', dot: 'bg-primary-light animate-pulse' },
      failed: { bg: 'bg-danger/15 text-danger border-danger/20', dot: 'bg-danger' },
      queued: { bg: 'bg-accent/15 text-accent border-accent/20', dot: 'bg-accent' },
    };
    const s = map[status] || { bg: 'bg-surface text-text-muted border-border', dot: 'bg-text-muted' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border ${s.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {status}
      </span>
    );
  };

  const stats = [
    { label: 'Total', value: calls.length, color: 'text-white' },
    { label: 'Completed', value: calls.filter(c => c.status === 'completed').length, color: 'text-success' },
    { label: 'Failed', value: calls.filter(c => c.status === 'failed').length, color: 'text-danger' },
    { label: 'In Progress', value: calls.filter(c => c.status === 'in-progress').length, color: 'text-primary-light' },
  ];

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="absolute -top-20 right-10 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <PageHeader
        kicker="Voice Sessions"
        title="Your"
        highlight="Calls"
        icon={Phone}
        subtitle={`${calls.length} total call${calls.length === 1 ? '' : 's'}`}
        action={
          <>
            <button
              onClick={loadCalls}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-text-muted hover:text-white hover:border-primary/40 transition-all"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setShowDialog(true)}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/25"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              New Call
            </button>
          </>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-card border border-border rounded-2xl p-4 backdrop-blur-xl">
            <p className="text-xs text-text-muted font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap relative">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by phone or assistant name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-text-muted focus:outline-none focus:border-primary backdrop-blur-xl transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-card border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary backdrop-blur-xl transition"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      {/* Table */}
      <div className="relative bg-surface-card border border-border rounded-2xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <Loader label="Loading calls" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Phone}
            title={calls.length === 0 ? 'No calls yet' : 'No matches'}
            description={calls.length === 0 ? 'Start your first voice call to see activity here.' : 'Try adjusting your filters or search.'}
            action={
              calls.length === 0 && (
                <button
                  onClick={() => setShowDialog(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium shadow-lg shadow-primary/25"
                >
                  <Plus size={16} />
                  Make your first call
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/30">
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Phone</th>
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Assistant</th>
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Duration</th>
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="text-right py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(call => (
                  <tr key={call._id} className="border-b border-border/30 hover:bg-surface/30 transition-colors">
                    <td className="py-4 px-5">{statusBadge(call.status)}</td>
                    <td className="py-4 px-5 font-mono text-white">{call.customerPhone}</td>
                    <td className="py-4 px-5 text-text-muted">{call.assistantId?.name || '—'}</td>
                    <td className="py-4 px-5 text-text-muted">{call.duration ? `${call.duration}s` : '—'}</td>
                    <td className="py-4 px-5 text-text-muted">
                      {new Date(call.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => viewCall(call._id)}
                          className="p-2 rounded-lg border border-transparent hover:border-border hover:bg-surface text-text-muted hover:text-primary-light transition-all"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        {(call.status === 'in-progress' || call.status === 'queued') && (
                          <button
                            onClick={() => handleStop(call._id)}
                            className="p-2 rounded-lg border border-transparent hover:border-danger/30 hover:bg-danger/10 text-text-muted hover:text-danger transition-all"
                            title="Stop call"
                          >
                            <StopCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-bg-secondary/95 border border-border rounded-3xl w-full max-w-2xl animate-fade-in max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="relative px-6 py-5 border-b border-border flex justify-between items-center">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-light to-accent" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light">
                  <Phone size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Call Details</h2>
                  <p className="text-xs text-text-muted">{selectedCall.customerPhone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCall(null)} className="p-2 rounded-lg hover:bg-surface text-text-muted hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Status', value: selectedCall.status },
                  { label: 'Duration', value: selectedCall.duration ? `${selectedCall.duration}s` : 'N/A' },
                  { label: 'Phone', value: selectedCall.customerPhone, mono: true },
                  { label: 'Direction', value: selectedCall.direction || '—' },
                ].map(f => (
                  <div key={f.label} className="bg-surface/60 border border-border/60 rounded-xl p-3.5">
                    <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">{f.label}</p>
                    <p className={`text-white font-medium ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
                  </div>
                ))}
              </div>

              {selectedCall.transcript && (
                <div className="bg-surface/60 border border-border/60 rounded-xl p-4">
                  <p className="text-text-muted text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Mic size={11} /> Transcript
                  </p>
                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed max-h-[30vh] overflow-y-auto">
                    {selectedCall.transcript}
                  </p>
                </div>
              )}

              {selectedCall.summary && (
                <div className="bg-surface/60 border border-border/60 rounded-xl p-4">
                  <p className="text-text-muted text-[10px] uppercase tracking-widest mb-2">Summary</p>
                  <p className="text-white text-sm leading-relaxed">{selectedCall.summary}</p>
                </div>
              )}

              {selectedCall.recordingUrl && (
                <div className="bg-surface/60 border border-border/60 rounded-xl p-4">
                  <p className="text-text-muted text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Mic size={11} /> Recording
                  </p>
                  <audio controls src={selectedCall.recordingUrl} className="w-full mb-2 rounded-lg" />
                  <a
                    href={selectedCall.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-light hover:underline inline-flex items-center gap-1"
                  >
                    <Download size={11} /> Download Recording
                  </a>
                </div>
              )}

              {selectedCall.executionId && (
                <div className="bg-surface/40 border border-border/40 rounded-xl p-3 text-[10px] text-text-muted">
                  Execution ID: <span className="font-mono text-white/70">{selectedCall.executionId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CallDialog open={showDialog} onClose={() => setShowDialog(false)} onCreated={loadCalls} />
    </div>
  );
}
