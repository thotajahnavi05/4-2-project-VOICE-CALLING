import 'dotenv/config';
import { bolnaRequest } from '../services/bolnaService.js';

const agentId = 'bd966fcd-300a-4f25-bf65-9bca146b225a';

const systemPrompt = `You are a friendly, professional multilingual voice assistant for India.

LANGUAGE RULES:
- You can speak Telugu, Hindi, and English fluently
- ALWAYS reply in the SAME language the caller is speaking
- If the caller speaks Telugu, reply in Telugu
- If the caller speaks Hindi, reply in Hindi
- If the caller speaks English, reply in English
- If the caller mixes languages (Hinglish/Tenglish), match their style
- Be natural and conversational in all languages

CONVERSATION RULES:
- Keep responses SHORT (under 25 words)
- Ask ONE question at a time
- Wait for the user to FINISH speaking before responding
- Do NOT interrupt the user mid-sentence
- If unclear, ask them to repeat politely
- Be warm, helpful and professional

CALL ENDING:
- When the user says bye/goodbye/alvida/dhanyavaad/nenu velthunna/sare bye, say a warm goodbye and STOP
- After saying goodbye, say NOTHING more`;

const welcomeMessage = 'Namaste! Thank you for calling. How can I help you today?';

const callCancellationPrompt = `Return TRUE to END CALL IMMEDIATELY if ANY of these are true:

1. Last message contains "bye" or "goodbye" (English)
2. Last message contains "alvida" or "dhanyavaad" or "chalo bye" (Hindi)
3. Last message contains "nenu velthunna" or "sare bye" or "velthanu" (Telugu)
4. Last message contains "never mind" or "nevermind"
5. Last message contains "that's all" or "thats all" or "bas itna hi"
6. Last message contains "thank you for calling"
7. Last message ends with "Goodbye!" or "Bye!"
8. Customer said only "bye" or "ok bye" or "thanks bye" or "ok thanks"
9. Last message contains "accha bye" or "theek hai bye" or "ok bye"

Return FALSE ONLY if there is an active question being asked or answered.
IMPORTANT: If you see any goodbye phrase in any language, return TRUE immediately.`;

const payload = {
  agent_config: {
    agent_name: 'India Voice Agent',
    agent_welcome_message: welcomeMessage,
    tasks: [{
      task_type: 'conversation',
      task_prompt: systemPrompt,
      welcome_message: welcomeMessage,
      tools_config: {
        llm_agent: {
          agent_type: 'simple_llm_agent',
          agent_flow_type: 'streaming',
          llm_config: {
            provider: 'openai',
            family: 'openai',
            model: 'gpt-4o-mini',
            max_tokens: 500,
            temperature: 0.7,
            base_url: 'https://api.openai.com/v1',
            top_p: 0.9,
            min_p: 0.1,
            top_k: 0,
            request_json: true,
            presence_penalty: 0,
            frequency_penalty: 0,
          },
        },
        // ElevenLabs multilingual v2 - supports Telugu, Hindi, English
        synthesizer: {
          stream: true,
          caching: true,
          provider: 'elevenlabs',
          buffer_size: 200,
          audio_format: 'wav',
          provider_config: {
            voice: 'm7GHBtY0UEqljrKQw2JH',
            voice_id: 'm7GHBtY0UEqljrKQw2JH',
            model: 'eleven_multilingual_v2',
          },
        },
        // Deepgram nova-2 with Hindi - handles Hindi/English/Hinglish code-switching
        // nova-2 is best for Indian accents and multilingual conversations
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'hi',
          stream: true,
          sampling_rate: 16000,
          encoding: 'linear16',
          endpointing: 1200,
        },
        input: { provider: 'plivo', format: 'wav' },
        output: { provider: 'plivo', format: 'wav' },
        api_tools: null,
      },
      toolchain: {
        execution: 'parallel',
        pipelines: [['transcriber', 'llm', 'synthesizer']],
      },
      task_config: {
        hangup_after_silence: 20,
        incremental_delay: 300,
        number_of_words_for_interruption: 5,
        interruption_backoff_period: 200,
        hangup_after_LLMCall: false,
        backchanneling: false,
        ambient_noise: false,
        optimize_latency: true,
        call_terminate: 600,
        voicemail: false,
        inbound_limit: -1,
        whitelist_phone_numbers: [],
        disallow_unknown_numbers: false,
        welcome_message: welcomeMessage,
        call_cancellation_prompt: callCancellationPrompt,
      },
    }],
  },
  agent_prompts: {
    task_1: {
      system_prompt: systemPrompt,
    },
  },
};

try {
  const result = await bolnaRequest('PUT', '/v2/agent/' + agentId, payload);
  console.log('Agent updated successfully:', JSON.stringify(result));

  // Verify
  const verify = await bolnaRequest('GET', '/v2/agent/' + agentId);
  console.log('\nVerification:');
  console.log('  Synthesizer:', verify.tasks[0]?.tools_config?.synthesizer?.provider, '-', verify.tasks[0]?.tools_config?.synthesizer?.provider_config?.model);
  console.log('  Transcriber:', verify.tasks[0]?.tools_config?.transcriber?.provider, '-', verify.tasks[0]?.tools_config?.transcriber?.model, '- lang:', verify.tasks[0]?.tools_config?.transcriber?.language);
  console.log('  LLM:', verify.tasks[0]?.tools_config?.llm_agent?.llm_config?.model);
  console.log('  Ambient noise:', verify.tasks[0]?.task_config?.ambient_noise);
  console.log('  Has hangup prompt:', !!verify.tasks[0]?.task_config?.call_cancellation_prompt);
} catch (e) {
  console.error('ERROR:', e.message?.substring(0, 500));
}
