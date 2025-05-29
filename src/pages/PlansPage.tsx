import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const plans = [
  {
    id: 'free',
    name: 'Plano Gratuito (Beta)',
    description: 'Perfeito para começar',
    price: 'R$ 0',
    features: [
      'Até 5 alunos',
      'Criação de treinos básicos',
      'Chat com alunos',
      'Visualização básica de progresso',
      'Suporte por email'
    ],
    maxStudents: 5,
    commission: '0%',
    bonuses: []
  },
  {
    id: 'basic',
    name: 'Plano Básico',
    description: 'Para professores em crescimento',
    price: 'R$ 49,90',
    period: '/mês',
    features: [
      'Até 20 alunos',
      'Templates de treino',
      'Dietas básicas',
      'Relatórios simples',
      'Chat ilimitado',
      'Notificações',
      'Exportação em PDF',
      'Suporte prioritário'
    ],
    maxStudents: 20,
    commission: '5%',
    bonuses: ['Bônus por meta atingida']
  },
  {
    id: 'premium',
    name: 'Plano Premium',
    description: 'Para profissionais estabelecidos',
    price: 'R$ 99,90',
    period: '/mês',
    features: [
      'Até 50 alunos',
      'Templates ilimitados',
      'Dietas personalizadas',
      'Relatórios avançados',
      'Videochamadas',
      'Integração com wearables',
      'Backup automático',
      'Suporte VIP',
      'Comissão por indicação'
    ],
    maxStudents: 50,
    commission: '10%',
    bonuses: ['Bônus por meta atingida', 'Bônus por indicação']
  },
  {
    id: 'vip',
    name: 'Plano VIP',
    description: 'Para grandes profissionais',
    price: 'R$ 199,90',
    period: '/mês',
    features: [
      'Alunos ilimitados',
      'Todas as funcionalidades',
      'API personalizada',
      'Consultoria exclusiva',
      'Bônus especiais',
      'Suporte 24/7',
      'Eventos exclusivos',
      'Mentoria mensal'
    ],
    maxStudents: 'Ilimitado',
    commission: '15%',
    bonuses: ['Bônus por meta atingida', 'Bônus por indicação', 'Bônus por performance']
  }
];

const PlansPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectPlan = (planId: string) => {
    // TODO: Implementar lógica de seleção de plano
    console.log('Plano selecionado:', planId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Escolha seu Plano</h1>
        <p className="text-xl text-gray-600">
          Selecione o plano ideal para o seu crescimento profissional
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => (
          <Card key={plan.id} className={`flex flex-col ${plan.id === 'premium' ? 'border-blue-500 shadow-lg' : ''}`}>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-gray-600">{plan.period}</span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Máximo de alunos:</span>
                  <span className="font-semibold">{plan.maxStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Comissão por indicação:</span>
                  <span className="font-semibold">{plan.commission}</span>
                </div>
                {plan.bonuses.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bônus disponíveis:</span>
                    <span className="font-semibold">{plan.bonuses.length}</span>
                  </div>
                )}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className={`w-full ${plan.id === 'premium' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.id === 'free' ? 'Plano Atual' : 'Selecionar Plano'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dúvidas Frequentes</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Como funciona a comissão por indicação?</h3>
            <p className="text-gray-600">
              Você recebe uma porcentagem do valor pago por cada novo professor que se cadastrar através do seu link de indicação.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Posso trocar de plano a qualquer momento?</h3>
            <p className="text-gray-600">
              Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. O valor será ajustado proporcionalmente.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Como funcionam os bônus por meta?</h3>
            <p className="text-gray-600">
              Você recebe bônus adicionais quando seus alunos atingem metas específicas, como perda de peso ou ganho de massa muscular.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage; 