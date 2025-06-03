import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, FileText, Bell, Copy } from 'lucide-react';
import AIChat from './AIChat';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc, onSnapshot, orderBy } from 'firebase/firestore';
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

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user) return;

      try {
        setIsLoadingWorkouts(true);
        const workoutsRef = collection(db, 'workouts');
        const q = query(workoutsRef, where('createdBy', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        const workoutsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          studentId: doc.data().studentId || '',
          studentName: doc.data().studentName || '',
          title: doc.data().title || '',
          description: doc.data().description || '',
          exercises: doc.data().exercises || '',
          status: doc.data().status || 'pending',
          createdAt: doc.data().createdAt,
          createdBy: doc.data().createdBy
        }));

        setWorkouts(workoutsData);
      } catch (error) {
        console.error('Erro ao buscar treinos:', error);
        toast.error('Erro ao carregar lista de treinos');
      } finally {
        setIsLoadingWorkouts(false);
      }
    };

    fetchWorkouts();
  }, [user]);

  const handleCreateWorkout = async () => {
    if (!user || user.level !== 2) {
      toast.error('Você precisa estar autenticado como personal trainer para criar treinos');
      return;
    }

    if (!selectedStudent || !workoutTitle || !workoutExercises) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Verificar se o aluno existe e está associado ao professor
      const studentDoc = await getDoc(doc(db, 'users', selectedStudent));
      if (!studentDoc.exists()) {
        toast.error('Aluno não encontrado');
        return;
      }

      const studentData = studentDoc.data();
      if (studentData.trainerId !== user.id) {
        toast.error('Aluno não está associado a este professor');
        return;
      }

      // Criar o treino
      const workoutData = {
        studentId: selectedStudent,
        studentName: studentData.name || 'Aluno',
        title: workoutTitle,
        description: 'Treino criado pelo professor',
        exercises: workoutExercises,
        createdAt: new Date(),
        status: 'pending',
        createdBy: user.id
      };

      await addDoc(collection(db, 'workouts'), workoutData);
      toast.success('Treino criado com sucesso!');
      
      // Limpar o formulário
      setSelectedStudent('');
      setWorkoutTitle('');
      setWorkoutExercises('');
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      toast.error('Erro ao criar treino. Tente novamente.');
    }
  };

  const handleCreateDiet = async () => {
    if (!user || user.level !== 2) {
      toast.error('Você precisa estar autenticado como personal trainer para criar dietas');
      return;
    }

    if (!selectedStudent || !dietTitle || !dietMeals) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Verificar se o aluno existe e está associado ao professor
      const studentDoc = await getDoc(doc(db, 'users', selectedStudent));
      if (!studentDoc.exists()) {
        toast.error('Aluno não encontrado');
        return;
      }

      const studentData = studentDoc.data();
      if (studentData.trainerId !== user.id) {
        toast.error('Aluno não está associado a este professor');
        return;
      }

      // Processar as refeições
      const meals = dietMeals.split('\n').reduce((acc: any[], line) => {
        if (line.trim().startsWith('-')) {
          const currentMeal = acc[acc.length - 1];
          if (currentMeal) {
            currentMeal.foods.push(line.trim().substring(1).trim());
          }
        } else if (line.trim()) {
          acc.push({
            name: line.trim(),
            foods: []
          });
        }
        return acc;
      }, []).filter(meal => meal.foods.length > 0);

      if (meals.length === 0) {
        toast.error('Por favor, adicione pelo menos uma refeição com alimentos');
        return;
      }

      // Criar o plano de dieta
      const dietData = {
        name: dietTitle,
        studentId: selectedStudent,
        meals,
        waterGoal: 2.5,
        createdBy: user.id,
        createdAt: new Date(),
        isActive: true
      };

      await addDoc(collection(db, 'dietPlans'), dietData);
      toast.success('Plano de dieta criado com sucesso!');
      
      // Limpar o formulário
      setSelectedStudent('');
      setDietTitle('');
      setDietMeals('');
    } catch (error) {
      console.error('Erro ao criar plano de dieta:', error);
      toast.error('Erro ao criar plano de dieta. Tente novamente.');
    }
  };

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

  return (
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
                  <div className="text-right">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{student.progress || 0}%</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{student.goal || 'Sem objetivo definido'}</p>
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

      <AIChat />
    </div>
  );
};

export default TrainerDashboard;
