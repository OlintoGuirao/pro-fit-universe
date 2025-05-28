
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/Auth/LoginForm';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import StudentDashboard from '@/components/Student/StudentDashboard';
import TrainerDashboard from '@/components/Trainer/TrainerDashboard';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import SocialFeed from '@/components/Social/SocialFeed';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const getDefaultTab = () => {
    switch (user?.level) {
      case 1: return 'social';
      case 2: return 'students';
      case 3: return 'dashboard';
      default: return 'social';
    }
  };

  // Move useEffect to the top, before any conditional returns
  React.useEffect(() => {
    if (user) {
      setActiveTab(getDefaultTab());
    }
  }, [user?.level]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-white text-2xl">💪</span>
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    if (activeTab === 'social') return <SocialFeed />;
    
    switch (user.level) {
      case 1: // Aluno
        switch (activeTab) {
          case 'workout': return <div className="p-6"><h2>Meu Treino</h2></div>;
          case 'diet': return <div className="p-6"><h2>Minha Dieta</h2></div>;
          case 'progress': return <div className="p-6"><h2>Meu Progresso</h2></div>;
          case 'messages': return <div className="p-6"><h2>Mensagens</h2></div>;
          default: return <StudentDashboard />;
        }
      case 2: // Professor
        switch (activeTab) {
          case 'students': return <TrainerDashboard />;
          case 'templates': return <div className="p-6"><h2>Modelos de Treino</h2></div>;
          case 'schedule': return <div className="p-6"><h2>Agenda</h2></div>;
          case 'messages': return <div className="p-6"><h2>Mensagens</h2></div>;
          default: return <TrainerDashboard />;
        }
      case 3: // Admin
        switch (activeTab) {
          case 'dashboard': return <AdminDashboard />;
          case 'trainers': return <div className="p-6"><h2>Gerenciar Professores</h2></div>;
          case 'users': return <div className="p-6"><h2>Gerenciar Usuários</h2></div>;
          case 'plans': return <div className="p-6"><h2>Planos e Pagamentos</h2></div>;
          default: return <AdminDashboard />;
        }
      default:
        return <div className="p-6"><h2>Conteúdo não encontrado</h2></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
