const { firestore } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor() {
    this.collection = firestore.collection('users');
  }

  formatUser(doc, { includePassword = false } = {}) {
    if (!doc || !doc.exists) {
      return null;
    }

    const data = doc.data();
    const user = {
      id: doc.id,
      ...data
    };

    if (!includePassword) {
      delete user.password;
    }

    return user;
  }

  prepareAvatar(avatar) {
    if (!avatar) {
      return null;
    }

    if (typeof avatar !== 'string' || !avatar.startsWith('data:image/')) {
      throw new Error('Formato de imagem inválido');
    }

    const MAX_AVATAR_BYTES = 700 * 1024; // ~700KB
    const base64Data = avatar.split(',')[1] || '';
    const bufferLength = Buffer.from(base64Data, 'base64').length;

    if (bufferLength > MAX_AVATAR_BYTES) {
      throw new Error('Imagem muito grande. Utilize arquivos de até 700KB.');
    }

    return avatar;
  }

  async findByEmail(email) {
    const snapshot = await this.collection.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    return this.formatUser(snapshot.docs[0], { includePassword: true });
  }

  async findById(id) {
    const doc = await this.collection.doc(id).get();
    return this.formatUser(doc, { includePassword: true });
  }

  async create(userData) {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Usar apenas o nome para gerar o ID, não o email (para preservar pontos no email)
    const baseId = userData.name || uuidv4();
    const id = String(baseId)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || uuidv4();
    const now = new Date().toISOString();

    const newUser = {
      id,
      name: userData.name,
      email: userData.email,
      password: userData.password, // Mantém texto plano (apenas para desenvolvimento)
      userType: userData.userType || 'client',
      phone: userData.phone || '',
      address: userData.address || {},
      avatar: this.prepareAvatar(userData.avatar),
      profileComplete: Boolean(userData.profileComplete) || false,
      verified: Boolean(userData.verified) || false,
      createdAt: now,
      updatedAt: now,
      // Carteira para integração futura com Stripe
      wallet: {
        balance: 0, // Saldo disponível em EUR
        pendingBalance: 0, // Saldo pendente (pagamentos em processamento)
        totalEarnings: 0, // Total ganho (apenas cuidadores)
        totalSpent: 0, // Total gasto (apenas clientes)
        currency: 'EUR',
        stripeCustomerId: null, // ID do cliente no Stripe
        stripeAccountId: null, // ID da conta conectada Stripe (para cuidadores)
        paymentMethods: [], // Métodos de pagamento salvos
        lastUpdated: now
      }
    };

    if (userData.userType === 'caregiver' || userData.userType === 'nurse') {
      newUser.professional = {
        experience: userData.experience || '',
        specialties: userData.specialties || [],
        certifications: userData.certifications || [],
        availability: userData.availability || {},
        hourlyRate: userData.hourlyRate || null,
        bio: userData.bio || '',
        rating: 0,
        totalReviews: 0
      };
    } else if (userData.userType === 'client') {
      newUser.careRecipient = {
        age: null,
        weight: null,
        limitations: '',
        maxHourlyRate: null,
        bio: ''
      };
    }

    await this.collection.doc(id).set(newUser);

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async update(id, updateData) {
    const docRef = this.collection.doc(id);
    const currentSnapshot = await docRef.get();

    if (!currentSnapshot.exists) {
      throw new Error('Usuário não encontrado');
    }

    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (Object.prototype.hasOwnProperty.call(updateData, 'avatar')) {
      dataToUpdate.avatar = this.prepareAvatar(updateData.avatar);
    }

    // Senha em texto puro (sem hash)
    // A senha será atualizada diretamente no banco de dados se for fornecida

    await docRef.set(dataToUpdate, { merge: true });

    const updatedDoc = await docRef.get();
    const updatedUser = this.formatUser(updatedDoc, { includePassword: true });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async delete(id) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Usuário não encontrado');
    }

    await docRef.delete();
    return true;
  }

  async findAll(filters = {}) {
    let query = this.collection;

    if (filters.userType) {
      query = query.where('userType', '==', filters.userType);
    }

    if (typeof filters.verified === 'boolean') {
      query = query.where('verified', '==', filters.verified);
    }

    const snapshot = await query.get();

    return snapshot.docs
      .map(doc => this.formatUser(doc))
      .filter(Boolean);
  }

  async verifyPassword(plainPassword, storedPassword) {
    return plainPassword === storedPassword;
  }
}

module.exports = new User();
