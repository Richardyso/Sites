// ===== ROTAS DE METAS LOCAL =====

const express = require('express');
const router = express.Router();
const { verifyLocalToken } = require('../middleware/authLocal');

// Função para obter o banco de dados dinamicamente (chamada em runtime)
const getDb = () => {
    if (global.db) {
        return global.db;
    }
    return require('../config/database-local');
};

// ===== GET /api/goals =====
// Lista todas as metas do usuário
router.get('/', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getSubcollection, log } = db;
    
    try {
        log('info', `GET /api/goals - Usuário: ${req.user.email}`);
        
        const goals = await getSubcollection(req.user.uid, 'goals');
        
        res.json({
            success: true,
            goals: goals || []
        });
        
    } catch (error) {
        log('error', 'Erro ao buscar metas', error);
        res.status(500).json({ 
            error: 'Erro ao buscar metas',
            message: error.message 
        });
    }
});

// ===== POST /api/goals =====
// Cria uma nova meta
router.post('/', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { addToSubcollection, log } = db;
    
    try {
        const { title, description, category, frequency, points } = req.body;
        
        log('info', `POST /api/goals - Criando meta: ${title}`);
        
        const newGoal = {
            title,
            description,
            category,
            frequency,
            points: parseInt(points) || 50,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        const goal = await addToSubcollection(req.user.uid, 'goals', newGoal);
        
        res.json({
            success: true,
            goal
        });
        
    } catch (error) {
        log('error', 'Erro ao criar meta', error);
        res.status(500).json({ 
            error: 'Erro ao criar meta',
            message: error.message 
        });
    }
});

// ===== PUT /api/goals/:goalId/complete =====
// Marca uma meta como completa
router.put('/:goalId/complete', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getSubcollection, updateSubcollectionItem, addPoints, log } = db;
    
    try {
        const { goalId } = req.params;
        
        log('info', `PUT /api/goals/${goalId}/complete - Usuário: ${req.user.email}`);
        
        const goals = await getSubcollection(req.user.uid, 'goals');
        const goal = goals.find(g => g.id === goalId);
        
        if (!goal) {
            return res.status(404).json({ error: 'Meta não encontrada' });
        }
        
        if (goal.completed) {
            return res.status(400).json({ error: 'Meta já foi completada' });
        }
        
        // Marcar como completa
        await updateSubcollectionItem(req.user.uid, 'goals', goalId, { 
            completed: true,
            completedAt: new Date().toISOString()
        });
        
        // Adicionar pontos
        await addPoints(req.user.uid, goal.points, `Completou meta: ${goal.title}`);
        
        res.json({
            success: true,
            message: 'Meta completada com sucesso!',
            pointsEarned: goal.points
        });
        
    } catch (error) {
        log('error', 'Erro ao completar meta', error);
        res.status(500).json({ 
            error: 'Erro ao completar meta',
            message: error.message 
        });
    }
});

// ===== DELETE /api/goals/:goalId =====
// Deleta uma meta
router.delete('/:goalId', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { deleteFromSubcollection, log } = db;
    
    try {
        const { goalId } = req.params;
        
        log('info', `DELETE /api/goals/${goalId} - Usuário: ${req.user.email}`);
        
        await deleteFromSubcollection(req.user.uid, 'goals', goalId);
        
        res.json({
            success: true,
            message: 'Meta deletada com sucesso'
        });
        
    } catch (error) {
        log('error', 'Erro ao deletar meta', error);
        res.status(500).json({ 
            error: 'Erro ao deletar meta',
            message: error.message 
        });
    }
});

module.exports = router;
