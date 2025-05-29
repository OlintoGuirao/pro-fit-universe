import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Utensils, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DietPlan } from '@/types/diet';

const Diet: React.FC = () => {
  const { user } = useAuth();
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDietPlans = async () => {
      if (!user) return;

      try {
        console.log('Buscando dietas para o aluno:', user.id);
        const dietPlansRef = collection(db, 'dietPlans');
        const q = query(dietPlansRef, where('studentId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        console.log('Dietas encontradas:', querySnapshot.size);
        const fetchedDietPlans = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Dados da dieta:', { id: doc.id, ...data });
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate()
          };
        }) as DietPlan[];

        console.log('Dietas processadas:', fetchedDietPlans);
        setDietPlans(fetchedDietPlans);
      } catch (error) {
        console.error('Erro ao buscar planos de dieta:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDietPlans();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (dietPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Nenhum plano de dieta encontrado</h2>
        <p className="text-gray-600">
          Seu professor ainda não enviou nenhum plano de dieta para você.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-800">Meus Planos de Dieta</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dietPlans.map((plan) => (
          <Card key={plan.id} className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
                  <p className="text-sm text-gray-500">
                    Criado em {plan.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {plan.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Refeições</h4>
                {plan.meals.map((meal) => (
                  <div key={meal.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-gray-800">{meal.name}</h5>
                      <span className="text-sm text-gray-600">{meal.time}</span>
                    </div>
                    <ul className="space-y-1">
                      {meal.foods.map((food, index) => (
                        <li key={index} className="text-sm text-gray-600">• {food}</li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="grid grid-cols-4 gap-2 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">{meal.calories}</span> cal
                        </div>
                        <div>
                          <span className="font-medium">{meal.protein}g</span> prot
                        </div>
                        <div>
                          <span className="font-medium">{meal.carbs}g</span> carb
                        </div>
                        <div>
                          <span className="font-medium">{meal.fat}g</span> gordura
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Meta de água: <span className="font-medium">{plan.waterGoal}L</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-medium">{plan.totalCalories} cal</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Diet; 