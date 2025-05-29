import { LoginForm } from '@/components/Auth/LoginForm';
import { Card, CardContent } from '@/components/ui/card';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Login() {
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
              <LoginForm />
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                onClick={() => window.location.href = '/register'}
              >
                Criar conta
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 