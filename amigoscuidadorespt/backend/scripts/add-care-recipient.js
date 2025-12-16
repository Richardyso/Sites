const { firestore } = require('../config/firebase');

async function addCareRecipientToClients() {
  try {
    console.log('🔄 Iniciando atualização dos clientes...\n');
    
    const usersRef = firestore.collection('users');
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️  Nenhum usuário encontrado no banco de dados.');
      return;
    }
    
    console.log(`📊 Total de usuários no banco: ${snapshot.size}\n`);
    
    const batch = firestore.batch();
    let count = 0;
    let clientsFound = 0;
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      
      // Listar todos os clientes
      if (userData.userType === 'client') {
        clientsFound++;
        console.log(`\n👤 Cliente: ${userData.name || doc.id}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Tem careRecipient: ${!!userData.careRecipient}`);
        
        // Verificar se já tem o campo careRecipient
        if (!userData.careRecipient) {
          console.log(`   ➡️  Adicionando campo careRecipient...`);
          
          batch.update(doc.ref, {
            careRecipient: {
              age: null,
              weight: null,
              limitations: '',
              maxHourlyRate: null,
              bio: ''
            }
          });
          
          count++;
        } else {
          console.log(`   ✅ Já possui careRecipient`);
        }
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   Total de clientes encontrados: ${clientsFound}`);
    console.log(`   Clientes a serem atualizados: ${count}`);
    
    if (count > 0) {
      console.log(`\n💾 Salvando alterações no Firestore...`);
      await batch.commit();
      console.log(`✅ Atualização concluída! ${count} cliente(s) atualizado(s).`);
    } else {
      console.log(`\n✅ Todos os clientes já possuem o campo careRecipient.`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao atualizar clientes:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

addCareRecipientToClients();

