import { useState, useEffect } from 'react';
import { Calendar, Plus, Users, Clock, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { getBookings, getBookingStats, createBookingManual } from '../api/client';
import toast from 'react-hot-toast';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', guestCount: 2, customerName: '', email: '', phone: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        getBookings({ status: statusFilter || undefined }),
        getBookingStats(),
      ]);
      setBookings(bRes.data || []);
      setStats(sRes.data || {});
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time || !form.email) {
      toast.error('Date, time, and email are required');
      return;
    }
    setCreating(true);
    try {
      await createBookingManual(form);
      toast.success('Booking created!');
      setShowCreate(false);
      setForm({ date: '', time: '', guestCount: 2, customerName: '', email: '', phone: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      confirmed: 'bg-success/20 text-success',
      completed: 'bg-primary/20 text-primary-light',
      cancelled: 'bg-danger/20 text-danger',
      validation_failed: 'bg-danger/20 text-danger',
      slot_unavailable: 'bg-accent/20 text-accent',
      pending_extraction: 'bg-surface text-text-muted',
      needs_manual_followup: 'bg-accent/20 text-accent',
    };
    return map[status] || 'bg-surface text-text-muted';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-text-muted mt-1">Voice call booking management</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/25"
        >
          <Plus size={16} />
          Manual Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
          <Calendar size={20} className="mx-auto text-primary-light mb-2" />
          <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
          <p className="text-xs text-text-muted">Total</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
          <CheckCircle size={20} className="mx-auto text-success mb-2" />
          <p className="text-2xl font-bold text-white">{stats.confirmed || 0}</p>
          <p className="text-xs text-text-muted">Confirmed</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
          <Clock size={20} className="mx-auto text-accent mb-2" />
          <p className="text-2xl font-bold text-white">{stats.pending || 0}</p>
          <p className="text-xs text-text-muted">Pending</p>
        </div>
        <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
          <Users size={20} className="mx-auto text-primary-light mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalGuests || 0}</p>
          <p className="text-xs text-text-muted">Total Guests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'confirmed', 'pending_extraction', 'validation_failed', 'slot_unavailable', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-white'
            }`}
          >
            {s === '' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">No bookings found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left py-3.5 px-5 text-text-muted font-medium">Booking ID</th>
                <th className="text-left py-3.5 px-5 text-text-muted font-medium">Customer</th>
                <th className="text-left py-3.5 px-5 text-text-muted font-medium">Date & Time</th>
                <th className="text-left py-3.5 px-5 text-text-muted font-medium">Guests</th>
                <th className="text-left py-3.5 px-5 text-text-muted font-medium">Source</th>
                <th className="text-left py-3.5 px-5 text-text-muted font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id} className="border-b border-border/30 hover:bg-surface/30 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-primary-light text-xs">{b.bookingId}</td>
                  <td className="py-3.5 px-5">
                    <p className="text-white">{b.customerName || '—'}</p>
                    <p className="text-xs text-text-muted">{b.email}</p>
                  </td>
                  <td className="py-3.5 px-5 text-text-muted">
                    {b.date ? new Date(b.date).toLocaleDateString('en-IN') : '—'} {b.time || ''}
                  </td>
                  <td className="py-3.5 px-5 text-white">{b.guestCount}</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded text-xs bg-surface text-text-muted">
                      {b.source?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>
                      {b.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Manual Booking</h2>
              <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}
                    className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))}
                    className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Customer Name</label>
                <input value={form.customerName} onChange={e => setForm(f => ({...f, customerName: e.target.value}))}
                  placeholder="Rahul Sharma" className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  placeholder="rahul@example.com" className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                    placeholder="+919876543210" className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Guests</label>
                  <input type="number" min="1" value={form.guestCount} onChange={e => setForm(f => ({...f, guestCount: parseInt(e.target.value) || 1}))}
                    className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
              <button type="submit" disabled={creating}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 mt-2">
                {creating ? 'Creating...' : 'Create Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
