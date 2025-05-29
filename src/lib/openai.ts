import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateAIResponse = async (message: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em personal training, com conhecimento profundo em:
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
            
            Sempre inclua exemplos práticos e dicas úteis.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content || 'Desculpe, não consegui processar sua pergunta.';
  } catch (error) {
    console.error('Erro ao gerar resposta da IA:', error);
    return 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.';
  }
}; 