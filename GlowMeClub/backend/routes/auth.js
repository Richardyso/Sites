// ===== ROTAS DE AUTENTICAÇÃO =====
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { verifyToken } = require('../middleware/authMiddleware');
const { sendWelcomeEmail } = require('../utils/email');
const { auth, firestore, admin } = require('../config/firebase-admin');

// ===== FUNÇÕES AUXILIARES =====

// Gerar token JWT simples para sessão
function generateSessionToken() {
    return crypto.randomBytes(64).toString('hex');
}

// Hash de senha usando crypto nativo (PBKDF2)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

// Verificar senha
function verifyPassword(plainPassword, storedHash) {
    if (!storedHash || !storedHash.includes(':')) {
        return false;
    }
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(plainPassword, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}

/**
 * POST /api/auth/register
 * Registrar novo usuário
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, preferredColor, focusArea } = req.body;
        
        console.log('📝 Tentativa de registro:', email);
        
        // Validações
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Dados inválidos',
                message: 'Nome, email e senha são obrigatórios'
            });
        }
        
        if (password.length < 8) {
            return res.status(400).json({
                error: 'Senha fraca',
                message: 'A senha deve ter pelo menos 8 caracteres'
            });
        }
        
        // Verificar se email já existe
        const existingUser = await firestore
            .collection('users')
            .where('email', '==', email.toLowerCase())
            .get();
        
        if (!existingUser.empty) {
            return res.status(409).json({
                error: 'Email já cadastrado',
                message: 'Este email já está em uso'
            });
        }
        
        // Criar ID único
        const uid = crypto.randomBytes(16).toString('hex');
        
        // Hash da senha
        const hashedPassword = hashPassword(password);
        
        // Criar documento do usuário
        const userData = {
            uid,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            preferredColor: preferredColor || '#8B5CF6',
            focusArea: focusArea || null,
            role: 'user',
            totalPoints: 0,
            level: 1,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await firestore.collection('users').doc(uid).set(userData);
        
        // Gerar token de sessão
        const sessionToken = generateSessionToken();
        
        // Salvar sessão
        await firestore.collection('sessions').doc(sessionToken).set({
            userId: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        });
        
        // Retornar dados (sem senha)
        const { password: _, ...safeUserData } = userData;
        
        console.log('✅ Usuário registrado:', email);
        
        res.status(201).json({
            success: true,
            message: 'Conta criada com sucesso!',
            token: sessionToken,
            user: safeUserData
        });
        
    } catch (error) {
        console.error('❌ Erro no registro:', error);
        res.status(500).json({
            error: 'Erro ao criar conta',
            message: 'Não foi possível criar sua conta. Tente novamente.'
        });
    }
});

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Tentativa de login:', email);
        
        // Validações
        if (!email || !password) {
            return res.status(400).json({
                error: 'Dados inválidos',
                message: 'Email e senha são obrigatórios'
            });
        }
        
        // Buscar usuário pelo email
        const usersSnapshot = await firestore
            .collection('users')
            .where('email', '==', email.toLowerCase().trim())
            .limit(1)
            .get();
        
        if (usersSnapshot.empty) {
            console.log('❌ Usuário não encontrado:', email);
            return res.status(401).json({
                error: 'Credenciais inválidas',
                message: 'Email ou senha incorretos'
            });
        }
        
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        
        // Verificar senha
        const isPasswordValid = verifyPassword(password, userData.password);
        
        if (!isPasswordValid) {
            console.log('❌ Senha incorreta para:', email);
            return res.status(401).json({
                error: 'Credenciais inválidas',
                message: 'Email ou senha incorretos'
            });
        }
        
        // Gerar token de sessão
        const sessionToken = generateSessionToken();
        
        // Salvar sessão
        await firestore.collection('sessions').doc(sessionToken).set({
            userId: userData.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        });
        
        // Atualizar último login
        await firestore.collection('users').doc(userData.uid).update({
            lastLogin: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Retornar dados (sem senha)
        const { password: _, ...safeUserData } = userData;
        
        console.log('✅ Login bem-sucedido:', email);
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            token: sessionToken,
            user: safeUserData
        });
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({
            error: 'Erro ao fazer login',
            message: 'Não foi possível fazer login. Tente novamente.'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout de usuário
 */
router.post('/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            // Deletar sessão
            await firestore.collection('sessions').doc(token).delete();
        }
        
        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({
            error: 'Erro ao fazer logout'
        });
    }
});

/**
 * GET /api/auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        // Buscar dados atualizados do usuário
        const userDoc = await firestore
            .collection('users')
            .doc(req.user.uid)
            .get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        const { password: _, ...safeUserData } = userData;
        
        res.json({
            success: true,
            user: safeUserData
        });
        
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        res.status(500).json({
            error: 'Erro ao obter dados do usuário'
        });
    }
});

/**
 * POST /api/auth/forgot-password
 * Solicitar recuperação de senha
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                error: 'Email é obrigatório'
            });
        }
        
        // Buscar usuário
        const usersSnapshot = await firestore
            .collection('users')
            .where('email', '==', email.toLowerCase().trim())
            .limit(1)
            .get();
        
        // Sempre retornar sucesso por segurança
        if (usersSnapshot.empty) {
            return res.json({
                success: true,
                message: 'Se o email estiver cadastrado, você receberá instruções de recuperação.'
            });
        }
        
        const userData = usersSnapshot.docs[0].data();
        
        // Gerar token de reset
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Salvar token com expiração de 1 hora
        await firestore.collection('resetTokens').doc(resetToken).set({
            userId: userData.uid,
            email: userData.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
        });
        
        // TODO: Enviar email com link de recuperação
        console.log('🔑 Token de reset gerado para:', email, '- Token:', resetToken);
        
        res.json({
            success: true,
            message: 'Se o email estiver cadastrado, você receberá instruções de recuperação.'
        });
        
    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({
            error: 'Erro ao processar solicitação'
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Resetar senha com token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        
        if (!token || !password) {
            return res.status(400).json({
                error: 'Token e nova senha são obrigatórios'
            });
        }
        
        if (password.length < 8) {
            return res.status(400).json({
                error: 'A senha deve ter pelo menos 8 caracteres'
            });
        }
        
        // Buscar token
        const tokenDoc = await firestore.collection('resetTokens').doc(token).get();
        
        if (!tokenDoc.exists) {
            return res.status(400).json({
                error: 'Token inválido ou expirado'
            });
        }
        
        const tokenData = tokenDoc.data();
        
        // Verificar expiração
        if (new Date() > tokenData.expiresAt.toDate()) {
            await firestore.collection('resetTokens').doc(token).delete();
            return res.status(400).json({
                error: 'Token expirado'
            });
        }
        
        // Hash da nova senha
        const hashedPassword = hashPassword(password);
        
        // Atualizar senha
        await firestore.collection('users').doc(tokenData.userId).update({
            password: hashedPassword,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Deletar token usado
        await firestore.collection('resetTokens').doc(token).delete();
        
        // Invalidar todas as sessões do usuário
        const sessionsSnapshot = await firestore
            .collection('sessions')
            .where('userId', '==', tokenData.userId)
            .get();
        
        const batch = firestore.batch();
        sessionsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        res.json({
            success: true,
            message: 'Senha alterada com sucesso! Faça login novamente.'
        });
        
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({
            error: 'Erro ao alterar senha'
        });
    }
});

/**
 * POST /api/auth/welcome-email
 * Enviar email de boas-vindas para novo usuário
 * Protegida - requer autenticação
 */
router.post('/welcome-email', verifyToken, async (req, res) => {
    try {
        const { email, name } = req.body;
        
        // Validar dados
        if (!email || !name) {
            return res.status(400).json({
                error: 'Dados inválidos',
                message: 'Email e nome são obrigatórios'
            });
        }
        
        // Verificar se é o próprio usuário
        if (req.user.email !== email) {
            return res.status(403).json({
                error: 'Acesso negado',
                message: 'Você só pode enviar email de boas-vindas para sua própria conta'
            });
        }
        
        // Enviar email
        await sendWelcomeEmail(email, name);
        
        res.json({
            success: true,
            message: 'Email de boas-vindas enviado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao enviar email de boas-vindas:', error);
        res.status(500).json({
            error: 'Erro ao enviar email',
            message: 'Não foi possível enviar o email de boas-vindas'
        });
    }
});

/**
 * POST /api/auth/verify-token
 * Verificar se um token é válido
 */
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                error: 'Token não fornecido'
            });
        }
        
        try {
            const decodedToken = await auth.verifyIdToken(token);
            
            // Buscar dados adicionais do usuário
            const userDoc = await firestore
                .collection('users')
                .doc(decodedToken.uid)
                .get();
            
            const userData = userDoc.exists ? userDoc.data() : null;
            
            res.json({
                valid: true,
                user: {
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    emailVerified: decodedToken.email_verified,
                    ...userData
                }
            });
            
        } catch (error) {
            res.json({
                valid: false,
                error: error.code || 'invalid-token'
            });
        }
        
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({
            error: 'Erro interno',
            message: 'Erro ao verificar token'
        });
    }
});

/**
 * POST /api/auth/refresh-token
 * Atualizar token (o Firebase faz isso automaticamente no frontend)
 * Esta rota é mais para compatibilidade
 */
router.post('/refresh-token', verifyToken, async (req, res) => {
    try {
        // O Firebase cuida da renovação do token automaticamente
        // Esta rota apenas confirma que o token atual ainda é válido
        res.json({
            success: true,
            message: 'Token válido',
            user: req.user
        });
        
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({
            error: 'Erro ao processar requisição'
        });
    }
});

/**
 * DELETE /api/auth/delete-account
 * Deletar conta do usuário
 * CUIDADO: Esta ação é irreversível
 */
router.delete('/delete-account', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        
        // Criar batch para deletar todos os dados
        const batch = firestore.batch();
        
        // Deletar documento principal do usuário
        batch.delete(firestore.collection('users').doc(uid));
        
        // Deletar subcoleções (goals, missions, pointsHistory, rewards)
        const collections = ['goals', 'missions', 'pointsHistory', 'rewards'];
        
        for (const collectionName of collections) {
            const snapshot = await firestore
                .collection('users')
                .doc(uid)
                .collection(collectionName)
                .get();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        
        // Executar batch
        await batch.commit();
        
        // Deletar usuário do Firebase Auth
        await auth.deleteUser(uid);
        
        res.json({
            success: true,
            message: 'Conta deletada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao deletar conta:', error);
        res.status(500).json({
            error: 'Erro ao deletar conta',
            message: 'Não foi possível deletar sua conta. Tente novamente.'
        });
    }
});

/**
 * GET /api/auth/session
 * Obter informações da sessão atual
 */
router.get('/session', verifyToken, async (req, res) => {
    try {
        const userDoc = await firestore
            .collection('users')
            .doc(req.user.uid)
            .get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        
        res.json({
            user: {
                uid: req.user.uid,
                email: req.user.email,
                emailVerified: req.user.emailVerified,
                ...userData
            }
        });
        
    } catch (error) {
        console.error('Erro ao obter sessão:', error);
        res.status(500).json({
            error: 'Erro ao obter dados da sessão'
        });
    }
});

module.exports = router;