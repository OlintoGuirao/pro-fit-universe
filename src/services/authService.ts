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
      // Impedir criação de administradores via API
      if (userData.level === 3) {
        throw new Error('Não é possível criar contas de administrador através do registro público');
      }

      console.log('Iniciando processo de registro para:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Usuário criado com sucesso no Firebase Auth:', user.uid);
      
      // Criar documento do usuário no Firestore
      const userDoc = {
        id: user.uid,
        email: user.email,
        name: userData.name || '',
        level: userData.level || 1,
        createdAt: new Date(),
        isActive: true,
        ...(userData.level === 1 && {
          goals: userData.goals || [],
          weight: userData.weight,
          height: userData.height
        }),
        ...(userData.level === 2 && {
          students: [],
          maxStudents: userData.maxStudents || 5,
          isVerified: false
        })
      };

      console.log('Criando documento do usuário no Firestore:', userDoc);
      await setDoc(doc(db, 'users', user.uid), userDoc);
      console.log('Documento do usuário criado com sucesso no Firestore');
      
      return { user, userData: userDoc };
    } catch (error) {
      console.error('Erro detalhado no cadastro:', error);
      throw error;
    }
  },

  // Fazer login
  async login(email: string, password: string) {
    try {
      console.log('Iniciando processo de login para:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Autenticação Firebase bem sucedida para:', email);
      
      // Buscar dados do usuário no Firestore
      const userDocRef = doc(db, 'users', user.uid);
      console.log('Buscando documento do usuário no Firestore:', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        console.log('Documento do usuário encontrado no Firestore');
        return { user, userData: userDoc.data() as UserType };
      } else {
        console.log('Documento do usuário não encontrado no Firestore');
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
        
        throw new Error('Dados do usuário não encontrados no Firestore');
      }
    } catch (error) {
      console.error('Erro detalhado no login:', error);
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
