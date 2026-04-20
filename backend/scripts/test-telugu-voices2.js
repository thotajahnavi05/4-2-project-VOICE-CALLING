import 'dotenv/config';
import { bolnaRequest } from '../services/bolnaService.js';

const tests = [
  // Sarvam with both voice AND voice_id
  { label: 'Sarvam meera (voice+voice_id)', provider: 'sarvam', config: { voice: 'meera', voice_id: 'meera', model: 'bhashini-tts', language: 'te-IN' } },
  { label: 'Sarvam arvind', provider: 'sarvam', config: { voice: 'arvind', voice_id: 'arvind', model: 'bhashini-tts', language: 'te-IN' } },
  // Polly with Indian voices
  { label: 'Polly Aditi neural', provider: 'polly', config: { voice: 'Aditi', engine: 'neural', language: 'te-IN' } },
  // ElevenLabs with different models
  { label: 'ElevenLabs turbo v2.5', provider: 'elevenlabs', config: { voice: '7Q6qcYvsTRgb4IVcoAdK', voice_id: '7Q6qcYvsTRgb4IVcoAdK', model: 'eleven_turbo_v2_5' } },
  { label: 'ElevenLabs flash v2.5', provider: 'elevenlabs', config: { voice: '7Q6qcYvsTRgb4IVcoAdK', voice_id: '7Q6qcYvsTRgb4IVcoAdK', model: 'eleven_flash_v2_5' } },
  // Deepgram
  { label: 'Deepgram angus', provider: 'deepgram', config: { voice: 'angus', model: 'aura-2' } },
];

for (const test of tests) {
  const payload = {
    agent_config: {
      agent_name: `TE-${test.label}`,
      agent_welcome_message: 'Namaskaram!',
      tasks: [{
        task_type: 'conversation',
        task_prompt: 'You speak Telugu.',
        welcome_message: 'Namaskaram!',
        tools_config: {
          llm_agent: { agent_type: 'simple_llm_agent', agent_flow_type: 'streaming',
            llm_config: { provider: 'openai', family: 'openai', model: 'gpt-4o-mini', max_tokens: 400, temperature: 0.7, base_url: 'https://api.openai.com/v1' }},
          synthesizer: { stream: true, caching: true, provider: test.provider, buffer_size: 200, audio_format: 'wav', provider_config: test.config },
          transcriber: { provider: 'sarvam', model: 'saarika:v2.5', language: 'te', stream: true },
          input: { provider: 'plivo', format: 'wav' }, output: { provider: 'plivo', format: 'wav' }, api_tools: null,
        },
        toolchain: { execution: 'parallel', pipelines: [['transcriber', 'llm', 'synthesizer']] },
        task_config: { hangup_after_silence: 20, optimize_latency: true, call_terminate: 600, welcome_message: 'Namaskaram!' },
      }],
    },
    agent_prompts: { task_1: { system_prompt: 'You speak Telugu.' } },
  };

  try {
    const result = await bolnaRequest('POST', '/v2/agent', payload);
    console.log(`✅ ${test.label} - agent_id: ${result.agent_id}`);
    await bolnaRequest('DELETE', `/v2/agent/${result.agent_id}`);
  } catch (e) {
    console.log(`❌ ${test.label} - ${e.message?.substring(0, 200)}`);
  }
}
