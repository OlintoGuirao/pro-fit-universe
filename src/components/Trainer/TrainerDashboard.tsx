import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, FileText, Bell, Copy, Loader2, Plus, Trash2 } from 'lucide-react';
import AIChat from './AIChat';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc, onSnapshot, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
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
import StudentLimitAlert from './StudentLimitAlert';
import { Input } from "@/components/ui/input";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createStudent } from '@/lib/db/queries';
import { StudentRequests } from './StudentRequests';
import { TrainerProfile } from './TrainerProfile';
import { getAuth } from "firebase/auth";
import { PendingEvaluations } from './PendingEvaluations';

interface Student {
  id: string;
  name: string;
  email?: string;
  goal?: string;
  lastWorkout?: string;
  progress?: number;
  active?: boolean;
  photoURL?: string;
  trainerId?: string;
  level?: number;
  isOnline?: boolean;
  lastSeen?: any;
}

interface Task {
  id: string;
  type: string;
  studentId: string;
  studentName: string;
  trainerId: string;
  status: 'pending' | 'completed';
  createdAt: any;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface Workout {
  id?: string;
  studentId: string;
  studentName: string;
  title: string;
  description?: string;
  exercises?: string;
  createdAt: any;
  status: 'pending' | 'completed';
  createdBy?: string;
  expiresAt?: any;
}

interface Diet {
  id?: string;
  studentId: string;
  studentName: string;
  title: string;
  description?: string;
  meals?: string;
  createdAt: any;
  status: 'pending' | 'completed';
  createdBy?: string;
  trainerId?: string;
}

const TrainerDashboard = () => {
  const { user } = useAuth();
  const { workoutSuggestion, dietSuggestion, setWorkoutSuggestion, setDietSuggestion } = useSuggestion();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState('');
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [dietTitle, setDietTitle] = useState('');
  const [dietDescription, setDietDescription] = useState('');
  const [dietMeals, setDietMeals] = useState('');
  const [isCreatingDiet, setIsCreatingDiet] = useState(false);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Dados de exemplo para os rankings
  const topStudents = [
    { id: '1', name: 'João Silva', completedWorkouts: 15 },
    { id: '2', name: 'Maria Santos', completedWorkouts: 12 },
    { id: '3', name: 'Pedro Oliveira', completedWorkouts: 10 },
    { id: '4', name: 'Ana Costa', completedWorkouts: 8 },
    { id: '5', name: 'Lucas Ferreira', completedWorkouts: 7 }
  ];

  const topExercises = [
    { id: '1', name: 'Supino Reto', usageCount: 45 },
    { id: '2', name: 'Agachamento', usageCount: 42 },
    { id: '3', name: 'Levantamento Terra', usageCount: 38 },
    { id: '4', name: 'Rosca Direta', usageCount: 35 },
    { id: '5', name: 'Puxada Frontal', usageCount: 32 }
  ];

  const handleCopyTrainerCode = () => {
    if (user?.trainerCode) {
      navigator.clipboard.writeText(user.trainerCode);
      toast.success('Código do professor copiado com sucesso!');
    } else {
      toast.error('Código do professor não encontrado');
    }
  };

  const { data: tasks = [] } = useQuery({
    queryKey: ['trainer-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef, 
        where('trainerId', '==', user.id), 
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      console.log('Tarefas encontradas:', tasksData);
      return tasksData;
    }
  });

  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.active).length,
    pendingTasks: tasks.length,
    averageRating: 4.8 // TODO: Implementar cálculo real
  };

  useEffect(() => {
    if (!user?.id) return;

    // Configurar listener para atualizações em tempo real dos alunos
    const studentsRef = collection(db, 'users');
    const q = query(
      studentsRef, 
      where('trainerId', '==', user.id), 
      where('level', '==', 1),
      where('pendingTrainerApproval', '==', false)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        email: doc.data().email || '',
        goal: doc.data().goal || '',
        lastWorkout: doc.data().lastWorkout || '',
        progress: doc.data().progress || 0,
        active: doc.data().active || false,
        photoURL: doc.data().photoURL,
        trainerId: doc.data().trainerId,
        level: doc.data().level,
        isOnline: doc.data().isOnline || false,
        lastSeen: doc.data().lastSeen
      })) as Student[];

      setStudents(studentsData);
    });

    // Limpar listener quando o componente for desmontado
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (workoutSuggestion) {
      setWorkoutExercises(workoutSuggestion);
      setWorkoutSuggestion('');
    }
  }, [workoutSuggestion, setWorkoutSuggestion]);

  useEffect(() => {
    if (dietSuggestion) {
      setDietMeals(dietSuggestion);
      setDietSuggestion('');
      toast.success('Nova sugestão de dieta disponível!');
    }
  }, [dietSuggestion, setDietSuggestion]);

  const fetchWorkouts = async () => {
    if (!user?.id) return;

    setIsLoadingWorkouts(true);
    try {
      const workoutsRef = collection(db, 'workouts');
      const q = query(
        workoutsRef,
        where('trainerId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const workoutsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workout[];

      setWorkouts(workoutsData);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      toast.error('Erro ao carregar treinos');
    } finally {
      setIsLoadingWorkouts(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWorkouts();
    }
  }, [user?.id]);

  const handleCreateWorkout = async () => {
    if (!selectedStudent || !workoutTitle || !workoutExercises) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsCreatingWorkout(true);

    try {
      const selectedStudentData = students.find(s => s.id === selectedStudent);
      
      // Calcula a data de expiração (15 dias a partir de agora)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);
      
      const workoutData = {
        studentId: selectedStudent,
        studentName: selectedStudentData?.name || '',
        title: workoutTitle,
        description: workoutDescription,
        exercises: workoutExercises,
        createdAt: serverTimestamp(),
        status: 'pending',
        trainerId: user?.id,
        expiresAt: expiresAt
      };

      const workoutsRef = collection(db, 'workouts');
      await addDoc(workoutsRef, workoutData);

      toast.success('Treino criado com sucesso!');
      
      // Limpar campos
      setSelectedStudent('');
      setWorkoutTitle('');
      setWorkoutDescription('');
      setWorkoutExercises('');
      
      // Atualizar lista de treinos
      fetchWorkouts();
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      toast.error('Erro ao criar treino. Tente novamente.');
    } finally {
      setIsCreatingWorkout(false);
    }
  };

  // Função para verificar se o treino está próximo de expirar
  const isWorkoutExpiringSoon = (expiresAt: any) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expirationDate = expiresAt.toDate();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 3 && daysUntilExpiration > 0;
  };

  // Função para verificar se o treino expirou
  const isWorkoutExpired = (expiresAt: any) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expirationDate = expiresAt.toDate();
    return now > expirationDate;
  };

  // Função para limpar treinos expirados
  const cleanupExpiredWorkouts = async () => {
    if (!user?.id) return;

    try {
      const workoutsRef = collection(db, 'workouts');
      const q = query(
        workoutsRef,
        where('createdBy', '==', user.id),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const now = new Date();

      for (const doc of querySnapshot.docs) {
        const workout = doc.data();
        if (workout.expiresAt && workout.expiresAt.toDate() < now) {
          await deleteDoc(doc.ref);
        }
      }

      // Atualizar a lista de treinos após a limpeza
      fetchWorkouts();
    } catch (error) {
      console.error('Erro ao limpar treinos expirados:', error);
    }
  };

  // Efeito para limpar treinos expirados periodicamente
  useEffect(() => {
    if (user?.id) {
      cleanupExpiredWorkouts();
      // Verificar a cada hora
      const interval = setInterval(cleanupExpiredWorkouts, 3600000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const handleCreateDiet = async () => {
    if (!selectedStudent || !dietTitle || !dietMeals) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsCreatingDiet(true);

    try {
      const selectedStudentData = students.find(s => s.id === selectedStudent);
      
      if (!selectedStudentData) {
        toast.error('Aluno não encontrado');
        return;
      }

      console.log('Dados do aluno selecionado:', selectedStudentData);

      const dietData = {
        studentId: selectedStudent,
        studentName: selectedStudentData.name,
        title: dietTitle,
        description: dietDescription || '',
        meals: dietMeals,
        createdAt: serverTimestamp(),
        status: 'pending',
        createdBy: user.id,
        trainerId: user.id
      };

      console.log('Criando dieta com dados:', dietData);

      const dietsRef = collection(db, 'diets');
      const docRef = await addDoc(dietsRef, dietData);
      
      console.log('Dieta criada com ID:', docRef.id);
      console.log('Dados da dieta criada:', dietData);

      toast.success('Dieta criada com sucesso!');
      
      // Limpar campos
      setSelectedStudent('');
      setDietTitle('');
      setDietDescription('');
      setDietMeals('');
      
      // Atualizar lista de dietas
      await fetchDiets();
    } catch (error) {
      console.error('Erro ao criar dieta:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      toast.error('Erro ao criar dieta. Tente novamente.');
    } finally {
      setIsCreatingDiet(false);
    }
  };

  const fetchDiets = async () => {
    if (!user?.id) {
      console.log('Usuário não autenticado, não é possível buscar dietas');
      return;
    }

    try {
      console.log('Dados do usuário:', user);
      console.log('Nível do usuário:', user.level);
      console.log('Buscando dietas para o usuário:', user.id);
      
      const dietsRef = collection(db, 'diets');
      console.log('Referência da coleção criada');
      
      try {
        console.log('Executando query...');
        const q = query(
          dietsRef,
          where('trainerId', '==', user.id)
        );
        
        console.log('Query criada:', q);
        const querySnapshot = await getDocs(q);
        console.log('Query executada com sucesso');
        console.log('Número de documentos encontrados:', querySnapshot.size);
        
        const dietsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Dados do documento:', data);
          return {
            id: doc.id,
            ...data
          };
        }) as Diet[];
        
        console.log('Dietas encontradas:', dietsData);
        setDiets(dietsData);
      } catch (error) {
        console.error('Erro ao executar query:', error);
        console.error('Detalhes do erro:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        throw error;
      }
    } catch (error) {
      console.error('Erro ao buscar dietas:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      toast.error('Erro ao carregar dietas');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWorkouts();
      fetchDiets();
    }
  }, [user?.id]);

  useEffect(() => {
    if (dietSuggestion) {
      setDietMeals(dietSuggestion);
      setDietSuggestion('');
    }
  }, [dietSuggestion, setDietSuggestion]);

  const handleCreateStudent = async () => {
    if (!user || user.level !== 2) {
      toast.error('Você precisa estar autenticado como personal trainer para criar alunos');
      return;
    }

    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    // Verificar limite de alunos
    const studentsRef = collection(db, 'users');
    const q = query(studentsRef, where('trainerId', '==', user.id), where('level', '==', 1));
    const querySnapshot = await getDocs(q);
    const currentStudentCount = querySnapshot.size;

    if (currentStudentCount >= 5) {
      toast.error('Você atingiu o limite de 5 alunos no plano gratuito. Atualize seu plano para continuar crescendo!');
      return;
    }

    try {
      setIsCreatingStudent(true);
      console.log('Iniciando criação de aluno:', { ...newStudent, password: '***' });

      const uid = await createStudent({
        name: newStudent.name,
        email: newStudent.email,
        password: newStudent.password,
        trainerId: user.id
      });

      console.log('Aluno criado com sucesso:', uid);

      // Atualizar a lista de alunos
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        email: doc.data().email || '',
        goal: doc.data().goal || '',
        lastWorkout: doc.data().lastWorkout || '',
        progress: doc.data().progress || 0,
        active: doc.data().active || false,
        photoURL: doc.data().photoURL,
        trainerId: doc.data().trainerId,
        level: doc.data().level
      })) as Student[];

      setStudents(studentsData);
      toast.success('Aluno criado com sucesso!');
      
      // Limpar o formulário
      setNewStudent({
        name: '',
        email: '',
        password: '',
      });
    } catch (error) {
      console.error('Erro detalhado ao criar aluno:', error);
      toast.error(error.message || 'Erro ao criar aluno. Tente novamente.');
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const handleRemoveWorkout = async (workoutId: string) => {
    try {
      const workoutRef = doc(db, 'workouts', workoutId);
      await deleteDoc(workoutRef);
      
      // Atualiza a lista de treinos localmente
      setWorkouts(prevWorkouts => prevWorkouts.filter(w => w.id !== workoutId));
      
      toast.success('Treino removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover treino:', error);
      toast.error('Erro ao remover treino. Tente novamente.');
    }
  };

  const handleRemoveDiet = async (dietId: string) => {
    try {
      const dietRef = doc(db, 'diets', dietId);
      await deleteDoc(dietRef);
      
      // Atualiza a lista de dietas localmente
      setDiets(prevDiets => prevDiets.filter(d => d.id !== dietId));
      
      toast.success('Dieta removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover dieta:', error);
      toast.error('Erro ao remover dieta. Tente novamente.');
    }
  };

  const handleUnlinkStudent = async (studentId: string) => {
    try {
      // Atualiza o documento do aluno removendo o trainerId
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        trainerId: null,
        pendingTrainerApproval: false
      });

      // Remove o aluno da lista local
      setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
      
      toast.success('Aluno desvinculado com sucesso!');
    } catch (error) {
      console.error('Erro ao desvincular aluno:', error);
      toast.error('Erro ao desvincular aluno. Tente novamente.');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <StudentLimitAlert />
      
      <div className="space-y-6 p-4 sm:p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primary">Dashboard do Professor</h2>
          <div className="bg-muted/50 border border-primary/20 px-4 py-3 rounded-md flex items-center gap-2 w-fit">
            <span className="text-sm text-muted-foreground">Código do Professor:</span>
            <span className="font-bold text-lg tracking-wider text-primary">{user?.trainerCode || 'Não disponível'}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyTrainerCode}
              className="h-6 w-6 p-0 hover:bg-primary/10"
            >
              <Copy className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card hover:bg-card/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeStudents} alunos ativos
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card hover:bg-card/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingTasks === 0 ? 'Nenhuma tarefa pendente' : 'Tarefas aguardando ação'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card hover:bg-card/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Bell className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                Baseado em {stats.totalStudents} avaliações
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card hover:bg-card/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">0</div>
              <p className="text-xs text-muted-foreground">
                Eventos agendados para hoje
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card className="bg-card hover:bg-card/80 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Meus Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarImage src={student.photoURL} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${student.isOnline ? 'bg-green-500' : 'bg-muted'}`}></span>
                      </div>
                      <div>
                        <p className="font-medium text-primary">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Visto por último: {student.lastSeen ? new Date(student.lastSeen.toDate()).toLocaleString() : 'Nunca'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{student.progress || 0}%</Badge>
                      <p className="text-xs text-muted-foreground">{student.goal || 'Sem objetivo definido'}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlinkStudent(student.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Desvincular
                      </Button>
                    </div>
                  </div>
                ))}
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => setShowCalendar(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Adicionar Novo Aluno
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-card/80 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Bell className="mr-2 h-5 w-5 text-primary" />
                Solicitações Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentRequests />
            </CardContent>
          </Card>
        </div>

        {/* Seção de Treinos e Dietas */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card className="bg-card hover:bg-card/80 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-primary">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Treinos Recentes
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Treino
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Treino</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Aluno</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
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
                      <div className="space-y-2">
                        <Label>Título do Treino</Label>
                        <Input
                          value={workoutTitle}
                          onChange={(e) => setWorkoutTitle(e.target.value)}
                          placeholder="Ex: Treino A - Peito e Tríceps"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                          value={workoutDescription}
                          onChange={(e) => setWorkoutDescription(e.target.value)}
                          placeholder="Adicione uma descrição para o treino"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Exercícios</Label>
                        <Textarea
                          value={workoutExercises}
                          onChange={(e) => setWorkoutExercises(e.target.value)}
                          placeholder="Liste os exercícios do treino"
                          className="min-h-[200px]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleCreateWorkout}
                        disabled={isCreatingWorkout}
                      >
                        {isCreatingWorkout ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          'Criar Treino'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingWorkouts ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : workouts.length > 0 ? (
                  workouts.map((workout) => (
                    <div key={workout.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-primary">{workout.title}</h3>
                          <p className="text-sm text-muted-foreground">Aluno: {workout.studentName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Criado em: {workout.createdAt?.toDate().toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Status: {workout.status === 'pending' ? 'Pendente' : 'Concluído'}
                          </p>
                          {workout.expiresAt && (
                            <p className="text-xs text-muted-foreground">
                              Expira em: {workout.expiresAt.toDate().toLocaleDateString()}
                            </p>
                          )}
                          {isWorkoutExpiringSoon(workout.expiresAt) && (
                            <p className="text-xs text-yellow-500 mt-1">
                              ⚠️ Este treino expira em breve!
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWorkout(workout.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">Nenhum treino criado ainda</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card hover:bg-card/80 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-primary">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Dietas Recentes
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Dieta
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Dieta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Aluno</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
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
                      <div className="space-y-2">
                        <Label>Título da Dieta</Label>
                        <Input
                          value={dietTitle}
                          onChange={(e) => setDietTitle(e.target.value)}
                          placeholder="Ex: Dieta para Ganho de Massa"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                          value={dietDescription}
                          onChange={(e) => setDietDescription(e.target.value)}
                          placeholder="Adicione uma descrição para a dieta"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Refeições</Label>
                        <Textarea
                          value={dietMeals}
                          onChange={(e) => setDietMeals(e.target.value)}
                          placeholder="Liste as refeições da dieta"
                          className="min-h-[200px]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleCreateDiet}
                        disabled={isCreatingDiet}
                      >
                        {isCreatingDiet ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          'Criar Dieta'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diets.length > 0 ? (
                  diets.map((diet) => (
                    <div key={diet.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-primary">{diet.title}</h3>
                          <p className="text-sm text-muted-foreground">Aluno: {diet.studentName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Criado em: {diet.createdAt?.toDate().toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Status: {diet.status === 'pending' ? 'Pendente' : 'Concluído'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDiet(diet.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">Nenhuma dieta criada ainda</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 mt-6">
          <PendingEvaluations />
          <AIChat />
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
