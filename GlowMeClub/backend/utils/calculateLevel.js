// ===== CÁLCULO DE NÍVEIS E SISTEMA DE XP/MOEDAS =====

/**
 * Configuração dos níveis (baseado em XP, não em moedas)
 * XP = experiência acumulada (nunca decresce) - determina NÍVEL e RANKING
 * Moedas = recurso gastável - usado para RECOMPENSAS
 */
const LEVELS = {
    1: {
        name: 'Plebeia',
        emoji: '🌱',
        message: 'Toda rainha começa aqui.',
        minXp: 0,
        maxXp: 499
    },
    2: {
        name: 'Princesa',
        emoji: '👑',
        message: 'Consistência é o teu novo luxo.',
        minXp: 500,
        maxXp: 1499
    },
    3: {
        name: 'Rainha',
        emoji: '✨',
        message: 'Tu assumes o teu lugar.',
        minXp: 1500,
        maxXp: 2999
    },
    4: {
        name: 'Imperatriz',
        emoji: '💎',
        message: 'Tu não pedes permissão, tu lideras.',
        minXp: 3000,
        maxXp: 4999
    },
    5: {
        name: 'Deusa Glow',
        emoji: '🔥',
        message: 'O glow agora é natural.',
        minXp: 5000,
        maxXp: Infinity
    }
};

/**
 * Configuração de recompensas por tipo de ação
 * Cada ação dá XP (progresso) e Moedas (para gastar)
 */
const ACTION_REWARDS = {
    mission_completed: { xp: 10, coins: 10 },      // Missão diária
    goal_completed: { xp: 50, coins: 30 },         // Meta concluída
    checkin: { xp: 10, coins: 10 },                // Check-in diário (base)
    profile_complete: { xp: 20, coins: 15 },       // Perfil completo
    admin_grant: { xp: 1, coins: 1 }               // Base para grant manual (multiplicado)
};

/**
 * Sistema de Streak Progressivo para Check-in (Ciclo de 5 dias)
 * 
 * O bônus aumenta conforme a usuária mantém a constância:
 * - Dia 1: Base (10 XP, 10 moedas)
 * - Dia 2: +20% (12 XP, 12 moedas)
 * - Dia 3: +50% (15 XP, 15 moedas)
 * - Dia 4: +80% (18 XP, 18 moedas)
 * - Dia 5+: +120% (22 XP, 22 moedas) - Bônus máximo mantido enquanto continuar
 * 
 * Se perder um dia, volta para o Dia 1!
 */
const STREAK_REWARDS = {
    1: { xp: 10, coins: 10, emoji: '🌱', message: 'Primeiro passo!' },
    2: { xp: 12, coins: 12, emoji: '💪', message: 'Segundo dia! Continue assim!' },
    3: { xp: 15, coins: 15, emoji: '✨', message: 'Três dias seguidos! Você está brilhando!' },
    4: { xp: 18, coins: 18, emoji: '🔥', message: 'Quatro dias! Quase lá!' },
    5: { xp: 22, coins: 22, emoji: '🏆', message: 'CINCO DIAS! Bônus máximo desbloqueado!' }
};

/**
 * Obter recompensa do streak pelo nível
 * @param {number} streakDays - Dias consecutivos de check-in
 * @returns {Object} - { xp, coins, emoji, message }
 */
function getStreakReward(streakDays) {
    const level = Math.min(Math.max(streakDays, 1), 5);
    return STREAK_REWARDS[level];
}

/**
 * Calcular o nível baseado no XP total (não moedas!)
 * @param {number} totalXp - Total de XP do usuário
 * @returns {number} - Nível atual (1-5)
 */
function calculateLevel(totalXp) {
    if (totalXp < 500) return 1;    // Plebeia
    if (totalXp < 1500) return 2;   // Princesa
    if (totalXp < 3000) return 3;   // Rainha
    if (totalXp < 5000) return 4;   // Imperatriz
    return 5;                        // Deusa Glow
}

/**
 * Obter XP necessário para o próximo nível
 * @param {number} currentLevel - Nível atual
 * @returns {number} - XP necessário para o próximo nível
 */
function getXpForNextLevel(currentLevel) {
    const thresholds = [500, 1500, 3000, 5000];
    
    if (currentLevel >= 1 && currentLevel < 5) {
        return thresholds[currentLevel - 1];
    }
    
    // Se já está no nível máximo
    return 5000;
}

// Alias para compatibilidade
const getPointsForNextLevel = getXpForNextLevel;

/**
 * Obter informações detalhadas do nível
 * @param {number} level - Nível
 * @returns {Object} - Informações do nível
 */
function getLevelInfo(level) {
    return LEVELS[level] || LEVELS[1];
}

/**
 * Calcular progresso no nível atual
 * @param {number} totalXp - Total de XP
 * @returns {Object} - Progresso detalhado
 */
function calculateLevelProgress(totalXp) {
    const currentLevel = calculateLevel(totalXp);
    const levelInfo = getLevelInfo(currentLevel);
    
    if (currentLevel === 5) {
        return {
            level: currentLevel,
            ...levelInfo,
            progress: 100,
            xpInLevel: totalXp - levelInfo.minXp,
            xpToNext: 0,
            nextLevel: null
        };
    }
    
    const nextLevelXp = getXpForNextLevel(currentLevel);
    const xpInLevel = totalXp - levelInfo.minXp;
    const xpNeededForNext = nextLevelXp - levelInfo.minXp;
    const progress = Math.round((xpInLevel / xpNeededForNext) * 100);
    
    return {
        level: currentLevel,
        ...levelInfo,
        progress: Math.min(100, Math.max(0, progress)),
        xpInLevel,
        xpToNext: nextLevelXp - totalXp,
        nextLevel: getLevelInfo(currentLevel + 1)
    };
}

/**
 * Obter todas as informações de níveis
 * @returns {Object} - Todos os níveis
 */
function getAllLevels() {
    return LEVELS;
}

/**
 * Verificar se usuário subiu de nível (baseado em XP)
 * @param {number} oldXp - XP anterior
 * @param {number} newXp - Novo XP
 * @returns {Object|null} - Informações do novo nível ou null
 */
function checkLevelUp(oldXp, newXp) {
    const oldLevel = calculateLevel(oldXp);
    const newLevel = calculateLevel(newXp);
    
    if (newLevel > oldLevel) {
        return {
            leveledUp: true,
            oldLevel,
            newLevel,
            levelInfo: getLevelInfo(newLevel)
        };
    }
    
    return null;
}

/**
 * Obter recompensa para um tipo de ação
 * @param {string} actionType - Tipo da ação
 * @returns {Object} - { xp, coins }
 */
function getActionReward(actionType) {
    return ACTION_REWARDS[actionType] || { xp: 0, coins: 0 };
}

module.exports = {
    calculateLevel,
    getXpForNextLevel,
    getPointsForNextLevel, // Alias para compatibilidade
    getLevelInfo,
    calculateLevelProgress,
    getAllLevels,
    checkLevelUp,
    getActionReward,
    getStreakReward,
    LEVELS,
    ACTION_REWARDS,
    STREAK_REWARDS
};