import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface NewEvaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewEvaluationDialog: React.FC<NewEvaluationDialogProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    priority: 'normal'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      console.log('Usuário não encontrado');
      return;
    }

    try {
      console.log('Iniciando criação de avaliação...');
      console.log('Dados do formulário:', formData);
      console.log('ID do usuário:', user.id);
      console.log('ID do professor:', user.trainerId);

      if (!user.trainerId) {
        console.error('ID do professor não encontrado');
        toast.error('Erro: Professor não encontrado');
        return;
      }

      const newEvaluation = {
        type: formData.type,
        description: formData.description,
        studentId: user.id,
        studentName: user.name,
        trainerId: user.trainerId,
        status: 'pending',
        createdAt: serverTimestamp(),
        priority: formData.priority
      };

      console.log('Objeto de avaliação a ser criado:', newEvaluation);

      const evaluationsRef = collection(db, 'evaluations');
      const docRef = await addDoc(evaluationsRef, newEvaluation);
      console.log('Avaliação criada com sucesso. ID:', docRef.id);

      // Verificar se a avaliação foi realmente criada
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log('Avaliação confirmada no banco:', docSnap.data());
      } else {
        console.error('Avaliação não encontrada após criação');
      }

      toast.success('Avaliação solicitada com sucesso!');
      onClose();
      setFormData({ type: '', description: '', priority: 'normal' });
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      toast.error('Erro ao solicitar avaliação. Tente novamente.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Avaliação</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para solicitar uma nova avaliação ao seu professor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Avaliação</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de avaliação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fisica">Avaliação Física</SelectItem>
                <SelectItem value="nutricional">Avaliação Nutricional</SelectItem>
                <SelectItem value="performance">Avaliação de Performance</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o motivo da sua solicitação de avaliação..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Solicitar Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 