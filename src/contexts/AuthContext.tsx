import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: string, trainerId?: string) => Promise<void>;
  setUser: (user: User | null | ((prev: User | null) => User | null)) => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  setUser: () => {},
  updateUser: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userWithId = {
              id: firebaseUser.uid,
              ...userData
            } as User;
            
            // Atualiza o status online para true
            await updateDoc(userRef, {
              isOnline: true,
              lastSeen: serverTimestamp()
            });
            
            setUser(userWithId);
          } else {
            console.error('Documento do usuário não encontrado');
            setUser(null);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          setUser(null);
        }
      } else {
        // Se o usuário estiver logado, atualiza o status para offline antes de limpar
        if (user?.id) {
          try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
              isOnline: false,
              lastSeen: serverTimestamp()
            });
          } catch (error) {
            console.error('Erro ao atualizar status offline:', error);
          }
        }
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', userCredential.user.uid);
      
      // Atualiza o status online para true no login
      await updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp()
      });
      
      let userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // Criar dados do usuário se não existir
        const defaultUserData = {
          name: email.split('@')[0],
          email: email,
          level: 1, // Aluno por padrão
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), defaultUserData);
        userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      }
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userWithId = {
          id: userCredential.user.uid,
          ...userData
        } as User;
        
        // Se for um professor (nível 2), armazenar a senha temporariamente
        if (userData.level === 2) {
          sessionStorage.setItem('trainerPassword', password);
        }
        
        setUser(userWithId);
      } else {
        throw new Error('Dados do usuário não encontrados');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const generateTrainerCode = () => {
    const prefix = 'PT';
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${randomNum}`;
  };

  const register = async (email: string, password: string, name: string, role: string, trainerId?: string) => {
    try {
      console.log('Iniciando registro:', { email, name, role, trainerId });
      
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Usuário criado no Firebase Auth:', user.uid);

      // Preparar dados do usuário
      const userData = {
        id: user.uid,
        email: user.email,
        name,
        level: role === 'trainer' ? 2 : 1,
        isActive: true,
        createdAt: new Date(),
        isOnline: true,
        lastSeen: new Date(),
        ...(role === 'trainer' && { 
          trainerCode: generateTrainerCode(),
          students: [],
          maxStudents: 5
        }),
        ...(role === 'student' && trainerId && { 
          trainerId, 
          pendingTrainerApproval: true
        })
      };

      console.log('Criando documento do usuário:', userData);

      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('Documento do usuário criado com sucesso');

      // Se for um aluno com professor, tentar atualizar a lista de alunos do professor
      if (role === 'student' && trainerId) {
        try {
          console.log('Atualizando lista de alunos do professor:', trainerId);
          const trainerRef = doc(db, 'users', trainerId);
          const trainerDoc = await getDoc(trainerRef);
          
          if (trainerDoc.exists()) {
            const trainerData = trainerDoc.data();
            const students = trainerData.students || [];
            
            if (!students.includes(user.uid)) {
              await updateDoc(trainerRef, {
                students: arrayUnion(user.uid)
              });
              console.log('Lista de alunos do professor atualizada');
            } else {
              console.log('Aluno já está na lista do professor');
            }
          } else {
            console.warn('Professor não encontrado');
          }
        } catch (error) {
          console.warn('Não foi possível atualizar a lista de alunos do professor:', error);
          // Não interrompe o fluxo de registro se falhar ao atualizar a lista de alunos
        }
      }

      setUser(userData);
      console.log('Registro concluído com sucesso');
      return userData;
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user?.id) {
        const userRef = doc(db, 'users', user.id);
        // Atualiza o status online para false no logout
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      }
      // Remover a senha do professor do sessionStorage
      sessionStorage.removeItem('trainerPassword');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    // Implementation of updateUser method
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isLoading: loading, 
      login, 
      logout, 
      register,
      setUser,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
