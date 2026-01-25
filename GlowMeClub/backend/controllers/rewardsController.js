// ===== CONTROLADOR DE RECOMPENSAS =====
const { firestore, serverTimestamp } = require('../config/firebase-admin');
const { sendRewardEmail } = require('../utils/email');

// Catálogo de recompensas padrão
const DEFAULT_REWARDS = [
    {
        id: 'ebook-skincare',
        title: 'E-book de Skincare',
        description: 'Guia completo com rotina de cuidados com a pele, dicas de produtos e receitas caseiras para um glow natural.',
        pointsCost: 300,
        category: 'ebooks',
        imageURL: '/assets/images/rewards/ebook-skincare.png',
        available: true,
        instructions: 'Após o resgate, você receberá o link para download do e-book por email.'
    },
    {
        id: 'aula-autocuidado',
        title: 'Aula de Autocuidado',
        description: 'Aula online ao vivo sobre técnicas de autocuidado, meditação e desenvolvimento de hábitos saudáveis.',
        pointsCost: 500,
        category: 'aulas',
        imageURL: '/assets/images/rewards/aula-autocuidado.png',
        available: true,
        instructions: 'Você receberá o link para a aula e poderá escolher entre os horários disponíveis.'
    },
    {
        id: 'sessao-mentoria',
        title: 'Sessão de Mentoria',
        description: 'Sessão individual de 1 hora com uma mentora especializada em desenvolvimento pessoal feminino.',
        pointsCost: 1000,
        category: 'aulas',
        imageURL: '/assets/images/rewards/sessao-mentoria.png',
        available: true,
        instructions: 'Após o resgate, entraremos em contato para agendar sua sessão personalizada.'
    },
    {
        id: 'badge-guerreira',
        title: 'Badge Exclusiva: Guerreira',
        description: 'Badge especial para seu perfil mostrando que você é uma verdadeira guerreira do autocuidado.',
        pointsCost: 200,
        category: 'badges',
        imageURL: '/assets/images/rewards/badge-guerreira.png',
        available: true,
        instructions: 'A badge será adicionada automaticamente ao seu perfil.'
    },
    {
        id: 'planner-digital',
        title: 'Planner Digital',
        description: 'Planner digital personalizado com páginas para metas, hábitos, gratidão e acompanhamento mensal.',
        pointsCost: 400,
        category: 'digital',
        imageURL: '/assets/images/rewards/planner-digital.png',
        available: true,
        instructions: 'Você receberá o arquivo PDF do planner para download e impressão.'
    },
    {
        id: 'kit-meditacoes',
        title: 'Kit de Meditações Guiadas',
        description: '10 meditações guiadas em áudio para diferentes momentos: manhã, ansiedade, sono e autoestima.',
        pointsCost: 350,
        category: 'digital',
        imageURL: '/assets/images/rewards/kit-meditacoes.png',
        available: true,
        instructions: 'Os áudios serão enviados por email em formato MP3 para você baixar.'
    }
];

/**
 * Listar catálogo de recompensas
 */
exports.getRewardsLibrary = async (req, res) => {
    try {
        const { category, available } = req.query;
        
        // Por enquanto, usar o catálogo padrão
        let rewards = [...DEFAULT_REWARDS];
        
        // Filtrar por categoria se fornecida
        if (category) {
            rewards = rewards.filter(r => r.category === category);
        }
        
        // Filtrar por disponibilidade se fornecida
        if (available !== undefined) {
            rewards = rewards.filter(r => r.available === (available === 'true'));
        }
        
        // Opcional: buscar do Firestore se existir
        try {
            const rewardsSnapshot = await firestore
                .collection('rewardsLibrary')
                .limit(1)
                .get();
            
            if (!rewardsSnapshot.empty) {
                // Se existir coleção no Firestore, usar ela
                const firestoreRewards = [];
                const allRewards = await firestore.collection('rewardsLibrary').get();
                
                allRewards.forEach(doc => {
                    const rewardData = doc.data();
                    if ((!category || rewardData.category === category) &&
                        (available === undefined || rewardData.available === (available === 'true'))) {
                        firestoreRewards.push({
                            id: doc.id,
                            ...rewardData
                        });
                    }
                });
                
                if (firestoreRewards.length > 0) {
                    rewards = firestoreRewards;
                }
            }
        } catch (error) {
            console.log('Usando catálogo padrão de recompensas');
        }
        
        res.json({ rewards });
        
    } catch (error) {
        console.error('Erro ao listar recompensas:', error);
        res.status(500).json({
            error: 'Erro ao listar recompensas'
        });
    }
};

/**
 * Obter detalhes de uma recompensa
 */
exports.getReward = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Procurar no catálogo padrão
        let reward = DEFAULT_REWARDS.find(r => r.id === id);
        
        // Tentar buscar do Firestore
        if (!reward) {
            try {
                const rewardDoc = await firestore
                    .collection('rewardsLibrary')
                    .doc(id)
                    .get();
                
                if (rewardDoc.exists) {
                    reward = {
                        id: rewardDoc.id,
                        ...rewardDoc.data()
                    };
                }
            } catch (error) {
                console.log('Recompensa não encontrada no Firestore');
            }
        }
        
        if (!reward) {
            return res.status(404).json({
                error: 'Recompensa não encontrada'
            });
        }
        
        res.json(reward);
        
    } catch (error) {
        console.error('Erro ao buscar recompensa:', error);
        res.status(500).json({
            error: 'Erro ao buscar recompensa'
        });
    }
};

/**
 * Resgatar uma recompensa
 */
exports.redeemReward = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        
        // Buscar dados da recompensa
        let reward = DEFAULT_REWARDS.find(r => r.id === id);
        
        // Tentar buscar do Firestore se não encontrar
        if (!reward) {
            try {
                const rewardDoc = await firestore
                    .collection('rewardsLibrary')
                    .doc(id)
                    .get();
                
                if (rewardDoc.exists) {
                    reward = {
                        id: rewardDoc.id,
                        ...rewardDoc.data()
                    };
                }
            } catch (error) {
                console.log('Recompensa não encontrada no Firestore');
            }
        }
        
        if (!reward) {
            return res.status(404).json({
                error: 'Recompensa não encontrada'
            });
        }
        
        if (!reward.available) {
            return res.status(400).json({
                error: 'Recompensa não está disponível'
            });
        }
        
        // Buscar pontos do usuário
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        const currentPoints = userData.totalPoints || 0;
        
        // Verificar se tem pontos suficientes
        if (currentPoints < reward.pointsCost) {
            return res.status(400).json({
                error: 'Pontos insuficientes',
                message: `Você precisa de ${reward.pointsCost - currentPoints} pontos a mais`,
                currentPoints,
                required: reward.pointsCost
            });
        }
        
        // Usar transação para garantir consistência
        const batch = firestore.batch();
        
        // Descontar pontos
        batch.update(userRef, {
            totalPoints: currentPoints - reward.pointsCost
        });
        
        // Adicionar recompensa resgatada
        const userRewardRef = firestore
            .collection('users')
            .doc(userId)
            .collection('rewards')
            .doc();
        
        batch.set(userRewardRef, {
            rewardId: reward.id,
            rewardTitle: reward.title,
            pointsCost: reward.pointsCost,
            redeemedAt: serverTimestamp(),
            status: 'pending',
            instructions: reward.instructions || null
        });
        
        // Adicionar ao histórico de pontos
        const historyRef = firestore
            .collection('users')
            .doc(userId)
            .collection('pointsHistory')
            .doc();
        
        batch.set(historyRef, {
            action: `Recompensa resgatada: ${reward.title}`,
            points: -reward.pointsCost,
            timestamp: serverTimestamp()
        });
        
        // Executar transação
        await batch.commit();
        
        // Enviar email com instruções
        if (userData.email) {
            sendRewardEmail(
                userData.email,
                userData.name,
                reward.title,
                reward.instructions
            ).catch(err => console.error('Erro ao enviar email de recompensa:', err));
        }
        
        res.json({
            success: true,
            message: 'Recompensa resgatada com sucesso!',
            reward: {
                id: reward.id,
                title: reward.title,
                pointsCost: reward.pointsCost
            },
            newTotalPoints: currentPoints - reward.pointsCost,
            userRewardId: userRewardRef.id
        });
        
    } catch (error) {
        console.error('Erro ao resgatar recompensa:', error);
        res.status(500).json({
            error: 'Erro ao resgatar recompensa'
        });
    }
};

/**
 * Listar recompensas resgatadas pelo usuário
 */
exports.getUserRewards = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { status } = req.query;
        
        let rewardsRef = firestore
            .collection('users')
            .doc(userId)
            .collection('rewards');
        
        // Filtrar por status se fornecido
        if (status) {
            rewardsRef = rewardsRef.where('status', '==', status);
        }
        
        const snapshot = await rewardsRef
            .orderBy('redeemedAt', 'desc')
            .get();
        
        const rewards = [];
        snapshot.forEach(doc => {
            rewards.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json({ rewards });
        
    } catch (error) {
        console.error('Erro ao listar recompensas do usuário:', error);
        res.status(500).json({
            error: 'Erro ao listar recompensas'
        });
    }
};

/**
 * Obter status de uma recompensa resgatada
 */
exports.getRedeemedReward = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { rewardId } = req.params;
        
        const rewardDoc = await firestore
            .collection('users')
            .doc(userId)
            .collection('rewards')
            .doc(rewardId)
            .get();
        
        if (!rewardDoc.exists) {
            return res.status(404).json({
                error: 'Recompensa resgatada não encontrada'
            });
        }
        
        res.json({
            id: rewardDoc.id,
            ...rewardDoc.data()
        });
        
    } catch (error) {
        console.error('Erro ao buscar recompensa resgatada:', error);
        res.status(500).json({
            error: 'Erro ao buscar recompensa'
        });
    }
};