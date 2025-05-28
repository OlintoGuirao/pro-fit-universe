
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserType } from '@/types/user';

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
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      throw error;
    }
  }
};
