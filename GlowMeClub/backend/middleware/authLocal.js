// ===== MIDDLEWARE DE AUTENTICAÇÃO LOCAL =====

// Função para obter o banco de dados dinamicamente (chamada em runtime)
const getDb = () => {
    if (global.db) {
        return global.db;
    }
    // Fallback para database-local
    return require('../config/database-local');
};

/**
 * Middleware para verificar token local
 */
const verifyLocalToken = async (req, res, next) => {
    // Obter banco de dados dinamicamente em cada requisição
    const db = getDb();
    const { verifySession, validateSession, getUserById, log } = db;
    
    const isFirebase = global.USE_FIREBASE === true;
    
    try {
        log('auth', `${req.method} ${req.path} - Verificando autenticação [${isFirebase ? 'Firebase' : 'JSON Local'}]`);
        
        // Obter token do header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            log('warning', 'Token não fornecido');
            return res.status(401).json({
                error: 'Token não fornecido',
                message: 'Inclua o token no header Authorization: Bearer <token>'
            });
        }
        
        // Extrair o token
        const token = authHeader.split('Bearer ')[1];
        
        if (!token) {
            log('warning', 'Token inválido');
            return res.status(401).json({
                error: 'Token inválido',
                message: 'Token não pode estar vazio'
            });
        }
        
        // Validar token - tenta verifySession (Firebase) ou validateSession (local)
        let userId = null;
        
        if (verifySession) {
            log('auth', `Verificando sessão via ${isFirebase ? 'Firebase' : 'Local'}...`);
            const session = await verifySession(token);
            userId = session ? session.userId : null;
            log('auth', `Resultado verifySession: ${userId ? 'Encontrado' : 'Não encontrado'}`);
        } else if (validateSession) {
            log('auth', 'Verificando sessão via validateSession...');
            userId = await validateSession(token);
        }
        
        if (!userId) {
            log('error', `Token inválido ou expirado [${isFirebase ? 'Firebase' : 'JSON Local'}]`);
            return res.status(401).json({
                error: 'Token inválido ou expirado',
                message: 'Por favor, faça login novamente'
            });
        }
        
        // Buscar dados do usuário
        log('auth', `Buscando usuário: ${userId}`);
        const user = await getUserById(userId);
        
        if (!user) {
            log('error', 'Usuário não encontrado');
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        // Adicionar informações do usuário ao request
        req.user = {
            uid: user.uid,
            email: user.email,
            name: user.name,
            role: user.role || 'user'
        };
        
        log('success', `Usuário autenticado: ${user.email}`);
        
        next();
        
    } catch (error) {
        log('error', 'Erro no middleware de autenticação', error);
        return res.status(500).json({
            error: 'Erro interno',
            message: 'Erro ao processar autenticação'
        });
    }
};

/**
 * Middleware para verificar se o usuário é admin
 */
const verifyAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    
    next();
};

module.exports = {
    verifyLocalToken,
    verifyAdmin
};