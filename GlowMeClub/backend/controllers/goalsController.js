// ===== CONTROLADOR DE METAS =====
const { firestore, serverTimestamp, increment } = require('../config/firebase-admin');
const { checkLevelUp, getActionReward } = require('../utils/calculateLevel');
const { sendLevelUpEmail } = require('../utils/email');

/**
 * Listar todas as metas do usuário
 */
exports.getGoals = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { category, completed } = req.query;
        
        let goalsRef = firestore
            .collection('users')
            .doc(userId)
            .collection('goals')
            .orderBy('createdAt', 'desc');
        
        // Filtros opcionais
        if (category) {
            goalsRef = goalsRef.where('category', '==', category);
        }
        
        if (completed !== undefined) {
            goalsRef = goalsRef.where('completed', '==', completed === 'true');
        }
        
        const snapshot = await goalsRef.get();
        
        const goals = [];
        snapshot.forEach(doc => {
            goals.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json({ goals });
        
    } catch (error) {
        console.error('Erro ao listar metas:', error);
        res.status(500).json({
            error: 'Erro ao listar metas'
        });
    }
};

/**
 * Obter uma meta específica
 */
exports.getGoal = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        
        const goalDoc = await firestore
            .collection('users')
            .doc(userId)
            .collection('goals')
            .doc(id)
            .get();
        
        if (!goalDoc.exists) {
            return res.status(404).json({
                error: 'Meta não encontrada'
            });
        }
        
        res.json({
            id: goalDoc.id,
            ...goalDoc.data()
        });
        
    } catch (error) {
        console.error('Erro ao buscar meta:', error);
        res.status(500).json({
            error: 'Erro ao buscar meta'
        });
    }
};

/**
 * Criar nova meta
 */
exports.createGoal = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { title, category, deadline, description, period, notes } = req.body;
        
        // Validações
        if (!title || !title.trim()) {
            return res.status(400).json({
                error: 'Título é obrigatório'
            });
        }
        
        const validCategories = ['Mental', 'Físico', 'Emocional', 'Espiritual', 'Financeiro', 'Aparência'];
        if (!category || !validCategories.includes(category)) {
            return res.status(400).json({
                error: 'Categoria inválida'
            });
        }
        
        // Validar período
        const validPeriods = ['weekly', 'monthly', 'yearly'];
        const goalPeriod = period && validPeriods.includes(period) ? period : 'monthly';
        
        // Criar dados da meta
        const goalData = {
            title: title.trim(),
            category,
            period: goalPeriod,
            progress: 0,
            completed: false,
            notes: notes && notes.trim() ? notes.trim() : null,
            createdAt: serverTimestamp()
        };
        
        // Adicionar descrição se fornecida
        if (description && description.trim()) {
            goalData.description = description.trim();
        }
        
        // Adicionar deadline se fornecido
        if (deadline) {
            const deadlineDate = new Date(deadline);
            if (deadlineDate < new Date()) {
                return res.status(400).json({
                    error: 'A data limite deve ser no futuro'
                });
            }
            goalData.deadline = deadlineDate;
        }
        
        // Criar meta no Firestore
        const goalRef = await firestore
            .collection('users')
            .doc(userId)
            .collection('goals')
            .add(goalData);
        
        res.status(201).json({
            success: true,
            id: goalRef.id,
            ...goalData
        });
        
    } catch (error) {
        console.error('Erro ao criar meta:', error);
        res.status(500).json({
            error: 'Erro ao criar meta'
        });
    }
};

/**
 * Atualizar meta existente
 */
exports.updateGoal = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        const { title, category, deadline, progress, notes, period, description } = req.body;
        
        // Verificar se a meta existe
        const goalRef = firestore
            .collection('users')
            .doc(userId)
            .collection('goals')
            .doc(id);
        
        const goalDoc = await goalRef.get();
        
        if (!goalDoc.exists) {
            return res.status(404).json({
                error: 'Meta não encontrada'
            });
        }
        
        // Preparar atualizações
        const updates = {};
        
        if (title && title.trim()) {
            updates.title = title.trim();
        }
        
        const validCategories = ['Mental', 'Físico', 'Emocional', 'Espiritual', 'Financeiro', 'Aparência'];
        if (category && validCategories.includes(category)) {
            updates.category = category;
        }
        
        // Atualizar período se fornecido
        const validPeriods = ['weekly', 'monthly', 'yearly'];
        if (period && validPeriods.includes(period)) {
            updates.period = period;
        }
        
        // Atualizar descrição
        if (description !== undefined) {
            updates.description = description && description.trim() ? description.trim() : null;
        }
        
        // Atualizar anotações
        if (notes !== undefined) {
            updates.notes = notes && notes.trim() ? notes.trim() : null;
        }
        
        if (deadline !== undefined) {
            if (deadline) {
                const deadlineDate = new Date(deadline);
                if (deadlineDate < new Date()) {
                    return res.status(400).json({
                        error: 'A data limite deve ser no futuro'
                    });
                }
                updates.deadline = deadlineDate;
            } else {
                updates.deadline = null;
            }
        }
        
        if (progress !== undefined) {
            const progressNum = parseInt(progress);
            if (progressNum >= 0 && progressNum <= 100) {
                updates.progress = progressNum;
            }
        }
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: 'Nenhum campo válido para atualizar'
            });
        }
        
        // Atualizar no Firestore
        await goalRef.update(updates);
        
        res.json({
            success: true,
            message: 'Meta atualizada com sucesso',
            updates
        });
        
    } catch (error) {
        console.error('Erro ao atualizar meta:', error);
        res.status(500).json({
            error: 'Erro ao atualizar meta'
        });
    }
};

/**
 * Deletar meta
 */
exports.deleteGoal = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        
        const goalRef = firestore
            .collection('users')
            .doc(userId)
            .collection('goals')
            .doc(id);
        
        const goalDoc = await goalRef.get();
        
        if (!goalDoc.exists) {
            return res.status(404).json({
                error: 'Meta não encontrada'
            });
        }
        
        await goalRef.delete();
        
        res.json({
            success: true,
            message: 'Meta deletada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao deletar meta:', error);
        res.status(500).json({
            error: 'Erro ao deletar meta'
        });
    }
};

/**
 * Marcar meta como concluída e adicionar XP + Moedas
 */
exports.completeGoal = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        
        // Obter recompensa da ação (XP e Moedas)
        const reward = getActionReward('goal_completed');
        const XP_EARNED = reward.xp;      // 50 XP
        const COINS_EARNED = reward.coins; // 30 Moedas
        
        // Buscar a meta
        const goalRef = firestore
            .collection('users')
            .doc(userId)
            .collection('goals')
            .doc(id);
        
        const goalDoc = await goalRef.get();
        
        if (!goalDoc.exists) {
            return res.status(404).json({
                error: 'Meta não encontrada'
            });
        }
        
        const goalData = goalDoc.data();
        
        if (goalData.completed) {
            return res.status(400).json({
                error: 'Meta já foi concluída'
            });
        }
        
        // Usar transação para garantir consistência
        const batch = firestore.batch();
        
        // Marcar meta como concluída
        batch.update(goalRef, {
            completed: true,
            progress: 100,
            completedAt: serverTimestamp()
        });
        
        // Buscar dados atuais do usuário
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        
        // XP atual e novo (para cálculo de level up)
        const currentXp = userData.xp || userData.totalPoints || 0;
        const newXp = currentXp + XP_EARNED;
        
        // Moedas atuais e novas
        const currentCoins = userData.coins !== undefined ? userData.coins : (userData.totalPoints || 0);
        const newCoins = currentCoins + COINS_EARNED;
        
        // Atualizar XP e Moedas do usuário
        batch.update(userRef, {
            xp: increment(XP_EARNED),
            coins: increment(COINS_EARNED),
            totalPoints: increment(XP_EARNED) // Manter totalPoints = xp para compatibilidade
        });
        
        // Adicionar ao histórico de pontos
        const historyRef = firestore
            .collection('users')
            .doc(userId)
            .collection('pointsHistory')
            .doc();
        
        batch.set(historyRef, {
            reason: `Meta concluída: ${goalData.title}`,
            action: `Meta concluída: ${goalData.title}`,
            xp: XP_EARNED,
            coins: COINS_EARNED,
            points: XP_EARNED, // Compatibilidade
            type: 'goal_completed',
            createdAt: serverTimestamp()
        });
        
        // Executar transação
        await batch.commit();
        
        // Verificar se subiu de nível (baseado em XP)
        const levelUp = checkLevelUp(currentXp, newXp);
        
        if (levelUp && userData.email) {
            // Enviar email de level up (não bloquear resposta)
            sendLevelUpEmail(
                userData.email,
                userData.name,
                levelUp.newLevel,
                levelUp.levelInfo.name,
                levelUp.levelInfo.message
            ).catch(err => console.error('Erro ao enviar email de level up:', err));
        }
        
        res.json({
            success: true,
            message: 'Meta concluída com sucesso!',
            xpEarned: XP_EARNED,
            coinsEarned: COINS_EARNED,
            pointsEarned: XP_EARNED, // Compatibilidade
            newXp,
            newCoins,
            newTotalPoints: newXp, // Compatibilidade
            levelUp: levelUp ? {
                newLevel: levelUp.newLevel,
                levelName: levelUp.levelInfo.name,
                message: levelUp.levelInfo.message
            } : null
        });
        
    } catch (error) {
        console.error('Erro ao completar meta:', error);
        res.status(500).json({
            error: 'Erro ao completar meta'
        });
    }
};

/**
 * Atualizar progresso da meta
 */
exports.updateProgress = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { id } = req.params;
        const { progress } = req.body;
        
        if (progress === undefined || progress === null) {
            return res.status(400).json({
                error: 'Progresso é obrigatório'
            });
        }
        
        const progressNum = parseInt(progress);
        
        if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
            return res.status(400).json({
                error: 'Progresso deve ser um número entre 0 e 100'
            });
        }
        
        const goalRef = firestore
            .collection('users')
            .doc(userId)
            .collection('goals')
            .doc(id);
        
        const goalDoc = await goalRef.get();
        
        if (!goalDoc.exists) {
            return res.status(404).json({
                error: 'Meta não encontrada'
            });
        }
        
        // Atualizar progresso
        await goalRef.update({
            progress: progressNum,
            // Se progresso for 100, marcar como concluída
            ...(progressNum === 100 ? { completed: true, completedAt: serverTimestamp() } : {})
        });
        
        res.json({
            success: true,
            message: 'Progresso atualizado com sucesso',
            progress: progressNum
        });
        
    } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
        res.status(500).json({
            error: 'Erro ao atualizar progresso'
        });
    }
};