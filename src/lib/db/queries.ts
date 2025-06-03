import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, onSnapshot, updateDoc, doc, QuerySnapshot, getDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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
    console.log('Buscando mensagens entre:', userId1, userId2);
    const messagesCollection = collection(db, 'messages');
    const q = query(
      messagesCollection,
      where('senderId', 'in', [userId1, userId2]),
      where('receiverId', 'in', [userId1, userId2]),
      orderBy('createdAt', 'desc'),
      limit(messageLimit)
    );

    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Mensagem encontrada:', data);
      return {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        isRead: data.isRead,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      };
    });
    console.log('Total de mensagens encontradas:', messages.length);
    return messages;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return [];
  }
};

// Função para enviar uma mensagem
export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  try {
    console.log('Enviando mensagem:', { senderId, receiverId, content });
    
    const messageData = {
      senderId,
      receiverId,
      content,
      isRead: false,
      createdAt: new Date(),
    };

    console.log('Dados da mensagem:', messageData);
    
    const docRef = await addDoc(collection(db, 'messages'), messageData);
    console.log('Mensagem enviada com sucesso, ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...messageData
    };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
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
    // Verificar se o usuário atual é um administrador ou professor
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const userData = userDoc.data();
    if (userData.level !== 3 && userData.level !== 2) {
      throw new Error('Apenas administradores e professores podem associar alunos');
    }

    // Verificar se o aluno existe
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    if (!studentDoc.exists()) {
      throw new Error('Aluno não encontrado');
    }

    const studentData = studentDoc.data();
    if (studentData.level !== 1) {
      throw new Error('Usuário selecionado não é um aluno');
    }

    // Verificar se o professor existe
    const trainerDoc = await getDoc(doc(db, 'users', trainerId));
    if (!trainerDoc.exists()) {
      throw new Error('Professor não encontrado');
    }

    // Verificar se o professor tem nível 2
    const trainerData = trainerDoc.data();
    if (trainerData.level !== 2) {
      throw new Error('Usuário selecionado não é um professor');
    }

    // Verificar se o aluno já está associado a outro professor
    if (studentData.trainerId && studentData.trainerId !== trainerId) {
      throw new Error('Aluno já está associado a outro professor');
    }

    // Atualizar o documento do aluno com o ID do professor
    await updateDoc(doc(db, 'users', studentId), {
      trainerId: trainerId,
      updatedAt: new Date()
    });

    // Atualizar a lista de alunos do professor usando arrayUnion
    await updateDoc(doc(db, 'users', trainerId), {
      students: arrayUnion(studentId),
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Erro ao associar aluno ao treinador:', error);
    throw error;
  }
};

// Função para buscar professor de um aluno
export const getTrainerByStudent = async (studentId: string) => {
  try {
    // Primeiro, buscar o documento do aluno para obter o trainerId
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    if (!studentDoc.exists()) {
      console.error('Aluno não encontrado');
      return [];
    }

    const studentData = studentDoc.data();
    const trainerId = studentData.trainerId;

    if (!trainerId) {
      console.log('Aluno não tem professor vinculado');
      return [];
    }

    // Buscar o documento do professor
    const trainerDoc = await getDoc(doc(db, 'users', trainerId));
    if (!trainerDoc.exists()) {
      console.error('Professor não encontrado');
      return [];
    }

    const trainerData = trainerDoc.data();
    return [{
      id: trainerDoc.id,
      name: trainerData.name || 'Professor',
      avatar: trainerData.avatar || null,
      ...trainerData
    }];
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
  try {
    console.log('Iniciando escuta de mensagens entre:', userId1, userId2);
    
    const messagesCollection = collection(db, 'messages');
    const q = query(
      messagesCollection,
      where('senderId', 'in', [userId1, userId2]),
      where('receiverId', 'in', [userId1, userId2]),
      orderBy('createdAt', 'desc')
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
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        };
      });

      // Ordenar mensagens por data (mais antigas primeiro)
      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      console.log('Novas mensagens recebidas:', messages);
      callback(messages);
    });
  } catch (error) {
    console.error('Erro ao configurar escuta de mensagens:', error);
    return () => {};
  }
};

// Add missing social functions for SocialFeed
export const createPost = async (authorId: string, content: string, type: string, images: string[], videos: string[]) => {
  try {
    console.log('Iniciando criação de post no Firestore:', {
      authorId,
      content,
      type,
      images,
      videos
    });

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

    const docRef = await addDoc(collection(db, 'posts'), postData);
    console.log('Post criado com sucesso, ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erro detalhado ao criar post:", error);
    throw new Error(`Falha ao criar post: ${error.message}`);
  }
};

export const subscribeToPosts = (callback: (posts: any[]) => void) => {
  try {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const posts = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const postData = docSnapshot.data();
            
            // Get author data
            let authorData = null;
            if (postData.authorId) {
              try {
                const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
                if (authorDoc.exists()) {
                  authorData = authorDoc.data();
                }
              } catch (error) {
                console.error("Erro ao buscar dados do autor:", error);
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
                role: authorData?.level === 2 ? 'trainer' : 'student',
                isOnline: authorData?.isOnline || false,
                lastSeen: authorData?.lastSeen || null
              }
            };
          })
        );
        
        callback(posts);
      } catch (error) {
        console.error("Erro ao processar posts:", error);
        callback([]);
      }
    }, (error) => {
      console.error("Erro na subscrição de posts:", error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Erro ao configurar subscrição de posts:", error);
    return () => {};
  }
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

export const createStudent = async (studentData: {
  name: string;
  email: string;
  password: string;
  trainerId: string;
}) => {
  try {
    console.log('Iniciando criação de aluno:', { ...studentData, password: '***' });

    const response = await fetch('/api/auth/create-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar aluno');
    }

    const data = await response.json();
    console.log('Aluno criado com sucesso:', data);

    return data.uid;
  } catch (error) {
    console.error('Erro detalhado ao criar aluno:', error);
    throw error;
  }
};
