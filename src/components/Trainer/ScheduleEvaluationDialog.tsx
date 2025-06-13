import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduleEvaluationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: {
    id: string;
    type: string;
    studentName: string;
    studentId: string;
  } | null;
}

export const ScheduleEvaluationDialog = ({
  isOpen,
  onOpenChange,
  evaluation
}: ScheduleEvaluationDialogProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('09:00');
  const [isLoading, setIsLoading] = useState(false);

  const handleSchedule = async () => {
    if (!evaluation) {
      toast.error('Avaliação não encontrada');
      return;
    }

    if (!date) {
      toast.error('Por favor, selecione uma data');
      return;
    }

    setIsLoading(true);
    try {
      const scheduledDate = new Date(date);
      const [hours, minutes] = time.split(':');
      scheduledDate.setHours(parseInt(hours), parseInt(minutes));

      // Atualiza a avaliação com a data agendada
      const evaluationRef = doc(db, 'evaluations', evaluation.id);
      await updateDoc(evaluationRef, {
        status: 'scheduled',
        scheduledDate: scheduledDate
      });

      // Cria uma notificação para o aluno
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: evaluation.studentId,
        type: 'evaluation_scheduled',
        title: 'Avaliação Agendada',
        message: `Sua avaliação ${evaluation.type === 'fisica' ? 'física' : evaluation.type === 'nutricional' ? 'nutricional' : 'de performance'} foi agendada para ${format(scheduledDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast.success('Avaliação agendada com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao agendar avaliação:', error);
      toast.error('Erro ao agendar avaliação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fisica':
        return 'Avaliação Física';
      case 'nutricional':
        return 'Avaliação Nutricional';
      case 'performance':
        return 'Avaliação de Performance';
      default:
        return 'Avaliação';
    }
  };

  // Gera horários das 8h às 18h
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  if (!evaluation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[98vw] p-1 sm:p-6 rounded-lg !m-0">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-center">
            Agendar Avaliação
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1 px-1">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold">Tipo de Avaliação</Label>
            <div className="p-2 bg-gray-100 rounded-md text-base min-h-[38px] flex items-center border border-gray-200">
              {getTypeLabel(evaluation.type)}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold">Aluno</Label>
            <div className="p-2 bg-gray-100 rounded-md text-base min-h-[38px] flex items-center border border-gray-200">
              {evaluation.studentName}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold">Data</Label>
            <div className="border rounded-md p-0.5 bg-white shadow-sm overflow-x-auto">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                disabled={(date) => date < new Date()}
                className="w-full text-[11px] sm:text-sm !p-0"
                style={{ minWidth: 0 }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold">Horário</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="w-full min-h-[38px] text-base border border-gray-200">
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot} className="text-base">
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 mt-5">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full h-12 text-base border border-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!date || isLoading}
            className="w-full h-12 text-base bg-violet-700 hover:bg-violet-800 text-white font-bold shadow-md"
          >
            {isLoading ? 'Agendando...' : 'Agendar Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 