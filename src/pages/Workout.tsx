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
  completedExercises?: Exercise[];
  workoutTime?: number;
  completedAt?: any;
  completedDate?: string;
  weekProgress?: number;
  lastCompletedDay?: string;
}

const Workout = () => {
  const { user } = useAuth();
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  const { data: workouts = [], isLoading, refetch } = useQuery({
    queryKey: ['student-workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const workoutsRef = collection(db, 'workouts');
      const q = query(workoutsRef, where('studentId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Inicializa os exercícios como não concluídos se não existirem
        const exercises = data.exercises.split('\n').filter((line: string) => line.trim().startsWith('-'));
        const completedExercises = data.completedExercises || exercises.map((ex: string) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: ex.trim().replace(/^- /, ''),
          completed: false
        }));

        return {
          id: doc.id,
          ...data,
          completedExercises
        };
      }) as Workout[];
    }
  });

  const handleStartWorkout = (workoutId: string, dayIndex: number) => {
    setActiveWorkoutId(workoutId);
    setActiveDayIndex(dayIndex);
  };

  const handleCompleteWorkout = async (workoutId: string, workoutTime?: number) => {
    try {
      const workoutRef = doc(db, 'workouts', workoutId);
      const now = new Date();
      
      await updateDoc(workoutRef, {
        status: 'completed',
        workoutTime: workoutTime || 0,
        completedAt: now,
        completedDate: now.toISOString().split('T')[0] // Salva a data no formato YYYY-MM-DD
      });
      
      toast.success('Treino marcado como concluído!');
      setActiveWorkoutId(null);
      setActiveDayIndex(null);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      toast.error('Erro ao marcar treino como concluído');
    }
  };

  const handleExerciseToggle = async (workoutId: string, dayIndex: number, exerciseId: string) => {
    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      const dayExercises = splitWorkoutByDays(workout.exercises)[dayIndex]?.exercises || [];
      const updatedExercises = dayExercises.map(ex => 
        ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
      );

      const workoutRef = doc(db, 'workouts', workoutId);
      await updateDoc(workoutRef, {
        [`completedExercises.${dayIndex}`]: updatedExercises
      });

      // Atualiza o status do treino se todos os exercícios estiverem concluídos
      const allCompleted = updatedExercises.every(ex => ex.completed);
      if (allCompleted && workout.status !== 'completed') {
        await handleCompleteWorkout(workoutId);
      }

      toast.success('Exercício atualizado!');
      refetch();
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
          .filter(line => line.trim().startsWith('-'))
          .map(line => ({
            id: Math.random().toString(36).substr(2, 9),
            name: line.trim().replace(/^- /, ''),
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
                {workouts.filter(w => {
                  if (w.status !== 'completed' || !w.completedAt) return false;
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  const completedDate = w.completedAt.toDate();
                  return completedDate >= startOfWeek && completedDate <= endOfWeek;
                }).length}/{workouts.filter(w => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  const createdDate = w.createdAt.toDate();
                  return createdDate >= startOfWeek && createdDate <= endOfWeek;
                }).length} treinos
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
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center">
                          {day.title}
                          {workout.status === 'completed' && (
                            <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
                          )}
                        </CardTitle>
                        {workout.workoutTime && workout.status === 'completed' && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Tempo total: {formatTime(workout.workoutTime)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleWorkout(`${workout.id}-${index}`)}
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
                                onComplete={(time) => handleCompleteWorkout(workout.id, time)}
                                autoStart={true}
                              />
                            )}
                            <Button
                              variant={activeWorkoutId === workout.id && activeDayIndex === index ? "secondary" : "default"}
                              onClick={() => activeWorkoutId === workout.id && activeDayIndex === index
                                ? handleCompleteWorkout(workout.id)
                                : handleStartWorkout(workout.id, index)
                              }
                            >
                              {activeWorkoutId === workout.id && activeDayIndex === index ? 'Finalizar Treino' : 'Iniciar Treino'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {expandedWorkouts[`${workout.id}-${index}`] && (
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="space-y-2">
                            {splitWorkoutByDays(workout.exercises)[index]?.exercises.map((exercise) => (
                              <div key={exercise.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={exercise.id}
                                  checked={exercise.completed}
                                  onCheckedChange={() => handleExerciseToggle(workout.id, index, exercise.id)}
                                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                />
                                <label
                                  htmlFor={exercise.id}
                                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                    exercise.completed ? 'line-through text-gray-500' : ''
                                  }`}
                                >
                                  {exercise.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
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