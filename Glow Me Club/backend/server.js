// ===== SERVIDOR PRINCIPAL - GLOWMECLUB =====
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente (.env ou env.example como fallback)
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('✅ Variáveis carregadas de .env');
} else if (fs.existsSync(envExamplePath)) {
    require('dotenv').config({ path: envExamplePath });
    console.log('✅ Variáveis carregadas de env.example');
} else {
    console.warn('⚠️ Nenhum arquivo .env encontrado!');
}

// Escolher banco de dados baseado na configuração
const USE_FIREBASE = process.env.USE_FIREBASE === 'true';

let db, log, initDatabase, colors;

if (USE_FIREBASE) {
    console.log('🔥 Usando Firebase Firestore como banco de dados');
    const firebaseDb = require('./config/database-firebase');
    db = firebaseDb;
    log = firebaseDb.log;
    initDatabase = firebaseDb.initDatabase;
    colors = firebaseDb.colors;
} else {
    console.log('💾 Usando JSON local como banco de dados');
    const localDb = require('./config/database-local');
    db = localDb;
    log = localDb.log;
    initDatabase = localDb.initDatabase;
    colors = localDb.colors;
}

// Exportar db globalmente para as rotas usarem
global.db = db;
global.USE_FIREBASE = USE_FIREBASE;

// Importar rotas
const authLocalRoutes = require('./routes/authLocal');
const userLocalRoutes = require('./routes/userLocal');
const goalsLocalRoutes = require('./routes/goalsLocal');
const missionsLocalRoutes = require('./routes/missionsLocal');
const rewardsLocalRoutes = require('./routes/rewardsLocal');
const adminLocalRoutes = require('./routes/adminLocal');

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES =====
// Segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://firebaseapp.com", "https://firebase.googleapis.com", "https://identitytoolkit.googleapis.com"]
        }
    }
}));

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, '../')));

// Middleware para logar todas as requisições (ANTES das rotas)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        log('info', `${req.method} ${req.path}`, {
            body: req.body,
            query: req.query,
            auth: req.headers.authorization ? 'Token presente' : 'Sem token'
        });
    }
    next();
});

// ===== ROTAS DA API =====
app.use('/api/auth', authLocalRoutes); // Usando rotas locais
app.use('/api/user', userLocalRoutes); // Usando rotas locais
app.use('/api/goals', goalsLocalRoutes); // Usando rotas locais
app.use('/api/missions', missionsLocalRoutes); // Usando rotas locais
app.use('/api/rewards', rewardsLocalRoutes); // Usando rotas locais
app.use('/api/admin', adminLocalRoutes); // Administração
app.use('/api/users', adminLocalRoutes); // Rotas públicas (ranking)

// ===== ROTA DE HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '✨ GlowMeClub API está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// ===== ROTAS DO FRONTEND (SPA) =====
// Redirecionar todas as rotas não-API para o index.html
app.get('*', (req, res) => {
    // Se não for uma rota de API, servir o index.html
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../index.html'));
    } else {
        // Rota de API não encontrada
        res.status(404).json({
            error: 'Endpoint não encontrado'
        });
    }
});

// ===== TRATAMENTO DE ERROS GLOBAL =====
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    
    // Erro de validação do Firebase
    if (err.code && err.code.startsWith('auth/')) {
        return res.status(400).json({
            error: 'Erro de autenticação',
            message: err.message
        });
    }
    
    // Erro genérico
    res.status(err.status || 500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'production' 
            ? 'Algo deu errado. Tente novamente.' 
            : err.message
    });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, async () => {
    // Inicializar banco de dados
    await initDatabase();
    
    const dbType = USE_FIREBASE ? 'Firebase 🔥' : 'JSON Local 💾';
    
    console.log(`
${colors.magenta}╔══════════════════════════════════════╗
║       ✨ GLOWMECLUB BACKEND ✨      ║
║                                      ║
║   Servidor rodando na porta ${PORT}     ║
║   ${new Date().toLocaleString('pt-BR')}      ║
║                                      ║
║   Ambiente: ${process.env.NODE_ENV || 'development'}          ║
║   Banco: ${dbType}              ║
╚══════════════════════════════════════╝${colors.reset}
    `);
    
    log('info', `Servidor iniciado em http://localhost:${PORT}`);
    log('info', `Usando banco de dados: ${USE_FIREBASE ? 'Firebase Firestore' : 'JSON Local'}`);
});

// ===== TRATAMENTO DE ERROS DO PROCESSO =====
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Em produção, você pode querer fazer log e reiniciar o processo
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Fechar servidor gracefully
    process.exit(1);
});

module.exports = app;