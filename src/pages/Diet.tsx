import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Utensils, CheckCircle2, Coffee, Apple, Salad, Fish, Milk } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Diet {
  id: string;
  title: string;
  description: string;
  meals: string;
  createdAt: any;
  status: 'pending' | 'completed';
  studentId: string;
  studentName: string;
  createdBy: string;
  trainerId: string;
}

const Diet = () => {
  const { user } = useAuth();

  const { data: diets = [], isLoading, refetch } = useQuery({
    queryKey: ['student-diets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const dietsRef = collection(db, 'diets');
      const q = query(dietsRef, where('studentId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Diet[];
    }
  });

  const handleMarkAsCompleted = async (dietId: string) => {
    try {
      const dietRef = doc(db, 'diets', dietId);
      await updateDoc(dietRef, {
        status: 'completed'
      });
      
      toast.success('Dieta marcada como concluída!');
      refetch(); // Atualiza a lista de dietas
    } catch (error) {
      console.error('Erro ao marcar dieta como concluída:', error);
      toast.error('Erro ao atualizar status da dieta');
    }
  };

  const dietPlan = {
    title: "Plano de Emagrecimento",
    description: "Dieta hipocalórica para redução de peso de forma saudável",
    meals: `
Café da Manhã (7h):
- 1 copo de chá verde sem açúcar
- 1 fatia de pão integral
- 1 ovo cozido
- 1 fatia de queijo branco
- 1 maçã

Lanche da Manhã (10h):
- 1 iogurte natural desnatado
- 1 colher de chia
- 5 morangos

Almoço (13h):
- 1 prato de salada verde à vontade
- 100g de frango grelhado
- 3 colheres de arroz integral
- 2 colheres de feijão
- 1 colher de azeite extra virgem

Lanche da Tarde (16h):
- 1 copo de suco verde (couve, limão, gengibre)
- 1 fatia de pão integral
- 1 colher de pasta de amendoim

Jantar (19h):
- 1 prato de salada verde à vontade
- 100g de peixe grelhado
- 2 colheres de arroz integral
- Legumes refogados
- 1 colher de azeite extra virgem

Ceia (21h):
- 1 copo de chá de camomila
- 1 fatia de queijo branco
- 5 amêndoas

Recomendações:
- Beber 2-3L de água por dia
- Evitar frituras e doces
- Fazer as refeições em horários regulares
- Mastigar bem os alimentos
- Praticar atividade física regularmente
- Dormir 7-8 horas por noite
`,
    createdAt: new Date(),
    status: 'pending',
    studentId: user?.id,
    studentName: user?.name,
    createdBy: user?.id
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Minha Dieta</h1>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Ver Calendário
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-4">Carregando dietas...</div>
        ) : diets.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Utensils className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>Nenhuma dieta disponível</p>
            <p className="text-sm text-gray-400 mt-1">Seu professor ainda não criou dietas para você</p>
          </div>
        ) : (
          diets.map((diet) => (
            <Card key={diet.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{diet.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="mr-1 h-4 w-4" />
                      Criado em: {diet.createdAt?.toDate().toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {diet.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Concluído</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {diet.description && (
                    <p className="text-sm text-gray-600">{diet.description}</p>
                  )}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg">
                    <div className="space-y-6">
                      {diet.meals.split('\n\n').map((meal, index) => {
                        if (!meal.trim()) return null;
                        
                        const [title, ...items] = meal.split('\n');
                        const getMealIcon = (mealTitle: string) => {
                          if (mealTitle.includes('Café')) return <Coffee className="h-5 w-5 text-amber-600" />;
                          if (mealTitle.includes('Lanche')) return <Apple className="h-5 w-5 text-red-500" />;
                          if (mealTitle.includes('Almoço')) return <Salad className="h-5 w-5 text-green-600" />;
                          if (mealTitle.includes('Jantar')) return <Fish className="h-5 w-5 text-blue-600" />;
                          if (mealTitle.includes('Ceia')) return <Milk className="h-5 w-5 text-gray-600" />;
                          return <Utensils className="h-5 w-5 text-primary" />;
                        };

                        return (
                          <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                              {getMealIcon(title)}
                              <h4 className="font-medium text-lg text-gray-800">{title}</h4>
                            </div>
                            <ul className="space-y-3">
                              {items.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                                  <span className="text-primary font-medium">•</span>
                                  <span className="flex-1">{item.replace('- ', '')}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 p-4 bg-white rounded-lg border border-gray-100">
                      <h4 className="font-medium text-gray-800 mb-3">Recomendações:</h4>
                      <ul className="space-y-2">
                        {diet.meals.split('\n\n').pop()?.split('\n').map((rec, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>{rec.replace('- ', '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {diets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Histórico de Refeições</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {diets
                  .filter(diet => diet.status === 'completed')
                  .map((diet) => (
                    <div key={diet.id} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{diet.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Concluído em: {diet.createdAt?.toDate().toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Diet; 