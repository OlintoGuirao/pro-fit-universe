
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Users } from 'lucide-react';

const StudentDashboard = () => {
  const weekProgress = 4; // 4 treinos completados de 5
  const weekGoal = 5;
  const progressPercentage = (weekProgress / weekGoal) * 100;

  const todayWorkout = {
    name: "Treino de Pernas",
    exercises: ["Agachamento", "Leg Press", "Cadeira Extensora"],
    duration: 60
  };

  const todayMeals = [
    { name: "Café da Manhã", calories: 350, completed: true },
    { name: "Lanche da Manhã", calories: 150, completed: true },
    { name: "Almoço", calories: 600, completed: false },
    { name: "Lanche da Tarde", calories: 200, completed: false },
    { name: "Jantar", calories: 550, completed: false }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard do Aluno</h1>
        <p className="text-gray-600 mt-2">Acompanhe seu progresso e mantenha-se motivado!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Progresso Semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-purple-500" />
              Progresso Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Treinos Realizados</span>
                <span>{weekProgress}/{weekGoal}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">
                {weekGoal - weekProgress} treinos restantes esta semana
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Treino de Hoje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-pink-500" />
              Treino de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">{todayWorkout.name}</h3>
                <p className="text-sm text-gray-500">{todayWorkout.duration} minutos</p>
              </div>
              <div className="space-y-1">
                {todayWorkout.exercises.map((exercise, index) => (
                  <Badge key={index} variant="secondary" className="mr-1">
                    {exercise}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dieta do Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-green-500" />
              Dieta de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayMeals.map((meal, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className={meal.completed ? "line-through text-gray-500" : ""}>
                    {meal.name}
                  </span>
                  <span className="text-gray-500">{meal.calories} cal</span>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total do Dia</span>
                  <span>1,850 cal</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak e Conquistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🔥 Sequência Atual</CardTitle>
            <CardDescription>Dias consecutivos de treino</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">7</div>
              <p className="text-gray-600">Dias seguidos treinando!</p>
              <div className="mt-4 flex justify-center space-x-1">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-orange-500 rounded-full"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🏆 Conquistas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  🥇
                </div>
                <div>
                  <p className="font-medium">Primeira Semana</p>
                  <p className="text-sm text-gray-500">Completou 5 treinos</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  💪
                </div>
                <div>
                  <p className="font-medium">Força Crescente</p>
                  <p className="text-sm text-gray-500">Aumentou peso em 3 exercícios</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
