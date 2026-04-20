import { useState, useEffect } from 'react';
import { X, Bot, Save, Volume2, Languages, Mic, Sparkles } from 'lucide-react';
import { createAssistant, updateAssistant } from '../api/client';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
// INDUSTRY-GRADE VOICE & LANGUAGE CONFIGURATION
// Matches original repo exactly
// ═══════════════════════════════════════════════════════════

const LANGUAGES = [
  { code: 'en', label: 'English', providers: ['elevenlabs', 'deepgram', 'polly'], defaultProvider: 'elevenlabs' },
  { code: 'hi', label: 'Hindi', providers: ['elevenlabs', 'sarvam', 'polly', 'cartesia'], defaultProvider: 'sarvam' },
  { code: 'te', label: 'Telugu', providers: ['elevenlabs', 'sarvam'], defaultProvider: 'sarvam' },
  { code: 'ta', label: 'Tamil', providers: ['elevenlabs', 'sarvam'], defaultProvider: 'sarvam' },
  { code: 'kn', label: 'Kannada', providers: ['elevenlabs', 'sarvam'], defaultProvider: 'sarvam' },
  { code: 'ml', label: 'Malayalam', providers: ['elevenlabs', 'sarvam'], defaultProvider: 'sarvam' },
  { code: 'mr', label: 'Marathi', providers: ['elevenlabs', 'sarvam', 'polly'], defaultProvider: 'sarvam' },
  { code: 'bn', label: 'Bengali', providers: ['elevenlabs', 'sarvam', 'polly'], defaultProvider: 'sarvam' },
  { code: 'gu', label: 'Gujarati', providers: ['elevenlabs', 'sarvam', 'polly'], defaultProvider: 'sarvam' },
  { code: 'pa', label: 'Punjabi', providers: ['elevenlabs', 'sarvam', 'polly'], defaultProvider: 'sarvam' },
  { code: 'ur', label: 'Urdu', providers: ['elevenlabs', 'sarvam', 'polly'], defaultProvider: 'sarvam' },
];

const VOICE_PROVIDERS = {
  elevenlabs: {
    label: 'ElevenLabs',
    description: 'Best quality, most natural voices',
    voices: [
      { id: 'm7GHBtY0UEqljrKQw2JH', name: 'Aisha (Female)', tags: ['multilingual', 'natural', 'recommended'] },
      { id: '7Q6qcYvsTRgb4IVcoAdK', name: 'Vikram (Male)', tags: ['multilingual', 'telugu'] },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Female)', tags: ['english', 'clear'] },
      { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (Male)', tags: ['english', 'professional'] },
      { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Female)', tags: ['multilingual', 'warm'] },
      { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Male)', tags: ['english', 'deep'] },
    ],
  },
  sarvam: {
    label: 'Sarvam AI (Bulbul)',
    description: 'Most natural for Indian languages',
    voices: [
      { id: 'simran', name: 'Simran (Female)', tags: ['natural', 'recommended', 'bulbul:v3'] },
      { id: 'pooja', name: 'Pooja (Female)', tags: ['natural', 'bulbul:v3'] },
      { id: 'ritu', name: 'Ritu (Female)', tags: ['natural', 'bulbul:v3'] },
      { id: 'arya', name: 'Arya (Male)', tags: ['natural', 'telugu'] },
      { id: 'karun', name: 'Karun (Male)', tags: ['natural', 'telugu'] },
      { id: 'vidya', name: 'Vidya (Female)', tags: ['natural'] },
      { id: 'hitesh', name: 'Hitesh (Male)', tags: ['natural'] },
      { id: 'anushka', name: 'Anushka (Female)', tags: ['natural'] },
      { id: 'abhilash', name: 'Abhilash (Male)', tags: ['natural'] },
    ],
  },
  deepgram: {
    label: 'Deepgram Aura',
    description: 'Fast, natural TTS',
    voices: [
      { id: 'aura-asteria-en', name: 'Asteria (Female)', tags: ['english', 'natural'] },
      { id: 'aura-luna-en', name: 'Luna (Female)', tags: ['english', 'warm'] },
      { id: 'aura-stella-en', name: 'Stella (Female)', tags: ['english', 'clear'] },
      { id: 'aura-athena-en', name: 'Athena (Female)', tags: ['english', 'professional'] },
      { id: 'aura-orion-en', name: 'Orion (Male)', tags: ['english', 'deep'] },
      { id: 'aura-angus-en', name: 'Angus (Male)', tags: ['english', 'friendly'] },
    ],
  },
  polly: {
    label: 'AWS Polly',
    description: 'Reliable, supports Indian English',
    voices: [
      { id: 'Aditi', name: 'Aditi (Female)', tags: ['hindi', 'indian-english'] },
      { id: 'Matthew', name: 'Matthew (Male)', tags: ['english', 'us'] },
      { id: 'Joanna', name: 'Joanna (Female)', tags: ['english', 'us'] },
      { id: 'Amy', name: 'Amy (Female)', tags: ['english', 'uk'] },
      { id: 'Brian', name: 'Brian (Male)', tags: ['english', 'uk'] },
    ],
  },
  cartesia: {
    label: 'Cartesia',
    description: 'Fast, supports Hindi',
    voices: [
      { id: '', name: 'Enter Cartesia Voice ID', tags: ['hindi'] },
    ],
  },
};

const TRANSCRIBER_INFO = {
  deepgram: { label: 'Deepgram Nova-2', desc: '95%+ accuracy, best for phone calls' },
  sarvam: { label: 'Sarvam Saarika v2.5', desc: 'Best for Telugu & Indian languages' },
};

const defaultForm = {
  name: '',
  systemPrompt: '',
  firstMessage: 'Namaste! Main aapki kaise madad kar sakta hoon?',
  language: 'hi',
  voiceProvider: 'sarvam',
  voiceId: '',
  model: 'gpt-4o-mini',
  enableBookingExtraction: false,
  useCase: 'general',
};

export default function AssistantDialog({ open, onClose, onSaved, editData }) {
  const [form, setForm] = useState(editData || defaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) setForm(editData);
    else setForm(defaultForm);
  }, [editData, open]);

  if (!open) return null;

  const isEdit = !!editData?._id;
  const langCode = form.language?.split('-')[0] || 'en';
  const langConfig = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];
  const isTelugu = langCode === 'te';
  const transcriberProvider = isTelugu ? 'sarvam' : 'deepgram';
  const transcriberInfo = TRANSCRIBER_INFO[transcriberProvider];
  const availableProviders = langConfig.providers;
  const providerVoices = VOICE_PROVIDERS[form.voiceProvider]?.voices || [];

  const handleLanguageChange = (newLang) => {
    const lc = newLang.split('-')[0];
    const lConfig = LANGUAGES.find(l => l.code === lc) || LANGUAGES[0];
    setForm(f => ({
      ...f,
      language: newLang,
      voiceProvider: lConfig.defaultProvider,
      voiceId: '', // Reset voice when language changes
    }));
  };

  const handleProviderChange = (newProvider) => {
    const voices = VOICE_PROVIDERS[newProvider]?.voices || [];
    setForm(f => ({
      ...f,
      voiceProvider: newProvider,
      voiceId: voices[0]?.id || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await updateAssistant(editData._id, form);
        toast.success('Assistant updated!');
      } else {
        await createAssistant(form);
        toast.success('Assistant created in Bolna!');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md overflow-y-auto p-4">
      <div className="bg-bg-secondary/95 border border-border rounded-3xl w-full max-w-2xl animate-fade-in my-4 overflow-hidden shadow-2xl">
        <div className="relative px-6 py-5 border-b border-border flex justify-between items-center">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-light to-accent" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isEdit ? 'Edit Assistant' : 'Create Assistant'}
              </h2>
              <p className="text-xs text-text-muted">
                {isEdit ? 'Update your voice AI agent' : 'Configure a new multilingual voice agent'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-text-muted hover:text-white transition"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="My India Assistant"
              className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary" />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">System Prompt</label>
            <textarea value={form.systemPrompt} onChange={e => update('systemPrompt', e.target.value)}
              placeholder="You are a helpful voice assistant..." rows={3}
              className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary resize-none" />
          </div>

          {/* First Message */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">First Message (Welcome)</label>
            <input value={form.firstMessage} onChange={e => update('firstMessage', e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary" />
          </div>

          {/* ═══ LANGUAGE SELECTION ═══ */}
          <div className="bg-surface/50 border border-border rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Languages size={16} className="text-primary-light" /> Language & Voice Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Language */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Language</label>
                <select value={form.language} onChange={e => handleLanguageChange(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-primary">
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Use Case */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Use Case</label>
                <select value={form.useCase} onChange={e => update('useCase', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-primary">
                  <option value="general">General</option>
                  <option value="restaurant_booking">Restaurant Booking</option>
                  <option value="appointment">Appointment</option>
                  <option value="support">Customer Support</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
            </div>

            {/* ═══ VOICE PROVIDER ═══ */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
                <Volume2 size={12} /> Voice Provider (TTS)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableProviders.map(p => {
                  const pInfo = VOICE_PROVIDERS[p];
                  if (!pInfo) return null;
                  return (
                    <button key={p} type="button" onClick={() => handleProviderChange(p)}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                        form.voiceProvider === p
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border bg-surface text-text-muted hover:border-primary/50'
                      }`}>
                      <p className="font-medium">{pInfo.label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{pInfo.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══ VOICE SELECTION ═══ */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Voice</label>
              {providerVoices.length > 1 ? (
                <select value={form.voiceId} onChange={e => update('voiceId', e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-primary">
                  {providerVoices.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.tags?.length ? `(${v.tags.join(', ')})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={form.voiceId} onChange={e => update('voiceId', e.target.value)}
                  placeholder={form.voiceProvider === 'cartesia' ? 'Enter Cartesia voice ID' : 'Voice ID (optional)'}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-primary" />
              )}
            </div>

            {/* ═══ TRANSCRIBER INFO ═══ */}
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs font-medium text-text-muted flex items-center gap-1">
                <Mic size={12} /> Transcriber (STT) - Auto-selected
              </p>
              <p className="text-sm text-white mt-1">{transcriberInfo.label}</p>
              <p className="text-[10px] text-text-muted">{transcriberInfo.desc}</p>
              {isTelugu && (
                <p className="text-[10px] text-accent mt-1">Telugu detected: Using Sarvam for LLM + STT + TTS</p>
              )}
            </div>
          </div>

          {/* LLM Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">LLM Model</label>
              <select value={form.model} onChange={e => update('model', e.target.value)}
                className="w-full bg-surface border border-border rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-primary">
                <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (Best)</option>
              </select>
              {isTelugu && <p className="text-[10px] text-accent mt-1">Telugu: Sarvam LLM will be used</p>}
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-3 bg-surface rounded-xl p-3 w-full">
                <input type="checkbox" checked={form.enableBookingExtraction}
                  onChange={e => update('enableBookingExtraction', e.target.checked)}
                  className="w-4 h-4 rounded accent-primary" />
                <div>
                  <p className="text-xs font-medium text-white">Booking Extraction</p>
                  <p className="text-[10px] text-text-muted">Auto-extract from calls</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isEdit ? (
              <><Save size={15} /> Update Assistant</>
            ) : (
              <><Sparkles size={15} /> Create Assistant</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
