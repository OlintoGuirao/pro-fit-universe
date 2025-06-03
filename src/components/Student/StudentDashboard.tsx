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

interface Diet {
  id: string;
  title: string;
  description: string;
  meals: string;
  createdAt: any;
  status: 'pending' | 'completed';
  trainerId: string;
  studentId: string;
  studentName: string;
  createdBy: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDiets, setIsLoadingDiets] = useState(true);
  const [weekProgress, setWeekProgress] = useState(0);
  const weekGoal = 5;

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

  const fetchDiets = async () => {
    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }

    try {
      console.log('Iniciando busca de dietas para o aluno:', user.id);
      setIsLoadingDiets(true);
      const dietsRef = collection(db, 'diets');
      const q = query(dietsRef, where('studentId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      console.log('Query executada, número de documentos:', querySnapshot.size);
      
      const dietsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Dados do documento:', data);
        return {
          id: doc.id,
          ...data
        };
      }) as Diet[];

      console.log('Dietas processadas:', dietsData);
      setDiets(dietsData);
      console.log('Estado atualizado com as dietas');
    } catch (error) {
      console.error('Erro ao buscar dietas:', error);
      toast.error('Erro ao carregar dietas');
    } finally {
      setIsLoadingDiets(false);
    }
  };

  useEffect(() => {
    console.log('useEffect executado');
    fetchWorkouts();
    fetchDiets();
  }, [user]);

  useEffect(() => {
    console.log('Estado das dietas atualizado:', {
      isLoadingDiets,
      dietsCount: diets.length,
      diets
    });
  }, [isLoadingDiets, diets]);

  // Novo useEffect para monitorar mudanças no estado
  useEffect(() => {
    if (!isLoadingDiets && diets.length > 0) {
      console.log('Dietas carregadas e prontas para exibição:', diets);
    }
  }, [isLoadingDiets, diets]);

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
              <Progress value={(weekProgress / weekGoal) * 100} className="h-2" />
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

        {/* Dieta Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-green-500" />
              Dieta Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDiets ? (
              <div className="text-center py-4">Carregando dietas...</div>
            ) : diets && diets.length > 0 ? (
              <div className="space-y-4">
                {diets.map((diet) => {
                  console.log('Renderizando dieta:', diet);
                  return (
                    <div key={diet.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium text-lg">{diet.title}</p>
                          <p className="text-sm text-gray-500">{diet.description}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Criado em: {diet.createdAt?.toDate().toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <Badge variant={diet.status === 'pending' ? 'secondary' : 'default'}>
                          {diet.status === 'pending' ? 'Pendente' : 'Concluído'}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Refeições:</h4>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <pre className="text-sm whitespace-pre-wrap">{diet.meals}</pre>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>Nenhuma dieta disponível</p>
                <p className="text-sm text-gray-400 mt-1">Seu professor ainda não criou dietas para você</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
