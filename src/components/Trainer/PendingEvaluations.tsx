import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Check, X, Calendar, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { ScheduleEvaluationDialog } from './ScheduleEvaluationDialog';
import { EvaluationResultsDialog } from './EvaluationResultsDialog';

interface Evaluation {
  id: string;
  type: string;
  description: string;
  studentId: string;
  studentName: string;
  trainerId: string;
  status: string;
  createdAt: any;
  priority: string;
  scheduledDate?: Date;
}

export const PendingEvaluations = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = React.useState<Evaluation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = React.useState<Evaluation | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = React.useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user?.id) {
      console.log('Usuário não encontrado');
      return;
    }

    console.log('Iniciando listener de avaliações para o professor:', user.id);
    
    const evaluationsRef = collection(db, 'evaluations');
    console.log('Referência da coleção criada');

    const q = query(
      evaluationsRef,
      where('trainerId', '==', user.id),
      where('status', 'in', ['pending', 'scheduled'])
    );

    console.log('Query criada:', q);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Nova atualização recebida');
      console.log('Número de documentos:', snapshot.size);
      
      const newEvaluations = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Dados do documento:', data);
        return {
          id: doc.id,
          ...data
        };
      }) as Evaluation[];
      
      console.log('Avaliações atualizadas:', newEvaluations);
      setEvaluations(newEvaluations);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao escutar avaliações:', error);
      setLoading(false);
    });

    return () => {
      console.log('Limpando listener de avaliações');
      unsubscribe();
    };
  }, [user?.id]);

  const handleEvaluation = async (evaluationId: string, status: 'approved' | 'rejected') => {
    try {
      console.log('Atualizando avaliação:', evaluationId, 'para status:', status);
      
      const evaluationRef = doc(db, 'evaluations', evaluationId);
      await updateDoc(evaluationRef, {
        status,
        updatedAt: serverTimestamp()
      });

      toast.success(`Avaliação ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar avaliação:', error);
      toast.error('Erro ao atualizar avaliação. Tente novamente.');
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
        return 'Outro';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Agendada</Badge>;
      case 'completed':
        return <Badge variant="default">Concluída</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Avaliações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white shadow-lg">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Avaliações Pendentes
            <Badge variant="outline" className="ml-2">
              {evaluations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {evaluations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Nenhuma avaliação pendente
                </p>
              </div>
            ) : (
              evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="border rounded-lg p-4 space-y-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {getTypeLabel(evaluation.type)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Solicitado por: <span className="font-medium">{evaluation.studentName}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {evaluation.createdAt?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(evaluation.status)}
                      <Badge 
                        variant={evaluation.priority === 'high' ? 'destructive' : 'default'}
                        className="ml-2"
                      >
                        {evaluation.priority === 'high' ? 'Alta Prioridade' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-md border">
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {evaluation.description}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    {evaluation.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEvaluation(evaluation.id, 'rejected')}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedEvaluation(evaluation);
                            setIsScheduleDialogOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Agendar
                        </Button>
                      </>
                    )}
                    {evaluation.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedEvaluation(evaluation);
                          setIsResultsDialogOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Registrar Resultados
                      </Button>
                    )}
                  </div>
                  {evaluation.status === 'scheduled' && evaluation.scheduledDate && (
                    <div className="mt-2 text-sm text-blue-700 font-medium">
                      Agendada para: {(() => {
                        let dateObj: Date;
                        if (evaluation.scheduledDate instanceof Date) {
                          dateObj = evaluation.scheduledDate;
                        } else if (evaluation.scheduledDate && typeof (evaluation.scheduledDate as any).toDate === 'function') {
                          dateObj = (evaluation.scheduledDate as any).toDate();
                        } else {
                          dateObj = new Date(evaluation.scheduledDate);
                        }
                        return dateObj.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                      })()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEvaluation && (
        <>
          <ScheduleEvaluationDialog
            isOpen={isScheduleDialogOpen}
            onOpenChange={setIsScheduleDialogOpen}
            evaluation={selectedEvaluation}
          />
          <EvaluationResultsDialog
            isOpen={isResultsDialogOpen}
            onOpenChange={setIsResultsDialogOpen}
            evaluation={selectedEvaluation}
          />
        </>
      )}
    </>
  );
}; 