// ===== SERVIDOR PRINCIPAL - GLOWMECLUB =====
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
// Em produção (Vercel), as variáveis vêm do dashboard
// Em desenvolvimento, carrega do arquivo .env
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
        const envPath = path.join(__dirname, '..', '.env');
        if (fs.existsSync(envPath)) {
            require('dotenv').config({ path: envPath });
            console.log('✅ Variáveis carregadas de .env');
        }
    } catch (e) {
        console.log('ℹ️ Usando variáveis de ambiente do sistema');
    }
}

// SEMPRE usar Firebase em produção
const USE_FIREBASE = true;

console.log('🔥 Usando Firebase Firestore como banco de dados');
const firebaseDb = require('./config/database-firebase');
const db = firebaseDb;
const log = firebaseDb.log;
const initDatabase = firebaseDb.initDatabase;
const colors = firebaseDb.colors;

// Exportar db globalmente para as rotas usarem
global.db = db;
global.USE_FIREBASE = USE_FIREBASE;

// Importar rotas do Firebase
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const goalsRoutes = require('./routes/goals');
const sharedGoalsRoutes = require('./routes/sharedGoals');
const missionsRoutes = require('./routes/missions');
const rewardsRoutes = require('./routes/rewards');

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

// CORS - permitir requisições do mesmo domínio e desenvolvimento
app.use(cors({
    origin: function(origin, callback) {
        // Permitir requisições sem origin (mesma origem, curl, etc)
        if (!origin) return callback(null, true);
        
        // Permitir desenvolvimento local
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5500',
            'https://glowmeclub.vercel.app',
            /\.vercel\.app$/  // Qualquer subdomínio da Vercel
        ];
        
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return allowed === origin;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(null, true); // Permitir todos por enquanto para debug
        }
    },
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

// ===== ROTAS DA API - FIREBASE =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Inclui rotas de admin e ranking
app.use('/api/user', userRoutes); // Alias para compatibilidade
app.use('/api/admin', userRoutes); // Rotas de admin (redirecionam para users)
app.use('/api/points', userRoutes); // Rotas de pontos (histórico)
app.use('/api/goals', goalsRoutes);
app.use('/api/shared-goals', sharedGoalsRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/rewards', rewardsRoutes);

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

// ===== INICIALIZAÇÃO =====
// Inicializar banco de dados (para Serverless, inicializa na primeira requisição)
let dbInitialized = false;
const initDb = async () => {
    if (!dbInitialized) {
        await initDatabase();
        dbInitialized = true;
    }
};

// Middleware para garantir que o DB está inicializado
app.use(async (req, res, next) => {
    try {
        await initDb();
        next();
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ===== INICIAR SERVIDOR (apenas em desenvolvimento local) =====
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, async () => {
        console.log(`
${colors.magenta}╔══════════════════════════════════════╗
║       ✨ GLOWMECLUB BACKEND ✨      ║
║                                      ║
║   Servidor rodando na porta ${PORT}     ║
║   ${new Date().toLocaleString('pt-BR')}      ║
║                                      ║
║   Ambiente: ${process.env.NODE_ENV || 'development'}          ║
║   Banco: Firebase Firestore 🔥       ║
╚══════════════════════════════════════╝${colors.reset}
        `);
        
        log('info', `Servidor iniciado em http://localhost:${PORT}`);
        log('info', 'Usando banco de dados: Firebase Firestore');
    });
}

// ===== TRATAMENTO DE ERROS DO PROCESSO =====
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Exportar para Vercel Serverless Functions
module.exports = app;