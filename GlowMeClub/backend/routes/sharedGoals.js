const express = require('express');
const router = express.Router();
const sharedGoalsController = require('../controllers/sharedGoalsController');
const { verifyToken } = require('../middleware/auth');

// Rotas para usuários
router.get('/', verifyToken, sharedGoalsController.getSharedGoals);
router.get('/progress', verifyToken, sharedGoalsController.getUserSharedGoalProgress);
router.put('/:goalId/progress', verifyToken, sharedGoalsController.updateUserSharedGoalProgress);

// Rotas administrativas
router.get('/admin', verifyToken, sharedGoalsController.getSharedGoalsAdmin);
router.post('/', verifyToken, sharedGoalsController.createSharedGoal);
router.put('/:id', verifyToken, sharedGoalsController.updateSharedGoal);
router.delete('/:id', verifyToken, sharedGoalsController.deleteSharedGoal);
router.get('/:goalId/progress/admin', verifyToken, sharedGoalsController.getSharedGoalProgressAdmin);

module.exports = router;