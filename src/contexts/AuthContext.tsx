
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserType } from '@/types/user';

interface AuthContextType {
  user: UserType | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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

  // Simulated user data for demo
  const mockUsers: UserType[] = [
    {
      id: '1',
      email: 'aluno@test.com',
      name: 'João Aluno',
      level: 1,
      createdAt: new Date(),
      isActive: true,
      trainerId: '2',
      goals: ['Hipertrofia', 'Emagrecimento'],
      weight: 80,
      height: 175
    } as any,
    {
      id: '2',
      email: 'professor@test.com',
      name: 'Maria Personal',
      level: 2,
      createdAt: new Date(),
      isActive: true,
      students: ['1'],
      maxStudents: 5,
      isVerified: true
    } as any,
    {
      id: '3',
      email: 'admin@test.com',
      name: 'Admin Sistema',
      level: 3,
      createdAt: new Date(),
      isActive: true
    } as any
  ];

  useEffect(() => {
    // Simular verificação de sessão
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simular autenticação
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
    } else {
      throw new Error('Usuário ou senha inválidos');
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
