import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, Scale, Ruler, Dumbbell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { NewEvaluationDialog } from '@/components/Student/NewEvaluationDialog';
import { EvaluationHistory } from '@/components/Student/EvaluationHistory';

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
  completedExercises?: any[];
  workoutTime?: number;
  completedAt?: any;
  completedDate?: string;
}

interface Evaluation {
  id: string;
  createdAt?: any;
  status?: string;
  scheduledDate?: any;
  results?: {
    weight?: string;
    height?: string;
    bmi?: string;
    bodyFat?: string;
    muscleMass?: string;
    weightGoal?: string;
  };
}

const ProgressPage = () => {
  const { user } = useAuth();
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [newEvaluationDialogOpen, setNewEvaluationDialogOpen] = useState(false);

  const { data: workouts = [] } = useQuery({
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

  const { data: evaluations = [] } = useQuery<Evaluation[]>({
    queryKey: ['student-evaluations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const evaluationsRef = collection(db, 'evaluations');
      const q = query(
        evaluationsRef,
        where('studentId', '==', user.id),
        where('status', '==', 'completed')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as Evaluation)
        .sort((a, b) => ((b.createdAt && b.createdAt.seconds) ? b.createdAt.seconds : 0) - ((a.createdAt && a.createdAt.seconds) ? a.createdAt.seconds : 0));
    }
  });

  const latestEvaluation = evaluations[0];

  const metrics = {
    weight: latestEvaluation && latestEvaluation.results ? latestEvaluation.results.weight || '-' : '-',
    height: latestEvaluation && latestEvaluation.results ? latestEvaluation.results.height || '-' : '-',
    bmi: latestEvaluation && latestEvaluation.results ? latestEvaluation.results.bmi || '-' : '-',
    bodyFat: latestEvaluation && latestEvaluation.results ? latestEvaluation.results.bodyFat || '-' : '-',
    muscleMass: latestEvaluation && latestEvaluation.results ? latestEvaluation.results.muscleMass || '-' : '-',
    weightGoal:  latestEvaluation && latestEvaluation.results ? latestEvaluation.results.weightGoal || '-' : '-',
    currentWeight: latestEvaluation && latestEvaluation.results ? latestEvaluation.results.weight || '-' : '-',
  };

  const handleNewEvaluation = async () => {
    try {
      if (!user?.id || !user?.trainerId) {
        toast.error('Erro ao solicitar avaliação: usuário não encontrado');
        return;
      }

      const tasksRef = collection(db, 'tasks');
      const taskData = {
        type: 'evaluation',
        studentId: user.id,
        studentName: user.name,
        trainerId: user.trainerId,
        status: 'pending',
        createdAt: serverTimestamp(),
        description: 'Solicitação de nova avaliação física',
        priority: 'high',
        title: 'Nova Avaliação Física'
      };

      const docRef = await addDoc(tasksRef, taskData);
      console.log('Tarefa criada com sucesso:', docRef.id);
      toast.success('Solicitação de avaliação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao solicitar avaliação. Tente novamente.');
    }
  };

  const getDaysTrainedThisMonth = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const uniqueDays = new Set(
      workouts
        .filter(w => w.status === 'completed' && w.completedAt)
        .map(w => {
          let completedDate: Date | null = null;
          if (w.completedAt && typeof w.completedAt.toDate === 'function') {
            completedDate = w.completedAt.toDate();
          } else if (w.completedAt && (typeof w.completedAt === 'string' || typeof w.completedAt === 'number')) {
            completedDate = new Date(w.completedAt);
          }
          if (
            completedDate &&
            completedDate >= startOfMonth &&
            completedDate <= endOfMonth
          ) {
            return completedDate.toISOString().split('T')[0];
          }
          return null;
        })
        .filter(Boolean)
    );

    return uniqueDays.size;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Progresso</h1>
          <Button onClick={() => setNewEvaluationDialogOpen(true)}>
            Nova Avaliação
          </Button>
        </div>

        <EvaluationHistory />

        <NewEvaluationDialog
          isOpen={newEvaluationDialogOpen}
          onClose={() => setNewEvaluationDialogOpen(false)}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peso Atual</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.weight} kg</div>
              <Progress value={70} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Meta: {metrics.weightGoal} kg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Altura</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.height} cm</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IMC</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.bmi}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.bmi < 18.5 ? 'Abaixo do peso' : 
                 metrics.bmi < 25 ? 'Peso normal' : 
                 metrics.bmi < 30 ? 'Sobrepeso' : 'Obesidade'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">% Gordura</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.bodyFat}%</div>
              <Progress value={metrics.bodyFat} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dias Treinados no Mês</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{getDaysTrainedThisMonth()}</div>
                <Badge variant="secondary">
                  {getDaysTrainedThisMonth()} dias
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Peso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-end space-x-2">
                {evaluations.map((evaluation, index) => {
                  const weight = evaluation.results?.weight ? parseFloat(evaluation.results.weight) : 0;
                  let createdAtDate: Date | null = null;
                  if (evaluation.createdAt) {
                    if (typeof evaluation.createdAt.toDate === 'function') {
                      createdAtDate = evaluation.createdAt.toDate();
                    } else if (typeof evaluation.createdAt === 'string' || typeof evaluation.createdAt === 'number') {
                      createdAtDate = new Date(evaluation.createdAt);
                    }
                  }
                  // Cálculo seguro do maior peso
                  const maxWeight = Math.max(...evaluations.map(e => {
                    const w = e.results?.weight ? parseFloat(e.results.weight) : 0;
                    return isNaN(w) ? 0 : w;
                  }));
                  const barHeight = maxWeight > 0 ? (weight / maxWeight) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-xs mt-2">{weight}kg</span>
                      <span className="text-xs text-muted-foreground">
                        {createdAtDate ? createdAtDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage; 