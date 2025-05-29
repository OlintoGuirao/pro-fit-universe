import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  studentCount: number;
  activeStudents: number;
  rating?: number;
}

const TrainersManagement = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true);
        
        // Buscar todos os professores (nível 2)
        const trainersRef = collection(db, 'users');
        const q = query(trainersRef, where('level', '==', 2));
        const querySnapshot = await getDocs(q);
        
        const trainersData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const trainerData = doc.data();
            
            // Buscar alunos deste professor
            const studentsQuery = query(
              collection(db, 'users'),
              where('trainerId', '==', doc.id),
              where('level', '==', 1)
            );
            const studentsSnapshot = await getDocs(studentsQuery);
            
            // Buscar alunos ativos
            const activeStudentsQuery = query(
              collection(db, 'users'),
              where('trainerId', '==', doc.id),
              where('level', '==', 1),
              where('active', '==', true)
            );
            const activeStudentsSnapshot = await getDocs(activeStudentsQuery);

            return {
              id: doc.id,
              name: trainerData.name || 'Professor',
              email: trainerData.email || '',
              phone: trainerData.phone || '',
              photoURL: trainerData.photoURL,
              studentCount: studentsSnapshot.size,
              activeStudents: activeStudentsSnapshot.size,
              rating: trainerData.rating || 0
            };
          })
        );

        setTrainers(trainersData);
      } catch (error) {
        console.error('Erro ao buscar professores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando professores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Professores</h1>
        <p className="text-gray-600 mt-2">Visualize e gerencie todos os professores da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map((trainer) => (
          <Card key={trainer.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  {trainer.photoURL ? (
                    <AvatarImage src={trainer.photoURL} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {trainer.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{trainer.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {trainer.studentCount} alunos
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {trainer.activeStudents} ativos
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {trainer.email}
                </div>
                {trainer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {trainer.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {trainer.studentCount} alunos no total
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trainers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum professor encontrado</h3>
          <p className="mt-2 text-gray-500">Não há professores cadastrados na plataforma.</p>
        </div>
      )}
    </div>
  );
};

export default TrainersManagement; 