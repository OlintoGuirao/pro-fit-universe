import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Dumbbell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';

interface Workout {
  id: string;
  title: string;
  description: string;
  exercises: string;
  createdAt: any;
  status: 'pending' | 'completed';
  studentId: string;
  studentName: string;
  createdBy: string;
}

const Workout = () => {
  const { user } = useAuth();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['student-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const workoutsRef = collection(db, 'workouts');
      const q = query(workoutsRef, where('studentId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workout[];
    }
  });

  const formatWorkoutTitle = (title: string) => {
    // Remove "Título:" se existir
    return title.replace(/^Título:\s*/i, '').trim();
  };

  const splitWorkoutByDays = (exercises: string) => {
    // Lista de dias da semana para identificar corretamente
    const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    // Divide o texto em dias usando os dias da semana como separadores
    const days = exercises.split(new RegExp(`(?=${weekDays.join('|')})`));
    
    return days
      .map(day => {
        const trimmedDay = day.trim();
        if (!trimmedDay) return null;
        
        // Encontra o primeiro dia da semana no texto
        const dayMatch = weekDays.find(d => trimmedDay.startsWith(d));
        if (!dayMatch) return null;
        
        // Pega o título (dia + descrição) e o conteúdo
        const lines = trimmedDay.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        return {
          title,
          content
        };
      })
      .filter(Boolean); // Remove dias vazios
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meus Treinos</h1>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Ver Calendário
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-4">Carregando treinos...</div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Nenhum treino disponível ainda</div>
        ) : (
          workouts.map((workout) => (
            <div key={`main-${workout.id}`} className="space-y-6">
              {splitWorkoutByDays(workout.exercises).map((day, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{day.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="mr-1 h-4 w-4" />
                          Criado em: {workout.createdAt?.toDate().toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Button variant={workout.status === 'completed' ? "secondary" : "default"}>
                        {workout.status === 'completed' ? 'Completado' : 'Iniciar Treino'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {workout.description && (
                        <p className="text-sm text-gray-600">{workout.description}</p>
                      )}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                          {day.content}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>

      {workouts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Histórico de Treinos</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {workouts
                  .filter(workout => workout.status === 'completed')
                  .map((workout) => (
                    <div key={`history-${workout.id}`} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{formatWorkoutTitle(workout.title)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Completado em: {workout.createdAt?.toDate().toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Progress value={100} className="w-24" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Workout; 