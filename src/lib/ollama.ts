export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    console.log('Iniciando requisição para Ollama...');

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: `Você é um assistente especializado em personal training. Responda à seguinte pergunta de forma profissional e detalhada em português: ${message}`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta recebida:', data);

    if (!data.response) {
      throw new Error('Formato de resposta inválido');
    }

    return data.response;
  } catch (error) {
    console.error('Erro detalhado:', error);
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';
  }
}; 