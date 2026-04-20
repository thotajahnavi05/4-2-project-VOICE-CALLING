import { useState, useEffect } from 'react';
import {
  FileText, RefreshCw, X, Download, Mic, Search,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { getTranscripts, getTranscript } from '../api/client';
import toast from 'react-hot-toast';

export default function Transcripts() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTranscripts();
      setTranscripts(res.data || []);
    } catch {
      toast.error('Failed to load transcripts');
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (id) => {
    setDetailLoading(true);
    setSelected({ _placeholder: true });
    try {
      const res = await getTranscript(id);
      setSelected(res.data);
    } catch {
      toast.error('Failed to load transcript detail');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const statusBadge = (status) => {
    const map = {
      completed: 'bg-success/15 text-success border-success/20',
      ended: 'bg-success/15 text-success border-success/20',
      failed: 'bg-danger/15 text-danger border-danger/20',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || 'bg-surface text-text-muted border-border'}`}>
        {status || '—'}
      </span>
    );
  };

  const filtered = transcripts.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.recipient?.includes(search) ||
      t.agentName?.toLowerCase().includes(q) ||
      t.content?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="absolute -top-20 left-20 w-[350px] h-[350px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <PageHeader
        kicker="Recordings & Text"
        title="Call"
        highlight="Transcripts"
        icon={FileText}
        subtitle={`${transcripts.length} transcript${transcripts.length === 1 ? '' : 's'} available`}
        action={
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-text-muted hover:text-white hover:border-primary/40 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search transcripts by agent, phone or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-text-muted focus:outline-none focus:border-primary backdrop-blur-xl transition"
        />
      </div>

      {/* List */}
      <div className="relative bg-surface-card border border-border rounded-2xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <Loader label="Loading transcripts" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={transcripts.length === 0 ? 'No transcripts yet' : 'No matches'}
            description={transcripts.length === 0 ? 'Make some calls — transcripts & recordings appear automatically here.' : 'Try a different search term.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/30">
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Agent</th>
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Phone</th>
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Duration</th>
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Assets</th>
                  <th className="text-left py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="text-right py-4 px-5 text-text-muted font-medium text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-border/30 hover:bg-surface/30 transition-colors">
                    <td className="py-4 px-5 text-white font-medium">{t.agentName || '—'}</td>
                    <td className="py-4 px-5 font-mono text-text-muted">{t.recipient || '—'}</td>
                    <td className="py-4 px-5">{statusBadge(t.status)}</td>
                    <td className="py-4 px-5 text-text-muted">{formatDuration(t.duration)}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        {t.content && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-success/15 text-success border border-success/20 flex items-center gap-1">
                            <FileText size={10} /> Text
                          </span>
                        )}
                        {t.recordingUrl && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/15 text-primary-light border border-primary/20 flex items-center gap-1">
                            <Mic size={10} /> Audio
                          </span>
                        )}
                        {!t.content && !t.recordingUrl && (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-text-muted text-xs">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => viewDetail(t.id)}
                        className="px-3 py-1.5 bg-primary/15 text-primary-light border border-primary/20 rounded-lg text-xs font-medium hover:bg-primary/25 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-bg-secondary/95 border border-border rounded-3xl w-full max-w-3xl animate-fade-in max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="relative px-6 py-5 border-b border-border flex justify-between items-center">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-light to-accent" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Transcript Detail</h2>
                  <p className="text-xs text-text-muted">{selected.agentName || 'Call transcript'}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-surface text-text-muted hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {detailLoading ? (
                <Loader label="Fetching transcript" />
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Status', value: selected.status || '—' },
                      { label: 'Duration', value: formatDuration(selected.duration) },
                      { label: 'Cost', value: selected.cost ? `$${selected.cost.toFixed(4)}` : '—' },
                      { label: 'Phone', value: selected.recipient || selected.from || '—', mono: true },
                    ].map(f => (
                      <div key={f.label} className="bg-surface/60 border border-border/60 rounded-xl p-3">
                        <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">{f.label}</p>
                        <p className={`text-sm text-white font-medium ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
                      </div>
                    ))}
                  </div>

                  {selected.recordingUrl && (
                    <div className="bg-surface/60 border border-border/60 rounded-xl p-4 mb-4">
                      <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Mic size={11} className="text-primary-light" /> Recording
                      </p>
                      <audio controls src={selected.recordingUrl} className="w-full mb-2 rounded-lg" />
                      <a
                        href={selected.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-light hover:underline inline-flex items-center gap-1"
                      >
                        <Download size={11} /> Download Recording
                      </a>
                    </div>
                  )}

                  <div className="bg-surface/60 border border-border/60 rounded-xl p-4">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
                      <FileText size={11} className="text-success" /> Transcript
                    </p>
                    {selected.content ? (
                      <div className="text-sm text-white whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto font-mono text-xs">
                        {selected.content}
                      </div>
                    ) : (
                      <p className="text-text-muted text-sm">No transcript available for this call.</p>
                    )}
                  </div>

                  {(selected.executionId || selected.id) && (
                    <div className="mt-3 text-[10px] text-text-muted">
                      Execution ID: <span className="font-mono text-white/70">{selected.executionId || selected.id}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
