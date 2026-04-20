import OpenAI from 'openai/index.mjs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function preprocessHinglish(transcript) {
  let text = transcript;
  const replacements = {
    'aaj': 'today', 'kal': 'tomorrow', 'parso': 'day after tomorrow',
    'subah': 'morning', 'dopahar': 'afternoon', 'shaam': 'evening', 'raat': 'night',
    'ek': '1', 'do': '2', 'teen': '3', 'chaar': '4', 'paanch': '5',
    'chhe': '6', 'saat': '7', 'aath': '8', 'nau': '9', 'das': '10',
    'gyarah': '11', 'barah': '12', 'baje': "o'clock",
    'log': 'people', 'aadmi': 'people', 'vyakti': 'persons',
  };
  for (const [hindi, eng] of Object.entries(replacements)) {
    text = text.replace(new RegExp(`\\b${hindi}\\b`, 'gi'), eng);
  }
  return text;
}

function fixPhoneticEmail(text) {
  const corrections = {
    'grosstag': 'growstack', 'grostag': 'growstack', 'geemail': 'gmail',
    'jeemail': 'gmail', 'hotmale': 'hotmail', 'yaahoo': 'yahoo',
    'outluk': 'outlook', 'redifmail': 'rediffmail',
  };
  let fixed = text;
  for (const [wrong, right] of Object.entries(corrections)) {
    fixed = fixed.replace(new RegExp(wrong, 'gi'), right);
  }
  return fixed;
}

export async function extractBookingFromTranscript(transcript) {
  const preprocessed = preprocessHinglish(transcript);
  const cleaned = fixPhoneticEmail(preprocessed);

  const systemPrompt = `You are an expert at extracting structured booking information from voice call transcripts.
The transcripts may be in English, Hindi, or Hinglish (mixed Hindi-English).

Extract the following fields:
- intent: one of [book_table, book_appointment, cancel_booking, modify_booking, inquiry, other]
- date: in YYYY-MM-DD format (convert relative dates like "tomorrow" using today's date)
- time: in HH:mm format (24-hour)
- guestCount: number of guests/people
- customerName: full name
- email: email address (fix phonetic spellings like "john at gmail dot com")
- phone: phone number with country code (+91...)
- confidence: 0-1 score of extraction confidence
- detectedLanguage: en, hi, or hinglish
- extractionNotes: any notes about the extraction

Today's date is ${new Date().toISOString().split('T')[0]}.
Timezone context: IST (Asia/Kolkata).

Return ONLY valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract booking details from this transcript:\n\n${cleaned}` },
    ],
    response_format: { type: 'json_object' },
  });

  const extracted = JSON.parse(response.choices[0].message.content);

  // Validate email format
  if (extracted.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(extracted.email)) {
    const emailMatch = transcript.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) extracted.email = emailMatch[0];
    else extracted.email = '';
  }

  // Ensure phone has +91 prefix
  if (extracted.phone && !extracted.phone.startsWith('+')) {
    extracted.phone = extracted.phone.startsWith('91')
      ? `+${extracted.phone}`
      : `+91${extracted.phone.replace(/^0+/, '')}`;
  }

  return {
    ...extracted,
    model: 'gpt-4o-mini',
    extractedAt: new Date(),
  };
}
