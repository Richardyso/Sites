// ===== ROTAS DE AUTENTICAÇÃO =====
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { sendWelcomeEmail } = require('../utils/email');
const { auth, firestore } = require('../config/firebase-admin');

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