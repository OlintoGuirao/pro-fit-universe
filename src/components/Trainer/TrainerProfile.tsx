import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export function TrainerProfile() {
  const { user } = useAuth();

  const copyTrainerCode = () => {
    if (user?.trainerCode) {
      navigator.clipboard.writeText(user.trainerCode);
      toast.success('Código copiado para a área de transferência!');
    }
  };

  if (!user || user.level !== 2) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Seu Código de Professor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Compartilhe este código com seus alunos</p>
              <p className="text-2xl font-bold mt-1">{user.trainerCode}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyTrainerCode}
              className="h-10 w-10"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Os alunos usarão este código para se vincular a você durante o cadastro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 