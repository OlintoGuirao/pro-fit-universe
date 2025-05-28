import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, Scale, Ruler } from 'lucide-react';

const ProgressPage = () => {
  // Dados fictícios para exemplo
  const metrics = {
    weight: 78,
    height: 175,
    bmi: 25.5,
    bodyFat: 18,
    muscleMass: 35,
    weightGoal: 75,
    currentWeight: 78,
  };

  const weightHistory = [
    { date: '2024-01-01', weight: 80 },
    { date: '2024-01-08', weight: 79 },
    { date: '2024-01-15', weight: 78.5 },
    { date: '2024-01-22', weight: 78 },
  ];

  const evaluations = [
    {
      date: '2024-01-22',
      weight: 78,
      bodyFat: 18,
      muscleMass: 35,
      notes: 'Progresso consistente, manter treino atual',
    },
    {
      date: '2024-01-15',
      weight: 78.5,
      bodyFat: 18.5,
      muscleMass: 34.5,
      notes: 'Aumento na massa muscular, reduzir gordura',
    },
    {
      date: '2024-01-08',
      weight: 79,
      bodyFat: 19,
      muscleMass: 34,
      notes: 'Início do programa, estabelecer baseline',
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Progresso</h1>
        <Button>
          <Activity className="mr-2 h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peso Atual</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.weight} kg</div>
            <Progress value={70} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {metrics.weightGoal} kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Altura</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.height} cm</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IMC</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.bmi}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.bmi < 18.5 ? 'Abaixo do peso' : 
               metrics.bmi < 25 ? 'Peso normal' : 
               metrics.bmi < 30 ? 'Sobrepeso' : 'Obesidade'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Gordura</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.bodyFat}%</div>
            <Progress value={metrics.bodyFat} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Peso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end space-x-2">
              {weightHistory.map((entry, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-primary rounded-t"
                    style={{ 
                      height: `${(entry.weight / Math.max(...weightHistory.map(w => w.weight))) * 100}%` 
                    }}
                  />
                  <span className="text-xs mt-2">{entry.weight}kg</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluations.map((evaluation, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        {new Date(evaluation.date).toLocaleDateString('pt-BR')}
                      </h3>
                      <div className="text-sm text-muted-foreground space-x-4">
                        <span>Peso: {evaluation.weight}kg</span>
                        <span>Gordura: {evaluation.bodyFat}%</span>
                        <span>Massa: {evaluation.muscleMass}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {evaluation.notes}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressPage; 