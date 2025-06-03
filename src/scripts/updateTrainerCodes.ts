import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const generateTrainerCode = () => {
  const prefix = 'PT';
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${randomNum}`;
};

export const updateTrainerCodes = async () => {
  try {
    // Buscar todos os professores (nível 2)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('level', '==', 2));
    const querySnapshot = await getDocs(q);

    console.log(`Encontrados ${querySnapshot.size} professores para atualizar`);

    // Atualizar cada professor com um código único
    const updatePromises = querySnapshot.docs.map(async (doc) => {
      const trainerCode = generateTrainerCode();
      await updateDoc(doc.ref, { trainerCode });
      console.log(`Professor ${doc.data().name} atualizado com código: ${trainerCode}`);
    });

    await Promise.all(updatePromises);
    console.log('Todos os professores foram atualizados com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar códigos dos professores:', error);
    throw error;
  }
};

// Executar a atualização
updateTrainerCodes(); 