// ===== BANCO DE DADOS FIREBASE (FIRESTORE) =====
const { firestore, serverTimestamp, increment } = require('./firebase-admin');
const crypto = require('crypto');

// Cores para logs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// Função de log colorido
function log(type, message, data = null) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    let color = colors.reset;
    let emoji = '';
    
    switch(type) {
        case 'info': color = colors.blue; emoji = '📘'; break;
        case 'success': color = colors.green; emoji = '✅'; break;
        case 'warning': color = colors.yellow; emoji = '⚠️'; break;
        case 'error': color = colors.red; emoji = '❌'; break;
        case 'database': color = colors.cyan; emoji = '🔥'; break;
        case 'auth': color = colors.magenta; emoji = '🔐'; break;
    }
    
    console.log(`${color}[${timestamp}] ${emoji}  ${message}${colors.reset}`);
    if (data) {
        console.log(colors.bright + '    └─ ' + colors.reset + JSON.stringify(data, null, 2));
    }
}

// Referências das coleções
const usersRef = firestore.collection('users');
const sessionsRef = firestore.collection('sessions');
const resetTokensRef = firestore.collection('resetTokens');

// ===== FUNÇÕES DE USUÁRIO =====

// Criar novo usuário
async function createUser(userData) {
    const userId = crypto.randomBytes(16).toString('hex');
    
    const newUser = {
        uid: userId,
        ...userData,
        totalPoints: 0,
        currentLevel: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await usersRef.doc(userId).set(newUser);
    
    log('success', `Usuário criado no Firebase: ${newUser.email}`, { uid: userId });
    
    return newUser;
}

// Buscar usuário por email
async function getUserByEmail(email) {
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    
    if (snapshot.empty) {
        log('warning', `Usuário não encontrado: ${email}`);
        return null;
    }
    
    const user = { ...snapshot.docs[0].data() };
    log('database', `Usuário encontrado: ${email}`);
    return user;
}

// Buscar usuário por ID
async function getUserById(userId) {
    const doc = await usersRef.doc(userId).get();
    
    if (!doc.exists) {
        log('warning', `Usuário não encontrado pelo ID: ${userId}`);
        return null;
    }
    
    return { ...doc.data() };
}

// Atualizar usuário
async function updateUser(userId, updateData) {
    const userDoc = await usersRef.doc(userId).get();
    
    if (!userDoc.exists) {
        log('warning', `Usuário não encontrado para atualização: ${userId}`);
        return null;
    }
    
    const updatedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
    };
    
    await usersRef.doc(userId).update(updatedData);
    
    const updatedDoc = await usersRef.doc(userId).get();
    log('success', `Usuário atualizado: ${userId}`);
    
    return { ...updatedDoc.data() };
}

// Listar todos os usuários
async function getAllUsers() {
    const snapshot = await usersRef.get();
    const users = [];
    
    snapshot.forEach(doc => {
        users.push({ ...doc.data() });
    });
    
    return users;
}

// Deletar usuário
async function deleteUser(userId) {
    await usersRef.doc(userId).delete();
    log('success', `Usuário deletado: ${userId}`);
    return true;
}

// ===== FUNÇÕES DE SESSÃO =====

// Criar sessão (compatível com database-local.js - recebe apenas userId, retorna token)
async function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    const session = {
        userId,
        token,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
    };
    
    await sessionsRef.doc(sessionId).set(session);
    log('auth', `🔥 Sessão Firebase criada para usuário: ${userId}`, { sessionId, token: token.substring(0, 10) + '...' });
    
    return token; // Retorna apenas o token (igual ao database-local.js)
}

// Verificar sessão
async function verifySession(token) {
    log('auth', `🔥 Verificando sessão Firebase: ${token.substring(0, 10)}...`);
    
    const snapshot = await sessionsRef.where('token', '==', token).limit(1).get();
    
    if (snapshot.empty) {
        log('warning', '🔥 Sessão não encontrada no Firebase');
        return null;
    }
    
    const session = snapshot.docs[0].data();
    log('auth', `🔥 Sessão encontrada:`, { userId: session.userId, expiresAt: session.expiresAt });
    
    if (new Date(session.expiresAt) < new Date()) {
        log('warning', '🔥 Sessão expirada, removendo...');
        await sessionsRef.doc(snapshot.docs[0].id).delete();
        return null;
    }
    
    return session;
}

// Validar sessão (retorna userId - compatível com database-local.js)
async function validateSession(token) {
    const session = await verifySession(token);
    if (session) {
        log('auth', `🔥 Sessão válida para usuário: ${session.userId}`);
        return session.userId;
    }
    return null;
}

// Invalidar sessão
async function invalidateSession(token) {
    const snapshot = await sessionsRef.where('token', '==', token).limit(1).get();
    
    if (!snapshot.empty) {
        await sessionsRef.doc(snapshot.docs[0].id).delete();
        log('auth', 'Sessão invalidada');
    }
    
    return true;
}

// ===== FUNÇÕES DE RESET DE SENHA =====

function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createResetToken(email) {
    const code = generateResetCode();
    
    const tokenData = {
        email,
        code,
        attempts: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
    
    // Remover tokens antigos do mesmo email
    const oldTokens = await resetTokensRef.where('email', '==', email).get();
    const batch = firestore.batch();
    oldTokens.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    // Criar novo token
    await resetTokensRef.doc(email).set(tokenData);
    
    log('auth', `Token de reset criado para: ${email}`);
    return code;
}

async function validateResetCode(email, code) {
    const doc = await resetTokensRef.doc(email).get();
    
    if (!doc.exists) {
        return { valid: false, error: 'Token não encontrado' };
    }
    
    const tokenData = doc.data();
    
    // Verificar expiração
    if (new Date(tokenData.expiresAt) < new Date()) {
        await resetTokensRef.doc(email).delete();
        return { valid: false, error: 'Código expirado' };
    }
    
    // Verificar tentativas
    if (tokenData.attempts >= 5) {
        await resetTokensRef.doc(email).delete();
        return { valid: false, error: 'Muitas tentativas. Solicite novo código.' };
    }
    
    // Verificar código
    if (tokenData.code !== code) {
        await resetTokensRef.doc(email).update({
            attempts: tokenData.attempts + 1
        });
        return { valid: false, error: 'Código inválido' };
    }
    
    return { valid: true };
}

async function consumeResetToken(email) {
    await resetTokensRef.doc(email).delete();
    log('auth', `Token de reset consumido: ${email}`);
    return true;
}

// ===== FUNÇÕES DE SUBCOLEÇÕES =====

// Goals
async function getUserGoals(userId) {
    const snapshot = await usersRef.doc(userId).collection('goals').get();
    const goals = [];
    snapshot.forEach(doc => goals.push({ id: doc.id, ...doc.data() }));
    return goals;
}

async function addUserGoal(userId, goalData) {
    const goalRef = await usersRef.doc(userId).collection('goals').add({
        ...goalData,
        createdAt: new Date().toISOString()
    });
    return { id: goalRef.id, ...goalData };
}

async function updateUserGoal(userId, goalId, updateData) {
    await usersRef.doc(userId).collection('goals').doc(goalId).update(updateData);
    const doc = await usersRef.doc(userId).collection('goals').doc(goalId).get();
    return { id: doc.id, ...doc.data() };
}

async function deleteUserGoal(userId, goalId) {
    await usersRef.doc(userId).collection('goals').doc(goalId).delete();
    return true;
}

// Missions
async function getUserMissions(userId) {
    const snapshot = await usersRef.doc(userId).collection('missions').get();
    const missions = [];
    snapshot.forEach(doc => missions.push({ id: doc.id, ...doc.data() }));
    return missions;
}

async function updateUserMission(userId, missionId, updateData) {
    await usersRef.doc(userId).collection('missions').doc(missionId).update(updateData);
    return true;
}

// Points History
async function addPointsHistory(userId, entry) {
    await usersRef.doc(userId).collection('pointsHistory').add({
        ...entry,
        createdAt: new Date().toISOString()
    });
    return true;
}

async function getPointsHistory(userId) {
    const snapshot = await usersRef.doc(userId).collection('pointsHistory')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
    
    const history = [];
    snapshot.forEach(doc => history.push({ id: doc.id, ...doc.data() }));
    return history;
}

// Rewards
async function getUserRewards(userId) {
    const snapshot = await usersRef.doc(userId).collection('rewards').get();
    const rewards = [];
    snapshot.forEach(doc => rewards.push({ id: doc.id, ...doc.data() }));
    return rewards;
}

async function addUserReward(userId, rewardData) {
    await usersRef.doc(userId).collection('rewards').add({
        ...rewardData,
        redeemedAt: new Date().toISOString()
    });
    return true;
}

// ===== FUNÇÕES DE SUBCOLEÇÕES (compatibilidade com database-local) =====

async function getSubcollection(userId, collectionName) {
    const snapshot = await usersRef.doc(userId).collection(collectionName).get();
    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    return items;
}

async function addToSubcollection(userId, collectionName, item) {
    const docRef = await usersRef.doc(userId).collection(collectionName).add({
        ...item,
        createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...item };
}

async function updateSubcollectionItem(userId, collectionName, itemId, updates) {
    await usersRef.doc(userId).collection(collectionName).doc(itemId).update({
        ...updates,
        updatedAt: new Date().toISOString()
    });
    
    const doc = await usersRef.doc(userId).collection(collectionName).doc(itemId).get();
    return { id: doc.id, ...doc.data() };
}

async function deleteFromSubcollection(userId, collectionName, itemId) {
    await usersRef.doc(userId).collection(collectionName).doc(itemId).delete();
    return true;
}

async function addPoints(userId, points, action) {
    // Buscar usuário
    const userDoc = await usersRef.doc(userId).get();
    if (!userDoc.exists) {
        log('error', `Usuário não encontrado para adicionar pontos: ${userId}`);
        return false;
    }
    
    const userData = userDoc.data();
    const newTotalPoints = (userData.totalPoints || 0) + points;
    const newLevel = Math.floor(newTotalPoints / 500) + 1;
    
    // Atualizar usuário
    await usersRef.doc(userId).update({
        totalPoints: newTotalPoints,
        currentLevel: Math.min(newLevel, 5),
        updatedAt: new Date().toISOString()
    });
    
    // Adicionar ao histórico
    await usersRef.doc(userId).collection('pointsHistory').add({
        points,
        action,
        totalAfter: newTotalPoints,
        createdAt: new Date().toISOString()
    });
    
    log('success', `Pontos adicionados: ${points} para usuário ${userId}. Total: ${newTotalPoints}`);
    return true;
}

// ===== INICIALIZAÇÃO =====

async function initDatabase() {
    log('info', '=== INICIANDO FIREBASE DATABASE ===');
    
    try {
        // Verificar conexão
        const testDoc = await firestore.collection('_test').doc('connection').get();
        log('success', 'Conexão com Firebase Firestore estabelecida');
        
        // Verificar se existe admin
        const adminSnapshot = await usersRef.where('role', '==', 'admin').limit(1).get();
        
        if (adminSnapshot.empty) {
            log('warning', 'Nenhum admin encontrado, criando admin padrão...');
            
            const adminData = {
                uid: 'admin001',
                name: 'Babi ADM',
                email: 'admin@glowmeclub.com',
                password: '4634dd8a22202721cdec99c588acf23bb47d2b76ea8251b5d0cf491f324ee42e', // Babi@3001
                preferredColor: '#8B5CF6',
                focusArea: 'Mental',
                totalPoints: 99999,
                currentLevel: 5,
                role: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await usersRef.doc('admin001').set(adminData);
            log('success', 'Admin criado com sucesso');
        } else {
            log('success', 'Admin já existe no Firebase');
        }
        
        log('success', '=== FIREBASE DATABASE PRONTO ===');
        return true;
        
    } catch (error) {
        log('error', 'Erro ao inicializar Firebase Database:', error.message);
        throw error;
    }
}

module.exports = {
    // Logs
    log,
    colors,
    
    // Usuários
    createUser,
    getUserByEmail,
    getUserById,
    updateUser,
    getAllUsers,
    deleteUser,
    
    // Sessões
    createSession,
    verifySession,
    validateSession,
    invalidateSession,
    
    // Reset de senha
    createResetToken,
    validateResetCode,
    consumeResetToken,
    
    // Goals
    getUserGoals,
    addUserGoal,
    updateUserGoal,
    deleteUserGoal,
    
    // Missions
    getUserMissions,
    updateUserMission,
    
    // Points
    addPointsHistory,
    getPointsHistory,
    
    // Rewards
    getUserRewards,
    addUserReward,
    
    // Subcoleções (compatibilidade)
    getSubcollection,
    addToSubcollection,
    updateSubcollectionItem,
    deleteFromSubcollection,
    addPoints,
    
    // Init
    initDatabase
};
