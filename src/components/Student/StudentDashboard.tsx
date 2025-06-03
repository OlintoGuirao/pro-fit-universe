import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Users, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface Workout {
  id: string;
  title: string;
  description: string;
  exercises: string;
  createdAt: any;
  status: 'pending' | 'completed';
  createdBy: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekProgress, setWeekProgress] = useState(0);
  const weekGoal = 5;

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const workoutsRef = collection(db, 'workouts');
        const q = query(workoutsRef, where('studentId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        const workoutsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Workout[];

        setWorkouts(workoutsData);
        
        // Calcular progresso semanal
        const completedWorkouts = workoutsData.filter(w => w.status === 'completed').length;
        setWeekProgress(completedWorkouts);
      } catch (error) {
        console.error('Erro ao buscar treinos:', error);
        toast.error('Erro ao carregar treinos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [user]);

  const handleCompleteWorkout = async (workoutId: string) => {
    try {
      const workoutRef = doc(db, 'workouts', workoutId);
      await updateDoc(workoutRef, {
        status: 'completed'
      });

      setWorkouts(prev => prev.map(w => 
        w.id === workoutId ? { ...w, status: 'completed' } : w
      ));
      
      setWeekProgress(prev => prev + 1);
      toast.success('Treino marcado como concluído!');
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      toast.error('Erro ao marcar treino como concluído');
    }
  };

  const progressPercentage = (weekProgress / weekGoal) * 100;

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
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              Treino de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Carregando treinos...</div>
            ) : workouts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>Nenhum treino disponível</p>
                <p className="text-sm text-gray-400 mt-1">Seu professor ainda não criou treinos para você</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map((workout) => (
                  <div key={workout.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium text-lg">{workout.title}</p>
                        <p className="text-sm text-gray-500">{workout.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Criado em: {new Date(workout.createdAt?.toDate()).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant={workout.status === 'pending' ? 'secondary' : 'default'}>
                          {workout.status === 'pending' ? 'Pendente' : 'Concluído'}
                        </Badge>
                        {workout.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteWorkout(workout.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Marcar como Concluído
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Exercícios:</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <pre className="text-sm whitespace-pre-wrap">{workout.exercises}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streak e Conquistas */}
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
      </div>
    </div>
  );
};

export default StudentDashboard;
