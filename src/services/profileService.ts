import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

const storage = getStorage();
const dbFirestore = getFirestore();

export interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export const profileService = {
  async updateProfile(userId: string, data: UpdateProfileData) {
    try {
      const userRef = doc(dbFirestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }

      // Atualizar no Firestore
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });

      // Se houver alteração no nome, atualizar também no Firebase Auth
      if (data.name && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: data.name
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  async getProfile(userId: string) {
    try {
      const userRef = doc(dbFirestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }

      return userDoc.data();
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  },

  async uploadProfileImage(userId: string, file: File) {
    try {
      // Criar referência para o arquivo no Storage
      const storageRef = ref(storage, `profile_images/${userId}/${file.name}`);
      
      // Upload do arquivo
      await uploadBytes(storageRef, file);
      
      // Obter URL do arquivo
      const downloadURL = await getDownloadURL(storageRef);
      
      // Atualizar URL da foto no Firestore
      const userRef = doc(dbFirestore, 'users', userId);
      await updateDoc(userRef, {
        avatar: downloadURL
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  }
}; 