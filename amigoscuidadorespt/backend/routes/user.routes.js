const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateUpdateProfile } = require('../middlewares/validation');

// Rotas protegidas - requerem autenticação
router.use(authenticate);

// Obter perfil do usuário atual
router.get('/profile', userController.getProfile);

// Atualizar perfil do usuário atual
router.put('/profile', validateUpdateProfile, userController.updateProfile);

// Deletar conta do usuário atual
router.delete('/profile', userController.deleteAccount);

// Listar todos os cuidadores/enfermeiros (para clientes)
router.get('/professionals', userController.listProfessionals);

// Obter detalhes de um profissional específico
router.get('/professionals/:id', userController.getProfessionalDetails);

// Rotas administrativas (apenas para admins)
router.get('/', authorize('admin'), userController.listAllUsers);
router.get('/:id', authorize('admin'), userController.getUserById);
router.put('/:id', authorize('admin'), userController.updateUserById);
router.delete('/:id', authorize('admin'), userController.deleteUserById);

module.exports = router;
