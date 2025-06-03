import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/Auth/LoginForm';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import StudentDashboard from '@/components/Student/StudentDashboard';
import TrainerDashboard from '@/components/Trainer/TrainerDashboard';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import TrainersManagement from '@/components/Admin/TrainersManagement';
import PlansManagement from '@/components/Admin/PlansManagement';
import SocialFeed from '@/components/Social/SocialFeed';
import ProgressPage from './Progress';
import Workout from './Workout';
import Messages from './Messages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Users from './Users';
import Diet from './Diet';
import { useLocation } from 'react-router-dom';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getDefaultTab = () => {
    const path = location.pathname;
    if (path.includes('/student/dashboard')) return 'dashboard';
    if (path.includes('/trainer/dashboard')) return 'students';
    if (path.includes('/admin/dashboard')) return 'dashboard';
    if (path.includes('/social')) return 'social';
    if (path.includes('/workout')) return 'workout';
    if (path.includes('/diet')) return 'diet';
    if (path.includes('/progress')) return 'progress';
    if (path.includes('/messages')) return 'messages';
    if (path.includes('/users')) return 'users';
    if (path.includes('/trainers')) return 'trainers';
    if (path.includes('/plans')) return 'plans';

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
  }, [user?.level, location.pathname]);

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
        <Card className="max-w-md mx-auto border-0 shadow-none">
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
    const path = location.pathname;
    
    // Rotas específicas
    if (path.includes('/student/dashboard')) return <StudentDashboard />;
    if (path.includes('/trainer/dashboard')) return <TrainerDashboard />;
    if (path.includes('/admin/dashboard')) return <AdminDashboard />;
    if (path.includes('/users')) return <Users />;
    
    // Rotas baseadas na aba ativa
    if (activeTab === 'social') return <SocialFeed />;
    
    switch (user.level) {
      case 1: // Aluno
        switch (activeTab) {
          case 'workout': return <Workout />;
          case 'diet': return <Diet />;
          case 'progress': return <ProgressPage />;
          case 'messages': return <Messages />;
          default: return <StudentDashboard />;
        }
      case 2: // Professor
        switch (activeTab) {
          case 'students': return <TrainerDashboard />;
          case 'templates': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Modelos de Treino</h2></div>;
          case 'schedule': return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Agenda</h2></div>;
          case 'messages': return <Messages />;
          default: return <TrainerDashboard />;
        }
      case 3: // Admin
        switch (activeTab) {
          case 'dashboard': return <AdminDashboard />;
          case 'trainers': return <TrainersManagement />;
          case 'users': return <Users />;
          case 'plans': return <PlansManagement />;
          default: return <AdminDashboard />;
        }
      default:
        return <div className="p-4 sm:p-6"><h2 className="text-xl sm:text-2xl">Conteúdo não encontrado</h2></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'lg:pl-64' : ''}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
