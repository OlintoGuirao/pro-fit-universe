import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, Timestamp, arrayUnion, getDoc, setDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { Post } from '@/types/post';

// Buscar mensagens entre dois usuários
export async function getMessagesBetweenUsers(userId1: string, userId2: string) {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('senderId', 'in', [userId1, userId2]),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      isRead: data.isRead,
      createdAt: data.createdAt?.toDate()
    };
  });

  // Filtrar mensagens localmente
  return messages.filter(msg => 
    (msg.senderId === userId1 && msg.receiverId === userId2) ||
    (msg.senderId === userId2 && msg.receiverId === userId1)
  );
}

// Buscar alunos de um professor
export async function getStudentsByTrainer(trainerId: string) {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('trainerId', '==', trainerId),
    where('level', '==', 1)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Buscar professor de um aluno
export async function getTrainerByStudent(studentId: string) {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('students', 'array-contains', studentId),
    where('level', '==', 2)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Enviar mensagem
export async function sendMessage(senderId: string, receiverId: string, content: string) {
  try {
    const messagesRef = collection(db, 'messages');
    const messageData = {
      senderId,
      receiverId,
      content,
      isRead: false,
      createdAt: Timestamp.now()
    };

    console.log('Enviando mensagem com dados:', messageData);

    const docRef = await addDoc(messagesRef, messageData);
    return {
      id: docRef.id,
      ...messageData
    };
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

// Marcar mensagens como lidas
export async function markMessagesAsRead(senderId: string, receiverId: string) {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '==', senderId),
      where('receiverId', '==', receiverId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    // Não vamos lançar o erro para não interromper o fluxo principal
  }
}

// Buscar contagem de mensagens não lidas por aluno (para professor)
export async function getUnreadMessagesCount(trainerId: string) {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('receiverId', '==', trainerId),
    where('isRead', '==', false)
  );

  const snapshot = await getDocs(q);
  const counts: Record<string, number> = {};

  snapshot.docs.forEach(doc => {
    const senderId = doc.data().senderId;
    counts[senderId] = (counts[senderId] || 0) + 1;
  });

  return counts;
}

// Buscar contagem de mensagens não lidas (para aluno)
export async function getUnreadMessagesCountForStudent(studentId: string, trainerId: string) {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('senderId', '==', trainerId),
    where('receiverId', '==', studentId),
    where('isRead', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Associar aluno ao professor
export async function associateStudentWithTrainer(studentId: string, trainerId: string) {
  try {
    console.log('Iniciando associação:', { studentId, trainerId });

    // Verificar se o aluno existe
    const studentRef = doc(db, 'users', studentId);
    const studentDoc = await getDoc(studentRef);
    
    console.log('Verificando aluno:', {
      exists: studentDoc.exists(),
      data: studentDoc.exists() ? studentDoc.data() : null
    });
    
    if (!studentDoc.exists()) {
      // Tentar buscar na coleção auth
      const authStudentRef = doc(db, 'auth', studentId);
      const authStudentDoc = await getDoc(authStudentRef);
      
      console.log('Verificando aluno na coleção auth:', {
        exists: authStudentDoc.exists(),
        data: authStudentDoc.exists() ? authStudentDoc.data() : null
      });
      
      if (!authStudentDoc.exists()) {
        throw new Error('Aluno não encontrado em nenhuma coleção');
      }
      
      // Se encontrou na auth, criar na coleção users
      const studentData = {
        ...authStudentDoc.data(),
        level: 1,
        trainerId: trainerId,
        createdAt: new Date()
      };
      
      console.log('Criando aluno na coleção users:', studentData);
      await setDoc(studentRef, studentData);
      console.log('Aluno criado na coleção users');
    } else {
      // Atualizar o documento do aluno existente
      const updateData = {
        trainerId: trainerId,
        level: 1,
        updatedAt: new Date()
      };
      
      console.log('Atualizando aluno existente:', updateData);
      await updateDoc(studentRef, updateData);
      console.log('Documento do aluno atualizado');
    }

    // Verificar se o professor existe
    const trainerRef = doc(db, 'users', trainerId);
    const trainerDoc = await getDoc(trainerRef);
    
    console.log('Verificando professor:', {
      exists: trainerDoc.exists(),
      data: trainerDoc.exists() ? trainerDoc.data() : null
    });
    
    if (!trainerDoc.exists()) {
      // Tentar buscar na coleção auth
      const authTrainerRef = doc(db, 'auth', trainerId);
      const authTrainerDoc = await getDoc(authTrainerRef);
      
      console.log('Verificando professor na coleção auth:', {
        exists: authTrainerDoc.exists(),
        data: authTrainerDoc.exists() ? authTrainerDoc.data() : null
      });
      
      if (!authTrainerDoc.exists()) {
        throw new Error('Professor não encontrado em nenhuma coleção');
      }
      
      // Se encontrou na auth, criar na coleção users
      const trainerData = {
        ...authTrainerDoc.data(),
        level: 2,
        students: [studentId],
        createdAt: new Date()
      };
      
      console.log('Criando professor na coleção users:', trainerData);
      await setDoc(trainerRef, trainerData);
      console.log('Professor criado na coleção users');
    } else {
      try {
        // Primeiro, vamos verificar se o campo students existe
        const trainerData = trainerDoc.data();
        console.log('Dados atuais do professor:', trainerData);

        // Se não existir o campo students, vamos criar o documento novamente
        if (!trainerData.students) {
          const newTrainerData = {
            ...trainerData,
            students: [studentId],
            level: 2,
            updatedAt: new Date()
          };
          console.log('Criando novo documento do professor com campo students:', newTrainerData);
          await setDoc(trainerRef, newTrainerData);
          console.log('Documento do professor atualizado com campo students');
        } else {
          // Se existir, apenas atualizamos o array
          const updateData = {
            students: arrayUnion(studentId),
            level: 2,
            updatedAt: new Date()
          };
          console.log('Atualizando array de students do professor:', updateData);
          await updateDoc(trainerRef, updateData);
          console.log('Array de students do professor atualizado');
        }
      } catch (updateError) {
        console.error('Erro ao atualizar professor:', updateError);
        if (updateError instanceof Error) {
          console.error('Mensagem de erro:', updateError.message);
          console.error('Stack trace:', updateError.stack);
        }
        throw new Error(`Erro ao atualizar professor: ${updateError instanceof Error ? updateError.message : 'Erro desconhecido'}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Erro detalhado ao associar aluno ao professor:', error);
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message);
      console.error('Stack trace:', error.stack);
      throw new Error(`Erro ao associar aluno ao professor: ${error.message}`);
    }
    throw error;
  }
}

// Escutar mensagens em tempo real
export function subscribeToMessages(userId1: string, userId2: string, callback: (messages: any[]) => void) {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('senderId', 'in', [userId1, userId2]),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        isRead: data.isRead,
        createdAt: data.createdAt?.toDate()
      };
    });

    // Filtrar mensagens localmente
    const filteredMessages = messages.filter(msg => 
      (msg.senderId === userId1 && msg.receiverId === userId2) ||
      (msg.senderId === userId2 && msg.receiverId === userId1)
    );

    callback(filteredMessages);
  });
}

// Funções para o Feed Social
export async function createPost(
  authorId: string,
  content: string,
  type: 'progress' | 'workout' | 'diet' | 'general',
  images: string[] = [],
  videos: string[] = []
) {
  try {
    const postsRef = collection(db, 'posts');
    const postData = {
      authorId,
      content,
      type,
      images,
      videos,
      likes: [],
      comments: [],
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(postsRef, postData);
    return {
      id: docRef.id,
      ...postData
    };
  } catch (error) {
    console.error('Erro ao criar post:', error);
    throw error;
  }
}

export async function getPosts() {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const posts = await Promise.all(snapshot.docs.map(async docSnapshot => {
      const postData = docSnapshot.data();
      const authorDocRef = doc(db, 'users', postData.authorId);
      const authorDoc = await getDoc(authorDocRef);
      const authorData = authorDoc.data();
      
      return {
        id: docSnapshot.id,
        ...postData,
        authorName: authorData?.name || 'Usuário',
        authorAvatar: authorData?.avatar,
        authorRole: authorData?.level === 1 ? 'Aluno' : authorData?.level === 2 ? 'Professor' : 'Admin',
        createdAt: postData.createdAt?.toDate()
      };
    }));

    return posts;
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    throw error;
  }
}

export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    const posts = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const postData = docSnapshot.data();
        const authorDocRef = doc(db, 'users', postData.authorId);
        const authorDoc = await getDoc(authorDocRef);
        const authorData = authorDoc.data();

        return {
          id: docSnapshot.id,
          ...postData,
          createdAt: postData.createdAt,
          author: {
            id: postData.authorId,
            name: authorData?.name || 'Usuário',
            avatar: authorData?.avatar || '',
            role: authorData?.level === 1 ? 'Aluno' : authorData?.level === 2 ? 'Professor' : 'Admin'
          }
        };
      })
    );

    callback(posts);
  });
};

export async function likePost(postId: string, userId: string) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post não encontrado');
    }

    const postData = postDoc.data();
    const likes = postData.likes || [];
    
    if (likes.includes(userId)) {
      // Remove o like se o usuário já curtiu
      await updateDoc(postRef, {
        likes: likes.filter((id: string) => id !== userId)
      });
    } else {
      // Adiciona o like se o usuário ainda não curtiu
      await updateDoc(postRef, {
        likes: arrayUnion(userId)
      });
    }
  } catch (error) {
    console.error('Erro ao curtir post:', error);
    throw error;
  }
}

export async function addComment(postId: string, authorId: string, content: string) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post não encontrado');
    }

    const authorDoc = await getDoc(doc(db, 'users', authorId));
    const authorData = authorDoc.data();

    const comment = {
      id: crypto.randomUUID(),
      authorId,
      authorName: authorData?.name || 'Usuário',
      content,
      createdAt: Timestamp.now()
    };

    await updateDoc(postRef, {
      comments: arrayUnion(comment)
    });

    return comment;
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    throw error;
  }
}
