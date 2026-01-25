// ===== ROTAS DE METAS =====
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const goalsController = require('../controllers/goalsController');

/**
 * GET /api/goals
 * Listar todas as metas do usuário
 */
router.get('/', verifyToken, goalsController.getGoals);

/**
 * GET /api/goals/:id
 * Obter uma meta específica
 */
router.get('/:id', verifyToken, goalsController.getGoal);

/**
 * POST /api/goals
 * Criar nova meta
 */
router.post('/', verifyToken, goalsController.createGoal);

/**
 * PUT /api/goals/:id
 * Atualizar meta existente
 */
router.put('/:id', verifyToken, goalsController.updateGoal);

/**
 * DELETE /api/goals/:id
 * Deletar meta
 */
router.delete('/:id', verifyToken, goalsController.deleteGoal);

/**
 * POST /api/goals/:id/complete
 * Marcar meta como concluída e adicionar pontos
 */
router.post('/:id/complete', verifyToken, goalsController.completeGoal);

/**
 * PUT /api/goals/:id/progress
 * Atualizar progresso da meta
 */
router.put('/:id/progress', verifyToken, goalsController.updateProgress);

module.exports = router;