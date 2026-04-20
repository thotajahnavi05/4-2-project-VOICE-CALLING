import Assistant from '../models/Assistant.js';
import { bolnaRequest } from '../services/bolnaService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { MONGO_ID_REGEX } from '../constants/index.js';

const LANGUAGE_MAP = {
  'en': { transcriber: 'en', synth: 'en-US', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: 'Aditi', sarvamSupported: false, defaultSynthesizerProvider: 'elevenlabs', label: 'English' },
  'hi': { transcriber: 'hi', synth: 'hi-IN', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: 'Aditi', sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Hindi' },
  'te': { transcriber: 'te', synth: 'te-IN', transcriberProvider: 'sarvam', llmProvider: 'openai', pollyVoice: null, sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Telugu' },
  'ta': { transcriber: 'ta', synth: 'ta-IN', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: null, sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Tamil' },
  'kn': { transcriber: 'kn', synth: 'kn-IN', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: null, sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Kannada' },
  'ml': { transcriber: 'ml', synth: 'ml-IN', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: null, sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Malayalam' },
  'mr': { transcriber: 'mr', synth: 'mr-IN', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: 'Aditi', sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Marathi' },
  'gu': { transcriber: 'gu', synth: 'gu-IN', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: 'Aditi', sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Gujarati' },
  'bn': { transcriber: 'bn', synth: 'bn-IN', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: 'Aditi', sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Bengali' },
  'pa': { transcriber: 'pa', synth: 'pa-IN', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: 'Aditi', sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Punjabi' },
  'ur': { transcriber: 'ur', synth: 'ur-IN', transcriberProvider: 'deepgram', llmProvider: 'openai', pollyVoice: 'Aditi', sarvamSupported: true, defaultSynthesizerProvider: 'elevenlabs', label: 'Urdu' },
};

function buildBolnaPayload(data) {
  const langCode = data.language ? data.language.split('-')[0] : 'en';
  const langMapping = LANGUAGE_MAP[langCode] || LANGUAGE_MAP['en'];
  const isTelugu = langCode === 'te';
  const isRestaurant = data.enableBookingExtraction || data.useCase === 'restaurant_booking';

  // Provider selection
  const bolnaConfig = data.bolnaConfig || {};
  const synthesizerConfig = bolnaConfig.synthesizer || {};
  const transcriberConfig = bolnaConfig.transcriber || {};

  let effectiveSynthesizerProvider;
  if (isRestaurant) {
    effectiveSynthesizerProvider = 'elevenlabs';
  } else if (data.voiceProvider) {
    effectiveSynthesizerProvider = data.voiceProvider;
  } else {
    effectiveSynthesizerProvider = langMapping.defaultSynthesizerProvider || 'elevenlabs';
  }

  const effectiveTranscriberProvider = isTelugu ? 'sarvam' : (transcriberConfig.provider || langMapping.transcriberProvider || 'deepgram');

  // ═══════════════════════════════════════════════════════════
  // SYSTEM PROMPT - Include language instruction
  // ═══════════════════════════════════════════════════════════
  let systemPrompt = data.systemPrompt || '';

  // Add language instruction so the LLM knows what language to speak
  const langLabel = langMapping.label || 'English';
  const langInstruction = `\n\nIMPORTANT: You MUST speak and respond ONLY in ${langLabel}. All your responses must be in ${langLabel} language. If the user speaks in another language, still respond in ${langLabel}.`;

  if (!systemPrompt) {
    systemPrompt = `You are a friendly and helpful voice assistant. You speak ${langLabel} fluently. Be warm, professional, and conversational. Keep responses short and natural.${langInstruction}`;
  } else {
    systemPrompt += langInstruction;
  }

  // Only add restaurant booking instructions if useCase is restaurant
  if (isRestaurant) {
    systemPrompt += `\n\nFor bookings, collect: Name, Date, Time, Guests, Phone, Email. Ask ONE question at a time. Keep responses under 25 words.`;
  }

  // ═══════════════════════════════════════════════════════════
  // LLM - Always use OpenAI (best multilingual support)
  // ═══════════════════════════════════════════════════════════
  const llmConfigObj = {
    provider: 'openai',
    family: 'openai',
    model: isRestaurant ? 'gpt-4-turbo' : (data.model || 'gpt-4o-mini'),
    max_tokens: isRestaurant ? 500 : 400,
    temperature: 0.7,
    base_url: 'https://api.openai.com/v1',
    top_p: 0.9,
    min_p: 0.1,
    top_k: 0,
    request_json: true,
    presence_penalty: 0,
    frequency_penalty: 0,
  };

  // ═══════════════════════════════════════════════════════════
  // SYNTHESIZER (TTS)
  // ═══════════════════════════════════════════════════════════
  let synthesizer;

  if (effectiveSynthesizerProvider === 'elevenlabs') {
    const voiceId = data.voiceId || (isTelugu ? '7Q6qcYvsTRgb4IVcoAdK' : 'm7GHBtY0UEqljrKQw2JH');
    synthesizer = {
      stream: true, caching: true, provider: 'elevenlabs',
      buffer_size: 200, audio_format: 'wav',
      provider_config: { voice: voiceId, voice_id: voiceId, model: 'eleven_turbo_v2_5' },
    };
  } else if (effectiveSynthesizerProvider === 'sarvam') {
    const sarvamVoice = data.voiceId || 'simran';
    synthesizer = {
      stream: true, caching: true, provider: 'sarvam',
      buffer_size: 100, audio_format: 'wav',
      provider_config: { voice: sarvamVoice.charAt(0).toUpperCase() + sarvamVoice.slice(1), voice_id: sarvamVoice.toLowerCase(), model: 'bulbul:v3', speed: 1, language: langMapping.synth.split('-')[0] },
    };
  } else if (effectiveSynthesizerProvider === 'deepgram') {
    synthesizer = {
      provider: 'deepgram', stream: true, buffer_size: 400, audio_format: 'wav', caching: true,
      provider_config: { voice: data.voiceId || 'aura-asteria-en', model: 'aura-2' },
    };
  } else if (effectiveSynthesizerProvider === 'polly') {
    synthesizer = {
      provider: 'polly', stream: true, buffer_size: 150, audio_format: 'wav', caching: true,
      provider_config: { voice: data.voiceId || langMapping.pollyVoice || 'Aditi', engine: 'generative', language: langMapping.synth },
    };
  } else if (effectiveSynthesizerProvider === 'cartesia') {
    synthesizer = {
      provider: 'cartesia', stream: true,
      provider_config: { voice: data.voiceId || '', language: langMapping.synth, model: 'sonic-3-preview' },
    };
  } else {
    // Fallback: ElevenLabs multilingual
    const voiceId = data.voiceId || 'm7GHBtY0UEqljrKQw2JH';
    synthesizer = {
      stream: true, caching: true, provider: 'elevenlabs',
      buffer_size: 200, audio_format: 'wav',
      provider_config: { voice: voiceId, voice_id: voiceId, model: 'eleven_turbo_v2_5' },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSCRIBER (STT)
  // ═══════════════════════════════════════════════════════════
  let transcriber;
  if (effectiveTranscriberProvider === 'sarvam') {
    transcriber = { provider: 'sarvam', model: 'saarika:v2.5', language: langMapping.transcriber, stream: true };
  } else {
    transcriber = { provider: 'deepgram', model: 'nova-2', language: langMapping.transcriber, stream: true, sampling_rate: 16000, encoding: 'linear16', endpointing: 1200 };
  }

  // ═══════════════════════════════════════════════════════════
  // BUILD PAYLOAD - Clean, no office ambience, no forced hangup
  // ═══════════════════════════════════════════════════════════
  const welcomeMessage = data.firstMessage || 'Hello, how can I help you today?';

  return {
    agent_config: {
      agent_name: data.name,
      agent_welcome_message: welcomeMessage,
      tasks: [{
        task_type: 'conversation',
        task_prompt: systemPrompt,
        welcome_message: welcomeMessage,
        tools_config: {
          llm_agent: { agent_type: 'simple_llm_agent', agent_flow_type: 'streaming', llm_config: llmConfigObj },
          synthesizer,
          transcriber,
          input: { provider: 'plivo', format: 'wav' },
          output: { provider: 'plivo', format: 'wav' },
          api_tools: null,
        },
        toolchain: { execution: 'parallel', pipelines: [['transcriber', 'llm', 'synthesizer']] },
        task_config: {
          hangup_after_silence: 12,
          incremental_delay: 100,
          number_of_words_for_interruption: 2,
          interruption_backoff_period: 100,
          hangup_after_LLMCall: true,
          backchanneling: false,
          ambient_noise: false,
          optimize_latency: true,
          call_terminate: 600,
          voicemail: false,
          welcome_message: welcomeMessage,
          call_cancellation_prompt: 'Determine if the user wants to end the call. Return {"hangup": "Yes"} if they said: bye, goodbye, ok bye, thanks bye, not interested, stop calling, hang up, end call, no thanks bye, alvida, theek hai bye, dhanyavaad, nenu velthunna, sare bye, bas. Return {"hangup": "No"} if the conversation is still ongoing.',
        },
      }],
    },
    agent_prompts: {
      task_1: { system_prompt: systemPrompt },
    },
  };
}

// ═══════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════
export const createAssistant = asyncHandler(async (req, res) => {
  const { name, systemPrompt, firstMessage, language, voiceId, voiceProvider,
    model, enableBookingExtraction, useCase, bookingConfig, hangupKeywords, bolnaConfig } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, error: 'Agent name is required' });
  }

  const bolnaPayload = buildBolnaPayload(req.body);
  const langCode = language ? language.split('-')[0] : 'en';

  console.log('==========================================');
  console.log('[Bolna] Creating:', name, '| Lang:', langCode);
  console.log('[Bolna] LLM:', bolnaPayload.agent_config.tasks[0]?.tools_config?.llm_agent?.llm_config?.model);
  console.log('[Bolna] TTS:', bolnaPayload.agent_config.tasks[0]?.tools_config?.synthesizer?.provider);
  console.log('[Bolna] STT:', bolnaPayload.agent_config.tasks[0]?.tools_config?.transcriber?.provider, bolnaPayload.agent_config.tasks[0]?.tools_config?.transcriber?.language);
  console.log('==========================================');

  const endpoints = [process.env.BOLNA_AGENT_ENDPOINT, '/v2/agent', '/agent'].filter(Boolean);
  let agent = null, lastError = null;

  for (const endpoint of endpoints) {
    try {
      agent = await bolnaRequest('POST', endpoint, bolnaPayload);
      console.log(`[Bolna] SUCCESS on ${endpoint}: ${JSON.stringify(agent)}`);
      break;
    } catch (err) {
      lastError = err;
      console.error(`[Bolna] Failed on ${endpoint}:`, err.message?.substring(0, 300));
      if (err.response?.status === 400 || err.response?.status === 422) break;
    }
  }

  const providerId = agent?.agent_id || agent?.id || null;
  if (!providerId) {
    return res.status(502).json({ success: false, error: 'Failed to create agent in Bolna', details: lastError?.message?.substring(0, 500) });
  }

  const assistant = new Assistant({
    name, providerId, provider: 'bolna',
    systemPrompt: systemPrompt || '', firstMessage: firstMessage || 'Hello! How can I help you today?',
    language: language || 'hi', country: 'IN',
    voiceId: voiceId || '', voiceProvider: voiceProvider || 'elevenlabs',
    model: model || 'gpt-4o-mini',
    enableBookingExtraction: enableBookingExtraction || false, useCase: useCase || 'general',
    bookingConfig: bookingConfig || {},
    hangupKeywords: hangupKeywords || ['bye', 'goodbye', 'alvida', 'dhanyavaad'],
    userId: req.userId,
  });

  await assistant.save();
  res.status(201).json({ success: true, data: assistant });
});

export const getAllAssistants = asyncHandler(async (req, res) => {
  const assistants = await Assistant.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, data: assistants });
});

export const getAssistantById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assistant = MONGO_ID_REGEX.test(id) ? await Assistant.findById(id) : await Assistant.findOne({ providerId: id });
  if (!assistant) return res.status(404).json({ success: false, error: 'Assistant not found' });
  res.json({ success: true, data: assistant });
});

export const updateAssistant = asyncHandler(async (req, res) => {
  const assistant = await Assistant.findById(req.params.id);
  if (!assistant) return res.status(404).json({ success: false, error: 'Assistant not found' });
  for (const field of ['name','systemPrompt','firstMessage','language','voiceId','voiceProvider','model','enableBookingExtraction','useCase','bookingConfig','hangupKeywords','isActive']) {
    if (req.body[field] !== undefined) assistant[field] = req.body[field];
  }
  if (assistant.providerId) {
    try {
      await bolnaRequest('PUT', `/v2/agent/${assistant.providerId}`, buildBolnaPayload({ ...assistant.toObject(), ...req.body }));
    } catch (err) { console.error('[Bolna] Update failed:', err.message?.substring(0, 200)); }
  }
  await assistant.save();
  res.json({ success: true, data: assistant });
});

export const deleteAssistant = asyncHandler(async (req, res) => {
  const assistant = await Assistant.findById(req.params.id);
  if (!assistant) return res.status(404).json({ success: false, error: 'Assistant not found' });
  if (assistant.providerId) { try { await bolnaRequest('DELETE', `/v2/agent/${assistant.providerId}`); } catch {} }
  await Assistant.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Assistant deleted' });
});
