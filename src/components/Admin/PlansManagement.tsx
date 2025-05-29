import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Trash2, Edit2, Check, Users, Star, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  active: boolean;
  duration: number;
  maxStudents: number;
  commission: number;
  bonuses: {
    students: number;
    amount: number;
  }[];
}

const PlansManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    name: '',
    description: '',
    price: 0,
    features: [''],
    active: true,
    duration: 1,
    maxStudents: 5,
    commission: 0,
    bonuses: []
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const plansRef = collection(db, 'plans');
      const snapshot = await getDocs(plansRef);
      const plansData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plan[];
      setPlans(plansData);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async () => {
    try {
      if (!newPlan.name || !newPlan.description || newPlan.price <= 0) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const planData = {
        ...newPlan,
        features: newPlan.features?.filter(f => f.trim() !== '')
      };

      await addDoc(collection(db, 'plans'), planData);
      toast.success('Plano adicionado com sucesso!');
      setNewPlan({
        name: '',
        description: '',
        price: 0,
        features: [''],
        active: true,
        duration: 1,
        maxStudents: 5,
        commission: 0,
        bonuses: []
      });
      fetchPlans();
    } catch (error) {
      console.error('Erro ao adicionar plano:', error);
      toast.error('Erro ao adicionar plano');
    }
  };

  const handleUpdatePlan = async (plan: Plan) => {
    try {
      await updateDoc(doc(db, 'plans', plan.id), plan);
      toast.success('Plano atualizado com sucesso!');
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar plano');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteDoc(doc(db, 'plans', planId));
      toast.success('Plano excluído com sucesso!');
      fetchPlans();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  const addFeature = () => {
    setNewPlan(prev => ({
      ...prev,
      features: [...(prev.features || []), '']
    }));
  };

  const addBonus = () => {
    setNewPlan(prev => ({
      ...prev,
      bonuses: [...(prev.bonuses || []), { students: 0, amount: 0 }]
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features?.map((f, i) => i === index ? value : f)
    }));
  };

  const updateBonus = (index: number, field: 'students' | 'amount', value: number) => {
    setNewPlan(prev => ({
      ...prev,
      bonuses: prev.bonuses?.map((b, i) => i === index ? { ...b, [field]: value } : b)
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Planos para Professores</h1>
        <p className="text-gray-600 mt-2">Gerencie os planos disponíveis para professores</p>
      </div>

      {/* Formulário de novo plano */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input
                  id="name"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Plano Básico"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva os benefícios do plano"
              />
            </div>

            <div className="space-y-2">
              <Label>Duração (meses)</Label>
              <Input
                type="number"
                value={newPlan.duration}
                onChange={(e) => setNewPlan(prev => ({ ...prev, duration: Number(e.target.value) }))}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Máximo de Alunos</Label>
              <Input
                type="number"
                value={newPlan.maxStudents}
                onChange={(e) => setNewPlan(prev => ({ ...prev, maxStudents: Number(e.target.value) }))}
                min="5"
              />
            </div>

            <div className="space-y-2">
              <Label>Comissão por Indicação (%)</Label>
              <Input
                type="number"
                value={newPlan.commission}
                onChange={(e) => setNewPlan(prev => ({ ...prev, commission: Number(e.target.value) }))}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label>Bônus por Metas</Label>
              {newPlan.bonuses?.map((bonus, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="number"
                    value={bonus.students}
                    onChange={(e) => updateBonus(index, 'students', Number(e.target.value))}
                    placeholder="Número de alunos"
                  />
                  <Input
                    type="number"
                    value={bonus.amount}
                    onChange={(e) => updateBonus(index, 'amount', Number(e.target.value))}
                    placeholder="Valor do bônus"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setNewPlan(prev => ({
                      ...prev,
                      bonuses: prev.bonuses?.filter((_, i) => i !== index)
                    }))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addBonus}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Bônus
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Recursos Inclusos</Label>
              {newPlan.features?.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Recurso inclusivo"
                  />
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setNewPlan(prev => ({
                        ...prev,
                        features: prev.features?.filter((_, i) => i !== index)
                      }))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addFeature}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Recurso
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={newPlan.active}
                onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">Plano Ativo</Label>
            </div>

            <Button onClick={handleAddPlan} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Plano
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de planos existentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    R$ {plan.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {plan.duration} {plan.duration === 1 ? 'mês' : 'meses'}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      <Users className="h-4 w-4 inline mr-1" />
                      Máx. {plan.maxStudents} alunos
                    </p>
                    {plan.commission && (
                      <p className="text-sm text-gray-500">
                        <Star className="h-4 w-4 inline mr-1" />
                        {plan.commission}% de comissão
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePlan(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </div>
                ))}
              </div>
              {plan.bonuses && plan.bonuses.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Bônus por Metas:</p>
                  {plan.bonuses.map((bonus, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Gift className="h-4 w-4 text-yellow-500 mr-2" />
                      {bonus.students} alunos = R$ {bonus.amount}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center space-x-2">
                <Switch
                  checked={plan.active}
                  onCheckedChange={(checked) => handleUpdatePlan({ ...plan, active: checked })}
                />
                <span className="text-sm text-gray-500">
                  {plan.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nenhum plano encontrado</h3>
          <p className="mt-2 text-gray-500">Adicione seu primeiro plano usando o formulário acima.</p>
        </div>
      )}
    </div>
  );
};

export default PlansManagement; 