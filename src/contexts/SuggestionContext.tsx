import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { DietPlan, Meal } from '@/types/diet';
import { Student } from '@/types/student';
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
  workoutSuggestion: string;
  dietSuggestion: string;
  setWorkoutSuggestion: React.Dispatch<React.SetStateAction<string>>;
  setDietSuggestion: React.Dispatch<React.SetStateAction<string>>;
  sendSuggestion: (content: string, type: 'workout' | 'diet', studentId: string) => Promise<void>;
  getStudentsByTrainer: (trainerId: string) => Promise<Student[]>;
  updateSuggestionStatus: (suggestionId: string, status: 'accepted' | 'rejected') => Promise<void>;
}

const SuggestionContext = createContext<SuggestionContextType | undefined>(undefined);

export const SuggestionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [workoutSuggestion, setWorkoutSuggestion] = useState('');
  const [dietSuggestion, setDietSuggestion] = useState('');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;

      try {
        const suggestionsRef = collection(db, 'suggestions');
        const q = query(suggestionsRef, where('trainerId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        const fetchedSuggestions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })) as Suggestion[];

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
    if (!user) {
      toast.error('Você precisa estar autenticado para enviar sugestões');
      return;
    }

    try {
      // Buscar dados do aluno
      const studentDoc = await getDoc(doc(db, 'users', studentId));
      if (!studentDoc.exists()) {
        throw new Error('Aluno não encontrado');
      }

      const studentData = studentDoc.data();

      // Criar sugestão
      const suggestionData: Omit<Suggestion, 'id'> = {
        content,
        type,
        studentId,
        trainerId: user.id,
        status: 'pending',
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'suggestions'), suggestionData);
      
      // Atualizar estado local
      setSuggestions(prev => [...prev, { id: docRef.id, ...suggestionData }]);

      // Se for dieta, criar o plano de dieta
      if (type === 'diet') {
        try {
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
        } catch (dietError) {
          console.error('Erro ao criar plano de dieta:', dietError);
        }
      }

      // Se for treino, criar o workout
      if (type === 'workout') {
        try {
          await addDoc(collection(db, 'workouts'), {
            studentId,
            studentName: studentData.name || 'Aluno',
            title: `Treino - ${new Date().toLocaleDateString('pt-BR')}`,
            description: 'Treino criado pelo professor',
            exercises: content,
            createdAt: new Date(),
            status: 'pending',
            createdBy: user.id
          });
        } catch (workoutError) {
          console.error('Erro ao criar treino:', workoutError);
        }
      }

      toast.success(`${type === 'diet' ? 'Dieta' : 'Treino'} enviado com sucesso para o aluno!`);
    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      toast.error('Erro ao enviar sugestão. Tente novamente.');
    }
  };

  const updateSuggestionStatus = async (suggestionId: string, status: 'accepted' | 'rejected') => {
    try {
      const suggestionRef = doc(db, 'suggestions', suggestionId);
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
      toast.error('Erro ao atualizar status da sugestão');
    }
  };

  const getStudentsByTrainer = async (trainerId: string): Promise<Student[]> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('trainerId', '==', trainerId), where('level', '==', 1));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        level: doc.data().level,
        isActive: doc.data().isActive || false,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        trainerId: doc.data().trainerId,
        weight: doc.data().weight,
        height: doc.data().height,
        goals: doc.data().goals
      })) as Student[];
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      return [];
    }
  };

  return (
    <SuggestionContext.Provider value={{
      suggestions,
      workoutSuggestion,
      dietSuggestion,
      setWorkoutSuggestion,
      setDietSuggestion,
      sendSuggestion,
      getStudentsByTrainer,
      updateSuggestionStatus
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
