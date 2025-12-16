const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas de carteira (usuário autenticado)
router.get('/my-wallet', walletController.getWallet);
router.get('/my-transactions', walletController.getTransactions);
router.get('/my-statistics', walletController.getWalletStatistics);

// Criar transação (simulação - para testes)
router.post('/transactions', walletController.createTransaction);

// Processar pagamento
router.post('/transactions/:transactionId/process', walletController.processPayment);

// Solicitar saque (apenas cuidadores)
router.post('/withdrawal', 
  authorize(['caregiver', 'nurse']), 
  walletController.requestWithdrawal
);

// Rotas administrativas
router.get('/admin/transactions', 
  authorize(['admin']), 
  walletController.getAllTransactions
);

router.get('/admin/monthly-history', 
  authorize(['admin']), 
  walletController.getMonthlyHistory
);

router.post('/admin/withdrawals/:transactionId/process', 
  authorize(['admin']), 
  walletController.processWithdrawal
);

module.exports = router;

