import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Dados fictícios para exemplo
const mockStudents = [
  {
    id: 1,
    name: 'João Silva',
    avatar: '/avatars/student1.jpg',
    lastMessage: 'Está indo bem! Consegui fazer todas as séries.',
    timestamp: '10:32',
    unread: 2,
  },
  {
    id: 2,
    name: 'Maria Santos',
    avatar: '/avatars/student2.jpg',
    lastMessage: 'Professor, posso trocar o treino de hoje?',
    timestamp: '09:15',
    unread: 0,
  },
  {
    id: 3,
    name: 'Pedro Oliveira',
    avatar: '/avatars/student3.jpg',
    lastMessage: 'Obrigado pelo treino!',
    timestamp: 'Ontem',
    unread: 0,
  },
];

const mockChats = {
  1: [
    {
      id: 1,
      sender: 'trainer',
      name: 'Prof. João',
      avatar: '/avatars/trainer.jpg',
      message: 'Olá! Como está o treino hoje?',
      timestamp: '10:30',
    },
    {
      id: 2,
      sender: 'student',
      name: 'João Silva',
      avatar: '/avatars/student1.jpg',
      message: 'Está indo bem! Consegui fazer todas as séries.',
      timestamp: '10:32',
    },
    {
      id: 3,
      sender: 'trainer',
      name: 'Prof. João',
      avatar: '/avatars/trainer.jpg',
      message: 'Ótimo! Lembre-se de manter a postura correta durante os exercícios.',
      timestamp: '10:33',
    },
  ],
  2: [
    {
      id: 1,
      sender: 'trainer',
      name: 'Prof. João',
      avatar: '/avatars/trainer.jpg',
      message: 'Olá Maria! Como posso ajudar?',
      timestamp: '09:10',
    },
    {
      id: 2,
      sender: 'student',
      name: 'Maria Santos',
      avatar: '/avatars/student2.jpg',
      message: 'Professor, posso trocar o treino de hoje?',
      timestamp: '09:15',
    },
  ],
  3: [
    {
      id: 1,
      sender: 'trainer',
      name: 'Prof. João',
      avatar: '/avatars/trainer.jpg',
      message: 'Bom treino hoje!',
      timestamp: 'Ontem',
    },
    {
      id: 2,
      sender: 'student',
      name: 'Pedro Oliveira',
      avatar: '/avatars/student3.jpg',
      message: 'Obrigado pelo treino!',
      timestamp: 'Ontem',
    },
  ],
};

const Messages = () => {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [messages, setMessages] = useState<typeof mockChats>(mockChats);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = mockStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudent) return;

    const message = {
      id: messages[selectedStudent].length + 1,
      sender: user?.level === 2 ? 'trainer' : 'student',
      name: user?.level === 2 ? 'Prof. João' : 'Você',
      avatar: user?.level === 2 ? '/avatars/trainer.jpg' : '/avatars/student.jpg',
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => ({
      ...prev,
      [selectedStudent]: [...prev[selectedStudent], message],
    }));
    setNewMessage('');
  };

  if (user?.level === 1) {
    // Visão do aluno - mostra apenas o chat com o professor
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Chat com Prof. João</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] mb-4">
              <div className="space-y-4">
                {messages[1].map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'student' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex items-end gap-2 max-w-[80%] ${
                        msg.sender === 'student' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.avatar} alt={msg.name} />
                        <AvatarFallback>{msg.name[0]}</AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.sender === 'student'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Visão do professor - mostra lista de alunos e chat selecionado
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Alunos</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {filteredStudents.map((student) => (
                <Button
                  key={student.id}
                  variant={selectedStudent === student.id ? "secondary" : "ghost"}
                  className="w-full justify-start px-4 py-3"
                  onClick={() => setSelectedStudent(student.id)}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={student.avatar} alt={student.name} />
                    <AvatarFallback>{student.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{student.name}</span>
                      {student.unread > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {student.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {student.lastMessage}
                    </p>
                  </div>
                </Button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          {selectedStudent ? (
            <>
              <CardHeader>
                <CardTitle>
                  Chat com {mockStudents.find(s => s.id === selectedStudent)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] mb-4">
                  <div className="space-y-4">
                    {messages[selectedStudent].map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender === 'trainer' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`flex items-end gap-2 max-w-[80%] ${
                            msg.sender === 'trainer' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.avatar} alt={msg.name} />
                            <AvatarFallback>{msg.name[0]}</AvatarFallback>
                          </Avatar>
                          <div
                            className={`rounded-lg p-3 ${
                              msg.sender === 'trainer'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="h-[600px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Selecione um aluno para iniciar a conversa
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages; 