import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { DietPlan, Meal } from '@/types/diet';
import { Student } from '@/types/user';
import { toast } from 'sonner';

interface Suggestion {
  id: string;
  content: string;
  type: 'workout' | 'diet';
  studentId: string;
  trainerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

interface SuggestionContextType {
  suggestions: Suggestion[];
  sendSuggestion: (content: string, type: 'workout' | 'diet', studentId: string) => Promise<void>;
  updateSuggestionStatus: (suggestionId: string, status: 'accepted' | 'rejected') => Promise<void>;
  getStudentsByTrainer: (trainerId: string) => Promise<Student[]>;
  workoutSuggestion: string;
  setWorkoutSuggestion: (suggestion: string) => void;
  dietSuggestion: string;
  setDietSuggestion: (suggestion: string) => void;
}

const SuggestionContext = createContext<SuggestionContextType | undefined>(undefined);

export const SuggestionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [workoutSuggestion, setWorkoutSuggestion] = useState('');
  const [dietSuggestion, setDietSuggestion] = useState('');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) {
        console.log('Usuário não autenticado, não buscando sugestões');
        return;
      }

      try {
        console.log('Buscando sugestões para o usuário:', user.id);
        const suggestionsRef = collection(db, 'suggestions');
        const q = query(suggestionsRef, where('trainerId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        const fetchedSuggestions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })) as Suggestion[];

        console.log('Sugestões encontradas:', fetchedSuggestions.length);
        setSuggestions(fetchedSuggestions);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        toast.error('Erro ao carregar sugestões');
      }
    };

    if (!authLoading) {
      fetchSuggestions();
    }
  }, [user, authLoading]);

  const validateUserAndStudent = async (studentId: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    if (user.level !== 2) {
      throw new Error('Apenas professores podem enviar sugestões');
    }

    // Verificar se o aluno existe e está associado ao professor
    const studentRef = doc(db, 'users', studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error('Aluno não encontrado');
    }

    const studentData = studentDoc.data();
    if (studentData.trainerId !== user.id) {
      throw new Error('Aluno não está associado a este professor');
    }

    return studentData;
  };

  const processDietContent = (content: string): { meals: Meal[], totalCalories: number } => {
    try {
      const meals: Meal[] = [];
      let totalCalories = 0;

      // Divide o conteúdo em refeições
      const mealSections = content.split(/\n\s*\n/);
      
      mealSections.forEach(section => {
        const lines = section.trim().split('\n');
        if (lines.length < 2) return;

        const mealName = lines[0].replace(/^[•\-\*]\s*/, '').trim();
        const foods: string[] = [];
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;

        // Processa cada linha de alimento
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Extrai informações nutricionais se disponíveis
          const nutritionMatch = line.match(/(\d+)\s*cal|(\d+)\s*g\s*prot|(\d+)\s*g\s*carb|(\d+)\s*g\s*gordura/gi);
          if (nutritionMatch) {
            nutritionMatch.forEach(match => {
              const value = parseInt(match);
              if (match.includes('cal')) calories += value;
              if (match.includes('prot')) protein += value;
              if (match.includes('carb')) carbs += value;
              if (match.includes('gordura')) fat += value;
            });
          }

          // Remove informações nutricionais da linha para obter apenas o nome do alimento
          const foodName = line.replace(/\d+\s*(cal|g\s*prot|g\s*carb|g\s*gordura)/gi, '').trim();
          if (foodName) foods.push(foodName);
        }

        if (mealName && foods.length > 0) {
          meals.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: mealName,
            calories,
            protein,
            carbs,
            fat,
            foods,
            time: '00:00' // Será atualizado pelo professor posteriormente
          });
          totalCalories += calories;
        }
      });

      if (meals.length === 0) {
        throw new Error('Nenhuma refeição válida encontrada no conteúdo');
      }

      return { meals, totalCalories };
    } catch (error) {
      console.error('Erro ao processar conteúdo da dieta:', error);
      throw new Error('Erro ao processar conteúdo da dieta: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const sendSuggestion = async (content: string, type: 'workout' | 'diet', studentId: string) => {
    console.log('Verificando usuário:', { user, authLoading });

    if (authLoading) {
      console.log('Aguardando carregamento da autenticação...');
      throw new Error('Aguarde o carregamento da autenticação');
    }

    if (!user) {
      console.error('Usuário não autenticado');
      throw new Error('Por favor, faça login para enviar sugestões');
    }

    try {
      // Criar a sugestão
      const suggestionData = {
        content,
        type,
        studentId,
        trainerId: user.id,
        status: 'pending',
        createdAt: new Date()
      };

      console.log('Criando sugestão:', suggestionData);

      // Salvar no Firestore
      const docRef = await addDoc(collection(db, 'suggestions'), suggestionData);
      console.log('Sugestão criada com sucesso:', docRef.id);
      
      // Se for dieta, criar o plano
      if (type === 'diet') {
        const { meals, totalCalories } = processDietContent(content);
        await addDoc(collection(db, 'dietPlans'), {
          name: `Plano de Dieta - ${new Date().toLocaleDateString('pt-BR')}`,
          studentId,
          meals,
          totalCalories,
          waterGoal: 2.5,
          createdBy: user.id,
          createdAt: new Date(),
          isActive: true
        });
      }

      // Atualizar estado local
      setSuggestions(prev => [...prev, { id: docRef.id, ...suggestionData }]);
      toast.success('Sugestão enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      throw error;
    }
  };

  const updateSuggestionStatus = async (suggestionId: string, status: 'accepted' | 'rejected') => {
    try {
      const suggestionRef = doc(db, 'suggestions', suggestionId);
      const suggestionDoc = await getDoc(suggestionRef);

      if (!suggestionDoc.exists()) {
        throw new Error('Sugestão não encontrada');
      }

      const suggestionData = suggestionDoc.data();
      if (suggestionData.studentId !== user?.id && suggestionData.trainerId !== user?.id) {
        throw new Error('Você não tem permissão para atualizar esta sugestão');
      }

      await updateDoc(suggestionRef, { status });

      setSuggestions(prev =>
        prev.map(suggestion =>
          suggestion.id === suggestionId
            ? { ...suggestion, status }
            : suggestion
        )
      );

      toast.success(`Sugestão ${status === 'accepted' ? 'aceita' : 'rejeitada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar status da sugestão:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar status: ${errorMessage}`);
      throw error;
    }
  };

  const getStudentsByTrainer = async (trainerId: string): Promise<Student[]> => {
    try {
      if (!trainerId) {
        throw new Error('ID do professor não fornecido');
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('trainerId', '==', trainerId), where('level', '==', 1));
      const querySnapshot = await getDocs(q);
      
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        trainerId: doc.data().trainerId
      })) as Student[];

      console.log(`Encontrados ${students.length} alunos para o professor ${trainerId}`);
      return students;
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao buscar alunos: ${errorMessage}`);
      return [];
    }
  };

  return (
    <SuggestionContext.Provider value={{
      suggestions,
      sendSuggestion,
      updateSuggestionStatus,
      getStudentsByTrainer
    }}>
      {children}
    </SuggestionContext.Provider>
  );
};

export const useSuggestion = () => {
  const context = useContext(SuggestionContext);
  if (context === undefined) {
    throw new Error('useSuggestion deve ser usado dentro de um SuggestionProvider');
  }
  return context;
}; 