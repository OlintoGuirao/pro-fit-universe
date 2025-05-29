
import { CohereClient } from 'cohere-ai';

const COHERE_API_KEY = import.meta.env.VITE_COHERE_API_KEY;

const cohere = new CohereClient({
  token: COHERE_API_KEY
});

export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    console.log('Iniciando requisição para Cohere...');
    console.log('API Key:', COHERE_API_KEY ? 'Presente' : 'Ausente');

    const response = await cohere.generate({
      model: 'command',
      prompt: `Você é um assistente especializado em personal training. Responda à seguinte pergunta de forma profissional e detalhada em português: ${message}`,
      maxTokens: 300,
      temperature: 0.7,
      k: 0,
      stopSequences: [],
      returnLikelihoods: 'NONE'
    });

    console.log('Resposta recebida:', response);

    if (!response || !response.generations || !response.generations[0]) {
      throw new Error('Formato de resposta inválido');
    }

    return response.generations[0].text;
  } catch (error) {
    console.error('Erro detalhado:', error);
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';
  }
};
