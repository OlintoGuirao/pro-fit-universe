import { useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export const useOnlineStatus = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const userRef = doc(db, 'users', user.id);
    let intervalId: NodeJS.Timeout;

    // Função para atualizar o lastSeen
    const updateLastSeen = async () => {
      try {
        await updateDoc(userRef, {
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('Erro ao atualizar lastSeen:', error);
      }
    };

    // Função para atualizar o status para offline
    const handleOffline = async () => {
      try {
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('Erro ao atualizar status offline:', error);
      }
    };

    // Função para atualizar o status para online
    const handleOnline = async () => {
      try {
        await updateDoc(userRef, {
          isOnline: true,
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('Erro ao atualizar status online:', error);
      }
    };

    // Atualiza o lastSeen a cada 15 segundos
    intervalId = setInterval(updateLastSeen, 15000);

    // Adiciona listeners para eventos de visibilidade e fechamento
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleOnline();
      } else {
        handleOffline();
      }
    };

    const handleBeforeUnload = () => {
      handleOffline();
    };

    // Adiciona os event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleOffline();
    };
  }, [user?.id]);
}; 