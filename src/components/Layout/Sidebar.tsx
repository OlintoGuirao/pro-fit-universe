
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  FileText, 
  Bell, 
  MessageCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen = true, 
  setSidebarOpen 
}) => {
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

  const handleItemClick = (itemId: string) => {
    setActiveTab(itemId);
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarOpen?.(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen?.(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-64 bg-white shadow-lg border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:block
      `}>
        {/* Mobile close button */}
        <div className="flex justify-end p-4 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen?.(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-4 pb-4 lg:p-4">
          <nav className="space-y-1 sm:space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start text-sm sm:text-base py-2 sm:py-3 ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
