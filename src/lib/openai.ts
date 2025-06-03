import { OPENROUTER_API_URL, OPENROUTER_CONFIG } from '../config/openrouter';

export async function generateAIResponse(messages: any[]) {
  try {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...OPENROUTER_CONFIG.headers,
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na API:', errorData);
      throw new Error(`Erro na API: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro detalhado:', error);
    throw error;
  }
} 