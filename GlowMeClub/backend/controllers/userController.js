// ===== CONTROLADOR DE USUÁRIOS =====
const { firestore } = require('../config/firebase-admin');
const { calculateLevel, getPointsForNextLevel } = require('../utils/calculateLevel');

/**
 * Obter perfil do usuário
 */
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        const userDoc = await firestore
            .collection('users')
            .doc(userId)
            .get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        
        // XP determina nível (não moedas!)
        const xp = userData.xp || userData.totalPoints || 0;
        const coins = userData.coins !== undefined ? userData.coins : (userData.totalPoints || 0);
        const currentLevel = calculateLevel(xp);
        
        res.json({
            id: userDoc.id,
            ...userData,
            xp,
            coins,
            totalPoints: xp, // Compatibilidade
            currentLevel,
            nextLevelXp: getPointsForNextLevel(currentLevel),
            nextLevelPoints: getPointsForNextLevel(currentLevel) // Compatibilidade
        });
        
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({
            error: 'Erro ao buscar perfil',
            message: 'Não foi possível carregar seu perfil'
        });
    }
};

/**
 * Atualizar perfil do usuário
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { name, preferredColor, focusArea, phone, profileImage, emailPreferences } = req.body;
        
        // Validações
        const updates = {};
        
        if (name && name.trim()) {
            updates.name = name.trim();
        }
        
        if (preferredColor) {
            // Validar se é uma cor hexadecimal válida
            const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
            if (hexColorRegex.test(preferredColor)) {
                updates.preferredColor = preferredColor;
            }
        }
        
        if (focusArea) {
            const validAreas = ['Mental', 'Físico', 'Emocional', 'Espiritual', 'Financeiro', 'Aparência'];
            if (validAreas.includes(focusArea)) {
                updates.focusArea = focusArea;
            }
        }
        
        // Processar telefone (pode ser null para remover, ou string com DDI+número)
        if (phone !== undefined) {
            if (phone === null || phone === '') {
                updates.phone = null;
            } else {
                // Telefone já vem formatado do frontend (DDI + dígitos)
                updates.phone = phone;
            }
        }
        
        // Processar imagem de perfil
        if (profileImage !== undefined) {
            if (profileImage === null) {
                updates.profileImage = null;
            } else if (typeof profileImage === 'string' && profileImage.startsWith('data:image')) {
                updates.profileImage = profileImage;
            }
        }
        
        // Processar preferências de email
        if (emailPreferences && typeof emailPreferences === 'object') {
            updates.emailPreferences = {
                weekly: emailPreferences.weekly !== false,
                rewards: emailPreferences.rewards !== false,
                levelUp: emailPreferences.levelUp !== false,
                reminders: emailPreferences.reminders === true
            };
        }
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: 'Nenhum campo válido para atualizar'
            });
        }
        
        // Atualizar no Firestore
        await firestore
            .collection('users')
            .doc(userId)
            .update(updates);
        
        // Buscar dados atualizados para retornar
        const userDoc = await firestore
            .collection('users')
            .doc(userId)
            .get();
        
        const userData = userDoc.data();
        const { password: _, ...safeUserData } = userData;
        
        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            user: safeUserData
        });
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({
            error: 'Erro ao atualizar perfil',
            message: 'Não foi possível atualizar seu perfil'
        });
    }
};

/**
 * Obter XP, moedas e nível do usuário
 */
exports.getUserPoints = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        const userDoc = await firestore
            .collection('users')
            .doc(userId)
            .get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        
        // XP determina nível (não moedas!)
        const xp = userData.xp || userData.totalPoints || 0;
        const coins = userData.coins !== undefined ? userData.coins : (userData.totalPoints || 0);
        const currentLevel = calculateLevel(xp);
        const nextLevelXp = getPointsForNextLevel(currentLevel);
        
        // Calcular progresso baseado em XP
        let progress = 0;
        if (currentLevel < 5) {
            const levelThresholds = [0, 500, 1500, 3000, 5000];
            const currentLevelMin = levelThresholds[currentLevel - 1];
            const xpInLevel = xp - currentLevelMin;
            const xpNeededForNext = nextLevelXp - currentLevelMin;
            progress = Math.round((xpInLevel / xpNeededForNext) * 100);
        } else {
            progress = 100;
        }
        
        res.json({
            xp,
            coins,
            totalPoints: xp, // Compatibilidade
            currentLevel,
            nextLevelXp,
            nextLevelPoints: nextLevelXp, // Compatibilidade
            progress,
            xpToNextLevel: Math.max(0, nextLevelXp - xp),
            pointsToNextLevel: Math.max(0, nextLevelXp - xp) // Compatibilidade
        });
        
    } catch (error) {
        console.error('Erro ao buscar pontos:', error);
        res.status(500).json({
            error: 'Erro ao buscar pontos'
        });
    }
};

/**
 * Obter estatísticas do usuário
 */
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        // Buscar dados do usuário
        const userDoc = await firestore
            .collection('users')
            .doc(userId)
            .get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        
        // XP e moedas
        const xp = userData.xp || userData.totalPoints || 0;
        const coins = userData.coins !== undefined ? userData.coins : (userData.totalPoints || 0);
        
        // Contar metas
        const goalsSnapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('goals')
            .get();
        
        const totalGoals = goalsSnapshot.size;
        const completedGoals = goalsSnapshot.docs.filter(doc => doc.data().completed).length;
        
        // Contar missões do mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const missionsSnapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .where('completedAt', '>=', startOfMonth)
            .get();
        
        const completedMissions = missionsSnapshot.size;
        
        // Contar recompensas resgatadas
        const rewardsSnapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('rewards')
            .get();
        
        const redeemedRewards = rewardsSnapshot.size;
        
        res.json({
            xp,
            coins,
            totalPoints: xp, // Compatibilidade
            currentLevel: calculateLevel(xp),
            totalGoals,
            completedGoals,
            goalsCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
            completedMissionsThisMonth: completedMissions,
            redeemedRewards,
            memberSince: userData.createdAt
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            error: 'Erro ao buscar estatísticas'
        });
    }
};

/**
 * Atualizar avatar do usuário
 */
exports.updateAvatar = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { photoURL } = req.body;
        
        if (!photoURL) {
            return res.status(400).json({
                error: 'URL da foto não fornecida'
            });
        }
        
        // Validar se é uma URL válida
        try {
            new URL(photoURL);
        } catch {
            return res.status(400).json({
                error: 'URL inválida'
            });
        }
        
        // Atualizar no Firestore
        await firestore
            .collection('users')
            .doc(userId)
            .update({ photoURL });
        
        res.json({
            success: true,
            message: 'Avatar atualizado com sucesso',
            photoURL
        });
        
    } catch (error) {
        console.error('Erro ao atualizar avatar:', error);
        res.status(500).json({
            error: 'Erro ao atualizar avatar'
        });
    }
};