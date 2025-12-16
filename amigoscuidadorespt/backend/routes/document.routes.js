const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Todas as rotas de documentos requerem autenticação
router.use(authenticate);

// Listar documentos do usuário
router.get('/', documentController.listDocuments);

// Adicionar novo documento
router.post('/', documentController.addDocument);

// Obter documento específico
router.get('/:id', documentController.getDocument);

// Excluir documento
router.delete('/:id', documentController.deleteDocument);

module.exports = router;

