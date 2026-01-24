// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
const { auth } = require('../config/firebase-admin');

/**
 * Middleware para verificar token JWT do Firebase
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
            // Verificar o token com Firebase Admin
            const decodedToken = await auth.verifyIdToken(token);
            
            // Adicionar informações do usuário ao request
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified,
                name: decodedToken.name,
                picture: decodedToken.picture,
                customClaims: decodedToken.customClaims || {}
            };
            
            // Log para debug em desenvolvimento
            if (process.env.NODE_ENV !== 'production') {
                console.log(`✅ Usuário autenticado: ${req.user.email} (${req.user.uid})`);
            }
            
            next();
            
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            
            // Tratar erros específicos do Firebase
            if (error.code === 'auth/id-token-expired') {
                return res.status(401).json({
                    error: 'Token expirado',
                    message: 'Por favor, faça login novamente'
                });
            }
            
            if (error.code === 'auth/id-token-revoked') {
                return res.status(401).json({
                    error: 'Token revogado',
                    message: 'Por favor, faça login novamente'
                });
            }
            
            if (error.code === 'auth/argument-error') {
                return res.status(401).json({
                    error: 'Token inválido',
                    message: 'O token fornecido é inválido'
                });
            }
            
            // Erro genérico
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
            const decodedToken = await auth.verifyIdToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified,
                name: decodedToken.name,
                picture: decodedToken.picture,
                customClaims: decodedToken.customClaims || {}
            };
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
 * Middleware para verificar claims específicos
 */
const requireClaim = (claimName, claimValue = true) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Não autenticado',
                message: 'Autenticação necessária'
            });
        }
        
        const claims = req.user.customClaims || {};
        
        if (claims[claimName] !== claimValue) {
            return res.status(403).json({
                error: 'Acesso negado',
                message: 'Você não tem permissão para acessar este recurso'
            });
        }
        
        next();
    };
};

/**
 * Middleware para verificar se o email foi verificado
 */
const requireVerifiedEmail = (req, res, next) => {
    if (!req.user || !req.user.emailVerified) {
        return res.status(403).json({
            error: 'Email não verificado',
            message: 'Por favor, verifique seu email antes de continuar'
        });
    }
    
    next();
};

module.exports = {
    verifyToken,
    optionalAuth,
    requireClaim,
    requireVerifiedEmail
};