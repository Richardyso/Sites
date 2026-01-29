// ===== CONTROLADOR DE RECOMPENSAS =====
const { firestore, serverTimestamp } = require('../config/firebase-admin');
const { sendRewardEmail } = require('../utils/email');

/**
 * Listar catálogo de recompensas
 */
exports.getRewardsLibrary = async (req, res) => {
    try {
        const { category, available } = req.query;
        
        // Buscar recompensas do Firestore
        const rewardsSnapshot = await firestore.collection('rewards').get();
        const rewards = [];
        
        rewardsSnapshot.forEach(doc => {
            const rewardData = doc.data();
            // Aplicar filtros
            if ((!category || rewardData.category === category) &&
                (available === undefined || rewardData.available === (available === 'true'))) {
                rewards.push({
                    id: doc.id,
                    ...rewardData
                });
            }
        });
        
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
        
        // Buscar do Firestore
        const rewardDoc = await firestore
            .collection('rewards')
            .doc(id)
            .get();
        
        if (!rewardDoc.exists) {
            return res.status(404).json({
                error: 'Recompensa não encontrada'
            });
        }
        
        const reward = {
            id: rewardDoc.id,
            ...rewardDoc.data()
        };
        
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
        
        // Buscar do Firestore
        const rewardDoc = await firestore
            .collection('rewards')
            .doc(id)
            .get();
        
        if (!rewardDoc.exists) {
            return res.status(404).json({
                error: 'Recompensa não encontrada'
            });
        }
        
        const reward = {
            id: rewardDoc.id,
            ...rewardDoc.data()
        };
        
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
        
        // Usar points OU pointsCost (compatibilidade com recompensas antigas e novas)
        const rewardCost = reward.points || reward.pointsCost || 0;
        
        // Validar que o custo é um número válido
        if (!rewardCost || isNaN(rewardCost) || rewardCost <= 0) {
            console.error('Custo da recompensa inválido:', rewardCost, reward);
            return res.status(400).json({
                error: 'Recompensa com custo inválido'
            });
        }
        
        // Verificar se tem pontos suficientes
        if (currentPoints < rewardCost) {
            return res.status(400).json({
                error: 'Pontos insuficientes',
                message: `Você precisa de ${rewardCost - currentPoints} pontos a mais`,
                currentPoints,
                required: rewardCost
            });
        }
        
        // Calcular novos pontos
        const newTotalPoints = currentPoints - rewardCost;
        
        // Validar que o resultado é um número válido
        if (isNaN(newTotalPoints) || newTotalPoints < 0) {
            console.error('Erro no cálculo de pontos:', { currentPoints, rewardCost, newTotalPoints });
            return res.status(500).json({
                error: 'Erro ao calcular pontos'
            });
        }
        
        // Usar transação para garantir consistência
        const batch = firestore.batch();
        
        // Descontar pontos
        batch.update(userRef, {
            totalPoints: newTotalPoints
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
            pointsCost: rewardCost,
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
            reason: `Recompensa resgatada: ${reward.title}`,
            action: `Recompensa resgatada: ${reward.title}`,
            points: -rewardCost,
            type: 'reward_redeemed',
            createdAt: serverTimestamp()
        });
        
        // Executar transação
        await batch.commit();
        
        console.log(`✅ Recompensa resgatada: ${reward.title} por ${rewardCost} pts. Usuário ${userId} agora tem ${newTotalPoints} pts`);
        
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
                pointsCost: rewardCost
            },
            newTotalPoints: newTotalPoints,
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