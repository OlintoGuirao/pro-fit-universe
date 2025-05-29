const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    console.log('Iniciando requisição para DeepSeek...');
    console.log('API Key:', DEEPSEEK_API_KEY ? 'Presente' : 'Ausente');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em personal training. Responda sempre em português de forma profissional e detalhada.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta recebida:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Formato de resposta inválido');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro detalhado:', error);
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';
  }
}; 