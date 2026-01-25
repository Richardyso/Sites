// ===== BANCO DE DADOS LOCAL (JSON) =====
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Diretório para armazenar os dados
const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const RESET_TOKENS_FILE = path.join(DATA_DIR, 'resetTokens.json');

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
        case 'info':
            color = colors.blue;
            emoji = '📘';
            break;
        case 'success':
            color = colors.green;
            emoji = '✅';
            break;
        case 'warning':
            color = colors.yellow;
            emoji = '⚠️';
            break;
        case 'error':
            color = colors.red;
            emoji = '❌';
            break;
        case 'database':
            color = colors.cyan;
            emoji = '💾';
            break;
        case 'auth':
            color = colors.magenta;
            emoji = '🔐';
            break;
    }
    
    console.log(`${color}[${timestamp}] ${emoji}  ${message}${colors.reset}`);
    if (data) {
        console.log(colors.bright + '    └─ ' + colors.reset + JSON.stringify(data, null, 2));
    }
}

// Garantir que o diretório de dados existe
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(path.join(DATA_DIR, 'users'), { recursive: true });
    } catch (error) {
        log('error', 'Erro ao criar diretório de dados', error);
    }
}

// Carregar dados de um arquivo JSON
async function loadData(filePath, defaultData = {}) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Arquivo não existe, criar com dados padrão
            await saveData(filePath, defaultData);
            return defaultData;
        }
        log('error', `Erro ao carregar ${filePath}`, error);
        return defaultData;
    }
}

// Salvar dados em um arquivo JSON
async function saveData(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        log('database', `Dados salvos em ${path.basename(filePath)}`);
    } catch (error) {
        log('error', `Erro ao salvar ${filePath}`, error);
        throw error;
    }
}

// ===== FUNÇÕES DE USUÁRIO =====

// Criar novo usuário
async function createUser(userData) {
    await ensureDataDir();
    
    const users = await loadData(USERS_FILE, {});
    const userId = crypto.randomBytes(16).toString('hex');
    
    const newUser = {
        uid: userId,
        ...userData,
        totalPoints: 0,
        currentLevel: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    users[userId] = newUser;
    await saveData(USERS_FILE, users);
    
    // Criar diretório do usuário para subcoleções
    const userDir = path.join(DATA_DIR, 'users', userId);
    await fs.mkdir(userDir, { recursive: true });
    
    // Criar arquivos vazios para subcoleções
    await saveData(path.join(userDir, 'goals.json'), []);
    await saveData(path.join(userDir, 'missions.json'), []);
    await saveData(path.join(userDir, 'pointsHistory.json'), []);
    await saveData(path.join(userDir, 'rewards.json'), []);
    
    log('success', `Usuário criado: ${newUser.email}`, { uid: userId });
    
    return newUser;
}

// Buscar usuário por email
async function getUserByEmail(email) {
    const users = await loadData(USERS_FILE, {});
    const user = Object.values(users).find(u => u.email === email);
    
    if (user) {
        log('database', `Usuário encontrado: ${email}`);
    } else {
        log('warning', `Usuário não encontrado: ${email}`);
    }
    
    return user;
}

// Buscar usuário por ID
async function getUserById(userId) {
    const users = await loadData(USERS_FILE, {});
    return users[userId] || null;
}

// Atualizar usuário
async function updateUser(userId, updates) {
    const users = await loadData(USERS_FILE, {});
    
    if (!users[userId]) {
        log('error', `Usuário não encontrado: ${userId}`);
        return null;
    }
    
    users[userId] = {
        ...users[userId],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    await saveData(USERS_FILE, users);
    log('success', `Usuário atualizado: ${userId}`);
    
    return users[userId];
}

// Obter todos os usuários
async function getAllUsers() {
    const users = await loadData(USERS_FILE, {});
    return Object.values(users);
}

// Deletar usuário
async function deleteUser(userId) {
    const users = await loadData(USERS_FILE, {});
    
    if (!users[userId]) {
        log('error', `Usuário não encontrado para deletar: ${userId}`);
        return false;
    }
    
    const userEmail = users[userId].email;
    delete users[userId];
    await saveData(USERS_FILE, users);
    
    // Remover diretório do usuário
    const userDir = path.join(DATA_DIR, 'users', userId);
    try {
        await fs.rm(userDir, { recursive: true });
    } catch (error) {
        log('warning', `Não foi possível remover diretório do usuário: ${userId}`);
    }
    
    log('success', `Usuário deletado: ${userEmail}`, { uid: userId });
    return true;
}

// ===== FUNÇÕES DE SESSÃO =====

// Criar sessão
async function createSession(userId) {
    const sessions = await loadData(SESSIONS_FILE, {});
    const token = crypto.randomBytes(32).toString('hex');
    
    sessions[token] = {
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };
    
    await saveData(SESSIONS_FILE, sessions);
    log('auth', `Sessão criada para usuário: ${userId}`);
    
    return token;
}

// Validar sessão
async function validateSession(token) {
    const sessions = await loadData(SESSIONS_FILE, {});
    const session = sessions[token];
    
    if (!session) {
        log('warning', 'Token inválido');
        return null;
    }
    
    if (new Date(session.expiresAt) < new Date()) {
        log('warning', 'Token expirado');
        delete sessions[token];
        await saveData(SESSIONS_FILE, sessions);
        return null;
    }
    
    log('auth', `Sessão válida para usuário: ${session.userId}`);
    return session.userId;
}

// Deletar sessão
async function deleteSession(token) {
    const sessions = await loadData(SESSIONS_FILE, {});
    
    if (sessions[token]) {
        delete sessions[token];
        await saveData(SESSIONS_FILE, sessions);
        log('auth', 'Sessão removida');
    }
}

// ===== FUNÇÕES DE SUBCOLEÇÕES =====

// Função genérica para subcoleções
async function getSubcollection(userId, collectionName) {
    const filePath = path.join(DATA_DIR, 'users', userId, `${collectionName}.json`);
    return await loadData(filePath, []);
}

async function addToSubcollection(userId, collectionName, item) {
    const filePath = path.join(DATA_DIR, 'users', userId, `${collectionName}.json`);
    const items = await loadData(filePath, []);
    
    const newItem = {
        id: crypto.randomBytes(16).toString('hex'),
        ...item,
        createdAt: new Date().toISOString()
    };
    
    items.push(newItem);
    await saveData(filePath, items);
    
    log('database', `Item adicionado em ${collectionName}`, { userId, itemId: newItem.id });
    
    return newItem;
}

async function updateSubcollectionItem(userId, collectionName, itemId, updates) {
    const filePath = path.join(DATA_DIR, 'users', userId, `${collectionName}.json`);
    const items = await loadData(filePath, []);
    
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) {
        log('error', `Item não encontrado: ${itemId}`);
        return null;
    }
    
    items[index] = {
        ...items[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    await saveData(filePath, items);
    log('success', `Item atualizado em ${collectionName}`, { userId, itemId });
    
    return items[index];
}

async function deleteFromSubcollection(userId, collectionName, itemId) {
    const filePath = path.join(DATA_DIR, 'users', userId, `${collectionName}.json`);
    const items = await loadData(filePath, []);
    
    const filteredItems = items.filter(item => item.id !== itemId);
    
    if (filteredItems.length === items.length) {
        log('warning', `Item não encontrado para deletar: ${itemId}`);
        return false;
    }
    
    await saveData(filePath, filteredItems);
    log('success', `Item deletado de ${collectionName}`, { userId, itemId });
    
    return true;
}

// ===== FUNÇÕES ESPECÍFICAS =====

// Adicionar pontos ao usuário
async function addPoints(userId, points, action) {
    const currentUser = await getUserById(userId);
    const currentPoints = currentUser.totalPoints || 0;
    const newTotal = currentPoints + points;
    
    const user = await updateUser(userId, {
        totalPoints: newTotal
    });
    
    // Adicionar ao histórico
    await addToSubcollection(userId, 'pointsHistory', {
        action,
        points,
        type: points > 0 ? 'earned' : 'spent',
        total: newTotal,
        date: new Date().toISOString()
    });
    
    log('success', `${Math.abs(points)} pontos ${points > 0 ? 'adicionados' : 'deduzidos'}`, { 
        userId, 
        action,
        novoTotal: newTotal 
    });
    
    return user;
}

// ===== FUNÇÕES DE RESET DE SENHA =====

// Gerar código de 6 dígitos
function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Criar token de reset de senha
async function createResetToken(email) {
    const tokens = await loadData(RESET_TOKENS_FILE, {});
    const code = generateResetCode();
    
    // Expiração em 15 minutos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    tokens[email] = {
        code,
        email,
        createdAt: new Date().toISOString(),
        expiresAt,
        attempts: 0
    };
    
    await saveData(RESET_TOKENS_FILE, tokens);
    log('auth', `Token de reset criado para: ${email}`);
    
    return code;
}

// Validar código de reset
async function validateResetCode(email, code) {
    const tokens = await loadData(RESET_TOKENS_FILE, {});
    const tokenData = tokens[email];
    
    if (!tokenData) {
        log('warning', 'Token não encontrado para email:', email);
        return { valid: false, error: 'Código não encontrado. Solicite um novo.' };
    }
    
    // Verificar expiração
    if (new Date(tokenData.expiresAt) < new Date()) {
        delete tokens[email];
        await saveData(RESET_TOKENS_FILE, tokens);
        log('warning', 'Token expirado para:', email);
        return { valid: false, error: 'Código expirado. Solicite um novo.' };
    }
    
    // Verificar tentativas (máximo 5)
    if (tokenData.attempts >= 5) {
        delete tokens[email];
        await saveData(RESET_TOKENS_FILE, tokens);
        log('warning', 'Muitas tentativas para:', email);
        return { valid: false, error: 'Muitas tentativas. Solicite um novo código.' };
    }
    
    // Verificar código
    if (tokenData.code !== code) {
        tokens[email].attempts += 1;
        await saveData(RESET_TOKENS_FILE, tokens);
        log('warning', 'Código incorreto para:', email);
        return { valid: false, error: 'Código incorreto. Tente novamente.' };
    }
    
    log('success', 'Código validado para:', email);
    return { valid: true };
}

// Consumir token de reset (após usar)
async function consumeResetToken(email) {
    const tokens = await loadData(RESET_TOKENS_FILE, {});
    
    if (tokens[email]) {
        delete tokens[email];
        await saveData(RESET_TOKENS_FILE, tokens);
        log('auth', 'Token consumido para:', email);
    }
}

// Limpar tokens expirados
async function cleanExpiredTokens() {
    const tokens = await loadData(RESET_TOKENS_FILE, {});
    const now = new Date();
    let cleaned = 0;
    
    for (const email of Object.keys(tokens)) {
        if (new Date(tokens[email].expiresAt) < now) {
            delete tokens[email];
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        await saveData(RESET_TOKENS_FILE, tokens);
        log('database', `${cleaned} tokens expirados removidos`);
    }
}

// Inicializar banco de dados
async function initDatabase() {
    await ensureDataDir();
    log('success', 'Banco de dados local inicializado');
    
    // Limpar tokens expirados
    await cleanExpiredTokens();
    
    // Criar usuário de teste se não existir nenhum
    const users = await loadData(USERS_FILE, {});
    if (Object.keys(users).length === 0) {
        log('info', 'Criando usuário de teste...');
        await createUser({
            name: 'Usuária Teste',
            email: 'teste@glowmeclub.com',
            password: crypto.createHash('sha256').update('senha123').digest('hex'),
            preferredColor: '#DDD6FE',
            focusArea: 'Mental'
        });
    }
}

module.exports = {
    log,
    initDatabase,
    createUser,
    getUserByEmail,
    getUserById,
    updateUser,
    getAllUsers,
    deleteUser,
    createSession,
    validateSession,
    deleteSession,
    getSubcollection,
    addToSubcollection,
    updateSubcollectionItem,
    deleteFromSubcollection,
    addPoints,
    // Funções de reset de senha
    createResetToken,
    validateResetCode,
    consumeResetToken,
    colors
};