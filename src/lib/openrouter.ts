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

export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    const systemPrompt = `Você é um assistente de personal trainer altamente qualificado, especializado em treinamento físico e nutrição. Suas respostas devem seguir **rigorosamente** as instruções abaixo:

1. SEMPRE responder em **português do Brasil (PT-BR)**
2. Manter um tom **profissional, direto e baseado em evidência científica**
3. Personalizar as respostas conforme o contexto fornecido pelo usuário
4. NUNCA misturar dieta e treino na mesma resposta
5. NÃO usar frases introdutórias ou conclusivas (ex: "Claro, aqui está...", "Espero que ajude", "Lembre-se de...")
6. NÃO incluir dicas, explicações ou justificativas

**Formato para treinos**:
- SEMPRE incluir TODOS os dias da semana solicitados
- Listar os exercícios por dia e grupo muscular
- Incluir apenas: NOME DO EXERCÍCIO – XxY (X séries x Y repetições)
- Agrupar por dia da semana com título (ex: Segunda – Peito + Tríceps)
- Mínimo de 6 exercícios por dia

**Formato para dietas**:
- Listar por refeição
- Cada refeição deve conter apenas alimentos e quantidades
- Adicionar substituições entre parênteses, como no exemplo abaixo:

Exemplo de dieta:
Desjejum:
- 200g de frutas e vegetais (substituição: 2 frutas e 1 cenoura cozida)
- 15g de proteína (substituição: 2 ovos ou 30g de proteína vegetal)

Exemplo de treino:
Segunda – Peito + Tríceps  
Supino reto com barra – 4x10  
Supino inclinado com halteres – 4x10  
Crossover (polia alta) – 3x12  
Tríceps corda (polia) – 4x12  
Tríceps testa – 3x12  
Tríceps francês – 3x12  

Terça – Costas + Bíceps  
Puxada frontal – 4x10  
Remada baixa – 4x10  
Remada curvada – 3x12  
Rosca direta – 4x12  
Rosca alternada – 3x12  
Rosca martelo – 3x12  

**IMPORTANTE**:
- Use sempre **terminologia técnica** em português (sem anglicismos desnecessários)
- Comece a resposta **diretamente com o conteúdo** (sem saudações ou explicações)
- O foco deve ser sempre o objetivo prático da resposta: montar o treino ou a dieta
- Garantir que TODOS os dias solicitados sejam incluídos na resposta`;

    const apiKey = validateApiKey(OPENROUTER_API_KEY);
    
    console.log('Iniciando requisição para OpenRouter API...');
    
    // Lista de modelos em ordem de preferência
    const models = [
      'anthropic/claude-3-opus:beta',    // Modelo mais avançado
      'anthropic/claude-3-sonnet:beta',  // Modelo intermediário
      'mistralai/mistral-7b-instruct',   // Modelo mais econômico
      'openai/gpt-3.5-turbo'             // Fallback final
    ];

    let lastError = null;
    
    for (const model of models) {
      try {
        console.log(`Tentando modelo: ${model}`);
        
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
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: model.includes('claude-3') ? 2000 : 800,
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

        console.log(`Resposta gerada com sucesso usando modelo: ${model}`);
        return aiResponse;
      } catch (error) {
        lastError = error;
        console.error(`Erro com modelo ${model}:`, error);
        
        if (model === models[models.length - 1]) {
          throw error;
        }
        
        console.log(`Tentando próximo modelo...`);
      }
    }

    throw lastError || new Error('Todas as tentativas falharam');
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    
    // Mensagens de erro mais amigáveis e específicas
    if (error instanceof Error) {
      if (error.message.includes('402')) {
        return 'Desculpe, estamos enfrentando um problema temporário com nossos serviços. Por favor, tente novamente em alguns minutos ou entre em contato com o suporte.';
      }
      if (error.message.includes('401')) {
        return 'Desculpe, houve um problema de autenticação. Por favor, tente novamente mais tarde.';
      }
      if (error.message.includes('429')) {
        return 'Desculpe, atingimos o limite de requisições. Por favor, tente novamente em alguns minutos.';
      }
    }
    
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente ou reformule sua pergunta.';
  }
}; 