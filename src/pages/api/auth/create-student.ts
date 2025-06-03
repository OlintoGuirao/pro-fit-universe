import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { name, email, password, trainerId } = req.body;

    // Validar campos obrigatórios
    if (!name || !email || !password || !trainerId) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Verificar se o professor existe e é um professor
    const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
    if (!trainerDoc.exists || trainerDoc.data()?.level !== 2) {
      return res.status(400).json({ error: 'Professor não encontrado ou inválido' });
    }

    // Criar usuário no Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Criar documento do usuário no Firestore
    const userData = {
      name,
      email,
      level: 1,
      trainerId,
      createdAt: new Date(),
      active: true,
      progress: 0,
      goal: 'Não definido'
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    return res.status(200).json({ 
      uid: userRecord.uid,
      message: 'Aluno criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar aluno:', error);
    return res.status(500).json({ 
      error: 'Erro ao criar aluno',
      details: error.message
    });
  }
} 