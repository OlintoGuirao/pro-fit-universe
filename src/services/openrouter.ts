import { OPENROUTER_API_URL, OPENROUTER_CONFIG } from '../config/openrouter';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finish_reason: string;
  }[];
}

export class OpenRouterService {
  static async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...OPENROUTER_CONFIG.headers,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao chamar OpenRouter:', error);
      throw error;
    }
  }

  static async listModels() {
    try {
      const response = await fetch(`${OPENROUTER_API_URL}/models`, {
        headers: OPENROUTER_CONFIG.headers,
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar modelos:', error);
      throw error;
    }
  }
} 