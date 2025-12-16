const { firestore } = require('../config/firebase');

class Transaction {
  constructor() {
    this.collection = firestore.collection('transactions');
  }

  /**
   * Criar uma nova transação
   * @param {Object} transactionData - Dados da transação
   * @returns {Promise<Object>} Transação criada
   */
  async create(transactionData) {
    const now = new Date().toISOString();

    const transaction = {
      id: this.collection.doc().id,
      type: transactionData.type, // 'payment', 'refund', 'withdrawal', 'commission'
      status: transactionData.status || 'pending', // 'pending', 'completed', 'failed', 'cancelled'
      
      // Valores
      amount: parseFloat(transactionData.amount) || 0,
      currency: transactionData.currency || 'EUR',
      platformFee: parseFloat(transactionData.platformFee) || 0, // Taxa da plataforma
      netAmount: 0, // Calculado automaticamente
      
      // Participantes
      fromUserId: transactionData.fromUserId || null, // Cliente pagador
      toUserId: transactionData.toUserId || null, // Cuidador recebedor
      
      // Detalhes do serviço
      serviceDetails: {
        serviceType: transactionData.serviceType || 'caregiving', // 'caregiving', 'nursing'
        hours: transactionData.hours || 0,
        hourlyRate: transactionData.hourlyRate || 0,
        date: transactionData.serviceDate || null,
        description: transactionData.description || ''
      },
      
      // Stripe (para integração futura)
      stripe: {
        paymentIntentId: transactionData.stripePaymentIntentId || null,
        chargeId: transactionData.stripeChargeId || null,
        transferId: transactionData.stripeTransferId || null,
        refundId: transactionData.stripeRefundId || null
      },
      
      // Metadados
      metadata: transactionData.metadata || {},
      notes: transactionData.notes || '',
      
      // Timestamps
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null
    };

    // Calcular valor líquido (valor - taxa da plataforma)
    transaction.netAmount = transaction.amount - transaction.platformFee;

    await this.collection.doc(transaction.id).set(transaction);
    return transaction;
  }

  /**
   * Atualizar status da transação
   * @param {string} id - ID da transação
   * @param {string} status - Novo status
   * @param {Object} additionalData - Dados adicionais
   */
  async updateStatus(id, status, additionalData = {}) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Transação não encontrada');
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData
    };

    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date().toISOString();
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  /**
   * Buscar transação por ID
   */
  async findById(id) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Buscar transações de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} filters - Filtros opcionais
   */
  async findByUser(userId, filters = {}) {
    let query = this.collection;

    // Buscar onde o usuário é remetente OU destinatário
    const sentQuery = query.where('fromUserId', '==', userId);
    const receivedQuery = query.where('toUserId', '==', userId);

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      sentQuery.get(),
      receivedQuery.get()
    ]);

    const transactions = new Map();

    sentSnapshot.docs.forEach(doc => {
      transactions.set(doc.id, { id: doc.id, ...doc.data(), direction: 'sent' });
    });

    receivedSnapshot.docs.forEach(doc => {
      transactions.set(doc.id, { id: doc.id, ...doc.data(), direction: 'received' });
    });

    let result = Array.from(transactions.values());

    // Aplicar filtros
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }

    if (filters.type) {
      result = result.filter(t => t.type === filters.type);
    }

    // Ordenar por data (mais recente primeiro)
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
  }

  /**
   * Buscar todas as transações (admin)
   * @param {Object} filters - Filtros opcionais
   */
  async findAll(filters = {}) {
    let query = this.collection;

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }

    const snapshot = await query.get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por data (mais recente primeiro)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return transactions;
  }

  /**
   * Calcular estatísticas de transações
   * @param {string} userId - ID do usuário (opcional)
   */
  async getStatistics(userId = null) {
    let transactions;

    if (userId) {
      transactions = await this.findByUser(userId);
    } else {
      transactions = await this.findAll();
    }

    const stats = {
      total: transactions.length,
      completed: transactions.filter(t => t.status === 'completed').length,
      pending: transactions.filter(t => t.status === 'pending').length,
      failed: transactions.filter(t => t.status === 'failed').length,
      cancelled: transactions.filter(t => t.status === 'cancelled').length,
      totalAmount: 0,
      totalPlatformFees: 0,
      totalNetAmount: 0
    };

    transactions.forEach(t => {
      if (t.status === 'completed') {
        stats.totalAmount += t.amount;
        stats.totalPlatformFees += t.platformFee;
        stats.totalNetAmount += t.netAmount;
      }
    });

    return stats;
  }

  /**
   * Obter histórico mensal de transações
   * @param {number} months - Número de meses para buscar
   */
  async getMonthlyHistory(months = 12) {
    const transactions = await this.findAll({ status: 'completed' });
    const now = new Date();
    const monthlyData = [];

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.createdAt);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      monthlyData.push({
        month: monthDate.toISOString().substring(0, 7), // YYYY-MM
        monthName: monthDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }),
        transactions: monthTransactions.length,
        totalAmount: monthTransactions.reduce((sum, t) => sum + t.amount, 0),
        platformFees: monthTransactions.reduce((sum, t) => sum + t.platformFee, 0),
        netAmount: monthTransactions.reduce((sum, t) => sum + t.netAmount, 0)
      });
    }

    return monthlyData.reverse(); // Ordem cronológica
  }
}

module.exports = new Transaction();

