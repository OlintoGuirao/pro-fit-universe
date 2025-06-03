export const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('VITE_OPENROUTER_API_KEY não está definida no arquivo .env');
}

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

export const OPENROUTER_CONFIG = {
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': window.location.origin,
    'X-Title': 'ProFit Universe',
  }
}; 