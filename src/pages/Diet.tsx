import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Utensils } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';

interface DietPlan {
  id: string;
  title: string;
  description: string;
  meals: {
    name: string;
    foods: string[];
  }[];
  createdAt: any;
  status: 'pending' | 'completed';
  studentId: string;
  studentName: string;
  createdBy: string;
}

const Diet = () => {
  const { user } = useAuth();

  const { data: dietPlans = [], isLoading } = useQuery({
    queryKey: ['student-diets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const dietPlansRef = collection(db, 'dietPlans');
      const q = query(dietPlansRef, where('studentId', '==', user.id));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DietPlan[];
    }
  });

  const formatDietTitle = (title: string) => {
    return title.replace(/^Título:\s*/i, '').trim();
  };

  const splitMeals = (meals: any[]) => {
    return meals.map(meal => ({
      title: meal.name,
      content: meal.foods.join('\n')
    }));
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
        ) : dietPlans.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Nenhuma dieta disponível ainda</div>
        ) : (
          dietPlans.map((diet) => (
            <div key={diet.id} className="space-y-6">
              {splitMeals(diet.meals).map((meal, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{meal.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="mr-1 h-4 w-4" />
                          Criado em: {diet.createdAt?.toDate().toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Button variant={diet.status === 'completed' ? "secondary" : "default"}>
                        {diet.status === 'completed' ? 'Completado' : 'Registrar Refeição'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {diet.description && (
                        <p className="text-sm text-gray-600">{diet.description}</p>
                      )}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                          {meal.content}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>

      {dietPlans.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Histórico de Refeições</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {dietPlans
                  .filter(diet => diet.status === 'completed')
                  .map((diet) => (
                    <div key={diet.id} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{formatDietTitle(diet.title)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Completado em: {diet.createdAt?.toDate().toLocaleDateString('pt-BR')}
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