import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft } from 'lucide-react';
import { profileService } from '@/services/profileService';

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: user?.displayName || '',
    email: user?.email || '',
    role: user?.role === 'student' ? 'Aluno' : 'Personal Trainer'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    setIsLoading(true);

    try {
      await profileService.updateProfile(user.uid, {
        displayName: formData.name
      });

      // Atualizar o estado do usuário
      setUser(prev => prev ? {
        ...prev,
        displayName: formData.name
      } : null);

      addToast({
        type: 'success',
        message: 'Perfil alterado com sucesso!'
      });

      // Aguarda 1 segundo para mostrar a mensagem antes de redirecionar
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      addToast({
        type: 'error',
        message: 'Erro ao salvar configurações. Tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Gerencie suas preferências e configurações da conta
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="role">Tipo de Conta</Label>
                <Input
                  id="role"
                  name="role"
                  value={formData.role}
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 