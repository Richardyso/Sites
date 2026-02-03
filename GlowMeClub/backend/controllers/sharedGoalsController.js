const admin = require('../config/firebase-admin');
const logger = require('../utils/logger');
const { sendNotification } = require('../utils/notifications');

const db = admin.firestore();

// Buscar todas as metas compartilhadas
exports.getSharedGoals = async (req, res) => {
    try {
        const snapshot = await db.collection('sharedGoals')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        const goals = [];
        snapshot.forEach(doc => {
            goals.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.status(200).json({
            success: true,
            goals
        });
    } catch (error) {
        logger.error('Erro ao buscar metas compartilhadas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar metas compartilhadas' 
        });
    }
};

// Buscar metas compartilhadas para admin (incluindo inativas)
exports.getSharedGoalsAdmin = async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin' && req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ 
                success: false, 
                error: 'Acesso não autorizado' 
            });
        }

        const snapshot = await db.collection('sharedGoals')
            .orderBy('createdAt', 'desc')
            .get();
        
        const goals = [];
        snapshot.forEach(doc => {
            goals.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.status(200).json({
            success: true,
            goals
        });
    } catch (error) {
        logger.error('Erro ao buscar metas compartilhadas (admin):', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar metas compartilhadas' 
        });
    }
};

// Criar nova meta compartilhada
exports.createSharedGoal = async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin' && req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ 
                success: false, 
                error: 'Acesso não autorizado' 
            });
        }

        const {
            title,
            description,
            category,
            period,
            totalRequired,
            xp,
            points,
            active = true
        } = req.body;

        // Validações
        if (!title || !period || !totalRequired) {
            return res.status(400).json({ 
                success: false, 
                error: 'Campos obrigatórios: título, período e total requerido' 
            });
        }

        const validPeriods = ['weekly', 'monthly', 'yearly'];
        if (!validPeriods.includes(period)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Período inválido' 
            });
        }

        const newGoal = {
            title,
            description: description || '',
            category: category || 'Geral',
            period,
            totalRequired: parseInt(totalRequired),
            currentProgress: 0,
            xp: parseInt(xp) || 0,
            points: parseInt(points) || 0,
            active,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid
        };

        const docRef = await db.collection('sharedGoals').add(newGoal);
        
        res.status(201).json({
            success: true,
            goal: {
                id: docRef.id,
                ...newGoal,
                createdAt: new Date()
            }
        });
    } catch (error) {
        logger.error('Erro ao criar meta compartilhada:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao criar meta compartilhada' 
        });
    }
};

// Atualizar meta compartilhada
exports.updateSharedGoal = async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin' && req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ 
                success: false, 
                error: 'Acesso não autorizado' 
            });
        }

        const { id } = req.params;
        const updates = {};

        // Campos permitidos para atualização
        const allowedFields = [
            'title', 'description', 'category', 'period', 
            'totalRequired', 'xp', 'points', 'active'
        ];

        allowedFields.forEach(field => {
            if (req.body.hasOwnProperty(field)) {
                if (field === 'totalRequired' || field === 'xp' || field === 'points') {
                    updates[field] = parseInt(req.body[field]);
                } else {
                    updates[field] = req.body[field];
                }
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nenhum campo para atualizar' 
            });
        }

        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('sharedGoals').doc(id).update(updates);
        
        res.status(200).json({
            success: true,
            message: 'Meta compartilhada atualizada com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao atualizar meta compartilhada:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao atualizar meta compartilhada' 
        });
    }
};

// Deletar meta compartilhada
exports.deleteSharedGoal = async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin' && req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ 
                success: false, 
                error: 'Acesso não autorizado' 
            });
        }

        const { id } = req.params;
        
        await db.collection('sharedGoals').doc(id).delete();
        
        // Deletar também o progresso de todos os usuários para essa meta
        const progressSnapshot = await db.collection('sharedGoalProgress')
            .where('goalId', '==', id)
            .get();
        
        const batch = db.batch();
        progressSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        res.status(200).json({
            success: true,
            message: 'Meta compartilhada deletada com sucesso'
        });
    } catch (error) {
        logger.error('Erro ao deletar meta compartilhada:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao deletar meta compartilhada' 
        });
    }
};

// Buscar progresso do usuário nas metas compartilhadas
exports.getUserSharedGoalProgress = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        // Buscar todas as metas compartilhadas ativas
        const goalsSnapshot = await db.collection('sharedGoals')
            .where('active', '==', true)
            .get();
        
        const goalsWithProgress = [];
        
        for (const goalDoc of goalsSnapshot.docs) {
            const goalData = {
                id: goalDoc.id,
                ...goalDoc.data()
            };
            
            // Buscar progresso do usuário para esta meta
            const progressDoc = await db.collection('sharedGoalProgress')
                .doc(`${userId}_${goalDoc.id}`)
                .get();
            
            if (progressDoc.exists) {
                const progressData = progressDoc.data();
                goalData.userProgress = progressData.progress || 0;
                goalData.userCompleted = progressData.completed || false;
                goalData.userNotes = progressData.notes || '';
                goalData.completedAt = progressData.completedAt;
            } else {
                goalData.userProgress = 0;
                goalData.userCompleted = false;
                goalData.userNotes = '';
            }
            
            goalsWithProgress.push(goalData);
        }
        
        res.status(200).json({
            success: true,
            goals: goalsWithProgress
        });
    } catch (error) {
        logger.error('Erro ao buscar progresso das metas compartilhadas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar progresso das metas compartilhadas' 
        });
    }
};

// Atualizar progresso do usuário em uma meta compartilhada
exports.updateUserSharedGoalProgress = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { goalId } = req.params;
        const { progress, notes, completed } = req.body;
        
        // Verificar se a meta existe e está ativa
        const goalDoc = await db.collection('sharedGoals').doc(goalId).get();
        if (!goalDoc.exists || !goalDoc.data().active) {
            return res.status(404).json({ 
                success: false, 
                error: 'Meta compartilhada não encontrada ou inativa' 
            });
        }
        
        const goalData = goalDoc.data();
        const progressId = `${userId}_${goalId}`;
        
        const progressData = {
            userId,
            goalId,
            progress: progress !== undefined ? parseInt(progress) : 0,
            notes: notes || '',
            completed: completed || false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Se a meta foi completada agora, adicionar recompensas
        const progressRef = db.collection('sharedGoalProgress').doc(progressId);
        const existingProgress = await progressRef.get();
        const wasCompleted = existingProgress.exists && existingProgress.data().completed;
        
        if (completed && !wasCompleted) {
            progressData.completedAt = admin.firestore.FieldValue.serverTimestamp();
            
            // Adicionar XP e pontos se configurados
            if (goalData.xp > 0 || goalData.points > 0) {
                const userRef = db.collection('users').doc(userId);
                const userDoc = await userRef.get();
                const userData = userDoc.data();
                
                const updates = {};
                if (goalData.xp > 0) {
                    updates.totalXp = (userData.totalXp || 0) + goalData.xp;
                }
                if (goalData.points > 0) {
                    updates.points = (userData.points || 0) + goalData.points;
                }
                
                await userRef.update(updates);
                
                // Registrar no histórico
                const historyData = {
                    userId,
                    type: 'sharedGoalCompleted',
                    action: `Completou meta compartilhada: ${goalData.title}`,
                    xpGained: goalData.xp || 0,
                    pointsGained: goalData.points || 0,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };
                
                await db.collection('pointsHistory').add(historyData);
                
                // Enviar notificação
                await sendNotification(userId, {
                    title: 'Meta Compartilhada Completada! 🎯',
                    body: `Parabéns! Você completou a meta "${goalData.title}" e ganhou ${goalData.xp} XP e ${goalData.points} moedas!`,
                    type: 'sharedGoalCompleted',
                    data: { goalId }
                });
            }
        }
        
        await progressRef.set(progressData, { merge: true });
        
        res.status(200).json({
            success: true,
            message: 'Progresso atualizado com sucesso',
            rewarded: completed && !wasCompleted && (goalData.xp > 0 || goalData.points > 0)
        });
    } catch (error) {
        logger.error('Erro ao atualizar progresso da meta compartilhada:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao atualizar progresso' 
        });
    }
};

// Buscar todos os progressos de uma meta específica (admin)
exports.getSharedGoalProgressAdmin = async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin' && req.user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ 
                success: false, 
                error: 'Acesso não autorizado' 
            });
        }

        const { goalId } = req.params;
        
        // Buscar todos os progressos para esta meta
        const progressSnapshot = await db.collection('sharedGoalProgress')
            .where('goalId', '==', goalId)
            .get();
        
        const progressList = [];
        
        for (const doc of progressSnapshot.docs) {
            const progressData = doc.data();
            
            // Buscar dados do usuário
            const userDoc = await db.collection('users').doc(progressData.userId).get();
            if (userDoc.exists) {
                progressList.push({
                    id: doc.id,
                    ...progressData,
                    userName: userDoc.data().name || 'Usuário',
                    userEmail: userDoc.data().email
                });
            }
        }
        
        res.status(200).json({
            success: true,
            progress: progressList
        });
    } catch (error) {
        logger.error('Erro ao buscar progresso da meta (admin):', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar progresso' 
        });
    }
};