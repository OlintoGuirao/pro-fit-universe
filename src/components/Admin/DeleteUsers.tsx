import React from 'react';
import { Button } from '@/components/ui/button';
import { createTestUsers, deleteUsers } from '@/lib/db/queries';
import { toast } from 'sonner';

export const DeleteUsers: React.FC = () => {
  const handleDelete = async () => {
    try {
      await deleteUsers();
      toast.success('Usuários removidos com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover usuários:', error);
      toast.error(error.message || 'Erro ao remover usuários');
    }
  };

  const handleCreate = async () => {
    try {
      console.log('Iniciando criação de usuários de teste...');
      await createTestUsers();
      toast.success('Usuários de teste criados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar usuários de teste:', error);
      toast.error(error.message || 'Erro ao criar usuários de teste');
    }
  };

  return (
    <div className="flex gap-4">
      <Button onClick={handleDelete} variant="destructive">
        Remover Usuários de Teste
      </Button>
      <Button onClick={handleCreate} variant="default">
        Criar Usuários de Teste
      </Button>
    </div>
  );
}; 