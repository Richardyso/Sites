// ===== ROTAS DE RECOMPENSAS LOCAL =====

const express = require('express');
const router = express.Router();
const { verifyLocalToken } = require('../middleware/authLocal');

// Função para obter o banco de dados dinamicamente (chamada em runtime)
const getDb = () => {
    if (global.db) {
        return global.db;
    }
    return require('../config/database-local');
};

// ===== GET /api/rewards =====
// Lista todas as recompensas disponíveis
router.get('/', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { log } = db;
    
    try {
        log('info', `GET /api/rewards - Usuário: ${req.user.email}`);
        
        // Recompensas fixas disponíveis
        const availableRewards = [
            {
                id: 'ebook-1',
                name: 'E-book: Jornada do Autocuidado',
                description: 'Um guia completo sobre como construir uma rotina de autocuidado que funciona para você',
                category: 'ebooks',
                points: 100,
                icon: 'fa-book'
            },
            {
                id: 'ebook-2',
                name: 'E-book: Mindfulness para Iniciantes',
                description: 'Aprenda técnicas simples de mindfulness para aplicar no dia a dia',
                category: 'ebooks',
                points: 150,
                icon: 'fa-book'
            },
            {
                id: 'aula-1',
                name: 'Aula: Yoga Flow 30min',
                description: 'Sequência completa de yoga para relaxamento e força',
                category: 'aulas',
                points: 200,
                icon: 'fa-video'
            },
            {
                id: 'aula-2',
                name: 'Workshop: Produtividade Feminina',
                description: 'Técnicas de produtividade alinhadas com o ciclo feminino',
                category: 'aulas',
                points: 250,
                icon: 'fa-video'
            },
            {
                id: 'desc-1',
                name: '20% OFF em Produtos de Skincare',
                description: 'Cupom de desconto para nossa parceira de produtos naturais',
                category: 'descontos',
                points: 80,
                icon: 'fa-tag'
            },
            {
                id: 'desc-2',
                name: '30% OFF em Sessão de Coaching',
                description: 'Desconto exclusivo para sessão individual com coach parceira',
                category: 'descontos',
                points: 300,
                icon: 'fa-tag'
            }
        ];
        
        res.json({
            success: true,
            rewards: availableRewards
        });
        
    } catch (error) {
        log('error', 'Erro ao buscar recompensas', error);
        res.status(500).json({ 
            error: 'Erro ao buscar recompensas',
            message: error.message 
        });
    }
});

// ===== POST /api/rewards/redeem =====
// Resgata uma recompensa
router.post('/redeem', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getUserById, updateUser, addToSubcollection, addPoints, log } = db;
    
    try {
        const { rewardId } = req.body;
        
        log('info', `POST /api/rewards/redeem - Resgatando: ${rewardId}`);
        
        // Buscar dados do usuário
        const user = await getUserById(req.user.uid);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Verificar recompensa (mesma lista de cima)
        const rewards = {
            'ebook-1': { name: 'E-book: Jornada do Autocuidado', points: 100 },
            'ebook-2': { name: 'E-book: Mindfulness para Iniciantes', points: 150 },
            'aula-1': { name: 'Aula: Yoga Flow 30min', points: 200 },
            'aula-2': { name: 'Workshop: Produtividade Feminina', points: 250 },
            'desc-1': { name: '20% OFF em Produtos de Skincare', points: 80 },
            'desc-2': { name: '30% OFF em Sessão de Coaching', points: 300 }
        };
        
        const reward = rewards[rewardId];
        
        if (!reward) {
            return res.status(404).json({ error: 'Recompensa não encontrada' });
        }
        
        // Verificar pontos
        if (user.totalPoints < reward.points) {
            return res.status(400).json({ error: 'Pontos insuficientes' });
        }
        
        // Deduzir pontos (negativo)
        await addPoints(req.user.uid, -reward.points, `Resgatou recompensa: ${reward.name}`);
        
        // Registrar resgate
        await addToSubcollection(req.user.uid, 'rewards', {
            rewardId,
            name: reward.name,
            points: reward.points,
            redeemedAt: new Date().toISOString()
        });
        
        // Atualizar total de pontos do usuário
        await updateUser(req.user.uid, {
            totalPoints: user.totalPoints - reward.points
        });
        
        res.json({
            success: true,
            message: 'Recompensa resgatada com sucesso!',
            reward: reward.name,
            pointsSpent: reward.points,
            newBalance: user.totalPoints - reward.points
        });
        
    } catch (error) {
        log('error', 'Erro ao resgatar recompensa', error);
        res.status(500).json({ 
            error: 'Erro ao resgatar recompensa',
            message: error.message 
        });
    }
});

// ===== GET /api/rewards/history =====
// Histórico de recompensas resgatadas
router.get('/history', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { getSubcollection, log } = db;
    
    try {
        log('info', `GET /api/rewards/history - Usuário: ${req.user.email}`);
        
        const rewards = await getSubcollection(req.user.uid, 'rewards');
        
        res.json({
            success: true,
            history: rewards || []
        });
        
    } catch (error) {
        log('error', 'Erro ao buscar histórico de recompensas', error);
        res.status(500).json({ 
            error: 'Erro ao buscar histórico',
            message: error.message 
        });
    }
});

module.exports = router;
