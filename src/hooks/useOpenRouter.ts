import { useState } from 'react';
import { OpenRouterService, ChatMessage, ChatCompletionRequest } from '../services/openrouter';

export const useOpenRouter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = async (
    messages: ChatMessage[],
    model: string = 'openai/gpt-3.5-turbo',
    temperature: number = 0.7,
    maxTokens: number = 1000
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const request: ChatCompletionRequest = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      const response = await OpenRouterService.createChatCompletion(request);
      return response.choices[0].message;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const listAvailableModels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      return await OpenRouterService.listModels();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    listAvailableModels,
    isLoading,
    error,
  };
}; 