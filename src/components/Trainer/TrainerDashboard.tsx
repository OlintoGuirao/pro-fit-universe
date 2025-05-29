import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, FileText, Bell } from 'lucide-react';
import AIChat from './AIChat';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSuggestion } from '@/contexts/SuggestionContext';

interface Student {
  id: string;
  name: string;
  goal?: string;
  lastWorkout?: string;
  progress?: number;
  active?: boolean;
  photoURL?: string;
  trainerId?: string;
  level?: number;
}

interface Task {
  id: string;
  studentId: string;
  studentName: string;
  task: string;
  deadline: string;
  status: 'pending' | 'completed' | 'overdue';
}

interface Workout {
  id?: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  exercises: string;
  createdAt: any;
  status: 'pending' | 'completed';
}

const TrainerDashboard = () => {
  const { user } = useAuth();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState('');
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const { workoutSuggestion, setWorkoutSuggestion } = useSuggestion();

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['trainer-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('trainerId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    }
  });

  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.active).length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    averageRating: 4.8 // TODO: Implementar cálculo real
  };

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) return;

      try {
        if (!user.id) {
          return;
        }

        const studentsRef = collection(db, 'users');
        const q = query(studentsRef, where('trainerId', '==', user.id), where('level', '==', 1));
        const querySnapshot = await getDocs(q);
        
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          goal: doc.data().goal || '',
          lastWorkout: doc.data().lastWorkout || '',
          progress: doc.data().progress || 0,
          active: doc.data().active || false,
          photoURL: doc.data().photoURL,
          trainerId: doc.data().trainerId,
          level: doc.data().level
        })) as Student[];

        setStudents(studentsData);
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
        toast.error('Erro ao carregar lista de alunos');
      }
    };

    fetchStudents();
  }, [user]);

  useEffect(() => {
    if (workoutSuggestion) {
      setWorkoutExercises(workoutSuggestion);
      setWorkoutSuggestion('');
    }
  }, [workoutSuggestion, setWorkoutSuggestion]);

  const handleCreateWorkout = async () => {
    if (!selectedStudent || !workoutTitle || !workoutExercises) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsCreatingWorkout(true);

    try {
      const selectedStudentData = students.find(s => s.id === selectedStudent);
      
      if (!selectedStudentData) {
        throw new Error('Aluno não encontrado');
      }

      const workoutData: Workout = {
        studentId: selectedStudent,
        studentName: selectedStudentData.name,
        title: workoutTitle,
        description: workoutDescription,
        exercises: workoutExercises,
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      await addDoc(collection(db, 'workouts'), workoutData);
      
      toast.success('Treino criado e enviado com sucesso!');
      
      // Limpar formulário
      setSelectedStudent('');
      setWorkoutTitle('');
      setWorkoutDescription('');
      setWorkoutExercises('');
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      toast.error('Erro ao criar treino. Tente novamente.');
    } finally {
      setIsCreatingWorkout(false);
    }
  };

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
            <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500">de 5 permitidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Alunos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeStudents}</div>
            <p className="text-xs text-gray-500">treinaram esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tarefas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
            <p className="text-xs text-gray-500">requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avaliação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.averageRating}</div>
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
              {isLoadingTasks ? (
                <div className="text-center py-4">Carregando alunos...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Nenhum aluno encontrado</div>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        {student.photoURL ? (
                          <AvatarImage src={student.photoURL} />
                        ) : (
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        )}
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
                ))
              )}
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Adicionar Novo Aluno
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat com IA */}
        <AIChat />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              {isLoadingTasks ? (
                <div className="text-center py-4">Carregando tarefas...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Nenhuma tarefa pendente</div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{task.task}</p>
                      <p className="text-sm text-gray-500">{task.studentName}</p>
                    </div>
                    <Badge 
                      variant={task.status === 'overdue' ? 'destructive' : 'secondary'}
                    >
                      {task.deadline}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Calendar className="h-6 w-6 mb-2" />
                    Criar Treino
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Treino</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes do treino para seu aluno.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="student">Aluno</Label>
                      <Select
                        value={selectedStudent}
                        onValueChange={setSelectedStudent}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um aluno" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título do Treino</Label>
                      <Textarea
                        id="title"
                        value={workoutTitle}
                        onChange={(e) => setWorkoutTitle(e.target.value)}
                        placeholder="Ex: Treino A - Peito e Tríceps"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Textarea
                        id="description"
                        value={workoutDescription}
                        onChange={(e) => setWorkoutDescription(e.target.value)}
                        placeholder="Ex: Foco em hipertrofia com exercícios compostos"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="exercises">Exercícios</Label>
                      <Textarea
                        id="exercises"
                        value={workoutExercises}
                        onChange={(e) => setWorkoutExercises(e.target.value)}
                        placeholder="Ex: Supino Reto - 4x12
Leg Press - 4x15
Extensão de Pernas - 3x20"
                        className="h-[200px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateWorkout}
                      disabled={isCreatingWorkout}
                    >
                      {isCreatingWorkout ? 'Criando...' : 'Criar e Enviar Treino'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
    </div>
  );
};

export default TrainerDashboard;
