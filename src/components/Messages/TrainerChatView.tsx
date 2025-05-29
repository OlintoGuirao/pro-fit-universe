
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import UserList from './UserList';
import MessageList from './MessageList';
import { Message } from '@/types/message';

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

interface TrainerChatViewProps {
  users: User[];
  selectedUser: User | null;
  currentUser: User;
  messages: Message[];
  newMessage: string;
  searchTerm: string;
  unreadCounts: Record<string, number>;
  onUserSelect: (user: User) => void;
  onSearchChange: (term: string) => void;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

const TrainerChatView: React.FC<TrainerChatViewProps> = ({
  users,
  selectedUser,
  currentUser,
  messages,
  newMessage,
  searchTerm,
  unreadCounts,
  onUserSelect,
  onSearchChange,
  onMessageChange,
  onSendMessage
}) => {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UserList
          users={users}
          selectedUser={selectedUser}
          searchTerm={searchTerm}
          unreadCounts={unreadCounts}
          onUserSelect={onUserSelect}
          onSearchChange={onSearchChange}
        />

        <Card className="md:col-span-3">
          {selectedUser ? (
            <>
              <CardHeader>
                <CardTitle>Chat com {selectedUser.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <MessageList 
                  messages={messages}
                  currentUser={currentUser}
                  selectedUser={selectedUser}
                />
                <form onSubmit={onSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => onMessageChange(e.target.value)}
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

export default TrainerChatView;
