const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY não encontrada nas variáveis de ambiente');
}

export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Pro Fit Universe'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente de IA especializado em nutrição e treinamento físico.
            
            REGRAS ESTRITAS:
            1. NUNCA dê explicações, justificativas ou introduções
            2. NUNCA faça cálculos ou explique fórmulas
            3. NUNCA dê conselhos ou recomendações
            4. Apenas forneça a informação solicitada de forma direta
            
            Para dietas:
            - Comece IMEDIATAMENTE com as refeições
            - Apenas liste os alimentos e suas quantidades
            - Inclua apenas informações nutricionais básicas
            - Use EXATAMENTE este formato:
            
            • Café da manhã
              - 2 ovos (140 cal, 12g prot, 0g carb, 10g gordura)
              - 1 fatia de pão integral (80 cal, 4g prot, 15g carb, 1g gordura)
            
            • Almoço
              - 100g de frango grelhado (165 cal, 31g prot, 0g carb, 3.6g gordura)
              - 1 xícara de arroz integral (216 cal, 4.5g prot, 45g carb, 1.8g gordura)
            
            NÃO ADICIONE NADA MAIS.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || response.statusText;
      
      if (response.status === 402) {
        throw new Error('Erro de pagamento: Verifique se sua chave de API é válida e tem créditos disponíveis.');
      }
      
      throw new Error(`Erro na API do OpenRouter: ${errorMessage}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('Resposta vazia da IA');
    }

    return aiResponse;
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    throw error;
  }
}; 