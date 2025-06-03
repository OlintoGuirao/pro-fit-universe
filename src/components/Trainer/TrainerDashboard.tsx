import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, FileText, Bell } from 'lucide-react';
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
    const q = query(studentsRef, where('trainerId', '==', user.id), where('level', '==', 1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
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
    <div className="container mx-auto p-4 space-y-6">
      <TrainerProfile />
      <StudentRequests />
      <StudentLimitAlert />
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
              <Users className="mr-2 h-5 w-5 text-green-500" />
              Meus Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingWorkouts ? (
                <div className="text-center py-4">Carregando alunos...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Nenhum aluno cadastrado</div>
              ) : (
                students.map((student) => (
                  <div key={`list-${student.id}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {student.photoURL ? (
                            <AvatarImage src={student.photoURL} />
                          ) : (
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <span 
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            student.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.goal}</p>
                        {!student.isOnline && student.lastSeen && (
                          <p className="text-xs text-gray-400">
                            Visto por último: {new Date(student.lastSeen.toDate()).toLocaleString('pt-BR')}
                          </p>
                        )}
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Adicionar Novo Aluno
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo aluno. Ele será automaticamente vinculado a você.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome do Aluno</Label>
                      <Input
                        id="name"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newStudent.password}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateStudent}
                      disabled={isCreatingStudent}
                    >
                      {isCreatingStudent ? 'Cadastrando...' : 'Cadastrar Aluno'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Chat com IA */}
        <AIChat />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Treinos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                Treinos Criados
              </div>
              <Badge variant="outline" className="text-sm">
                {workouts.length} {workouts.length === 1 ? 'treino' : 'treinos'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingWorkouts ? (
                <div className="text-center py-4">Carregando treinos...</div>
              ) : workouts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>Nenhum treino criado ainda</p>
                  <p className="text-sm text-gray-400 mt-1">Crie seu primeiro treino usando o botão abaixo</p>
                </div>
              ) : (
                workouts.map((workout) => (
                  <div key={workout.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium text-lg">{workout.title}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          <span>Para: {workout.studentName}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Criado em: {new Date(workout.createdAt?.toDate()).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant={workout.status === 'pending' ? 'secondary' : 'default'}>
                          {workout.status === 'pending' ? 'Pendente' : 'Concluído'}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

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
              {tasks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhuma tarefa pendente
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{task.studentName}</h4>
                      <p className="text-sm text-gray-500">{task.description}</p>
                      <p className="text-xs text-gray-400">
                        {task.createdAt?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                      {task.priority === 'high' ? 'Alta' : 'Média'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
                          <SelectItem key={`select-${student.id}`} value={student.id}>
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Criar Dieta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Criar Nova Dieta</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes da dieta para seu aluno.
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
                          <SelectItem key={`select-${student.id}`} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título da Dieta</Label>
                    <Textarea
                      id="title"
                      value={dietTitle}
                      onChange={(e) => setDietTitle(e.target.value)}
                      placeholder="Ex: Dieta para Hipertrofia"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={dietDescription}
                      onChange={(e) => setDietDescription(e.target.value)}
                      placeholder="Ex: Foco em ganho de massa muscular"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meals">Refeições</Label>
                    <Textarea
                      id="meals"
                      value={dietMeals}
                      onChange={(e) => setDietMeals(e.target.value)}
                      placeholder="Café da Manhã:
- Ovos (2 unidades)
- Banana (1 unidade)
- Leite (250ml)

Almoço:
- Frango (150g)
- Arroz (50g)
- Salada (à vontade)

Jantar:
- Peixe (100g)
- Batata (50g)
- Legumes (à vontade)

Lanche:
- Iogurte (100g)
- Maçã (1 unidade)"
                      className="h-[400px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateDiet}
                    disabled={isCreatingDiet}
                  >
                    {isCreatingDiet ? 'Criando...' : 'Criar e Enviar Dieta'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              Enviar Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerDashboard;
