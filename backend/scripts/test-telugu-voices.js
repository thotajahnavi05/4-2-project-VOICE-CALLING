import 'dotenv/config';
import { bolnaRequest } from '../services/bolnaService.js';

// Test different Telugu voice configurations
const testConfigs = [
  // Sarvam TTS with different voice IDs
  { label: 'Sarvam - meera', provider: 'sarvam', config: { voice_id: 'meera', model: 'bhashini-tts', language: 'te-IN' } },
  { label: 'Sarvam - arvind', provider: 'sarvam', config: { voice_id: 'arvind', model: 'bhashini-tts', language: 'te-IN' } },
  { label: 'Sarvam - karthik', provider: 'sarvam', config: { voice_id: 'karthik', model: 'bhashini-tts', language: 'te-IN' } },
  { label: 'Sarvam - padma', provider: 'sarvam', config: { voice_id: 'padma', model: 'bhashini-tts', language: 'te-IN' } },
  { label: 'Sarvam - ravi', provider: 'sarvam', config: { voice_id: 'ravi', model: 'bhashini-tts', language: 'te-IN' } },
  { label: 'Sarvam - default', provider: 'sarvam', config: { voice_id: 'default', model: 'bhashini-tts', language: 'te-IN' } },
  // Smallest AI
  { label: 'Smallest - default', provider: 'smallest', config: { voice: 'default', language: 'te-IN' } },
];

for (const test of testConfigs) {
  const payload = {
    agent_config: {
      agent_name: `Telugu Test - ${test.label}`,
      agent_welcome_message: 'Namaskaram!',
      tasks: [{
        task_type: 'conversation',
        task_prompt: 'You speak Telugu only.',
        welcome_message: 'Namaskaram!',
        tools_config: {
          llm_agent: { agent_type: 'simple_llm_agent', agent_flow_type: 'streaming',
            llm_config: { provider: 'openai', family: 'openai', model: 'gpt-4o-mini', max_tokens: 400, temperature: 0.7, base_url: 'https://api.openai.com/v1' }},
          synthesizer: {
            stream: true, caching: true, provider: test.provider,
            buffer_size: 200, audio_format: 'wav',
            provider_config: test.config,
          },
          transcriber: { provider: 'sarvam', model: 'saarika:v2.5', language: 'te', stream: true },
          input: { provider: 'plivo', format: 'wav' },
          output: { provider: 'plivo', format: 'wav' },
          api_tools: null,
        },
        toolchain: { execution: 'parallel', pipelines: [['transcriber', 'llm', 'synthesizer']] },
        task_config: { hangup_after_silence: 20, optimize_latency: true, call_terminate: 600, welcome_message: 'Namaskaram!' },
      }],
    },
    agent_prompts: { task_1: { system_prompt: 'You speak Telugu only.' } },
  };

  try {
    const result = await bolnaRequest('POST', '/v2/agent', payload);
    console.log(`✅ ${test.label} - WORKS! agent_id: ${result.agent_id}`);
    // Clean up
    await bolnaRequest('DELETE', `/v2/agent/${result.agent_id}`);
  } catch (e) {
    const msg = e.message?.substring(0, 150) || '';
    console.log(`❌ ${test.label} - FAILED: ${msg}`);
  }
}

console.log('\nDone!');
