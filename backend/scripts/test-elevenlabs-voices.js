import 'dotenv/config';
import { bolnaRequest } from '../services/bolnaService.js';

// Test various ElevenLabs voices to find the best for Telugu
const voices = [
  { id: '7Q6qcYvsTRgb4IVcoAdK', name: 'Vikram' },
  { id: 'm7GHBtY0UEqljrKQw2JH', name: 'Aisha' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
];

const models = ['eleven_turbo_v2_5', 'eleven_flash_v2_5'];

// Test each voice with turbo model (faster = more natural for phone calls)
for (const voice of voices) {
  const payload = {
    agent_config: {
      agent_name: `Voice-${voice.name}`,
      agent_welcome_message: 'Namaskaram! Meeku ela help cheyagalanu?',
      tasks: [{
        task_type: 'conversation',
        task_prompt: 'You are a Telugu assistant. Speak only in Telugu.',
        welcome_message: 'Namaskaram! Meeku ela help cheyagalanu?',
        tools_config: {
          llm_agent: { agent_type: 'simple_llm_agent', agent_flow_type: 'streaming',
            llm_config: { provider: 'openai', family: 'openai', model: 'gpt-4o-mini', max_tokens: 400, temperature: 0.7, base_url: 'https://api.openai.com/v1' }},
          synthesizer: { stream: true, caching: true, provider: 'elevenlabs', buffer_size: 200, audio_format: 'wav',
            provider_config: { voice: voice.id, voice_id: voice.id, model: 'eleven_turbo_v2_5' }},
          transcriber: { provider: 'sarvam', model: 'saarika:v2.5', language: 'te', stream: true },
          input: { provider: 'plivo', format: 'wav' }, output: { provider: 'plivo', format: 'wav' }, api_tools: null,
        },
        toolchain: { execution: 'parallel', pipelines: [['transcriber', 'llm', 'synthesizer']] },
        task_config: { hangup_after_silence: 20, optimize_latency: true, call_terminate: 600, welcome_message: 'Namaskaram!' },
      }],
    },
    agent_prompts: { task_1: { system_prompt: 'Telugu assistant.' } },
  };

  try {
    const result = await bolnaRequest('POST', '/v2/agent', payload);
    console.log(`✅ ${voice.name} (${voice.id}) - WORKS`);
    await bolnaRequest('DELETE', `/v2/agent/${result.agent_id}`);
  } catch (e) {
    console.log(`❌ ${voice.name} (${voice.id}) - ${e.message?.substring(0, 100)}`);
  }
}
