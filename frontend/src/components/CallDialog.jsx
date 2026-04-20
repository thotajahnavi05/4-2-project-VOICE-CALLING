import { useState, useEffect } from 'react';
import { X, Phone, Bot, Zap } from 'lucide-react';
import { createCall, getAssistants } from '../api/client';
import toast from 'react-hot-toast';

export default function CallDialog({ open, onClose, onCreated }) {
  const [assistants, setAssistants] = useState([]);
  const [form, setForm] = useState({ assistantId: '', customerPhone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      getAssistants().then(res => setAssistants(res.data || [])).catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assistantId || !form.customerPhone) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await createCall(form);
      toast.success('Call initiated!');
      onCreated?.();
      onClose();
      setForm({ assistantId: '', customerPhone: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-bg-secondary/95 border border-border rounded-3xl w-full max-w-md animate-fade-in overflow-hidden shadow-2xl">
        <div className="relative px-6 py-5 border-b border-border flex justify-between items-center">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-light to-accent" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light">
              <Phone size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">New Voice Call</h2>
              <p className="text-xs text-text-muted">Initiate an outbound call</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-text-muted hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-widest">Assistant</label>
            <div className="relative">
              <Bot size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <select
                value={form.assistantId}
                onChange={(e) => setForm(f => ({ ...f, assistantId: e.target.value }))}
                className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary appearance-none transition"
              >
                <option value="">Select assistant…</option>
                {assistants.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
            {assistants.length === 0 && (
              <p className="text-[11px] text-accent mt-1.5">No assistants yet — create one first.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-widest">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={form.customerPhone}
                onChange={(e) => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-white placeholder-text-muted focus:outline-none focus:border-primary font-mono transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap size={15} />
                Start Call
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
