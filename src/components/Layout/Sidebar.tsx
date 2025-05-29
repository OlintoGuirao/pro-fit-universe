import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Home,
  Dumbbell,
  LineChart,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  UserPlus,
  CreditCard,
  Utensils,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false); // Fecha o menu em todas as resoluções
    
    // Redireciona para a página correta
    if (tab === 'dashboard') {
      navigate('/trainer/dashboard');
    }
  };

  if (!user) return null;

  const renderStudentButtons = () => (
    <>
      <Button
        variant={activeTab === 'social' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('social')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <Home className="mr-2 h-4 w-4" />
        Feed Social
      </Button>
      <Button
        variant={activeTab === 'workout' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('workout')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <Dumbbell className="mr-2 h-4 w-4" />
        Treinos
      </Button>
      <Button
        variant={activeTab === 'diet' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('diet')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <Utensils className="mr-2 h-4 w-4" />
        Dieta
      </Button>
      <Button
        variant={activeTab === 'progress' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('progress')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <LineChart className="mr-2 h-4 w-4" />
        Progresso
      </Button>
      <Button
        variant={activeTab === 'messages' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('messages')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Mensagens
      </Button>
    </>
  );

  const renderTrainerButtons = () => (
    <>

      <Button
        variant={activeTab === 'social' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('social')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <Home className="mr-2 h-4 w-4" />
        Feed Social
      </Button>
      <Button
        variant={activeTab === 'students' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('students')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <Users className="mr-2 h-4 w-4" />
        Dashboard
      </Button>
      <Button
        variant={activeTab === 'templates' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('templates')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <FileText className="mr-2 h-4 w-4" />
        Modelos de Treino
      </Button>
      <Button
        variant={activeTab === 'schedule' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('schedule')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <Calendar className="mr-2 h-4 w-4" />
        Agenda
      </Button>
      <Button
        variant={activeTab === 'messages' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('messages')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Mensagens
      </Button>
    </>
  );

  const renderAdminButtons = () => (
    <>
      <Button
        variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('dashboard')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <Home className="mr-2 h-4 w-4" />
        Dashboard
      </Button>
      <Button
        variant={activeTab === 'trainers' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('trainers')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Gerenciar Professores
      </Button>
      <Button
        variant={activeTab === 'users' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('users')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <Users className="mr-2 h-4 w-4" />
        Usuários
      </Button>
      <Button
        variant={activeTab === 'plans' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('plans')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Planos e Pagamentos
      </Button>
      <Button
        variant={activeTab === 'messages' ? 'default' : 'ghost'}
        onClick={() => handleTabClick('messages')}
        className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Mensagens
      </Button>
    </>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-2">
            {user.level === 1 && renderStudentButtons()}
            {user.level === 2 && renderTrainerButtons()}
            {user.level === 3 && renderAdminButtons()}
          </div>
        </div>
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-sm sm:text-base py-2 sm:py-3"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
