import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { associateStudentWithTrainer } from '@/lib/db/queries';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  avatar?: string;
  trainerId?: string;
  students?: string[];
}

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<User | null>(null);
  const [associating, setAssociating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssociate = async (studentId: string, trainerId: string) => {
    try {
      setAssociating(true);
      await associateStudentWithTrainer(studentId, trainerId);
      toast.success('Aluno associado ao professor com sucesso!');
      await loadUsers();
      setSelectedStudent(null);
      setSelectedTrainer(null);
    } catch (error) {
      console.error('Erro ao associar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao associar aluno ao professor');
    } finally {
      setAssociating(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const students = filteredUsers.filter(u => u.level === 1);
  const trainers = filteredUsers.filter(u => u.level === 2);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="h-[600px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando usuários...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Usuários</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lista de Alunos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Alunos</h3>
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`p-4 rounded-lg border ${
                      selectedStudent?.id === student.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.trainerId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Professor: {trainers.find(t => t.id === student.trainerId)?.name || 'Não encontrado'}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={selectedStudent?.id === student.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedStudent(student)}
                      >
                        Selecionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de Professores */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Professores</h3>
              <div className="space-y-2">
                {trainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    className={`p-4 rounded-lg border ${
                      selectedTrainer?.id === trainer.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{trainer.name}</p>
                        <p className="text-sm text-muted-foreground">{trainer.email}</p>
                        {trainer.students && trainer.students.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {trainer.students.length} aluno(s)
                          </p>
                        )}
                      </div>
                      <Button
                        variant={selectedTrainer?.id === trainer.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTrainer(trainer)}
                      >
                        Selecionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botão de Associação */}
          {selectedStudent && selectedTrainer && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={() => handleAssociate(selectedStudent.id, selectedTrainer.id)}
                disabled={associating}
                className="w-full md:w-auto"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {associating ? 'Associando...' : 'Vincular Aluno ao Professor'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users; 