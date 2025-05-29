
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/types/message';

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  selectedUser: User;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, selectedUser }) => {
  return (
    <ScrollArea className="h-[500px] mb-4">
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex items-end gap-2 max-w-[80%] ${
                msg.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={msg.senderId === currentUser.id ? currentUser.avatar || undefined : selectedUser.avatar || undefined}
                  alt={msg.senderId === currentUser.id ? currentUser.name : selectedUser.name}
                />
                <AvatarFallback>
                  {(msg.senderId === currentUser.id ? currentUser.name : selectedUser.name)[0]}
                </AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg p-3 ${
                  msg.senderId === currentUser.id
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
  );
};

export default MessageList;
