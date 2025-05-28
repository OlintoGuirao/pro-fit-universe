import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';

// Dados fictícios para exemplo
const mockMessages = [
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
    name: 'Você',
    avatar: '/avatars/student.jpg',
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
];

const Messages = () => {
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: 'student',
      name: 'Você',
      avatar: '/avatars/student.jpg',
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Chat com Prof. João</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] mb-4">
            <div className="space-y-4">
              {messages.map((msg) => (
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
};

export default Messages; 