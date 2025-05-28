
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RegisterForm from './RegisterForm';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const { login } = useAuth();

  if (showRegister) {
    return <RegisterForm onBackToLogin={() => setShowRegister(false)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError('Email ou senha inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'aluno@test.com', role: 'Aluno', password: '123456' },
    { email: 'professor@test.com', role: 'Personal Trainer', password: '123456' },
    { email: 'admin@test.com', role: 'Administrador', password: '123456' }
  ];

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
          <p className="text-gray-600 mt-2">Entre na sua conta para continuar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Acesse sua conta com email e senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-purple-600 hover:text-purple-700"
                  onClick={() => setShowRegister(true)}
                >
                  Cadastre-se aqui
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contas de Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoAccounts.map((account, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full text-left justify-start"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
              >
                <div>
                  <div className="font-medium">{account.role}</div>
                  <div className="text-xs text-gray-500">{account.email}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
