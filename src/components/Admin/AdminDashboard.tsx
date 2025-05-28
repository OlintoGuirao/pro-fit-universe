
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const AdminDashboard = () => {
  const stats = {
    totalUsers: 156,
    activeTrainers: 12,
    totalStudents: 98,
    revenueMonth: 4850,
    growthRate: 15.2
  };

  const topTrainers = [
    { name: 'Maria Personal', students: 15, rating: 4.9, revenue: 890 },
    { name: 'João Trainer', students: 12, rating: 4.8, revenue: 720 },
    { name: 'Ana Fitness', students: 10, rating: 4.7, revenue: 650 }
  ];

  const recentUsers = [
    { name: 'Carlos Silva', type: 'Aluno', joinDate: 'Hoje', status: 'Ativo' },
    { name: 'Fernanda Costa', type: 'Personal', joinDate: 'Ontem', status: 'Pendente' },
    { name: 'Roberto Santos', type: 'Aluno', joinDate: '2 dias', status: 'Ativo' }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">Visão geral da plataforma e métricas principais</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Usuários Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              ↗ +{stats.growthRate}% este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Personal Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.activeTrainers}</div>
            <p className="text-xs text-gray-500">ativos na plataforma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500">cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {stats.revenueMonth}</div>
            <p className="text-xs text-gray-500">em assinaturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">68%</div>
            <p className="text-xs text-gray-500">trial → assinatura</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Trainers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-purple-500" />
              Top Personal Trainers
            </CardTitle>
            <CardDescription>Ranking por receita e avaliação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTrainers.map((trainer, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{trainer.name}</p>
                      <p className="text-sm text-gray-500">{trainer.students} alunos • ⭐ {trainer.rating}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">R$ {trainer.revenue}</p>
                    <p className="text-xs text-gray-500">este mês</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-500" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Novos usuários e ações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.type} • {user.joinDate}</p>
                  </div>
                  <Badge variant={user.status === 'Ativo' ? 'default' : 'secondary'}>
                    {user.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-green-500" />
            Distribuição de Planos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Plano Free</span>
                <span className="text-sm text-gray-500">65%</span>
              </div>
              <Progress value={65} className="h-2" />
              <p className="text-xs text-gray-500">102 usuários</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Plano Pro</span>
                <span className="text-sm text-gray-500">25%</span>
              </div>
              <Progress value={25} className="h-2" />
              <p className="text-xs text-gray-500">39 usuários</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Plano Premium</span>
                <span className="text-sm text-gray-500">10%</span>
              </div>
              <Progress value={10} className="h-2" />
              <p className="text-xs text-gray-500">15 usuários</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Administrativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              Gerenciar Usuários
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <FileText className="h-6 w-6 mb-2" />
              Relatórios
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              Configurações
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              Suporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
