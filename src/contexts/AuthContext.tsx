
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService } from '@/services/authService';
import { UserType } from '@/types/user';

interface AuthContextType {
  user: UserType | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<UserType>) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await authService.getCurrentUserData(firebaseUser);
          setUser(userData);
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { userData } = await authService.login(email, password);
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: Partial<UserType>) => {
    setIsLoading(true);
    try {
      const { userData: newUserData } = await authService.register(email, password, userData);
      setUser(newUserData as UserType);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
