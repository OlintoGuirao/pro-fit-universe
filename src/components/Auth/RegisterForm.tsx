import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Search } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Trainer {
  id: string;
  name: string;
  email: string;
  trainerCode: string;
  level: number;
}

interface RegisterFormProps {
  onBackToLogin: () => void;
  setShowRegister: (show: boolean) => void;
}

export function RegisterForm({ onBackToLogin, setShowRegister }: RegisterFormProps) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  useEffect(() => {
    const searchTrainers = async () => {
      if (searchTerm.length < 3) {
        setTrainers([]);
        setSelectedTrainer('');
        return;
      }

      try {
        const trainersRef = collection(db, 'users');
        const q = query(
          trainersRef,
          where('level', '==', 2)
        );
        
        console.log('Buscando professores...');
        
        const querySnapshot = await getDocs(q);
        const trainersList = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || '',
              email: data.email || '',
              trainerCode: data.trainerCode || '',
              level: data.level || 0
            } as Trainer;
          })
          .filter(trainer => 
            trainer.trainerCode && 
            trainer.trainerCode.trim().toUpperCase() === searchTerm.toUpperCase().trim()
          );
        
        console.log('Professores encontrados:', trainersList);
        
        if (trainersList.length > 0) {
          setSelectedTrainer(trainersList[0].id);
          addToast({
            type: 'success',
            message: 'Professor encontrado! A solicitação será enviada automaticamente.'
          });
        } else {
          setSelectedTrainer('');
          addToast({
            type: 'error',
            message: 'Código de professor inválido.'
          });
        }
        
        setTrainers(trainersList);
      } catch (error: any) {
        console.error('Erro ao buscar professores:', error);
        console.error('Detalhes do erro:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        setSelectedTrainer('');
        setTrainers([]);
        
        if (error.code === 'permission-denied') {
          addToast({
            type: 'error',
            message: 'Erro de permissão ao buscar professor. Por favor, tente novamente.'
          });
        } else {
          addToast({
            type: 'error',
            message: 'Erro ao buscar professor. Tente novamente.'
          });
        }
      }
    };

    searchTrainers();
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'trainerCode') {
      setSearchTerm(value.toUpperCase());
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as 'student' | 'trainer'
    }));
    setSelectedTrainer('');
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações básicas
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      if (formData.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      if (formData.role === 'student' && !selectedTrainer) {
        throw new Error('Por favor, insira um código de professor válido');
      }

      // Registrar usuário
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        selectedTrainer
      );

      addToast({
        type: 'success',
        message: 'Cadastro realizado com sucesso!'
      });

      // Redirecionar para a página Index
      window.location.href = '/';
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      
      let message = 'Erro ao fazer cadastro. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este email já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido.';
      } else if (error.message) {
        message = error.message;
      }
      
      addToast({
        type: 'error',
        message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">
            WordFit
          </h1>
          <p className="text-muted-foreground">
            Crie sua conta para começar
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/login'}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground">
              Criar Conta
            </h2>
            <div className="w-10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="h-11"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="h-11"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium mb-1.5 block">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="h-11"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium mb-1.5 block">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="h-11"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-sm font-medium mb-1.5 block">Tipo de Conta</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecionar tipo da conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="trainer">Personal Trainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === 'student' && (
                <div>
                  <Label htmlFor="trainerCode" className="text-sm font-medium mb-1.5 block">Código do Professor (opcional)</Label>
                  <div className="relative">
                    <Input
                      id="trainerCode"
                      name="trainerCode"
                      value={searchTerm}
                      onChange={handleInputChange}
                      placeholder="Digite o código do professor"
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>
                  {selectedTrainer && (
                    <p className="text-sm text-green-600 mt-1.5">
                      Professor encontrado! A solicitação será enviada automaticamente.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-11 font-medium"
              >
                Criar Conta
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
