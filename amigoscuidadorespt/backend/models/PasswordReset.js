const { firestore } = require('../config/firebase');
const crypto = require('crypto');

class PasswordReset {
  constructor() {
    this.collection = firestore.collection('password_resets');
  }

  // Gerar código de 6 dígitos
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Criar novo token de recuperação
  async create(email) {
    const code = this.generateCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos

    const resetData = {
      email: email.toLowerCase(),
      code,
      used: false,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      attempts: 0
    };

    // Deletar códigos anteriores não usados do mesmo email
    const previousCodes = await this.collection
      .where('email', '==', email.toLowerCase())
      .where('used', '==', false)
      .get();

    const batch = firestore.batch();
    
    // Deletar códigos anteriores
    previousCodes.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Criar novo código
    const newCodeRef = this.collection.doc();
    batch.set(newCodeRef, resetData);

    await batch.commit();

    return {
      id: newCodeRef.id,
      code,
      expiresAt: expiresAt.toISOString()
    };
  }

  // Verificar código
  async verifyCode(email, code) {
    const snapshot = await this.collection
      .where('email', '==', email.toLowerCase())
      .where('code', '==', code)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false, error: 'Código inválido' };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Verificar se expirou
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);
    
    if (now > expiresAt) {
      return { valid: false, error: 'Código expirado' };
    }

    // Incrementar tentativas
    await doc.ref.update({
      attempts: data.attempts + 1
    });

    // Verificar número de tentativas
    if (data.attempts >= 5) {
      return { valid: false, error: 'Muitas tentativas. Solicite um novo código' };
    }

    return { 
      valid: true, 
      resetId: doc.id,
      email: data.email 
    };
  }

  // Marcar código como usado
  async markAsUsed(resetId) {
    await this.collection.doc(resetId).update({
      used: true,
      usedAt: new Date().toISOString()
    });
  }

  // Limpar códigos expirados (executar periodicamente)
  async cleanupExpired() {
    const now = new Date().toISOString();
    const expiredCodes = await this.collection
      .where('expiresAt', '<', now)
      .get();

    const batch = firestore.batch();
    let count = 0;

    expiredCodes.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }

    return count;
  }

  // Verificar se o usuário solicitou muitos códigos recentemente
  async checkRateLimit(email) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Buscar todos os códigos do email e filtrar no JavaScript
    const recentRequests = await this.collection
      .where('email', '==', email.toLowerCase())
      .get();

    // Filtrar códigos recentes no JavaScript para evitar índice composto
    const recentCount = recentRequests.docs.filter(doc => {
      const createdAt = doc.data().createdAt;
      return new Date(createdAt) > oneHourAgo;
    }).length;

    return recentCount < 3; // Máximo 3 solicitações por hora
  }
}

module.exports = new PasswordReset();
