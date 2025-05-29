import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, User, Dumbbell, Salad, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSuggestion } from '@/contexts/SuggestionContext';
import { generateAIResponse } from '@/lib/openrouter';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AIChat = () => {
  const { user, loading: authLoading } = useAuth();
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
  const { setWorkoutSuggestion, setDietSuggestion, sendSuggestion, getStudentsByTrainer } = useSuggestion();
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionContent, setSuggestionContent] = useState('');
  const [suggestionType, setSuggestionType] = useState<'workout' | 'diet'>('workout');
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatDietResponse = (response: string): string => {
    // Remove qualquer texto introdutório ou explicativo
    let formatted = response
      .replace(/^.*?(?=Café da manhã|Almoço|Jantar|Lanche|Refeição)/is, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    // Formata cada refeição
    const meals = formatted.split(/\n\s*\n/);
    formatted = meals.map(meal => {
      const lines = meal.split('\n');
      if (lines.length < 2) return meal;

      // Formata o nome da refeição
      const mealName = lines[0].replace(/^[•\-\*]\s*/, '').trim();
      let formattedMeal = `• ${mealName}\n`;

      // Formata os alimentos
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Adiciona bullet point se não existir
        if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
          formattedMeal += `  - ${line}\n`;
        } else {
          formattedMeal += `  ${line}\n`;
        }
      }

      return formattedMeal;
    }).join('\n');

    return formatted;
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    try {
      setIsLoading(true);
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);

      const response = await generateAIResponse(message);
      console.log('Resposta da IA:', response);

      if (!response) {
        throw new Error('Resposta vazia da IA');
      }

      // Verifica se a resposta contém uma sugestão de dieta
      if (response.toLowerCase().includes('dieta') || response.toLowerCase().includes('alimentação')) {
        const formattedResponse = formatDietResponse(response);
        setShowSuggestionModal(true);
        setSuggestionContent(formattedResponse);
        setSuggestionType('diet');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setError('Erro ao enviar mensagem. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  // Carregar alunos quando o termo de busca mudar
  useEffect(() => {
    const loadStudents = async () => {
      if (!user?.id) return;
      
      setIsLoadingStudents(true);
      try {
        const allStudents = await getStudentsByTrainer(user.id);
        const filteredStudents = allStudents.filter(student =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setStudents(filteredStudents);
      } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        toast.error('Erro ao carregar lista de alunos');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, [searchTerm, user?.id]);

  const handleSendSuggestion = async (content: string, type: 'workout' | 'diet') => {
    if (!selectedStudent) {
      toast.error('Selecione um aluno primeiro!');
      return;
    }

    setIsSendingSuggestion(true);
    try {
      await sendSuggestion(content, type, selectedStudent);
      toast.success('Sugestão enviada com sucesso!');
      setSelectedStudent('');
      setSearchTerm('');
      setShowSuggestionModal(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar sugestão';
      toast.error(errorMessage);
    } finally {
      setIsSendingSuggestion(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base md:text-lg">
          <Bot className="mr-2 h-4 w-4 md:h-5 md:w-5 text-purple-500" />
          Assistente IA - Personal Trainer
          {authLoading && (
            <span className="ml-2 text-sm text-gray-500">(Carregando...)</span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 h-[calc(600px-4rem)]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="h-full flex flex-col">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[90%] md:max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <Avatar className="h-6 w-6 md:h-8 md:w-8">
                    <AvatarFallback>
                      {message.sender === 'user' ? <User className="h-3 w-3 md:h-4 md:w-4" /> : <Bot className="h-3 w-3 md:h-4 md:w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg p-2 md:p-3 ${
                      message.sender === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <span className={`text-[10px] md:text-xs ${message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'} mt-1 block`}>
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.sender === 'ai' && (
                      <div className="flex gap-2 mt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition-colors"
                            >
                              <Dumbbell className="h-3 w-3" />
                              Usar no Treino
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Enviar Sugestão de Treino</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                  placeholder="Buscar aluno..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-8"
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto">
                                {isLoadingStudents ? (
                                  <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                                  </div>
                                ) : students.length === 0 ? (
                                  <p className="text-sm text-gray-500 text-center py-2">
                                    Nenhum aluno encontrado
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {students.map((student) => (
                                      <button
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student.id)}
                                        className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                                          selectedStudent === student.id
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'hover:bg-gray-100'
                                        }`}
                                      >
                                        {student.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setWorkoutSuggestion(message.content)}
                                >
                                  Usar Localmente
                                </Button>
                                <Button
                                  onClick={() => handleSendSuggestion(message.content, 'workout')}
                                  disabled={!selectedStudent || isSendingSuggestion}
                                >
                                  Enviar para Aluno
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 transition-colors"
                            >
                              <Salad className="h-3 w-3" />
                              Usar na Dieta
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]" aria-describedby="diet-dialog-description">
                            <DialogHeader>
                              <DialogTitle>Enviar Sugestão de Dieta</DialogTitle>
                              <DialogDescription id="diet-dialog-description">
                                Selecione um aluno para enviar a sugestão de dieta.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                  placeholder="Buscar aluno..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-8"
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto">
                                {isLoadingStudents ? (
                                  <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                  </div>
                                ) : students.length === 0 ? (
                                  <p className="text-sm text-gray-500 text-center py-2">
                                    Nenhum aluno encontrado
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {students.map((student) => (
                                      <button
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student.id)}
                                        className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                                          selectedStudent === student.id
                                            ? 'bg-green-100 text-green-700'
                                            : 'hover:bg-gray-100'
                                        }`}
                                      >
                                        {student.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setDietSuggestion(message.content)}
                                >
                                  Usar Localmente
                                </Button>
                                <Button
                                  onClick={() => handleSendSuggestion(message.content, 'diet')}
                                  disabled={!selectedStudent || isSendingSuggestion}
                                >
                                  Enviar para Aluno
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <Avatar className="h-6 w-6 md:h-8 md:w-8">
                    <AvatarFallback>
                      <Bot className="h-3 w-3 md:h-4 md:w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-lg p-2 md:p-3">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-2 md:p-4 bg-white">
          <div className="flex space-x-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre treinos, dietas ou dicas..."
              className="flex-1 min-h-[36px] md:min-h-[40px] max-h-[100px] md:max-h-[120px] resize-none text-xs md:text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-purple-500 hover:bg-purple-600 h-9 w-9 md:h-10 md:w-10"
              size="icon"
            >
              <Send className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;
