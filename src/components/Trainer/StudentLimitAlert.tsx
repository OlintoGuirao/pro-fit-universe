import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentLimitAlert = () => {
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentCount = async () => {
      if (!user || !user.id) {
        console.log('Usuário não está autenticado ou ID não disponível');
        return;
      }

      try {
        setLoading(true);
        const studentsRef = collection(db, 'users');
        const q = query(
          studentsRef,
          where('trainerId', '==', user.id),
          where('level', '==', 1)
        );
        const snapshot = await getDocs(q);
        const count = snapshot.size;
        console.log('Número de alunos encontrados:', count);
        setStudentCount(count);
      } catch (error) {
        console.error('Erro ao buscar contagem de alunos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentCount();
  }, [user]);

  // Log para debug
  console.log('Estado atual:', { loading, studentCount, userId: user?.id });

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user || !user.id) {
    return null;
  }

  // Se o professor tiver 5 ou mais alunos, mostra o alerta
  if (studentCount >= 5) {
    return (
      <Alert className="mb-4 bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Limite de Alunos Atingido</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Você atingiu o limite de 5 alunos no plano gratuito. Atualize seu plano para continuar crescendo!
        </AlertDescription>
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            onClick={() => navigate('/plans')}
          >
            Ver Planos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Alert>
    );
  }

  return null;
};

export default StudentLimitAlert; 