import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/Auth/LoginForm';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import StudentDashboard from '@/components/Student/StudentDashboard';
import TrainerDashboard from '@/components/Trainer/TrainerDashboard';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import SocialFeed from '@/components/Social/SocialFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getDefaultTab = () => {
    switch (user?.level) {
      case 1: return 'social';
      case 2: return 'students';
      case 3: return 'dashboard';
      default: return 'social';
    }
  };

  React.useEffect(() => {
    if (user) {
      setActiveTab(getDefaultTab());
    }
  }, [user?.level]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white text-lg sm:text-2xl">💪</span>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'social') return <SocialFeed />;
    
    switch (user.level) {
      case 1: // Aluno
        switch (activeTab) {
          case 'workout': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Meu Treino</h2></div>;
          case 'diet': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Minha Dieta</h2></div>;
          case 'progress': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Meu Progresso</h2></div>;
          case 'messages': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Mensagens</h2></div>;
          default: return <StudentDashboard />;
        }
      case 2: // Professor
        switch (activeTab) {
          case 'students': return <TrainerDashboard />;
          case 'templates': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Modelos de Treino</h2></div>;
          case 'schedule': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Agenda</h2></div>;
          case 'messages': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Mensagens</h2></div>;
          default: return <TrainerDashboard />;
        }
      case 3: // Admin
        switch (activeTab) {
          case 'dashboard': return <AdminDashboard />;
          case 'trainers': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Gerenciar Professores</h2></div>;
          case 'users': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Gerenciar Usuários</h2></div>;
          case 'plans': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Planos e Pagamentos</h2></div>;
          default: return <AdminDashboard />;
        }
      default:
        return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Conteúdo não encontrado</h2></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 min-h-screen overflow-auto lg:ml-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
