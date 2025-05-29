const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// Verificação mais detalhada da chave de API
if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY não encontrada nas variáveis de ambiente');
  throw new Error('OPENROUTER_API_KEY não encontrada nas variáveis de ambiente. Por favor, verifique o arquivo .env');
}

// Função para validar a chave de API
const validateApiKey = (key: string) => {
  if (!key || key.trim() === '') {
    throw new Error('Chave de API inválida: está vazia');
  }
  if (key.length < 10) {
    throw new Error('Chave de API inválida: formato incorreto');
  }
  return key.trim();
};

export const generateAIResponse = async (message: string, messageHistory: {role: string, content: string}[] = []): Promise<string> => {
  try {
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
      - Informações nutricionais
      
      Mantenha o contexto da conversa e forneça respostas completas e detalhadas.`;

    const apiKey = validateApiKey(OPENROUTER_API_KEY);
    
    console.log('Iniciando requisição para OpenRouter API...');
    
    // Tentativa com modelo mais econômico primeiro
    const models = [
      'mistralai/mistral-7b-instruct', // Modelo mais econômico
      'anthropic/claude-3-opus:beta'   // Modelo original como fallback
    ];

    let lastError = null;
    
    for (const model of models) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://wordfit.vercel.app',
            'X-Title': 'WordFit'
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              ...messageHistory,
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: model === 'mistralai/mistral-7b-instruct' ? 800 : 2000,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          lastError = errorData?.error?.message || response.statusText;
          
          if (response.status === 402) {
            console.log(`Tentando próximo modelo após erro 402 com ${model}`);
            continue;
          }
          
          throw new Error(`Erro na API do OpenRouter: ${lastError}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;
        
        if (!aiResponse) {
          throw new Error('Resposta vazia da IA');
        }

        return aiResponse;
      } catch (error) {
        lastError = error;
        if (model === models[models.length - 1]) {
          throw error;
        }
        console.log(`Erro com modelo ${model}, tentando próximo...`);
      }
    }

    throw lastError || new Error('Todas as tentativas falharam');
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    
    // Mensagem amigável para o usuário
    if (error instanceof Error && error.message.includes('402')) {
      return 'Desculpe, estamos enfrentando um problema temporário com nossos serviços. Por favor, tente novamente em alguns minutos ou entre em contato com o suporte.';
    }
    
    throw error;
  }
}; 