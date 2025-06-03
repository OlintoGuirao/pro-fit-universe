import React from 'react';
import { Button } from '@/components/ui/button';
import { createTestUsers } from '@/lib/db/queries';
import { toast } from 'sonner';

export function CreateTestUsers() {
  const handleCreate = async () => {
    try {
      await createTestUsers();
      toast.success('Usuários de teste criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar usuários de teste:', error);
      toast.error('Erro ao criar usuários de teste');
    }
  };

  return (
    <div className="p-4">
      <Button onClick={handleCreate} variant="default">
        Criar Usuários de Teste
      </Button>
    </div>
  );
} 