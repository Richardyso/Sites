// ===== ROTAS DE MISSÕES =====
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const missionsController = require('../controllers/missionsController');

/**
 * GET /api/missions
 * Listar missões do usuário (filtradas por data)
 */
router.get('/', verifyToken, missionsController.getMissions);

/**
 * GET /api/missions/today
 * Listar missões de hoje
 */
router.get('/today', verifyToken, missionsController.getTodayMissions);

/**
 * POST /api/missions/:id/complete
 * Marcar missão como concluída e adicionar pontos
 */
router.post('/:id/complete', verifyToken, missionsController.completeMission);

/**
 * POST /api/missions/create-daily
 * Criar missões diárias (chamado automaticamente ou manualmente)
 * Pode ser protegido com um secret ou cron job
 */
router.post('/create-daily', verifyToken, missionsController.createDailyMissions);

/**
 * GET /api/missions/stats
 * Obter estatísticas de missões
 */
router.get('/stats', verifyToken, missionsController.getMissionStats);

/**
 * GET /api/missions/history
 * Obter histórico de missões (rastreio de hábitos)
 * Query params: days (padrão: 30)
 */
router.get('/history', verifyToken, missionsController.getMissionHistory);

/**
 * PUT /api/missions/:id/observation
 * Atualizar observação de uma missão
 */
router.put('/:id/observation', verifyToken, missionsController.updateMissionObservation);

// ===== MISSÕES RELÂMPAGO =====

/**
 * GET /api/missions/flash
 * Listar missões relâmpago ativas (para usuários)
 */
router.get('/flash', verifyToken, missionsController.getFlashMissions);

/**
 * POST /api/missions/flash/:id/claim
 * Resgatar recompensa de missão relâmpago (usuário clicou no link)
 */
router.post('/flash/:id/claim', verifyToken, missionsController.claimFlashMission);

/**
 * GET /api/missions/flash/admin
 * Listar todas as missões relâmpago (admin)
 */
router.get('/flash/admin', verifyToken, missionsController.getFlashMissionsAdmin);

/**
 * POST /api/missions/flash
 * Criar missão relâmpago (admin only)
 */
router.post('/flash', verifyToken, missionsController.createFlashMission);

/**
 * PUT /api/missions/flash/:id
 * Atualizar missão relâmpago (admin only)
 */
router.put('/flash/:id', verifyToken, missionsController.updateFlashMission);

/**
 * DELETE /api/missions/flash/:id
 * Deletar missão relâmpago (admin only)
 */
router.delete('/flash/:id', verifyToken, missionsController.deleteFlashMission);

module.exports = router;