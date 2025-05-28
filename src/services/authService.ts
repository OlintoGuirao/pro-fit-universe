
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserType } from '@/types/user';

// Usuários de demonstração
const demoUsers = {
  'aluno@test.com': {
    name: 'João Silva',
    level: 1 as const,
    goals: ['Hipertrofia', 'Condicionamento'],
    weight: 75,
    height: 180,
    isActive: true
  },
  'professor@test.com': {
    name: 'Maria Santos',
    level: 2 as const,
    students: [],
    maxStudents: 10,
    isVerified: true,
    isActive: true
  },
  'admin@test.com': {
    name: 'Carlos Admin',
    level: 3 as const,
    isActive: true
  }
};

export const authService = {
  // Cadastrar novo usuário
  async register(email: string, password: string, userData: Partial<UserType>) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Criar documento do usuário no Firestore
      const userDoc = {
        id: user.uid,
        email: user.email,
        name: userData.name || '',
        level: userData.level || 1,
        createdAt: new Date(),
        isActive: true,
        ...userData
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);
      
      return { user, userData: userDoc };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  },

  // Fazer login
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Buscar dados do usuário no Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { user, userData: userDoc.data() as UserType };
      } else {
        // Se o usuário não existe no Firestore, verificar se é um usuário demo
        const demoUserData = demoUsers[email as keyof typeof demoUsers];
        if (demoUserData) {
          console.log('Criando usuário demo no Firestore:', email);
          
          const newUserDoc = {
            id: user.uid,
            email: user.email,
            createdAt: new Date(),
            ...demoUserData
          };

          await setDoc(userDocRef, newUserDoc);
          return { user, userData: newUserDoc as UserType };
        }
        
        throw new Error('Dados do usuário não encontrados');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  // Fazer logout
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  },

  // Buscar dados do usuário atual
  async getCurrentUserData(user: User) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserType;
      }
      
      // Se não encontrar, verificar se é um usuário demo
      const demoUserData = demoUsers[user.email as keyof typeof demoUsers];
      if (demoUserData && user.email) {
        console.log('Criando usuário demo no Firestore durante getCurrentUserData:', user.email);
        
        const newUserDoc = {
          id: user.uid,
          email: user.email,
          createdAt: new Date(),
          ...demoUserData
        };

        await setDoc(userDocRef, newUserDoc);
        return newUserDoc as UserType;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      throw error;
    }
  }
};
