// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
const { auth, firestore } = require('../config/firebase-admin');

/**
 * Middleware para verificar token de sessão do Firestore
 */
const verifyToken = async (req, res, next) => {
    try {
        // Obter token do header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token não fornecido',
                message: 'Inclua o token no header Authorization: Bearer <token>'
            });
        }
        
        // Extrair o token
        const token = authHeader.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({
                error: 'Token inválido',
                message: 'Token não pode estar vazio'
            });
        }
        
        try {
            // Buscar sessão no Firestore
            const sessionDoc = await firestore.collection('sessions').doc(token).get();
            
            if (!sessionDoc.exists) {
                return res.status(401).json({
                    error: 'Sessão inválida',
                    message: 'Por favor, faça login novamente'
                });
            }
            
            const sessionData = sessionDoc.data();
            
            // Verificar se a sessão expirou
            if (sessionData.expiresAt && new Date() > sessionData.expiresAt.toDate()) {
                // Deletar sessão expirada
                await firestore.collection('sessions').doc(token).delete();
                return res.status(401).json({
                    error: 'Sessão expirada',
                    message: 'Por favor, faça login novamente'
                });
            }
            
            // Buscar dados do usuário
            const userDoc = await firestore.collection('users').doc(sessionData.userId).get();
            
            if (!userDoc.exists) {
                return res.status(401).json({
                    error: 'Usuário não encontrado',
                    message: 'Por favor, faça login novamente'
                });
            }
            
            const userData = userDoc.data();
            
            // Adicionar informações do usuário ao request
            req.user = {
                uid: userData.uid,
                email: userData.email,
                name: userData.name,
                role: userData.role || 'user',
                profileImage: userData.profileImage,
                preferredColor: userData.preferredColor,
                focusArea: userData.focusArea,
                totalPoints: userData.totalPoints || 0,
                level: userData.level || 1
            };
            
            // Log para debug em desenvolvimento
            if (process.env.NODE_ENV !== 'production') {
                console.log(`✅ Usuário autenticado: ${req.user.email} (${req.user.uid})`);
            }
            
            next();
            
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            
            return res.status(403).json({
                error: 'Token inválido',
                message: 'Não foi possível verificar o token'
            });
        }
        
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({
            error: 'Erro interno',
            message: 'Erro ao processar autenticação'
        });
    }
};

/**
 * Middleware opcional - não bloqueia se não houver token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Sem token, continuar sem usuário
            req.user = null;
            return next();
        }
        
        const token = authHeader.split('Bearer ')[1];
        
        if (!token) {
            req.user = null;
            return next();
        }
        
        try {
            // Buscar sessão no Firestore
            const sessionDoc = await firestore.collection('sessions').doc(token).get();
            
            if (!sessionDoc.exists) {
                req.user = null;
                return next();
            }
            
            const sessionData = sessionDoc.data();
            
            // Verificar expiração
            if (sessionData.expiresAt && new Date() > sessionData.expiresAt.toDate()) {
                req.user = null;
                return next();
            }
            
            // Buscar dados do usuário
            const userDoc = await firestore.collection('users').doc(sessionData.userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                req.user = {
                    uid: userData.uid,
                    email: userData.email,
                    name: userData.name,
                    role: userData.role || 'user',
                    profileImage: userData.profileImage,
                    preferredColor: userData.preferredColor
                };
            } else {
                req.user = null;
            }
        } catch (error) {
            // Token inválido, continuar sem usuário
            req.user = null;
        }
        
        next();
        
    } catch (error) {
        console.error('Erro no middleware opcional:', error);
        req.user = null;
        next();
    }
};

/**
 * Middleware para verificar se é admin
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Não autenticado',
            message: 'Autenticação necessária'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Acesso negado',
            message: 'Apenas administradores podem acessar este recurso'
        });
    }
    
    next();
};

/**
 * Middleware para verificar role específico
 */
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Não autenticado',
                message: 'Autenticação necessária'
            });
        }
        
        if (req.user.role !== role) {
            return res.status(403).json({
                error: 'Acesso negado',
                message: 'Você não tem permissão para acessar este recurso'
            });
        }
        
        next();
    };
};

module.exports = {
    verifyToken,
    optionalAuth,
    requireAdmin,
    requireRole
};