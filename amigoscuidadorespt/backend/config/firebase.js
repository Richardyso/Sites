const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const resolveServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  let serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, 'firebase-service-account.json');

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && !path.isAbsolute(serviceAccountPath)) {
    serviceAccountPath = path.resolve(process.cwd(), serviceAccountPath);
  }

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      'Arquivo de credenciais do Firebase não encontrado. ' +
        'Defina FIREBASE_SERVICE_ACCOUNT_PATH ou FIREBASE_SERVICE_ACCOUNT_JSON nas variáveis de ambiente.'
    );
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(serviceAccountPath);
};

const initializeFirebase = () => {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = resolveServiceAccount();

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
  });

  const firestore = admin.firestore(app);
  firestore.settings({ ignoreUndefinedProperties: true });

  return app;
};

const app = initializeFirebase();
const firestore = admin.firestore(app);

module.exports = {
  admin,
  firestore
};

