import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Garantir que a resposta seja sempre JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    console.log('Recebendo requisição para criar usuário');
    console.log('Método:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    if (req.method !== 'POST') {
      console.log('Método não permitido:', req.method);
      return res.status(405).json({ error: 'Método não permitido' });
    }

    // Verificar se o corpo da requisição é válido
    if (!req.body) {
      console.error('Corpo da requisição vazio');
      return res.status(400).json({ error: 'Corpo da requisição vazio' });
    }

    const { email, password, name, level, trainerId } = req.body;

    // Validação dos campos obrigatórios
    if (!email || !password || !name || !level || !trainerId) {
      console.error('Campos obrigatórios faltando:', { 
        email: !!email, 
        password: !!password, 
        name: !!name, 
        level: !!level, 
        trainerId: !!trainerId 
      });
      return res.status(400).json({ 
        error: 'Campos obrigatórios faltando',
        details: {
          email: !email,
          password: !password,
          name: !name,
          level: !level,
          trainerId: !trainerId
        }
      });
    }

    console.log('Criando usuário no Firebase Auth:', { email, name, level, trainerId });

    // Criar usuário no Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    console.log('Usuário criado no Auth:', userRecord.uid);

    // Criar documento do usuário no Firestore
    const userData = {
      name,
      email,
      level,
      trainerId,
      createdAt: new Date(),
      active: true,
      progress: 0,
      goal: 'Não definido'
    };

    console.log('Criando documento no Firestore:', { uid: userRecord.uid, ...userData });

    await adminDb.collection('users').doc(userRecord.uid).set(userData);
    console.log('Documento criado com sucesso no Firestore');

    return res.status(200).json({ 
      uid: userRecord.uid,
      message: 'Usuário criado com sucesso'
    });
  } catch (error) {
    console.error('Erro detalhado ao criar usuário:', error);
    
    // Tratamento específico para erros comuns
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Este e-mail já está em uso' });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'E-mail inválido' });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Senha muito fraca' });
    }

    // Garantir que sempre retornamos um JSON válido
    return res.status(500).json({ 
      error: 'Erro ao criar usuário',
      details: error.message || 'Erro desconhecido',
      code: error.code || 'unknown'
    });
  }
} 