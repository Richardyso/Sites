// ===== ROTAS DE RECOMPENSAS LOCAL =====

const express = require('express');
const router = express.Router();
const { verifyLocalToken, verifyAdmin } = require('../middleware/authLocal');

// Função para obter o banco de dados dinamicamente (chamada em runtime)
const getDb = () => {
    if (global.db) {
        return global.db;
    }
    return require('../config/database-local');
};

// Recompensas em memória (simulando DB)
let rewardsDatabase = [
    {
        id: 'ebook-1',
        title: 'E-book: Jornada do Autocuidado',
        description: 'Um guia completo sobre como construir uma rotina de autocuidado que funciona para você',
        category: 'ebooks',
        points: 100,
        icon: 'fa-book',
        link: 'https://exemplo.com/ebook-autocuidado',
        available: true,
        image: null
    },
    {
        id: 'ebook-2',
        title: 'E-book: Mindfulness para Iniciantes',
        description: 'Aprenda técnicas simples de mindfulness para aplicar no dia a dia',
        category: 'ebooks',
        points: 150,
        icon: 'fa-book',
        link: 'https://exemplo.com/ebook-mindfulness',
        available: true,
        image: null
    },
    {
        id: 'aula-1',
        title: 'Aula: Yoga Flow 30min',
        description: 'Sequência completa de yoga para relaxamento e força',
        category: 'aulas',
        points: 200,
        icon: 'fa-video',
        link: 'https://exemplo.com/aula-yoga',
        available: true,
        image: null
    },
    {
        id: 'aula-2',
        title: 'Workshop: Produtividade Feminina',
        description: 'Técnicas de produtividade alinhadas com o ciclo feminino',
        category: 'aulas',
        points: 250,
        icon: 'fa-video',
        link: 'https://exemplo.com/workshop-produtividade',
        available: true,
        image: null
    },
    {
        id: 'desc-1',
        title: '20% OFF em Produtos de Skincare',
        description: 'Cupom de desconto para nossa parceira de produtos naturais',
        category: 'descontos',
        points: 80,
        icon: 'fa-tag',
        link: 'https://exemplo.com/desconto-skincare',
        available: true,
        image: null
    },
    {
        id: 'desc-2',
        title: '30% OFF em Sessão de Coaching',
        description: 'Desconto exclusivo para sessão individual com coach parceira',
        category: 'descontos',
        points: 300,
        icon: 'fa-tag',
        link: 'https://exemplo.com/desconto-coaching',
        available: true,
        image: null
    }
];

// ===== GET /api/rewards =====
// Lista todas as recompensas (admin vê todas, usuário vê só disponíveis)
router.get('/', verifyLocalToken, async (req, res) => {
    const db = getDb();
    const { log } = db;
    
    try {
        log('info', `GET /api/rewards - Usuário: ${req.user.email}`);
        
        // Se for admin, retorna todas
        // Se for usuário, retorna apenas disponíveis
        const rewards = req.user.role === 'admin' 
            ? rewardsDatabase 
            : rewardsDatabase.filter(r => r.available);
        
        res.json({
            success: true,
            rewards: rewards
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
        
        // Buscar recompensa
        const reward = rewardsDatabase.find(r => r.id === rewardId);
        
        if (!reward) {
            return res.status(404).json({ error: 'Recompensa não encontrada' });
        }
        
        if (!reward.available) {
            return res.status(400).json({ error: 'Recompensa não disponível' });
        }
        
        // Verificar pontos
        if (user.totalPoints < reward.points) {
            return res.status(400).json({ error: 'Pontos insuficientes' });
        }
        
        // Deduzir pontos (negativo)
        await addPoints(req.user.uid, -reward.points, `Resgatou recompensa: ${reward.title}`);
        
        // Registrar resgate
        await addToSubcollection(req.user.uid, 'rewards', {
            rewardId,
            title: reward.title,
            points: reward.points,
            link: reward.link,
            redeemedAt: new Date().toISOString()
        });
        
        // Atualizar total de pontos do usuário
        await updateUser(req.user.uid, {
            totalPoints: user.totalPoints - reward.points
        });
        
        res.json({
            success: true,
            message: 'Recompensa resgatada com sucesso!',
            reward: reward.title,
            link: reward.link,
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

// ===== ROTAS DE ADMIN =====

// POST /api/rewards - Criar nova recompensa (admin)
router.post('/', verifyLocalToken, verifyAdmin, async (req, res) => {
    const db = getDb();
    const { log } = db;
    
    try {
        const { title, description, points, link, image, available = true } = req.body;
        
        // Validar campos obrigatórios
        if (!title || !description || !points || !link) {
            return res.status(400).json({ error: 'Campos obrigatórios: title, description, points, link' });
        }
        
        // Criar nova recompensa
        const newReward = {
            id: `reward-${Date.now()}`,
            title,
            description,
            points: parseInt(points),
            link,
            image: image || null,
            available,
            category: 'custom',
            icon: 'fa-gift',
            createdAt: new Date().toISOString()
        };
        
        // Adicionar ao "banco"
        rewardsDatabase.push(newReward);
        
        log('success', `Recompensa criada: ${title}`);
        
        res.status(201).json({
            success: true,
            reward: newReward
        });
        
    } catch (error) {
        log('error', 'Erro ao criar recompensa', error);
        res.status(500).json({ error: 'Erro ao criar recompensa' });
    }
});

// PUT /api/rewards/:id - Atualizar recompensa (admin)
router.put('/:id', verifyLocalToken, verifyAdmin, async (req, res) => {
    const db = getDb();
    const { log } = db;
    
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Encontrar recompensa
        const rewardIndex = rewardsDatabase.findIndex(r => r.id === id);
        
        if (rewardIndex === -1) {
            return res.status(404).json({ error: 'Recompensa não encontrada' });
        }
        
        // Atualizar dados
        rewardsDatabase[rewardIndex] = {
            ...rewardsDatabase[rewardIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        log('success', `Recompensa atualizada: ${id}`);
        
        res.json({
            success: true,
            reward: rewardsDatabase[rewardIndex]
        });
        
    } catch (error) {
        log('error', 'Erro ao atualizar recompensa', error);
        res.status(500).json({ error: 'Erro ao atualizar recompensa' });
    }
});

// DELETE /api/rewards/:id - Deletar recompensa (admin)
router.delete('/:id', verifyLocalToken, verifyAdmin, async (req, res) => {
    const db = getDb();
    const { log } = db;
    
    try {
        const { id } = req.params;
        
        // Encontrar índice
        const rewardIndex = rewardsDatabase.findIndex(r => r.id === id);
        
        if (rewardIndex === -1) {
            return res.status(404).json({ error: 'Recompensa não encontrada' });
        }
        
        // Remover
        const removed = rewardsDatabase.splice(rewardIndex, 1);
        
        log('success', `Recompensa removida: ${removed[0].title}`);
        
        res.json({
            success: true,
            message: 'Recompensa removida com sucesso'
        });
        
    } catch (error) {
        log('error', 'Erro ao deletar recompensa', error);
        res.status(500).json({ error: 'Erro ao deletar recompensa' });
    }
});

module.exports = router;
