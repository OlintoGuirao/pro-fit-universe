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
}

interface RegisterFormProps {
  onBackToLogin?: () => void;
}

export function RegisterForm({ onBackToLogin }: RegisterFormProps) {
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
        return;
      }

      try {
        const trainersRef = collection(db, 'users');
        const q = query(
          trainersRef,
          where('level', '==', 2),
          where('trainerCode', '==', searchTerm.toUpperCase())
        );
        
        const querySnapshot = await getDocs(q);
        const trainersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Trainer[];
        
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
      } catch (error) {
        console.error('Erro ao buscar professores:', error);
        addToast({
          type: 'error',
          message: 'Erro ao buscar professor. Tente novamente.'
        });
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
      setSearchTerm(value);
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

    if (formData.password !== formData.confirmPassword) {
      addToast({
        type: 'error',
        message: 'As senhas não coincidem.'
      });
      setIsLoading(false);
      return;
    }

    try {
      await register(formData.email, formData.password, formData.name, formData.role, selectedTrainer);
      addToast({
        type: 'success',
        message: 'Cadastro realizado com sucesso!'
      });
      navigate('/');
    } catch (error: any) {
      let message = 'Erro ao fazer cadastro. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este email já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl">💪</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            FitLife
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
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Conta</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo da conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="trainer">Personal Trainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="trainerCode">Código do Professor (opcional)</Label>
                  <div className="relative">
                    <Input
                      id="trainerCode"
                      name="trainerCode"
                      value={searchTerm}
                      onChange={handleInputChange}
                      placeholder="Digite o código do professor"
                      disabled={isLoading}
                    />
                  </div>
                  {selectedTrainer && (
                    <p className="text-sm text-green-600">
                      Professor encontrado! A solicitação será enviada automaticamente.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
