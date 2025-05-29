export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    console.log('Iniciando requisição para LM Studio...');

    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
        max_tokens: 500,
        stream: false
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