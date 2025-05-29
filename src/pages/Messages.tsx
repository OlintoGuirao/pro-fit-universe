
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Message } from '@/types/message';
import StudentChatView from '@/components/Messages/StudentChatView';
import TrainerChatView from '@/components/Messages/TrainerChatView';

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

  if (!user) return null;

  const currentUserData: User = {
    id: user.id,
    name: user.name,
    avatar: user.avatar || null
  };

  return (
    <>
      {renderAssociateButton()}
      {user.level === 1 ? (
        <StudentChatView
          selectedUser={selectedUser}
          currentUser={currentUserData}
          messages={messages}
          newMessage={newMessage}
          onMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <TrainerChatView
          users={users}
          selectedUser={selectedUser}
          currentUser={currentUserData}
          messages={messages}
          newMessage={newMessage}
          searchTerm={searchTerm}
          unreadCounts={unreadCounts}
          onUserSelect={setSelectedUser}
          onSearchChange={setSearchTerm}
          onMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
        />
      )}
    </>
  );
};

export default Messages;
