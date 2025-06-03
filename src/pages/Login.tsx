import { LoginForm } from '@/components/Auth/LoginForm';
import { Card, CardContent } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      window.location.href = '/';
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      
      let message = 'Erro ao fazer login. Tente novamente.';
      
      if (error.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Senha incorreta.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido.';
      }
      
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Imagem de fundo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center space-x-3 mb-8">
            <Dumbbell className="h-8 w-8" />
            <h2 className="text-2xl font-bold">WordFit</h2>
          </div>
          <h1 className="text-4xl font-bold mb-4">Transforme seu corpo, transforme sua vida</h1>
          <p className="text-lg text-blue-100">
            Acompanhamento personalizado, treinos adaptados e resultados reais.
            Comece sua jornada fitness hoje mesmo.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Lado direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo e título para mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Dumbbell className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">WordFit</h2>
            </div>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
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
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Não tem uma conta?{' '}
                    <Button
                      variant="link"
                      onClick={() => window.location.href = '/register'}
                      className="p-0 h-auto font-medium"
                    >
                      Criar conta
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 