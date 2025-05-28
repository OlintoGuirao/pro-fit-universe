
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  FileText, 
  Bell, 
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    const commonItems = [
      { id: 'social', label: 'Rede Social', icon: ImageIcon },
      { id: 'messages', label: 'Mensagens', icon: MessageCircle },
    ];

    switch (user?.level) {
      case 1: // Aluno
        return [
          ...commonItems,
          { id: 'workout', label: 'Meu Treino', icon: Calendar },
          { id: 'diet', label: 'Minha Dieta', icon: FileText },
          { id: 'progress', label: 'Progresso', icon: Users },
        ];
      case 2: // Professor
        return [
          ...commonItems,
          { id: 'students', label: 'Alunos', icon: Users },
          { id: 'templates', label: 'Modelos', icon: FileText },
          { id: 'schedule', label: 'Agenda', icon: Calendar },
        ];
      case 3: // Admin
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Users },
          { id: 'trainers', label: 'Professores', icon: Users },
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'plans', label: 'Planos', icon: FileText },
        ];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white shadow-lg h-full border-r border-gray-200">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
