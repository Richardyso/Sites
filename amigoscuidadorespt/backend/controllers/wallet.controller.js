const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { firestore } = require('../config/firebase');

/**
 * Calcular valores de transação
 * @param {number} hours - Número de horas contratadas
 * @param {number} hourlyRate - Preço por hora em EUR
 * @returns {Object} { totalAmount, platformFee, netAmount }
 */
function calculateTransactionValues(hours, hourlyRate) {
  const totalAmount = parseFloat((hours * hourlyRate).toFixed(2));
  const platformFeePercentage = 0.10; // 10% sobre cada hora
  const platformFee = parseFloat((totalAmount * platformFeePercentage).toFixed(2));
  const netAmount = parseFloat((totalAmount - platformFee).toFixed(2));
  
  return {
    totalAmount,
    platformFee,
    netAmount
  };
}

/**
 * Obter carteira do usuário atual
 */
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Garantir que a carteira existe
    if (!user.wallet) {
      user.wallet = {
        balance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalSpent: 0,
        currency: 'EUR',
        stripeCustomerId: null,
        stripeAccountId: null,
        paymentMethods: [],
        lastUpdated: new Date().toISOString()
      };

      await User.update(userId, { wallet: user.wallet });
    }

    res.json({
      success: true,
      data: user.wallet
    });
  } catch (error) {
    console.error('Erro ao obter carteira:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter carteira'
    });
  }
};

/**
 * Obter transações do usuário
 */
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    let transactions = await Transaction.findByUser(userId, filters);

    if (limit) {
      transactions = transactions.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Erro ao obter transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter transações'
    });
  }
};

/**
 * Criar uma nova transação (simulação - para testes)
 * NOTA: Em produção, isso será feito através do Stripe webhook
 */
exports.createTransaction = async (req, res) => {
  try {
    const {
      type,
      toUserId,
      serviceType,
      hours,
      hourlyRate,
      serviceDate,
      description
    } = req.body;

    const fromUserId = req.user.id;

    // Validações básicas
    if (!hours || hours <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Número de horas inválido'
      });
    }

    if (!hourlyRate || hourlyRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Preço por hora inválido'
      });
    }

    if (!toUserId) {
      return res.status(400).json({
        success: false,
        message: 'Destinatário não especificado'
      });
    }

    // Verificar se destinatário existe
    const recipient = await User.findById(toUserId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Destinatário não encontrado'
      });
    }

    // Calcular valores: total, taxa da plataforma (10%), valor líquido
    const { totalAmount, platformFee, netAmount } = calculateTransactionValues(
      parseFloat(hours),
      parseFloat(hourlyRate)
    );

    // Criar transação
    const transaction = await Transaction.create({
      type: type || 'payment',
      status: 'pending', // Inicialmente pendente
      amount: totalAmount,
      platformFee,
      fromUserId,
      toUserId,
      serviceType: serviceType || 'caregiving',
      hours: parseFloat(hours),
      hourlyRate: parseFloat(hourlyRate),
      serviceDate,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Transação criada com sucesso',
      data: transaction
    });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao criar transação'
    });
  }
};

/**
 * Processar pagamento (simulação)
 * NOTA: Em produção, isso será feito através do Stripe
 */
exports.processPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    // Verificar se o usuário é o pagador
    if (transaction.fromUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a processar este pagamento'
      });
    }

    // Verificar se já foi processada
    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transação já foi processada'
      });
    }

    // SIMULAÇÃO: Em produção, aqui chamaríamos a API do Stripe
    // Por enquanto, vamos apenas atualizar os saldos

    // Atualizar status da transação
    await Transaction.updateStatus(transactionId, 'completed', {
      stripe: {
        paymentIntentId: `pi_simulated_${Date.now()}`,
        chargeId: `ch_simulated_${Date.now()}`
      }
    });

    // Atualizar carteira do cliente (pagador)
    const client = await User.findById(transaction.fromUserId);
    await User.update(transaction.fromUserId, {
      wallet: {
        ...client.wallet,
        totalSpent: (client.wallet.totalSpent || 0) + transaction.amount,
        lastUpdated: new Date().toISOString()
      }
    });

    // Atualizar carteira do cuidador (recebedor)
    const caregiver = await User.findById(transaction.toUserId);
    await User.update(transaction.toUserId, {
      wallet: {
        ...caregiver.wallet,
        balance: (caregiver.wallet.balance || 0) + transaction.netAmount,
        totalEarnings: (caregiver.wallet.totalEarnings || 0) + transaction.netAmount,
        lastUpdated: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      data: await Transaction.findById(transactionId)
    });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar pagamento'
    });
  }
};

/**
 * Solicitar saque (para cuidadores)
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se é cuidador ou enfermeiro
    if (user.userType !== 'caregiver' && user.userType !== 'nurse') {
      return res.status(403).json({
        success: false,
        message: 'Apenas cuidadores podem solicitar saques'
      });
    }

    // Validar valor
    const withdrawalAmount = parseFloat(amount);
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor inválido'
      });
    }

    // Verificar saldo disponível
    if ((user.wallet.balance || 0) < withdrawalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    // Criar transação de saque
    const transaction = await Transaction.create({
      type: 'withdrawal',
      status: 'pending',
      amount: withdrawalAmount,
      platformFee: 0,
      fromUserId: userId,
      toUserId: null,
      serviceType: 'withdrawal',
      description: 'Solicitação de saque'
    });

    // Atualizar saldos (mover para pendente)
    await User.update(userId, {
      wallet: {
        ...user.wallet,
        balance: user.wallet.balance - withdrawalAmount,
        pendingBalance: (user.wallet.pendingBalance || 0) + withdrawalAmount,
        lastUpdated: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Solicitação de saque enviada com sucesso',
      data: transaction
    });
  } catch (error) {
    console.error('Erro ao solicitar saque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao solicitar saque'
    });
  }
};

/**
 * Obter estatísticas da carteira
 */
exports.getWalletStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Transaction.getStatistics(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};

/**
 * Obter histórico mensal (Admin)
 */
exports.getMonthlyHistory = async (req, res) => {
  try {
    const { months } = req.query;
    const history = await Transaction.getMonthlyHistory(parseInt(months) || 12);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico'
    });
  }
};

/**
 * Listar todas as transações (Admin)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { status, type } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    const transactions = await Transaction.findAll(filters);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Erro ao obter transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter transações'
    });
  }
};

/**
 * Aprovar/Rejeitar saque (Admin)
 */
exports.processWithdrawal = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { action, notes } = req.body; // 'approve' ou 'reject'

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({
        success: false,
        message: 'Esta não é uma transação de saque'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transação já foi processada'
      });
    }

    const user = await User.findById(transaction.fromUserId);

    if (action === 'approve') {
      // Aprovar saque
      await Transaction.updateStatus(transactionId, 'completed', {
        notes: notes || 'Saque aprovado e processado',
        stripe: {
          transferId: `tr_simulated_${Date.now()}`
        }
      });

      // Remover do saldo pendente
      await User.update(transaction.fromUserId, {
        wallet: {
          ...user.wallet,
          pendingBalance: user.wallet.pendingBalance - transaction.amount,
          lastUpdated: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: 'Saque aprovado com sucesso'
      });
    } else if (action === 'reject') {
      // Rejeitar saque - devolver ao saldo disponível
      await Transaction.updateStatus(transactionId, 'cancelled', {
        notes: notes || 'Saque rejeitado'
      });

      await User.update(transaction.fromUserId, {
        wallet: {
          ...user.wallet,
          balance: user.wallet.balance + transaction.amount,
          pendingBalance: user.wallet.pendingBalance - transaction.amount,
          lastUpdated: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: 'Saque rejeitado'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Ação inválida'
      });
    }
  } catch (error) {
    console.error('Erro ao processar saque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar saque'
    });
  }
};

