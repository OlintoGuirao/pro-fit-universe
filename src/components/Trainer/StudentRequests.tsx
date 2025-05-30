import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

interface StudentRequest {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  pendingTrainerApproval: boolean;
}

export function StudentRequests() {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const { user } = useAuth();
  const { addToast } = useToast();

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

  const handleRequest = async (studentId: string, approved: boolean) => {
    try {
      const studentRef = doc(db, 'users', studentId);
      
      if (approved) {
        await updateDoc(studentRef, {
          pendingTrainerApproval: false
        });
        addToast({
          type: 'success',
          message: 'Aluno aprovado com sucesso!'
        });
      } else {
        await updateDoc(studentRef, {
          trainerId: null,
          pendingTrainerApproval: false
        });
        addToast({
          type: 'success',
          message: 'Solicitação rejeitada.'
        });
      }
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      addToast({
        type: 'error',
        message: 'Erro ao processar solicitação. Tente novamente.'
      });
    }
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações de Alunos</CardTitle>
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
                  onClick={() => handleRequest(request.id, false)}
                >
                  Recusar
                </Button>
                <Button
                  onClick={() => handleRequest(request.id, true)}
                >
                  Aprovar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 