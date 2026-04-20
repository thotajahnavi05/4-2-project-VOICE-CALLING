import { useState, useEffect } from 'react';
import {
  Bot, Plus, Trash2, Edit2, Languages, Volume2,
  Sparkles, Search,
} from 'lucide-react';
import AssistantDialog from '../components/AssistantDialog';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { getAssistants, deleteAssistant } from '../api/client';
import toast from 'react-hot-toast';

const LANG_FLAGS = {
  en: '🇬🇧', hi: '🇮🇳', te: '🇮🇳', ta: '🇮🇳', kn: '🇮🇳',
  ml: '🇮🇳', mr: '🇮🇳', bn: '🇮🇳', gu: '🇮🇳', pa: '🇮🇳', ur: '🇮🇳',
};

const LANG_LABELS = {
  hi: 'Hindi', en: 'English', 'hi-IN': 'Hinglish', ta: 'Tamil',
  te: 'Telugu', bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati',
  kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', ur: 'Urdu',
};

export default function Assistants() {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { loadAssistants(); }, []);

  const loadAssistants = async () => {
    setLoading(true);
    try {
      const res = await getAssistants();
      setAssistants(res.data || []);
    } catch {
      toast.error('Failed to load assistants');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete assistant "${name}"?`)) return;
    try {
      await deleteAssistant(id);
      toast.success('Assistant deleted');
      loadAssistants();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (assistant) => {
    setEditData(assistant);
    setShowDialog(true);
  };

  const filtered = assistants.filter(a =>
    !search || a.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="absolute -top-20 right-20 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[130px] pointer-events-none" />

      <PageHeader
        kicker="AI Agents"
        title="Your"
        highlight="Assistants"
        icon={Bot}
        subtitle="Configure multilingual voice AI agents for India"
        action={
          <button
            onClick={() => { setEditData(null); setShowDialog(true); }}
            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
          >
            <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
            New Assistant
          </button>
        }
      />

      {/* Search */}
      {assistants.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search assistants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-text-muted focus:outline-none focus:border-primary backdrop-blur-xl transition"
          />
        </div>
      )}

      {loading ? (
        <Loader label="Loading assistants" />
      ) : filtered.length === 0 ? (
        <div className="bg-surface-card border border-border rounded-2xl backdrop-blur-xl relative">
          <EmptyState
            icon={Bot}
            title={assistants.length === 0 ? 'No assistants yet' : 'No matches'}
            description={assistants.length === 0 ? 'Create your first AI voice agent to start making calls.' : 'Try a different search.'}
            action={
              assistants.length === 0 && (
                <button
                  onClick={() => { setEditData(null); setShowDialog(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium shadow-lg shadow-primary/25"
                >
                  <Plus size={16} />
                  Create your first assistant
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(a => {
            const langCode = (a.language || '').split('-')[0];
            const flag = LANG_FLAGS[langCode] || '🌐';
            const langLabel = LANG_LABELS[a.language] || LANG_LABELS[langCode] || a.language;

            return (
              <div
                key={a._id}
                className="group relative bg-surface-card border border-border rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_10px_40px_rgba(6,182,212,0.2)] overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-light to-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bot size={20} className="text-primary-light" />
                      {a.isActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-bg-secondary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{a.name}</h3>
                      <p className="text-xs text-text-muted capitalize">{a.useCase || 'general'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(a)}
                      className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-primary-light transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(a._id, a.name)}
                      className="p-1.5 rounded-lg hover:bg-danger/20 text-text-muted hover:text-danger transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* System prompt preview */}
                <p className="text-sm text-text-muted line-clamp-2 mb-4 min-h-[40px]">
                  {a.systemPrompt || 'No system prompt configured'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-1 bg-surface/60 border border-border/60 rounded-lg text-[11px] text-white flex items-center gap-1">
                    <span>{flag}</span> {langLabel}
                  </span>
                  {a.voiceProvider && (
                    <span className="px-2 py-1 bg-surface/60 border border-border/60 rounded-lg text-[11px] text-text-muted flex items-center gap-1">
                      <Volume2 size={10} /> {a.voiceProvider}
                    </span>
                  )}
                  {a.model && (
                    <span className="px-2 py-1 bg-surface/60 border border-border/60 rounded-lg text-[11px] text-text-muted">
                      {a.model}
                    </span>
                  )}
                  {a.enableBookingExtraction && (
                    <span className="px-2 py-1 bg-accent/15 border border-accent/20 rounded-lg text-[11px] text-accent">
                      Booking
                    </span>
                  )}
                  {a.providerId && (
                    <span className="px-2 py-1 bg-success/15 border border-success/20 rounded-lg text-[11px] text-success">
                      Bolna
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <p className="text-[11px] text-text-muted">
                    {new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <span className={`text-[10px] font-medium uppercase tracking-widest ${a.isActive ? 'text-success' : 'text-text-muted'}`}>
                    {a.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssistantDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditData(null); }}
        onSaved={loadAssistants}
        editData={editData}
      />
    </div>
  );
}
