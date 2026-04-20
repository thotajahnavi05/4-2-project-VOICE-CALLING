import fetch from 'node-fetch';

// Read env vars at request time, NOT at import time
// This ensures dotenv has loaded before we read the values
function getBaseUrl() {
  return (process.env.BOLNA_BASE_URL || 'https://api.bolna.ai').replace(/\/$/, '');
}

function getApiKey() {
  return process.env.BOLNA_API_KEY;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getApiKey()}`,
  };
}

export async function bolnaRequest(method, endpoint, body = null) {
  const baseUrl = getBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const options = { method, headers: getHeaders() };

  if (body) {
    // Clean null/undefined but keep api_tools: null
    const cleanBody = {};
    if (body && typeof body === 'object') {
      for (const [key, value] of Object.entries(body)) {
        if (key === 'api_tools' && value === null) {
          cleanBody[key] = null;
        } else if (value !== null && value !== undefined) {
          cleanBody[key] = value;
        }
      }
    }
    options.body = JSON.stringify(cleanBody);
  }

  console.log(`[Bolna API] ${method} ${url}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
  options.signal = controller.signal;

  let res;
  try {
    res = await fetch(url, options);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[Bolna API Error] ${method} ${url} - ${res.status}: ${errText}`);
    const error = new Error(errText);
    error.response = { status: res.status, data: errText };
    throw error;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}
