export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    console.log('Iniciando requisição para Ollama...');

    const systemPrompt = `Você é um assistente especializado em personal training, com conhecimento profundo em:
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
      - Informações nutricionais`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: `${systemPrompt}\n\nPergunta do usuário: ${message}`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1,
          num_predict: 1024,
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

    if (!data.response) {
      throw new Error('Formato de resposta inválido');
    }

    return data.response;
  } catch (error) {
    console.error('Erro detalhado:', error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      return 'Não foi possível conectar ao servidor Ollama. Por favor, verifique se o Ollama está instalado e rodando em http://localhost:11434';
    }
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';
  }
}; 