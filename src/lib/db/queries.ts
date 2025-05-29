import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, onSnapshot, updateDoc, doc, QuerySnapshot, getDoc, arrayUnion } from 'firebase/firestore';

// Função para criar um novo usuário
export const createUser = async (userId: string, userData: any) => {
  try {
    await updateDoc(doc(db, 'users', userId), userData);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
  }
};

// Função para buscar um usuário pelo ID
export const getUser = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
};

// Função para buscar todos os usuários
export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    return userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erro ao buscar todos os usuários:", error);
    return [];
  }
};

// Função para atualizar os dados de um usuário
export const updateUser = async (userId: string, userData: any) => {
  try {
    await updateDoc(doc(db, 'users', userId), userData);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
  }
};

// Função para buscar mensagens entre dois usuários
export const getMessagesBetweenUsers = async (userId1: string, userId2: string, messageLimit: number = 50) => {
  try {
    const messagesCollection = collection(db, 'messages');
    const q = query(
      messagesCollection,
      where('senderId', 'in', [userId1, userId2]),
      where('receiverId', 'in', [userId1, userId2]),
      orderBy('createdAt'),
      limit(messageLimit)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      senderId: doc.data().senderId,
      receiverId: doc.data().receiverId,
      content: doc.data().content,
      isRead: doc.data().isRead,
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
    }));
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return [];
  }
};

// Função para enviar uma mensagem
export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  try {
    await addDoc(collection(db, 'messages'), {
      senderId,
      receiverId,
      content,
      isRead: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  }
};

// Função para marcar mensagens como lidas
export const markMessagesAsRead = async (senderId: string, receiverId: string) => {
  try {
    const messagesCollection = collection(db, 'messages');
    const q = query(
      messagesCollection,
      where('senderId', '==', senderId),
      where('receiverId', '==', receiverId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);

    // Atualizar cada documento encontrado para marcar como lido
    querySnapshot.docs.forEach(async (doc) => {
      await updateDoc(doc.ref, { isRead: true });
    });
  } catch (error) {
    console.error("Erro ao marcar mensagens como lidas:", error);
  }
};

// Função para obter o número de mensagens não lidas para um treinador
export const getUnreadMessagesCount = async (trainerId: string) => {
  try {
    const messagesCollection = collection(db, 'messages');
    const q = query(
      messagesCollection,
      where('receiverId', '==', trainerId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    // Contar mensagens não lidas por senderId
    const unreadCounts: { [key: string]: number } = {};
    querySnapshot.docs.forEach(doc => {
      const senderId = doc.data().senderId;
      unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
    });
    return unreadCounts;
  } catch (error) {
    console.error("Erro ao obter contagem de mensagens não lidas:", error);
    return {};
  }
};

// Função para obter o número de mensagens não lidas para um aluno específico de um treinador
export const getUnreadMessagesCountForStudent = async (studentId: string, trainerId: string) => {
  try {
    const messagesCollection = collection(db, 'messages');
    const q = query(
      messagesCollection,
      where('senderId', '==', trainerId),
      where('receiverId', '==', studentId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Erro ao obter contagem de mensagens não lidas para o aluno:", error);
    return 0;
  }
};

// Função para associar um aluno a um treinador
export const associateStudentWithTrainer = async (studentId: string, trainerId: string) => {
  try {
    // Atualizar o documento do aluno para incluir o trainerId
    const studentRef = doc(db, 'users', studentId);
    await updateDoc(studentRef, { trainerId: trainerId });

    // Atualizar o documento do treinador para incluir o studentId na lista de alunos
    const trainerRef = doc(db, 'users', trainerId);
    await updateDoc(trainerRef, {
      students: arrayUnion(studentId) // Use arrayUnion para evitar duplicatas
    });
  } catch (error) {
    console.error("Erro ao associar aluno ao treinador:", error);
  }
};

// Função para buscar professor de um aluno
export const getTrainerByStudent = async (studentId: string) => {
  try {
    const q = query(collection(db, 'users'), where('students', 'array-contains', studentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Professor',
      avatar: doc.data().avatar || null,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar professor:', error);
    return [];
  }
};

// Função para buscar alunos de um professor
export const getStudentsByTrainer = async (trainerId: string) => {
  try {
    const q = query(collection(db, 'users'), where('trainerId', '==', trainerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Aluno',
      avatar: doc.data().avatar || null,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return [];
  }
};

// Função para escutar mensagens em tempo real entre dois usuários
export const subscribeToMessages = (userId1: string, userId2: string, callback: (messages: any[]) => void) => {
  const messagesCollection = collection(db, 'messages');
  const q = query(
    messagesCollection,
    where('senderId', 'in', [userId1, userId2]),
    where('receiverId', 'in', [userId1, userId2]),
    orderBy('createdAt')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      senderId: doc.data().senderId,
      receiverId: doc.data().receiverId,
      content: doc.data().content,
      isRead: doc.data().isRead,
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
    }));
    callback(messages);
  });

  return unsubscribe;
};

// Add missing social functions for SocialFeed
export const createPost = async (authorId: string, content: string, type: string, images: string[], videos: string[]) => {
  try {
    const postData = {
      authorId,
      content,
      type,
      images: images || [],
      videos: videos || [],
      likes: [],
      comments: [],
      createdAt: new Date(),
    };
    await addDoc(collection(db, 'posts'), postData);
  } catch (error) {
    console.error("Erro ao criar post:", error);
  }
};

export const subscribeToPosts = (callback: (posts: any[]) => void) => {
  const postsCollection = collection(db, 'posts');
  const q = query(postsCollection, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, async (querySnapshot) => {
    const posts = await Promise.all(
      querySnapshot.docs.map(async (docSnapshot) => {
        const postData = docSnapshot.data();
        
        // Get author data
        let authorData = null;
        if (postData.authorId) {
          const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
          if (authorDoc.exists()) {
            authorData = authorDoc.data();
          }
        }

        return {
          id: docSnapshot.id,
          authorId: postData.authorId,
          content: postData.content,
          type: postData.type,
          images: postData.images || [],
          videos: postData.videos || [],
          likes: postData.likes || [],
          comments: postData.comments || [],
          createdAt: postData.createdAt?.toDate() || new Date(),
          author: {
            id: postData.authorId,
            name: authorData?.name || 'Usuário',
            avatar: authorData?.avatar || null,
            role: authorData?.level === 2 ? 'trainer' : 'student'
          }
        };
      })
    );
    
    callback(posts);
  });

  return unsubscribe;
};

export const likePost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayUnion(userId)
    });
  } catch (error) {
    console.error("Erro ao curtir post:", error);
  }
};

export const addComment = async (postId: string, userId: string, content: string) => {
  try {
    const commentData = {
      id: Date.now().toString(),
      authorId: userId,
      authorName: 'Usuário', // This will be updated with actual user data
      content,
      createdAt: new Date()
    };
    
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(commentData)
    });
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
  }
};
