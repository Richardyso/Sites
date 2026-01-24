// ===== ROTAS DE AUTENTICAÇÃO LOCAL =====
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { verifyLocalToken } = require('../middleware/authLocal');
const { sendWelcomeEmail, sendPasswordResetCode, sendPasswordChangedEmail } = require('../utils/email');

// Função para obter o banco de dados dinamicamente (chamada em runtime)
const getDb = () => {
    if (global.db) {
        return global.db;
    }
    return require('../config/database-local');
};

/**
 * POST /api/auth/register
 * Criar nova conta
 */
router.post('/register', async (req, res) => {
    const db = getDb();
    const { createUser, getUserByEmail, createSession, log } = db;
    const isFirebase = global.USE_FIREBASE === true;
    
    try {
        const { name, email, password, preferredColor, focusArea } = req.body;
        
        log('info', `Tentativa de cadastro [${isFirebase ? 'Firebase' : 'JSON'}]`, { email });
        
        // Validações
        if (!name || !email || !password) {
            log('warning', 'Dados incompletos no cadastro');
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'Nome, email e senha são obrigatórios'
            });
        }
        
        if (password.length < 8) {
            log('warning', 'Senha muito curta');
            return res.status(400).json({
                error: 'Senha inválida',
                message: 'A senha deve ter pelo menos 8 caracteres'
            });
        }
        
        // Verificar se usuário já existe
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            log('warning', 'Email já cadastrado', { email });
            return res.status(400).json({
                error: 'Email já cadastrado',
                message: 'Este email já está em uso'
            });
        }
        
        // Criar hash da senha
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        // Criar usuário
        const newUser = await createUser({
            name,
            email,
            password: hashedPassword,
            preferredColor: preferredColor || '#DDD6FE',
            focusArea: focusArea || 'Mental',
            role: 'user'
        });
        
        // Criar sessão
        const token = await createSession(newUser.uid);
        
        log('success', 'Usuário cadastrado com sucesso', { email });
        
        // Enviar email de boas-vindas (não bloqueia o cadastro se falhar)
        sendWelcomeEmail(email, name).catch(err => {
            log('warning', 'Não foi possível enviar email de boas-vindas', err);
        });
        
        res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso',
            token,
            user: {
                uid: newUser.uid,
                name: newUser.name,
                email: newUser.email,
                preferredColor: newUser.preferredColor,
                focusArea: newUser.focusArea,
                totalPoints: newUser.totalPoints,
                currentLevel: newUser.currentLevel,
                role: newUser.role || 'user'
            }
        });
        
    } catch (error) {
        log('error', 'Erro ao cadastrar usuário', error);
        res.status(500).json({
            error: 'Erro ao criar conta',
            message: 'Não foi possível criar sua conta. Tente novamente.'
        });
    }
});

/**
 * POST /api/auth/login
 * Fazer login
 */
router.post('/login', async (req, res) => {
    const db = getDb();
    const { getUserByEmail, createSession, log } = db;
    const isFirebase = global.USE_FIREBASE === true;
    
    try {
        const { email, password } = req.body;
        
        log('info', `Tentativa de login [${isFirebase ? 'Firebase' : 'JSON'}]`, { email });
        
        // Validações
        if (!email || !password) {
            log('warning', 'Dados incompletos no login');
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'Email e senha são obrigatórios'
            });
        }
        
        // Buscar usuário
        const user = await getUserByEmail(email);
        
        if (!user) {
            log('warning', 'Usuário não encontrado', { email });
            return res.status(401).json({
                error: 'Credenciais inválidas',
                message: 'Email ou senha incorretos'
            });
        }
        
        // Verificar senha
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        
        if (user.password !== hashedPassword) {
            log('warning', 'Senha incorreta', { email });
            return res.status(401).json({
                error: 'Credenciais inválidas',
                message: 'Email ou senha incorretos'
            });
        }
        
        // Criar sessão
        const token = await createSession(user.uid);
        
        log('success', 'Login realizado com sucesso', { email });
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            token,
            user: {
                uid: user.uid,
                name: user.name,
                email: user.email,
                preferredColor: user.preferredColor,
                focusArea: user.focusArea,
                totalPoints: user.totalPoints,
                currentLevel: user.currentLevel,
                role: user.role || 'user'
            }
        });
        
    } catch (error) {
        log('error', 'Erro ao fazer login', error);
        res.status(500).json({
            error: 'Erro ao fazer login',
            message: 'Não foi possível fazer login. Tente novamente.'
        });
    }
});

/**
 * POST /api/auth/logout
 * Fazer logout
 */
router.post('/logout', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { invalidateSession, log } = db;
    
    try {
        const token = req.headers.authorization.split('Bearer ')[1];
        
        await invalidateSession(token);
        
        log('info', 'Logout realizado', { userId: req.user.uid });
        
        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
        
    } catch (error) {
        log('error', 'Erro ao fazer logout', error);
        res.status(500).json({
            error: 'Erro ao fazer logout'
        });
    }
});

/**
 * GET /api/auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getUserById, log } = db;
    
    try {
        log('info', 'Dados do usuário solicitados', { userId: req.user.uid });
        
        // Buscar dados completos do usuário
        const user = await getUserById(req.user.uid);
        
        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        // Retornar dados completos sem a senha
        const { password, ...userData } = user;
        
        res.json({
            user: userData
        });
    } catch (error) {
        log('error', 'Erro ao buscar dados do usuário', error);
        res.status(500).json({
            error: 'Erro ao buscar dados do usuário'
        });
    }
});

/**
 * GET /api/auth/test
 * Testar se a API está funcionando
 */
router.get('/test', (req, res) => {
    const db = getDb();
    const { log } = db;
    const isFirebase = global.USE_FIREBASE === true;
    
    log('info', 'Teste de API solicitado');
    
    res.json({
        success: true,
        message: `API funcionando com ${isFirebase ? 'Firebase' : 'banco de dados local'}!`,
        database: isFirebase ? 'Firebase Firestore' : 'JSON Local',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/auth/forgot-password
 * Solicitar código de recuperação de senha
 */
router.post('/forgot-password', async (req, res) => {
    const db = getDb();
    const { getUserByEmail, createResetToken, log } = db;
    
    try {
        const { email } = req.body;
        
        log('info', 'Solicitação de recuperação de senha', { email });
        
        if (!email) {
            return res.status(400).json({
                error: 'Email obrigatório',
                message: 'Por favor, informe seu email'
            });
        }
        
        // Verificar se o usuário existe
        const user = await getUserByEmail(email);
        
        // Sempre retornar sucesso para não revelar se o email existe
        if (!user) {
            log('warning', 'Email não encontrado para reset', { email });
            // Mesmo assim retornar sucesso por segurança
            return res.json({
                success: true,
                message: 'Se este email estiver cadastrado, você receberá um código de recuperação.'
            });
        }
        
        // Criar token de reset
        const resetCode = await createResetToken(email);
        
        // Enviar email com o código
        try {
            await sendPasswordResetCode(email, user.name, resetCode);
            log('success', 'Email de recuperação enviado', { email });
        } catch (emailError) {
            log('error', 'Erro ao enviar email de recuperação', emailError);
            return res.status(500).json({
                error: 'Erro ao enviar email',
                message: 'Não foi possível enviar o email. Tente novamente.'
            });
        }
        
        res.json({
            success: true,
            message: 'Código de recuperação enviado para seu email!'
        });
        
    } catch (error) {
        log('error', 'Erro na recuperação de senha', error);
        res.status(500).json({
            error: 'Erro interno',
            message: 'Não foi possível processar sua solicitação. Tente novamente.'
        });
    }
});

/**
 * POST /api/auth/verify-reset-code
 * Verificar se o código de reset é válido
 */
router.post('/verify-reset-code', async (req, res) => {
    const db = getDb();
    const { validateResetCode, log } = db;
    
    try {
        const { email, code } = req.body;
        
        log('info', 'Verificação de código de reset', { email });
        
        if (!email || !code) {
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'Email e código são obrigatórios'
            });
        }
        
        // Validar código
        const result = await validateResetCode(email, code);
        
        if (!result.valid) {
            return res.status(400).json({
                error: 'Código inválido',
                message: result.error
            });
        }
        
        res.json({
            success: true,
            message: 'Código válido! Agora você pode criar uma nova senha.'
        });
        
    } catch (error) {
        log('error', 'Erro na verificação do código', error);
        res.status(500).json({
            error: 'Erro interno',
            message: 'Não foi possível verificar o código. Tente novamente.'
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Redefinir senha com código válido
 */
router.post('/reset-password', async (req, res) => {
    const db = getDb();
    const { validateResetCode, getUserByEmail, updateUser, consumeResetToken, log } = db;
    
    try {
        const { email, code, newPassword } = req.body;
        
        log('info', 'Tentativa de redefinição de senha', { email });
        
        if (!email || !code || !newPassword) {
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'Email, código e nova senha são obrigatórios'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'Senha inválida',
                message: 'A senha deve ter pelo menos 8 caracteres'
            });
        }
        
        // Validar código novamente
        const result = await validateResetCode(email, code);
        
        if (!result.valid) {
            return res.status(400).json({
                error: 'Código inválido',
                message: result.error
            });
        }
        
        // Buscar usuário
        const user = await getUserByEmail(email);
        
        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado',
                message: 'Não foi possível encontrar sua conta'
            });
        }
        
        // Criar hash da nova senha
        const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
        
        // Atualizar senha
        await updateUser(user.uid, { password: hashedPassword });
        
        // Consumir token
        await consumeResetToken(email);
        
        log('success', 'Senha redefinida com sucesso', { email });
        
        // Enviar email de confirmação
        sendPasswordChangedEmail(email, user.name).catch(err => {
            log('warning', 'Não foi possível enviar email de confirmação', err);
        });
        
        res.json({
            success: true,
            message: 'Senha alterada com sucesso! Você já pode fazer login.'
        });
        
    } catch (error) {
        log('error', 'Erro na redefinição de senha', error);
        res.status(500).json({
            error: 'Erro interno',
            message: 'Não foi possível alterar sua senha. Tente novamente.'
        });
    }
});

module.exports = router;