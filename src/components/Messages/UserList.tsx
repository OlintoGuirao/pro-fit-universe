
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

interface UserListProps {
  users: User[];
  selectedUser: User | null;
  searchTerm: string;
  unreadCounts: Record<string, number>;
  onUserSelect: (user: User) => void;
  onSearchChange: (term: string) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  selectedUser,
  searchTerm,
  unreadCounts,
  onUserSelect,
  onSearchChange
}) => {
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Alunos</CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
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
              onClick={() => onUserSelect(student)}
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
  );
};

export default UserList;
