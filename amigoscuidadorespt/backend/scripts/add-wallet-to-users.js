const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../config.env') });

// Inicializar Firebase
const { firestore } = require('../config/firebase');

async function addWalletToUsers() {
  try {
    console.log('Iniciando atualização de usuários com carteira...\n');

    // Buscar todos os usuários
    const usersSnapshot = await firestore.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('Nenhum usuário encontrado.');
      return;
    }

    console.log(`Encontrados ${usersSnapshot.size} usuários\n`);

    let updated = 0;
    let skipped = 0;

    // Preparar batch para atualizar múltiplos documentos
    const batch = firestore.batch();
    const now = new Date().toISOString();

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();

      // Verificar se já tem carteira
      if (userData.wallet && typeof userData.wallet === 'object') {
        console.log(`✓ ${userData.name || userData.email} - Já possui carteira`);
        skipped++;
        continue;
      }

      // Adicionar estrutura de carteira
      const wallet = {
        balance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalSpent: 0,
        currency: 'EUR',
        stripeCustomerId: null,
        stripeAccountId: null,
        paymentMethods: [],
        lastUpdated: now
      };

      const userRef = firestore.collection('users').doc(doc.id);
      batch.update(userRef, { wallet, updatedAt: now });

      console.log(`+ ${userData.name || userData.email} - Carteira adicionada`);
      updated++;
    }

    // Executar todas as atualizações
    if (updated > 0) {
      await batch.commit();
      console.log(`\n✅ ${updated} usuários atualizados com sucesso`);
    }

    if (skipped > 0) {
      console.log(`ℹ ${skipped} usuários já tinham carteira`);
    }

    console.log('\n✨ Processo concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao atualizar usuários:', error);
    process.exit(1);
  }
}

// Executar script
addWalletToUsers();

