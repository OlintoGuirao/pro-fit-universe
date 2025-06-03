import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegisterForm } from './RegisterForm';
import { Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <RegisterForm onBackToLogin={() => setShowRegister(false)} />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      addToast({
        type: 'success',
        message: 'Login realizado com sucesso!'
      });
      navigate('/');
    } catch (error: any) {
      let message = 'Erro ao fazer login. Tente novamente.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Email ou senha incorretos.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas de login. Tente novamente mais tarde.';
      }
      
      addToast({
        type: 'error',
        message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'aluno@test.com', role: 'Aluno', password: '123456' },
    { email: 'professor@test.com', role: 'Personal Trainer', password: '123456' },
    { email: 'admin@test.com', role: 'Administrador', password: '123456' }
  ];

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setIsLoading(true);

    try {
      await login(demoEmail, demoPassword);
      addToast({
        type: 'success',
        message: 'Login realizado com sucesso!'
      });
      navigate('/');
    } catch (err: any) {
      console.error('Erro no demo login:', err);
      addToast({
        type: 'error',
        message: 'Erro ao fazer login com conta demo. Tente novamente mais tarde.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="h-11 pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
            <Button
              variant="link"
              className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
              onClick={() => {/* TODO: Implementar recuperação de senha */}}
            >
              Esqueceu a senha?
            </Button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="h-11 pl-10"
            />
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Ou entre com uma conta demo</span>
        </div>
      </div>

      <div className="grid gap-3">
        {demoAccounts.map((account, index) => (
          <Button
            key={index}
            variant="outline"
            type="button"
            className="w-full h-11 justify-start text-left hover:bg-gray-50"
            onClick={() => handleDemoLogin(account.email, account.password)}
            disabled={isLoading}
          >
            <User className="mr-2 h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-sm">{account.role}</div>
              <div className="text-xs text-gray-500">{account.email}</div>
            </div>
          </Button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{' '}
          <Button 
            variant="link" 
            className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
            onClick={() => setShowRegister(true)}
          >
            Criar conta
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </p>
      </div>
    </form>
  );
}
