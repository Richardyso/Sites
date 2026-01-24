// ===== ROTAS DE RECOMPENSAS =====
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const rewardsController = require('../controllers/rewardsController');

/**
 * GET /api/rewards
 * Listar catálogo de recompensas disponíveis
 */
router.get('/', verifyToken, rewardsController.getRewardsLibrary);

/**
 * GET /api/rewards/user
 * Listar recompensas resgatadas pelo usuário
 */
router.get('/user', verifyToken, rewardsController.getUserRewards);

/**
 * GET /api/rewards/:id
 * Obter detalhes de uma recompensa específica
 */
router.get('/:id', verifyToken, rewardsController.getReward);

/**
 * POST /api/rewards/:id/redeem
 * Resgatar uma recompensa
 */
router.post('/:id/redeem', verifyToken, rewardsController.redeemReward);

/**
 * GET /api/rewards/user/:rewardId
 * Obter status de uma recompensa resgatada
 */
router.get('/user/:rewardId', verifyToken, rewardsController.getRedeemedReward);

module.exports = router;