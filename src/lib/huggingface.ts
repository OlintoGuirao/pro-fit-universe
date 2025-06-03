const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;

export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    console.log('Iniciando requisição para Hugging Face...');

    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/opt-350m',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`
        },
        body: JSON.stringify({
          inputs: `Você é um assistente especializado em personal training. Responda à seguinte pergunta de forma profissional e detalhada em português: ${message}`,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.7,
            top_p: 0.9,
            repetition_penalty: 1.1,
            do_sample: true
          }
        })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', errorText);
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Resposta recebida:', data);

    if (!data[0]?.generated_text) {
      throw new Error('Formato de resposta inválido');
    }

    return data[0].generated_text;
  } catch (error) {
    console.error('Erro detalhado:', error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      return 'Não foi possível conectar à API do Hugging Face. Por favor, verifique sua conexão com a internet.';
    }
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';
  }
}; 