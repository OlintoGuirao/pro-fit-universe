import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Dumbbell } from 'lucide-react';

const Workout = () => {
  // Dados fictícios para exemplo
  const workouts = [
    {
      id: 1,
      name: 'Treino A - Peito e Tríceps',
      exercises: [
        { name: 'Supino Reto', sets: 4, reps: 12, weight: '60kg' },
        { name: 'Supino Inclinado', sets: 3, reps: 12, weight: '50kg' },
        { name: 'Tríceps Pulley', sets: 3, reps: 15, weight: '30kg' },
      ],
      duration: 60,
      completed: false,
    },
    {
      id: 2,
      name: 'Treino B - Costas e Bíceps',
      exercises: [
        { name: 'Puxada Frontal', sets: 4, reps: 12, weight: '50kg' },
        { name: 'Remada Curvada', sets: 3, reps: 12, weight: '40kg' },
        { name: 'Rosca Direta', sets: 3, reps: 12, weight: '20kg' },
      ],
      duration: 60,
      completed: false,
    },
    {
      id: 3,
      name: 'Treino C - Pernas',
      exercises: [
        { name: 'Agachamento', sets: 4, reps: 12, weight: '80kg' },
        { name: 'Leg Press', sets: 3, reps: 12, weight: '100kg' },
        { name: 'Extensão', sets: 3, reps: 15, weight: '40kg' },
      ],
      duration: 75,
      completed: false,
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meu Treino</h1>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Ver Calendário
        </Button>
      </div>

      <div className="grid gap-6">
        {workouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{workout.name}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Clock className="mr-1 h-4 w-4" />
                    {workout.duration} minutos
                  </div>
                </div>
                <Button variant={workout.completed ? "secondary" : "default"}>
                  {workout.completed ? 'Completado' : 'Iniciar Treino'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workout.exercises.map((exercise, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center">
                      <Dumbbell className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{exercise.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {exercise.sets}x{exercise.reps} • {exercise.weight}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Histórico de Treinos</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Treino A - Peito e Tríceps</h3>
                  <p className="text-sm text-muted-foreground">Completado há 2 dias</p>
                </div>
                <Progress value={100} className="w-24" />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Treino B - Costas e Bíceps</h3>
                  <p className="text-sm text-muted-foreground">Completado há 4 dias</p>
                </div>
                <Progress value={100} className="w-24" />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Treino C - Pernas</h3>
                  <p className="text-sm text-muted-foreground">Completado há 6 dias</p>
                </div>
                <Progress value={100} className="w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Workout; 