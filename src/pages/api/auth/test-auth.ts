import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Teste de autenticação recebido');
  console.log('Método:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  res.status(200).json({ message: 'API de autenticação está funcionando!' });
} 