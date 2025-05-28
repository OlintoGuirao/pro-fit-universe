
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou sua assistente de IA para personal trainers. Posso ajudar você a criar treinos personalizados, sugerir dietas, dar dicas de exercícios e muito mais. Como posso ajudar hoje?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('treino') || lowerMessage.includes('exercício')) {
      return 'Para criar um treino eficaz, preciso saber mais sobre seu aluno:\n\n• Qual o objetivo principal? (hipertrofia, emagrecimento, condicionamento)\n• Quantos dias por semana pode treinar?\n• Tem alguma lesão ou limitação?\n• Qual o nível de experiência?\n\nCom essas informações, posso sugerir um programa personalizado!';
    }
    
    if (lowerMessage.includes('dieta') || lowerMessage.includes('alimentação')) {
      return 'Para uma dieta personalizada, considere:\n\n• Meta calórica baseada no objetivo\n• Distribuição de macronutrientes (proteína: 1,6-2,2g/kg)\n• Frequência das refeições (4-6 por dia)\n• Hidratação adequada (35ml/kg de peso)\n• Suplementação se necessário\n\nPrecisa de uma sugestão específica para algum aluno?';
    }
    
    if (lowerMessage.includes('hipertrofia')) {
      return 'Para hipertrofia muscular:\n\n• Treino: 3-5x/semana, 8-12 repetições\n• Sobrecarga progressiva constante\n• Descanso: 48-72h entre grupos musculares\n• Proteína: 1,8-2,2g/kg de peso\n• Superávit calórico moderado\n• Sono: 7-9 horas por noite\n\nQuer que eu detalhe algum aspecto específico?';
    }
    
    if (lowerMessage.includes('emagrecimento') || lowerMessage.includes('perder peso')) {
      return 'Para emagrecimento saudável:\n\n• Déficit calórico moderado (300-500 kcal)\n• Treino: força + cardio\n• Proteína: 1,6-2,0g/kg (preservar massa muscular)\n• Cardio: 150-300min/semana moderado\n• Controle de porções\n• Acompanhamento semanal\n\nPrecisa de um plano específico?';
    }
    
    return 'Entendi! Posso ajudar com várias questões relacionadas ao personal training:\n\n• Criação de treinos personalizados\n• Planejamento de dietas\n• Dicas de exercícios\n• Progressão de cargas\n• Motivação de alunos\n• Correção de erros comuns\n\nSobre qual tópico gostaria de saber mais?';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simular delay da IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: simulateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Bot className="mr-2 h-5 w-5 text-purple-500" />
          Assistente IA - Personal Trainer
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <span className={`text-xs ${message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'} mt-1 block`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre treinos, dietas ou dicas..."
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-purple-500 hover:bg-purple-600"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;
