const path = require('path');
const fs = require('fs');
const { firestore } = require('../config/firebase');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const BATCH_SIZE = 400;

async function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    throw new Error(`Arquivo ${USERS_FILE} não encontrado.`);
  }

  const raw = await fs.promises.readFile(USERS_FILE, 'utf8');
  const users = JSON.parse(raw);

  if (!Array.isArray(users)) {
    throw new Error('Conteúdo inválido em users.json: esperado um array.');
  }

  return users;
}

async function importUsers(users) {
  if (!users.length) {
    console.log('Nenhum usuário para importar.');
    return;
  }

  console.log(`Importando ${users.length} usuário(s) para o Firestore...`);

  let processed = 0;
  while (processed < users.length) {
    const chunk = users.slice(processed, processed + BATCH_SIZE);
    const batch = firestore.batch();

    chunk.forEach(user => {
      const baseId = user.email || user.name || user.id || firestore.collection('users').doc().id;
      const slug = String(baseId)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const userId = slug || firestore.collection('users').doc().id;
      const docRef = firestore.collection('users').doc(userId);
      const data = {
        ...user,
        id: userId,
        updatedAt: user.updatedAt || new Date().toISOString(),
        createdAt: user.createdAt || new Date().toISOString()
      };

      batch.set(docRef, data, { merge: true });
    });

    await batch.commit();
    processed += chunk.length;
    console.log(`  → ${processed}/${users.length} usuários importados`);
  }

  console.log('Importação concluída com sucesso!');
}

async function main() {
  try {
    const users = await readUsers();
    await importUsers(users);
    process.exit(0);
  } catch (error) {
    console.error('Erro ao importar usuários:', error.message);
    process.exit(1);
  }
}

main();

