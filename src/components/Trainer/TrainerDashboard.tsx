
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, FileText, Bell } from 'lucide-react';

const TrainerDashboard = () => {
  const students = [
    { 
      id: '1', 
      name: 'João Silva', 
      goal: 'Hipertrofia', 
      lastWorkout: '2 dias atrás',
      progress: 85,
      active: true
    },
    { 
      id: '2', 
      name: 'Maria Santos', 
      goal: 'Emagrecimento', 
      lastWorkout: 'Hoje',
      progress: 92,
      active: true
    },
    { 
      id: '3', 
      name: 'Pedro Costa', 
      goal: 'Condicionamento', 
      lastWorkout: '1 semana atrás',
      progress: 45,
      active: false
    }
  ];

  const pendingTasks = [
    { student: 'João Silva', task: 'Revisar dieta', deadline: 'Hoje' },
    { student: 'Maria Santos', task: 'Novo treino', deadline: 'Amanhã' },
    { student: 'Pedro Costa', task: 'Check-in semanal', deadline: 'Atrasado' }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard do Personal</h1>
        <p className="text-gray-600 mt-2">Gerencie seus alunos e acompanhe o progresso de cada um</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">3</div>
            <p className="text-xs text-gray-500">de 5 permitidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Alunos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2</div>
            <p className="text-xs text-gray-500">treinaram esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tarefas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-gray-500">requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avaliação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">4.8</div>
            <p className="text-xs text-gray-500">⭐⭐⭐⭐⭐</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Alunos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              Meus Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.goal}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={student.active ? "default" : "secondary"}>
                      {student.progress}%
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{student.lastWorkout}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Adicionar Novo Aluno
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarefas Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5 text-orange-500" />
              Tarefas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{task.task}</p>
                    <p className="text-sm text-gray-500">{task.student}</p>
                  </div>
                  <Badge 
                    variant={task.deadline === 'Atrasado' ? 'destructive' : 'secondary'}
                  >
                    {task.deadline}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-500" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              Criar Treino
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <FileText className="h-6 w-6 mb-2" />
              Criar Dieta
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              Enviar Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerDashboard;
