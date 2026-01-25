// ===== CÁLCULO DE NÍVEIS =====

/**
 * Configuração dos níveis
 */
const LEVELS = {
    1: {
        name: 'Plebeia',
        emoji: '🌱',
        message: 'Toda rainha começa aqui.',
        minPoints: 0,
        maxPoints: 499
    },
    2: {
        name: 'Princesa',
        emoji: '👑',
        message: 'Consistência é o teu novo luxo.',
        minPoints: 500,
        maxPoints: 1499
    },
    3: {
        name: 'Rainha',
        emoji: '✨',
        message: 'Tu assumes o teu lugar.',
        minPoints: 1500,
        maxPoints: 2999
    },
    4: {
        name: 'Imperatriz',
        emoji: '💎',
        message: 'Tu não pedes permissão, tu lideras.',
        minPoints: 3000,
        maxPoints: 4999
    },
    5: {
        name: 'Deusa Glow',
        emoji: '🔥',
        message: 'O glow agora é natural.',
        minPoints: 5000,
        maxPoints: Infinity
    }
};

/**
 * Calcular o nível baseado nos pontos totais
 * @param {number} totalPoints - Total de pontos do usuário
 * @returns {number} - Nível atual (1-5)
 */
function calculateLevel(totalPoints) {
    if (totalPoints < 500) return 1;    // Plebeia
    if (totalPoints < 1500) return 2;   // Princesa
    if (totalPoints < 3000) return 3;   // Rainha
    if (totalPoints < 5000) return 4;   // Imperatriz
    return 5;                            // Deusa Glow
}

/**
 * Obter pontos necessários para o próximo nível
 * @param {number} currentLevel - Nível atual
 * @returns {number} - Pontos necessários para o próximo nível
 */
function getPointsForNextLevel(currentLevel) {
    const thresholds = [500, 1500, 3000, 5000];
    
    if (currentLevel >= 1 && currentLevel < 5) {
        return thresholds[currentLevel - 1];
    }
    
    // Se já está no nível máximo
    return 5000;
}

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
 * @param {number} totalPoints - Total de pontos
 * @returns {Object} - Progresso detalhado
 */
function calculateLevelProgress(totalPoints) {
    const currentLevel = calculateLevel(totalPoints);
    const levelInfo = getLevelInfo(currentLevel);
    
    if (currentLevel === 5) {
        return {
            level: currentLevel,
            ...levelInfo,
            progress: 100,
            pointsInLevel: totalPoints - levelInfo.minPoints,
            pointsToNext: 0,
            nextLevel: null
        };
    }
    
    const nextLevelPoints = getPointsForNextLevel(currentLevel);
    const pointsInLevel = totalPoints - levelInfo.minPoints;
    const pointsNeededForNext = nextLevelPoints - levelInfo.minPoints;
    const progress = Math.round((pointsInLevel / pointsNeededForNext) * 100);
    
    return {
        level: currentLevel,
        ...levelInfo,
        progress: Math.min(100, Math.max(0, progress)),
        pointsInLevel,
        pointsToNext: nextLevelPoints - totalPoints,
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
 * Verificar se usuário subiu de nível
 * @param {number} oldPoints - Pontos anteriores
 * @param {number} newPoints - Novos pontos
 * @returns {Object|null} - Informações do novo nível ou null
 */
function checkLevelUp(oldPoints, newPoints) {
    const oldLevel = calculateLevel(oldPoints);
    const newLevel = calculateLevel(newPoints);
    
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

module.exports = {
    calculateLevel,
    getPointsForNextLevel,
    getLevelInfo,
    calculateLevelProgress,
    getAllLevels,
    checkLevelUp,
    LEVELS
};