import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

console.log('Iniciando configuração do Firebase Admin...');

// Verificar variáveis de ambiente
const requiredEnvVars = {
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
};

console.log('Verificando variáveis de ambiente:', {
  projectId: !!requiredEnvVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: !!requiredEnvVars.FIREBASE_CLIENT_EMAIL,
  privateKey: !!requiredEnvVars.FIREBASE_PRIVATE_KEY,
});

// Verificar se todas as variáveis necessárias estão presentes
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Variável de ambiente ${key} não está definida`);
  }
});

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
};

const apps = getApps();

if (!apps.length) {
  try {
    console.log('Inicializando Firebase Admin...');
    initializeApp(firebaseAdminConfig);
    console.log('Firebase Admin inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
    throw error;
  }
} else {
  console.log('Firebase Admin já está inicializado');
}

export const adminAuth = getAuth();
export const adminDb = getFirestore(); 