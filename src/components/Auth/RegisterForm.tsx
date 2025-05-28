import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    level: 1,
    goals: '',
    weight: '',
    height: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      addToast('error', 'Erro no cadastro', 'As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        name: formData.name,
        level: formData.level as 1 | 2 | 3,
        ...(formData.level === 1 && {
          goals: formData.goals ? formData.goals.split(',').map(g => g.trim()) : [],
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined
        }),
        ...(formData.level === 2 && {
          students: [],
          maxStudents: 5,
          isVerified: false
        })
      };

      console.log('Dados do usuário a serem registrados:', userData);
      await register(formData.email, formData.password, userData);
      console.log('Usuário registrado com sucesso');
      addToast('success', 'Conta criada com sucesso', 'Bem-vindo ao FitConnect!');
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        addToast('error', 'Email já cadastrado', 'Este email já está sendo usado por outra conta');
      } else if (err.code === 'auth/invalid-email') {
        addToast('error', 'Email inválido', 'Por favor, insira um email válido');
      } else if (err.code === 'auth/weak-password') {
        addToast('error', 'Senha fraca', 'A senha deve ter pelo menos 6 caracteres');
      } else if (err.code === 'auth/network-request-failed') {
        addToast('error', 'Erro de conexão', 'Verifique sua conexão com a internet');
      } else {
        addToast('error', 'Erro ao criar conta', err.message || 'Ocorreu um erro inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl">💪</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            FitConnect
          </h1>
          <p className="text-gray-600 mt-2">Crie sua conta para começar</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBackToLogin}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle>Cadastro</CardTitle>
                <CardDescription>
                  Preencha os dados para criar sua conta
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Tipo de Conta</Label>
                <Select 
                  value={formData.level.toString()} 
                  onValueChange={(value) => handleInputChange('level', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Aluno</SelectItem>
                    <SelectItem value="2">Personal Trainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.level === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="goals">Objetivos (separados por vírgula)</Label>
                    <Textarea
                      id="goals"
                      value={formData.goals}
                      onChange={(e) => handleInputChange('goals', e.target.value)}
                      placeholder="Ex: Hipertrofia, Emagrecimento"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        placeholder="70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        placeholder="175"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={isLoading}
              >
                {isLoading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterForm;
