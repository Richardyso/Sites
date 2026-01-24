// ===== CONFIGURAÇÃO DO FIREBASE ADMIN SDK =====
const admin = require('firebase-admin');

console.log('🔥 Inicializando Firebase Admin SDK...');
console.log('   📋 Project ID:', process.env.FIREBASE_PROJECT_ID || 'NÃO DEFINIDO');
console.log('   📧 Client Email:', process.env.FIREBASE_CLIENT_EMAIL ? '✓ Configurado' : '❌ NÃO DEFINIDO');
console.log('   🔑 Private Key:', process.env.FIREBASE_PRIVATE_KEY ? '✓ Configurado' : '❌ NÃO DEFINIDO');

// Verificar se as variáveis de ambiente estão configuradas
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // Usar variáveis de ambiente (funciona em desenvolvimento e produção)
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            }),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
        });
        console.log('🔥 Firebase Admin inicializado com variáveis de ambiente');
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
        throw error;
    }
} else {
    // Fallback - tentar usar arquivo local ou configuração padrão
    try {
        const serviceAccount = require('../../firebase-service-account.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('🔥 Firebase Admin inicializado com service account local');
    } catch (error) {
        console.error('❌ Nenhuma credencial Firebase válida encontrada!');
        console.error('   Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no env.example');
        throw new Error('Firebase credentials not found');
    }
}

// Exportar instâncias
const auth = admin.auth();
const firestore = admin.firestore();

// Configurações do Firestore
firestore.settings({
    timestampsInSnapshots: true,
    ignoreUndefinedProperties: true
});

// ===== FUNÇÕES AUXILIARES =====

/**
 * Verificar se um usuário existe no Firebase Auth
 */
async function userExists(uid) {
    try {
        await auth.getUser(uid);
        return true;
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return false;
        }
        throw error;
    }
}

/**
 * Criar ou atualizar custom claims de um usuário
 */
async function setCustomUserClaims(uid, claims) {
    try {
        await auth.setCustomUserClaims(uid, claims);
        return true;
    } catch (error) {
        console.error('Erro ao definir custom claims:', error);
        return false;
    }
}

/**
 * Obter documento do usuário do Firestore
 */
async function getUserDocument(uid) {
    try {
        const userDoc = await firestore.collection('users').doc(uid).get();
        if (userDoc.exists) {
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar documento do usuário:', error);
        return null;
    }
}

/**
 * Batch write para operações múltiplas
 */
function createBatch() {
    return firestore.batch();
}

/**
 * Timestamp do servidor
 */
function serverTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
}

/**
 * Incrementar valor
 */
function increment(value) {
    return admin.firestore.FieldValue.increment(value);
}

module.exports = {
    admin,
    auth,
    firestore,
    userExists,
    setCustomUserClaims,
    getUserDocument,
    createBatch,
    serverTimestamp,
    increment
};

console.log('✅ Firebase Admin SDK configurado com sucesso!');