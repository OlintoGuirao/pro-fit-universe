import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evaluation {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: any;
  scheduledDate?: any;
  results?: {
    weight?: string;
    height?: string;
    bmi?: string;
    bodyFat?: string;
    muscleMass?: string;
    waist?: string;
    chest?: string;
    arm?: string;
    thigh?: string;
    notes?: string;
    goals?: string;
    recommendations?: string;
    completedAt: any;
  };
}

export const EvaluationHistory = () => {
  const { user } = useAuth();

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['student-evaluations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const evaluationsRef = collection(db, 'evaluations');
      const q = query(
        evaluationsRef,
        where('studentId', '==', user.id),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Evaluation[];
    }
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'scheduled':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Histórico de Avaliações
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
    <Card className="bg-white shadow-lg">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-6 w-6 text-blue-600" />
          Histórico de Avaliações
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
                Nenhuma avaliação encontrada
              </p>
            </div>
          ) : (
            evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="border rounded-lg p-4 space-y-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(evaluation.status)}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {getTypeLabel(evaluation.type)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Solicitado em: {evaluation.createdAt?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                      {(evaluation.status === 'scheduled' || evaluation.status === 'completed') && evaluation.scheduledDate && (
                        <p className="text-sm text-blue-700 font-medium">
                          Agendada para: {typeof evaluation.scheduledDate.toDate === 'function' ? evaluation.scheduledDate.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : new Date(evaluation.scheduledDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(evaluation.status)}
                </div>

                <div className="bg-white p-3 rounded-md border">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {evaluation.description}
                  </p>
                </div>

                {evaluation.status === 'completed' && evaluation.results && (
                  <div className="bg-white p-3 rounded-md border mt-3">
                    <h4 className="font-medium mb-2">Resultados</h4>
                    {evaluation.type === 'fisica' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Peso: {evaluation.results.weight} kg</p>
                          <p className="text-sm text-gray-600">Altura: {evaluation.results.height} cm</p>
                          <p className="text-sm text-gray-600">IMC: {evaluation.results.bmi}</p>
                          <p className="text-sm text-gray-600">% Gordura: {evaluation.results.bodyFat}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Cintura: {evaluation.results.waist} cm</p>
                          <p className="text-sm text-gray-600">Peito: {evaluation.results.chest} cm</p>
                          <p className="text-sm text-gray-600">Braço: {evaluation.results.arm} cm</p>
                          <p className="text-sm text-gray-600">Coxa: {evaluation.results.thigh} cm</p>
                        </div>
                      </div>
                    )}
                    {(evaluation.type === 'nutricional' || evaluation.type === 'performance') && (
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Objetivos:</p>
                          <p className="text-sm text-gray-600 whitespace-pre-line">
                            {evaluation.results.goals}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Recomendações:</p>
                          <p className="text-sm text-gray-600 whitespace-pre-line">
                            {evaluation.results.recommendations}
                          </p>
                        </div>
                      </div>
                    )}
                    {evaluation.results.notes && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Observações:</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {evaluation.results.notes}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Concluído em: {evaluation.results.completedAt?.toDate().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 