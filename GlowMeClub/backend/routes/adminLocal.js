// ===== ROTAS DE ADMINISTRAÇÃO =====
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { verifyLocalToken } = require('../middleware/authLocal');

// Função para obter o banco de dados dinamicamente (chamada em runtime)
const getDb = () => {
    if (global.db) {
        return global.db;
    }
    return require('../config/database-local');
};

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
    const db = getDb();
    const { log } = db;
    
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        log('warning', 'Acesso admin negado', { userId: req.user?.uid });
        res.status(403).json({
            error: 'Acesso negado',
            message: 'Apenas administradores podem acessar esta rota'
        });
    }
};

/**
 * GET /api/admin/users
 * Listar todos os usuários
 */
router.get('/users', verifyLocalToken, isAdmin, async (req, res) => {
    const db = getDb();
    const { getAllUsers, log } = db;
    
    try {
        log('info', 'Admin listando usuários', { adminId: req.user.uid });
        
        const users = await getAllUsers();
        
        // Remover senhas antes de enviar
        const sanitizedUsers = users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
        
        res.json({
            success: true,
            users: sanitizedUsers
        });
        
    } catch (error) {
        log('error', 'Erro ao listar usuários', error);
        res.status(500).json({
            error: 'Erro ao listar usuários'
        });
    }
});

/**
 * GET /api/admin/users/:id
 * Obter detalhes de um usuário específico
 */
router.get('/users/:id', verifyLocalToken, isAdmin, async (req, res) => {
    const db = getDb();
    const { getUserById, log } = db;
    
    try {
        const { id } = req.params;
        
        log('info', 'Admin buscando usuário', { adminId: req.user.uid, targetId: id });
        
        const user = await getUserById(id);
        
        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        // Remover senha
        const { password, ...safeUser } = user;
        
        res.json({
            success: true,
            user: safeUser
        });
        
    } catch (error) {
        log('error', 'Erro ao buscar usuário', error);
        res.status(500).json({
            error: 'Erro ao buscar usuário'
        });
    }
});

/**
 * PUT /api/admin/users/:id
 * Atualizar dados de um usuário
 */
router.put('/users/:id', verifyLocalToken, isAdmin, async (req, res) => {
    const db = getDb();
    const { updateUser, log } = db;
    
    try {
        const { id } = req.params;
        const { name, email, totalPoints, focusArea, preferredColor, role } = req.body;
        
        log('info', 'Admin atualizando usuário', { 
            adminId: req.user.uid, 
            targetId: id,
            changes: req.body 
        });
        
        const updatedUser = await updateUser(id, {
            name,
            email,
            totalPoints: parseInt(totalPoints) || 0,
            focusArea,
            preferredColor,
            role,
            updatedAt: new Date().toISOString()
        });
        
        if (!updatedUser) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        // Remover senha
        const { password, ...safeUser } = updatedUser;
        
        log('success', 'Usuário atualizado pelo admin', { targetId: id });
        
        res.json({
            success: true,
            message: 'Usuário atualizado com sucesso',
            user: safeUser
        });
        
    } catch (error) {
        log('error', 'Erro ao atualizar usuário', error);
        res.status(500).json({
            error: 'Erro ao atualizar usuário'
        });
    }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Resetar senha de um usuário
 */
router.post('/users/:id/reset-password', verifyLocalToken, isAdmin, async (req, res) => {
    const db = getDb();
    const { updateUser, log } = db;
    
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                error: 'Senha inválida',
                message: 'A nova senha deve ter pelo menos 8 caracteres'
            });
        }
        
        log('info', 'Admin resetando senha de usuário', { 
            adminId: req.user.uid, 
            targetId: id 
        });
        
        // Hash da nova senha
        const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
        
        const updatedUser = await updateUser(id, {
            password: hashedPassword,
            updatedAt: new Date().toISOString()
        });
        
        if (!updatedUser) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        log('success', 'Senha resetada pelo admin', { targetId: id });
        
        res.json({
            success: true,
            message: 'Senha resetada com sucesso'
        });
        
    } catch (error) {
        log('error', 'Erro ao resetar senha', error);
        res.status(500).json({
            error: 'Erro ao resetar senha'
        });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Excluir um usuário
 */
router.delete('/users/:id', verifyLocalToken, isAdmin, async (req, res) => {
    const db = getDb();
    const { getUserById, deleteUser, log } = db;
    
    try {
        const { id } = req.params;
        
        // Não permitir deletar a si mesmo
        if (id === req.user.uid) {
            return res.status(400).json({
                error: 'Operação não permitida',
                message: 'Você não pode excluir sua própria conta'
            });
        }
        
        // Verificar se o usuário existe e não é admin
        const targetUser = await getUserById(id);
        
        if (!targetUser) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        if (targetUser.role === 'admin') {
            return res.status(400).json({
                error: 'Operação não permitida',
                message: 'Não é possível excluir um administrador'
            });
        }
        
        log('warning', 'Admin excluindo usuário', { 
            adminId: req.user.uid, 
            targetId: id,
            targetEmail: targetUser.email
        });
        
        await deleteUser(id);
        
        log('success', 'Usuário excluído pelo admin', { targetId: id });
        
        res.json({
            success: true,
            message: 'Usuário excluído com sucesso'
        });
        
    } catch (error) {
        log('error', 'Erro ao excluir usuário', error);
        res.status(500).json({
            error: 'Erro ao excluir usuário'
        });
    }
});

/**
 * POST /api/admin/users/:id/grant-points
 * Conceder pontos para um usuário
 */
router.post('/users/:id/grant-points', verifyLocalToken, isAdmin, async (req, res) => {
    const db = getDb();
    const { getUserById, updateUser, addPoints, log } = db;
    
    try {
        const { id } = req.params;
        const { points, reason } = req.body;
        
        // Validar dados
        if (!points || points <= 0) {
            return res.status(400).json({
                error: 'Pontos inválidos',
                message: 'A quantidade de pontos deve ser maior que zero'
            });
        }
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                error: 'Motivo obrigatório',
                message: 'Por favor, informe o motivo da concessão'
            });
        }
        
        // Buscar usuário
        const user = await getUserById(id);
        
        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        log('info', 'Admin concedendo pontos', {
            adminId: req.user.uid,
            adminName: req.user.name,
            targetId: id,
            targetName: user.name,
            points: points,
            reason: reason
        });
        
        // Adicionar pontos e registrar no histórico
        await addPoints(id, points, `Concessão administrativa: ${reason}`);
        
        // Atualizar total de pontos
        const newTotal = (user.totalPoints || 0) + points;
        await updateUser(id, {
            totalPoints: newTotal,
            updatedAt: new Date().toISOString()
        });
        
        log('success', 'Pontos concedidos pelo admin', {
            targetId: id,
            points: points,
            newTotal: newTotal
        });
        
        res.json({
            success: true,
            message: `${points} pontos concedidos com sucesso!`,
            newBalance: newTotal
        });
        
    } catch (error) {
        log('error', 'Erro ao conceder pontos', error);
        res.status(500).json({
            error: 'Erro ao conceder pontos'
        });
    }
});

/**
 * GET /api/users/ranking
 * Obter ranking de usuárias (pública, sem admin)
 */
router.get('/ranking', async (req, res) => {
    const db = getDb();
    const { getAllUsers, log } = db;
    
    try {
        const users = await getAllUsers();
        
        // Filtrar apenas usuárias normais e ordenar por pontos
        const ranking = users
            .filter(u => u.role !== 'admin')
            .map(u => ({
                uid: u.uid,
                name: u.name,
                totalPoints: u.totalPoints || 0,
                preferredColor: u.preferredColor,
                profileImage: u.profileImage || null
            }))
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 10); // Top 10
        
        res.json({
            success: true,
            ranking
        });
        
    } catch (error) {
        log('error', 'Erro ao obter ranking', error);
        res.status(500).json({
            error: 'Erro ao obter ranking'
        });
    }
});

module.exports = router;
