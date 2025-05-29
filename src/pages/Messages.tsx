import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMessagesBetweenUsers,
  getStudentsByTrainer,
  getTrainerByStudent,
  sendMessage,
  markMessagesAsRead,
  getUnreadMessagesCount,
  getUnreadMessagesCountForStudent,
  associateStudentWithTrainer,
  subscribeToMessages,
} from '@/lib/db/queries';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

const Messages = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isAssociating, setIsAssociating] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;

      if (user.level === 1) {
        // Aluno: carregar professor
        const trainer = await getTrainerByStudent(user.id);
        if (trainer.length > 0) {
          const trainerData = trainer[0];
          setSelectedUser({
            id: trainerData.id,
            name: trainerData.name || 'Professor',
            avatar: trainerData.avatar || null
          });
          const messages = await getMessagesBetweenUsers(user.id, trainerData.id);
          setMessages(messages);
          const unreadCount = await getUnreadMessagesCountForStudent(user.id, trainerData.id);
          setUnreadCounts({ [trainerData.id]: unreadCount });
        }
      } else if (user.level === 2) {
        // Professor: carregar alunos
        const students = await getStudentsByTrainer(user.id);
        const formattedStudents = students.map(student => ({
          id: student.id,
          name: student.name || 'Aluno',
          avatar: student.avatar || null
        }));
        setUsers(formattedStudents);
        const unreadCounts = await getUnreadMessagesCount(user.id);
        setUnreadCounts(unreadCounts);
      }
    };

    loadInitialData();
  }, [user]);

  // Carregar mensagens quando selecionar um usuário
  useEffect(() => {
    if (!user || !selectedUser) return;

    try {
      console.log('Iniciando escuta de mensagens entre:', user.id, selectedUser.id);
      
      // Marcar mensagens como lidas
      if (user.level === 1) {
        markMessagesAsRead(selectedUser.id, user.id);
      } else {
        markMessagesAsRead(selectedUser.id, user.id);
      }

      // Escutar mensagens em tempo real
      const unsubscribe = subscribeToMessages(user.id, selectedUser.id, (newMessages) => {
        console.log('Novas mensagens recebidas:', newMessages);
        setMessages(newMessages);
      });

      // Limpar a escuta quando o componente for desmontado ou o usuário selecionado mudar
      return () => {
        console.log('Limpando escuta de mensagens');
        unsubscribe();
      };
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      alert('Erro ao carregar mensagens. Por favor, tente novamente.');
    }
  }, [user, selectedUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUser) {
      console.log('Dados inválidos:', { newMessage, user, selectedUser });
      return;
    }

    try {
      console.log('Enviando mensagem:', {
        senderId: user.id,
        receiverId: selectedUser.id,
        content: newMessage.trim()
      });

      await sendMessage(user.id, selectedUser.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Por favor, tente novamente.');
    }
  };

  const handleAssociate = async () => {
    if (!user || user.level !== 3) return; // Apenas admin pode fazer isso
    
    try {
      setIsAssociating(true);
      const studentId = "r1zF9vMjSETM3QqATaJYOCLtzVm2"; // ID do aluno
      const trainerId = "9FlIw5ZQCEYYXWMPjIWT61dYqbo1"; // ID do professor
      
      await associateStudentWithTrainer(studentId, trainerId);
      alert('Aluno associado ao professor com sucesso!');
    } catch (error) {
      console.error('Erro ao associar:', error);
      alert(`Erro ao associar aluno ao professor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsAssociating(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Renderizar botão de associação apenas para admin
  const renderAssociateButton = () => {
    if (user?.level !== 3) return null;

    return (
      <div className="mb-4">
        <Button 
          onClick={handleAssociate} 
          disabled={isAssociating}
          variant="outline"
        >
          {isAssociating ? 'Associando...' : 'Associar Aluno ao Professor'}
        </Button>
      </div>
    );
  };

  if (user?.level === 1) {
    // Visão do aluno
    if (!selectedUser) {
      return (
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="h-[600px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Nenhum professor atribuído
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-8">
        {renderAssociateButton()}
        <Card>
          <CardHeader>
            <CardTitle>Chat com {selectedUser.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] mb-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex items-end gap-2 max-w-[80%] ${
                        msg.senderId === user.id ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={msg.senderId === user.id ? user.avatar || undefined : selectedUser.avatar || undefined}
                          alt={msg.senderId === user.id ? user.name : selectedUser.name}
                        />
                        <AvatarFallback>
                          {(msg.senderId === user.id ? user.name : selectedUser.name)[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.senderId === user.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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

  // Visão do professor
  return (
    <div className="container mx-auto py-8">
      {renderAssociateButton()}
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
              {filteredUsers.map((student) => (
                <Button
                  key={student.id}
                  variant={selectedUser?.id === student.id ? "secondary" : "ghost"}
                  className="w-full justify-start px-4 py-3"
                  onClick={() => setSelectedUser(student)}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={student.avatar || undefined} alt={student.name} />
                    <AvatarFallback>{student.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{student.name}</span>
                      {unreadCounts[student.id] > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {unreadCounts[student.id]}
                        </span>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          {selectedUser ? (
            <>
              <CardHeader>
                <CardTitle>Chat com {selectedUser.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] mb-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.senderId === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`flex items-end gap-2 max-w-[80%] ${
                            msg.senderId === user?.id ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={msg.senderId === user?.id ? user?.avatar || undefined : selectedUser.avatar || undefined}
                              alt={msg.senderId === user?.id ? user?.name : selectedUser.name}
                            />
                            <AvatarFallback>
                              {(msg.senderId === user?.id ? user?.name : selectedUser.name)[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`rounded-lg p-3 ${
                              msg.senderId === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
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
