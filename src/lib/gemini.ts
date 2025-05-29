const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    console.log('Iniciando requisição para Gemini...');
    console.log('API Key:', GEMINI_API_KEY ? 'Presente' : 'Ausente');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Você é um assistente especializado em personal training. Responda à seguinte pergunta de forma profissional e detalhada em português: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta recebida:', data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      throw new Error('Formato de resposta inválido');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Erro detalhado:', error);
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';
  }
}; 