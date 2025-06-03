import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User, Bot, Loader2 } from 'lucide-react';
import { generateAIResponse } from '@/lib/openrouter';
import { useAuth } from '@/contexts/AuthContext';
import { useSuggestion } from '@/contexts/SuggestionContext';
import { Student } from '@/types/student';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'training' | 'diet' | 'question';
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou seu assistente de personal training. Como posso ajudá-lo hoje? Posso sugerir treinos, dietas ou responder dúvidas sobre exercícios.',
      sender: 'ai',
      timestamp: new Date(),
      type: 'question'
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { getStudentsByTrainer, setWorkoutSuggestion, setDietSuggestion } = useSuggestion();

  useEffect(() => {
    const loadStudents = async () => {
      if (user && user.level === 2) {
        try {
          const studentsList = await getStudentsByTrainer(user.id);
          setStudents(studentsList);
        } catch (error) {
          console.error('Erro ao carregar alunos:', error);
          toast.error('Erro ao carregar lista de alunos');
        }
      }
    };

    loadStudents();
  }, [user, getStudentsByTrainer]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageType = detectMessageType(inputMessage);
    const timestamp = new Date();
    const messageId = Date.now().toString();

    // Adiciona mensagem do usuário imediatamente
    const userMessage: Message = {
      id: messageId,
      content: inputMessage,
      sender: 'user',
      timestamp,
      type: messageType
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Adiciona indicador de carregamento
      const loadingMessage: Message = {
        id: `${messageId}-loading`,
        content: 'Processando...',
        sender: 'ai',
        timestamp: new Date(),
        type: messageType
      };
      setMessages(prev => [...prev, loadingMessage]);

      // Gera resposta da IA
      const aiResponse = await generateAIResponse(inputMessage);
      
      // Remove mensagem de carregamento e adiciona resposta
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== `${messageId}-loading`);
        return [...filtered, {
          id: `${messageId}-response`,
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
          type: messageType
        }];
      });

      // Salva sugestão se for treino ou dieta
      if (messageType === 'training') {
        setWorkoutSuggestion(aiResponse);
        toast.success('Treino sugerido salvo! Você pode encontrá-lo na aba de treinos.');
      } else if (messageType === 'diet') {
        setDietSuggestion(aiResponse);
        toast.success('Dieta sugerida salva! Você pode encontrá-la na aba de dietas.');
      }

    } catch (error) {
      console.error('Erro ao gerar resposta da IA:', error);
      
      // Remove mensagem de carregamento e adiciona mensagem de erro
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== `${messageId}-loading`);
        return [...filtered, {
          id: `${messageId}-error`,
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
          sender: 'ai',
          timestamp: new Date(),
          type: 'question'
        }];
      });
      
      toast.error('Erro ao processar sua mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStyle = (type?: 'training' | 'diet' | 'question') => {
    switch (type) {
      case 'training':
        return 'bg-blue-50 border-blue-200';
      case 'diet':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-100';
    }
  };

  const detectMessageType = (message: string): 'training' | 'diet' | 'question' => {
    const lowerMessage = message.toLowerCase();
    
    // Palavras-chave expandidas para treino
    const trainingKeywords = [
      'treino', 'exercício', 'treinar', 'musculação', 'academia',
      'treino de', 'treino para', 'ficha', 'série', 'repetição',
      'supino', 'agachamento', 'levantamento', 'corrida', 'cardio',
      'aeróbico', 'hiit', 'funcional', 'crossfit', 'pilates'
    ];
    
    // Palavras-chave expandidas para dieta
    const dietKeywords = [
      'dieta', 'alimentação', 'nutrição', 'cardápio', 'refeição',
      'dieta de', 'dieta para', 'calorias', 'proteína', 'carboidrato',
      'gordura', 'suplemento', 'vitamina', 'mineral', 'água',
      'café da manhã', 'almoço', 'jantar', 'lanche', 'snack'
    ];
    
    // Verifica se a mensagem contém palavras-chave de treino
    if (trainingKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'training';
    }
    
    // Verifica se a mensagem contém palavras-chave de dieta
    if (dietKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'diet';
    }
    
    return 'question';
  };

  return (
    <Card className="h-[calc(100vh-2rem)] md:h-[600px] flex flex-col">
      <CardHeader className="pb-2 md:pb-3">
        <CardTitle className="flex items-center text-base md:text-lg">
          <MessageCircle className="mr-2 h-4 w-4 md:h-5 md:w-5 text-blue-500" />
          Assistente IA
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 md:space-y-4 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-3 h-3 md:w-4 md:h-4" />
                    ) : (
                      <Bot className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[85%] sm:max-w-xs md:max-w-md lg:max-w-lg p-2 md:p-3 rounded-lg border ${
                    message.sender === 'user' 
                      ? 'bg-blue-500 text-white ml-auto' 
                      : message.type === 'training' 
                        ? 'bg-blue-50 border-blue-200'
                        : message.type === 'diet'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-100'
                  }`}>
                    <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-[10px] md:text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-2 md:p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      <span className="text-xs md:text-sm">Processando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <div className="p-2 md:p-4 border-t bg-background">
          <div className="flex space-x-2">
            <Input
              placeholder="Digite sua pergunta sobre treinos, dietas ou exercícios..."
              className="flex-1 text-xs md:text-sm h-8 md:h-10"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button
              className="h-8 w-8 md:h-10 md:w-10"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
              ) : (
                <Send className="w-3 h-3 md:w-4 md:h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">
            Alunos cadastrados: {students.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;
