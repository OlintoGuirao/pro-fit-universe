
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import MessageList from './MessageList';
import { Message } from '@/types/message';

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

interface StudentChatViewProps {
  selectedUser: User | null;
  currentUser: User;
  messages: Message[];
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

const StudentChatView: React.FC<StudentChatViewProps> = ({
  selectedUser,
  currentUser,
  messages,
  newMessage,
  onMessageChange,
  onSendMessage
}) => {
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
      <Card>
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
      </Card>
    </div>
  );
};

export default StudentChatView;
