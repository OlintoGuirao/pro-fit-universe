const COHERE_API_KEY = import.meta.env.VITE_COHERE_API_KEY;

export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    console.log('Iniciando requisição para Cohere...');

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'command',
        prompt: `Você é um assistente especializado em personal training, com conhecimento profundo em:
          - Criação de treinos personalizados
          - Planejamento de dietas
          - Técnicas de exercícios
          - Fisiologia do exercício
          - Nutrição esportiva
          - Motivação e psicologia do esporte
          
          Suas respostas devem ser:
          - Profissionais e baseadas em evidências científicas
          - Detalhadas e práticas
          - Adaptadas ao nível do aluno
          - Seguras e responsáveis
          - Em português do Brasil
          
          Para treinos, sempre inclua:
          - Nome do exercício
          - Séries e repetições
          - Descrição da execução
          - Dicas de técnica
          - Cuidados e contraindicações
          
          Para dietas, sempre inclua:
          - Horário das refeições
          - Quantidades precisas
          - Opções de substituição
          - Dicas de preparo
          - Informações nutricionais

          Pergunta do usuário: ${message}`,
        max_tokens: 1000,
        temperature: 0.7,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', errorText);
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Resposta recebida:', data);

    if (!data.generations || !data.generations[0]?.text) {
      throw new Error('Formato de resposta inválido');
    }

    return data.generations[0].text;
  } catch (error) {
    console.error('Erro detalhado:', error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      return 'Não foi possível conectar à API do Cohere. Por favor, verifique sua conexão com a internet.';
    }
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';
  }
};
