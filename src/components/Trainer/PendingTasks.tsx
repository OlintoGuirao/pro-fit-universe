import React from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  type: string;
  description: string;
  studentId: string;
  studentName: string;
  trainerId: string;
  status: string;
  createdAt: any;
}

export const PendingTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [evaluations, setEvaluations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id) return;

    console.log('Iniciando listeners para o professor:', user.id);
    
    // Listener para tarefas
    const tasksRef = collection(db, 'tasks');
    const tasksQuery = query(
      tasksRef,
      where('trainerId', '==', user.id),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      console.log('Nova atualização de tarefas recebida');
      const newTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      
      console.log('Tarefas atualizadas:', newTasks);
      setTasks(newTasks);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao escutar tarefas:', error);
      setLoading(false);
    });

    // Listener para avaliações
    const evaluationsRef = collection(db, 'evaluations');
    const evaluationsQuery = query(
      evaluationsRef,
      where('trainerId', '==', user.id),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeEvaluations = onSnapshot(evaluationsQuery, (snapshot) => {
      console.log('Nova atualização de avaliações recebida');
      const newEvaluations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Avaliações atualizadas:', newEvaluations);
      setEvaluations(newEvaluations);
    }, (error) => {
      console.error('Erro ao escutar avaliações:', error);
    });

    return () => {
      console.log('Limpando listeners');
      unsubscribeTasks();
      unsubscribeEvaluations();
    };
  }, [user?.id]);

  const handleTask = async (taskId: string, status: 'approved' | 'rejected') => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status,
        updatedAt: serverTimestamp()
      });

      toast.success(`Tarefa ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa. Tente novamente.');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'workout':
        return 'Treino';
      case 'diet':
        return 'Dieta';
      case 'measurement':
        return 'Medida';
      default:
        return 'Outro';
    }
  };

  const totalPending = tasks.length + evaluations.length;

  if (loading) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Tarefas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-6 w-6 text-blue-600" />
          Tarefas Pendentes
          <Badge variant="outline" className="ml-2">
            {totalPending}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {totalPending === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Nenhuma tarefa pendente
              </p>
            </div>
          ) : (
            <>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-4 space-y-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {getTypeLabel(task.type)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Solicitado por: <span className="font-medium">{task.studentName}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.createdAt?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-md border">
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTask(task.id, 'rejected')}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleTask(task.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 