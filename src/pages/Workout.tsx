import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Dumbbell, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import WorkoutCalendar from '@/components/Calendar/WorkoutCalendar';
import { Checkbox } from '@/components/ui/checkbox';
import Timer from '@/components/Timer/Timer';

interface Exercise {
  id: string;
  name: string;
  completed: boolean;
}

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
  completedExercises?: Record<number, Exercise[]>;
  workoutTime?: Record<number, number>;
  completedAt?: Record<number, any>;
  completedDate?: Record<number, string>;
  weekProgress?: number;
  lastCompletedDay?: string;
  completedDays?: number[];
}

const Workout = () => {
  const { user } = useAuth();
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const { data: workoutsData = [], isLoading, refetch } = useQuery({
    queryKey: ['student-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const workoutsRef = collection(db, 'workouts');
      const q = query(workoutsRef, where('studentId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const exercises = data.exercises.split('\n').filter((line: string) => line.trim().startsWith('-'));
        const completedExercises = data.completedExercises || {};
        
        // Inicializa os exercícios para cada dia
        const days = splitWorkoutByDays(data.exercises);
        days.forEach((day, dayIndex) => {
          if (!completedExercises[dayIndex]) {
            completedExercises[dayIndex] = day.exercises.map(ex => ({
              id: ex.id,
              name: ex.name,
              completed: false
            }));
          }
        });

        return {
          id: doc.id,
          ...data,
          completedExercises
        };
      }) as Workout[];
    }
  });

  // Atualiza o estado local quando os dados do query mudam
  React.useEffect(() => {
    if (workoutsData.length > 0) {
      setWorkouts(workoutsData);
    }
  }, [workoutsData]);

  // Recupera o treino ativo e o tempo do localStorage ao carregar
  React.useEffect(() => {
    const savedActiveWorkout = localStorage.getItem('activeWorkout');
    if (savedActiveWorkout) {
      const { workoutId, dayIndex, startTime } = JSON.parse(savedActiveWorkout);
      setActiveWorkoutId(workoutId);
      setActiveDayIndex(dayIndex);
      setWorkoutStartTime(startTime);
    }
  }, []);

  const handleStartWorkout = (workoutId: string, dayIndex: number) => {
    // Verifica se já existe um treino ativo no mesmo dia
    const today = new Date().toISOString().split('T')[0];
    const hasActiveWorkoutToday = workouts.some(w => 
      w.completedDate?.[dayIndex] === today && w.id !== workoutId
    );

    if (hasActiveWorkoutToday) {
      toast.error('Você já iniciou um treino hoje. Finalize-o antes de começar outro.');
      return;
    }

    const startTime = Date.now();
    setActiveWorkoutId(workoutId);
    setActiveDayIndex(dayIndex);
    setWorkoutStartTime(startTime);
    
    // Salva o treino ativo e o tempo inicial no localStorage
    localStorage.setItem('activeWorkout', JSON.stringify({ 
      workoutId, 
      dayIndex,
      startTime 
    }));
  };

  const handleCompleteWorkout = async (workoutId: string, dayIndex: number, workoutTime?: number) => {
    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      // Verifica se todos os exercícios do dia foram concluídos
      const completedExercises = workout.completedExercises?.[dayIndex] || [];
      const allExercisesCompleted = completedExercises.every(ex => ex.completed);

      if (!allExercisesCompleted) {
        toast.error('Complete todos os exercícios antes de finalizar o treino');
        return;
      }

      const workoutRef = doc(db, 'workouts', workoutId);
      const now = new Date();
      
      const completedDays = workout.completedDays || [];
      if (!completedDays.includes(dayIndex)) {
        completedDays.push(dayIndex);
      }

      // Calcula o tempo total do treino
      const totalTime = workoutTime || (workoutStartTime ? Math.floor((Date.now() - workoutStartTime) / 1000) : 0);
      
      const updateData: Record<string, any> = {
        completedDays,
        [`workoutTime.${dayIndex}`]: totalTime,
        [`completedAt.${dayIndex}`]: now,
        [`completedDate.${dayIndex}`]: now.toISOString().split('T')[0]
      };

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await updateDoc(workoutRef, updateData);
      
      // Remove o treino ativo do localStorage
      localStorage.removeItem('activeWorkout');
      
      toast.success('Treino marcado como concluído!');
      setActiveWorkoutId(null);
      setActiveDayIndex(null);
      setWorkoutStartTime(null);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      toast.error('Erro ao marcar treino como concluído');
    }
  };

  const handleExerciseToggle = async (workoutId: string, dayIndex: number, exerciseId: string) => {
    try {
      // Encontra o treino
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      // Obtém os exercícios do dia atual
      const dayExercises = workout.completedExercises?.[dayIndex] || [];
      
      // Atualiza o estado do exercício
      const updatedExercises = dayExercises.map(ex => {
        if (ex.id === exerciseId) {
          return { ...ex, completed: !ex.completed };
        }
        return ex;
      });

      // Atualiza o banco de dados
      const workoutRef = doc(db, 'workouts', workoutId);
      await updateDoc(workoutRef, {
        [`completedExercises.${dayIndex}`]: updatedExercises
      });

      // Força uma atualização dos dados
      await refetch();

      toast.success('Exercício atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error);
      toast.error('Erro ao marcar exercício como concluído');
    }
  };

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkouts(prev => ({
      ...prev,
      [workoutId]: !prev[workoutId]
    }));
  };

  const formatWorkoutTitle = (title: string) => {
    // Remove "Título:" e "Hipertrofia" se existirem
    return title
      .replace(/^Título:\s*/i, '')
      .replace(/Hipertrofia\s*/i, '')
      .trim();
  };

  const splitWorkoutByDays = (exercises: string) => {
    const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const days = exercises.split(new RegExp(`(?=${weekDays.join('|')})`));
    
    return days
      .map(day => {
        const trimmedDay = day.trim();
        if (!trimmedDay) return null;
        
        const dayMatch = weekDays.find(d => trimmedDay.startsWith(d));
        if (!dayMatch) return null;
        
        const lines = trimmedDay.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        // Extrai os exercícios deste dia específico
        const dayExercises = content
          .split('\n')
          .filter(line => line.trim())
          .map(line => ({
            id: Math.random().toString(36).substr(2, 9),
            name: line.trim(),
            completed: false
          }));
        
        return {
          title,
          content,
          exercises: dayExercises
        };
      })
      .filter(Boolean);
  };

  const getWeekProgress = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Começa do domingo
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Termina no sábado

    const completedWorkoutsThisWeek = workouts.filter(w => {
      if (w.status !== 'completed' || !w.completedAt) return false;
      const completedDate = w.completedAt.toDate();
      return completedDate >= startOfWeek && completedDate <= endOfWeek;
    }).length;

    const totalWorkoutsThisWeek = workouts.filter(w => {
      const createdDate = w.createdAt.toDate();
      return createdDate >= startOfWeek && createdDate <= endOfWeek;
    }).length;

    return totalWorkoutsThisWeek > 0 ? (completedWorkoutsThisWeek / totalWorkoutsThisWeek) * 100 : 0;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Treinos</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe seu progresso semanal</p>
        </div>
        <Button onClick={() => setShowCalendar(true)}>
          <Calendar className="mr-2 h-4 w-4" />
          Ver Calendário
        </Button>
      </div>

      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Progresso Semanal</h3>
              <Badge variant="secondary">
                {workouts.reduce((total, workout) => {
                  return total + (workout.completedDays?.length || 0);
                }, 0)}/5 dias de treino
              </Badge>
            </div>
            <Progress value={getWeekProgress()} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-4">Carregando treinos...</div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Dumbbell className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>Nenhum treino disponível ainda</p>
            <p className="text-sm text-gray-400 mt-1">Seu professor ainda não criou treinos para você</p>
          </div>
        ) : (
          workouts.map((workout) => (
            <div key={`main-${workout.id}`} className="space-y-6">
              {splitWorkoutByDays(workout.exercises).map((day, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                      <div className="space-y-1 w-full sm:w-auto">
                        <CardTitle className="text-lg sm:text-xl flex flex-wrap items-center gap-2">
                          <span className="font-bold text-primary">{day.title.split(' – ')[0]}</span>
                          <span className="text-muted-foreground">–</span>
                          <span className="font-medium">{day.title.split(' – ')[1]}</span>
                          {workout.completedDays?.includes(index) && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                        </CardTitle>
                        {workout.workoutTime && workout.status === 'completed' && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Tempo total: {formatTime(workout.workoutTime[index] || 0)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleWorkout(`${workout.id}-${index}`)}
                          className="hover:bg-gray-100"
                        >
                          {expandedWorkouts[`${workout.id}-${index}`] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        {workout.status !== 'completed' && (
                          <div className="flex items-center gap-2">
                            {activeWorkoutId === workout.id && activeDayIndex === index && (
                              <Timer 
                                onComplete={(time) => handleCompleteWorkout(workout.id, index, time)}
                                autoStart={true}
                                initialTime={workoutStartTime ? Math.floor((Date.now() - workoutStartTime) / 1000) : 0}
                              />
                            )}
                            <Button
                              variant={activeWorkoutId === workout.id && activeDayIndex === index ? "secondary" : "default"}
                              onClick={() => {
                                if (activeWorkoutId === workout.id && activeDayIndex === index) {
                                  const dayExercises = splitWorkoutByDays(workout.exercises)[index]?.exercises || [];
                                  const allExercisesCompleted = dayExercises.every(ex => ex.completed);
                                  
                                  if (!allExercisesCompleted) {
                                    toast.error('Complete todos os exercícios antes de finalizar o treino');
                                    return;
                                  }
                                  handleCompleteWorkout(workout.id, index);
                                } else {
                                  handleStartWorkout(workout.id, index);
                                }
                              }}
                              className="min-w-[120px]"
                            >
                              {activeWorkoutId === workout.id && activeDayIndex === index ? 'Finalizar Treino' : 'Iniciar Treino'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {expandedWorkouts[`${workout.id}-${index}`] && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                          <Dumbbell className="h-4 w-4" />
                          Exercícios
                        </div>
                        <div className="space-y-2.5">
                          {day.exercises.map((exercise, exerciseIndex) => {
                            const isCompleted = workout.completedExercises?.[index]?.find(
                              ex => ex.id === exercise.id
                            )?.completed || false;

                            return (
                              <div 
                                key={exerciseIndex} 
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => handleExerciseToggle(workout.id, index, exercise.id)}
                                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                />
                                <span className={`text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                  {exercise.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                      </div>
                      <Progress value={100} className="w-24" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCalendar && (
        <WorkoutCalendar
          workouts={workouts}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default Workout; 