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
  setUser: (user: User | null | ((prev: User | null) => User | null)) => void;
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userWithId = {
              id: firebaseUser.uid,
              ...userData
            } as User;
            
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
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
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
        
        setUser(userWithId);
      } else {
        throw new Error('Dados do usuário não encontrados');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
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
      await signOut(auth);
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
