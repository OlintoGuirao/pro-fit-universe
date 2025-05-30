import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StudentRequest {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  pendingTrainerApproval: boolean;
}

export function TrainerProfile() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<StudentRequest[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users'),
      where('trainerId', '==', user.id),
      where('pendingTrainerApproval', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentRequest[];
      setRequests(requestsList);
    });

    return () => unsubscribe();
  }, [user]);

  const copyTrainerCode = () => {
    if (user?.trainerCode) {
      navigator.clipboard.writeText(user.trainerCode);
      toast.success('Código copiado para a área de transferência!');
    }
  };

  const handleRequest = async (studentId: string, approved: boolean) => {
    try {
      const studentRef = doc(db, 'users', studentId);
      
      if (approved) {
        await updateDoc(studentRef, {
          pendingTrainerApproval: false
        });
        toast.success('Aluno aprovado com sucesso!');
      } else {
        await updateDoc(studentRef, {
          trainerId: null,
          pendingTrainerApproval: false
        });
        toast.success('Solicitação rejeitada.');
      }
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      toast.error('Erro ao processar solicitação. Tente novamente.');
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

      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={request.avatar} />
                      <AvatarFallback>
                        {request.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.name}</p>
                      <p className="text-sm text-gray-500">{request.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRequest(request.id, false)}
                      className="h-10 w-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => handleRequest(request.id, true)}
                      className="h-10 w-10"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 