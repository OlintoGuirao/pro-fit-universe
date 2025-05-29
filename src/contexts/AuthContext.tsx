
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  setUser: () => {}
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
    console.log('Iniciando monitoramento de autenticação...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Estado de autenticação alterado:', { firebaseUser });
      
      if (firebaseUser) {
        try {
          console.log('Buscando dados do usuário:', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Dados do usuário encontrados:', userData);
            
            const userWithId = {
              id: firebaseUser.uid,
              ...userData
            } as User;
            
            console.log('Definindo usuário:', userWithId);
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
        console.log('Usuário não autenticado');
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('Desinscrevendo do monitoramento de autenticação');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Iniciando login...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login bem-sucedido:', userCredential.user.uid);
      
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
        console.log('Dados do usuário carregados:', userData);
        
        const userWithId = {
          id: userCredential.user.uid,
          ...userData
        } as User;
        
        console.log('Definindo usuário após login:', userWithId);
        setUser(userWithId);
      } else {
        console.error('Documento do usuário não encontrado após login');
        throw new Error('Dados do usuário não encontrados');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: string) => {
    try {
      console.log('Iniciando registro...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registro bem-sucedido:', userCredential.user.uid);
      
      const userData = {
        name,
        email,
        level: role === 'trainer' ? 2 : 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      const userWithId = {
        id: userCredential.user.uid,
        ...userData
      } as User;
      
      setUser(userWithId);
    } catch (error) {
      console.error('Erro ao fazer registro:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Iniciando logout...');
      await signOut(auth);
      console.log('Logout bem-sucedido');
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isLoading: loading, 
      login, 
      logout, 
      register,
      setUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
