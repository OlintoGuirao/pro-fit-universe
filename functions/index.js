/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp();

exports.createStudent = functions.https.onCall(async (data, context) => {
  // Verificar se o usuário está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    );
  }

  // Verificar se o usuário é um professor
  const trainerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const trainerData = trainerDoc.data();

  if (!trainerData || trainerData.level !== 2) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Apenas professores podem criar alunos'
    );
  }

  try {
    const { name, email, password, cpf, phone } = data;

    // Validar dados obrigatórios
    if (!name || !email || !password || !cpf) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Dados incompletos'
      );
    }

    // Verificar se o CPF já está cadastrado
    const cpfDoc = await admin.firestore().collection('users').doc(cpf).get();
    if (cpfDoc.exists) {
      throw new functions.https.HttpsError(
        'already-exists',
        'CPF já cadastrado'
      );
    }

    // Verificar se o email já está cadastrado
    const emailDoc = await admin.firestore().collection('users').doc(email).get();
    if (emailDoc.exists) {
      throw new functions.https.HttpsError(
        'already-exists',
        'Email já cadastrado'
      );
    }

    // Criar usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Preparar dados do aluno
    const studentData = {
      id: userRecord.uid,
      name,
      email,
      cpf,
      phone: phone || null,
      level: 1,
      trainerId: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Salvar dados do aluno no Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set(studentData);

    // Criar referências para busca rápida
    await admin.firestore().collection('users').doc(cpf).set({
      userId: userRecord.uid,
      type: 'cpf'
    });

    await admin.firestore().collection('users').doc(email).set({
      userId: userRecord.uid,
      type: 'email'
    });

    // Atualizar lista de alunos do professor
    await admin.firestore().collection('users').doc(context.auth.uid).update({
      students: admin.firestore.FieldValue.arrayUnion(userRecord.uid)
    });

    return { success: true, studentId: userRecord.uid };
  } catch (error) {
    console.error('Erro ao criar aluno:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao criar aluno: ' + error.message
    );
  }
});
