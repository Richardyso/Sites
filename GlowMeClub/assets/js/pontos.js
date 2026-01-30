// ===== PONTOS UNIFICADO =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// Dados
let currentUser = null;
let pointsHistory = [];

// Carregar histórico de pontos
async function loadPointsHistory() {
    const token = window.api.getToken();
    
    if (!token) {
        logger.error('Sem token, redirecionando para login...');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Buscar dados do usuário
        const authData = await window.api.get('/auth/me');
        currentUser = authData.user;
        
        // Atualizar header e estatísticas
        updateHeader();
        updateStats();
        
        // Carregar histórico
        await loadHistoryFromBackend();
        
    } catch (error) {
        logger.error('Erro ao carregar pontos:', error);
        
        // Tentar usar dados do cache primeiro
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                currentUser = JSON.parse(cachedData);
                updateHeader();
                updateStats();
                await loadHistoryFromBackend();
                logger.warn('⚠️ Usando dados do cache');
                return;
            } catch (e) {
                logger.error('Erro ao parsear cache');
            }
        }
        
        // Se não conseguir usar cache e for erro de autenticação explícito (401)
        if (error.status === 401 || (error.message && error.message.includes('401'))) {
            window.api.removeToken();
            window.location.href = 'login.html';
        } else {
            // Para outros erros, mostrar histórico vazio
            pointsHistory = [];
            displayHistory();
        }
    }
}

// Atualizar header
function updateHeader() {
    if (!currentUser) return;
    
    // Usa função compartilhada que suporta imagem de perfil
    if (window.updateHeaderAvatar) {
        window.updateHeaderAvatar(currentUser);
    }
}

// Configuração de níveis (mesma do backend - ÚNICA FONTE DE VERDADE)
const LEVELS = {
    1: { name: 'Plebeia', emoji: '🌱', message: 'Toda rainha começa aqui.', minXp: 0, maxXp: 499 },
    2: { name: 'Princesa', emoji: '👑', message: 'Consistência é o teu novo luxo.', minXp: 500, maxXp: 1499 },
    3: { name: 'Rainha', emoji: '✨', message: 'Tu assumes o teu lugar.', minXp: 1500, maxXp: 2999 },
    4: { name: 'Imperatriz', emoji: '💎', message: 'Tu não pedes permissão, tu lideras.', minXp: 3000, maxXp: 4999 },
    5: { name: 'Deusa Glow', emoji: '🔥', message: 'O glow agora é natural.', minXp: 5000, maxXp: Infinity }
};

// Calcular nível baseado em XP
function calculateLevel(xp) {
    if (xp < 500) return 1;
    if (xp < 1500) return 2;
    if (xp < 3000) return 3;
    if (xp < 5000) return 4;
    return 5;
}

// Obter XP necessário para próximo nível
function getXpForNextLevel(currentLevel) {
    const thresholds = [500, 1500, 3000, 5000];
    if (currentLevel >= 1 && currentLevel < 5) {
        return thresholds[currentLevel - 1];
    }
    return 5000;
}

// Atualizar estatísticas
function updateStats() {
    if (!currentUser) return;
    
    // XP determina nível (não gastável)
    const totalXp = currentUser.xp || currentUser.totalPoints || 0;
    // Moedas são para recompensas (gastável)
    const totalCoins = currentUser.coins !== undefined ? currentUser.coins : (currentUser.totalPoints || 0);
    
    const currentLevelNum = calculateLevel(totalXp);
    const currentLevelData = LEVELS[currentLevelNum];
    const nextLevelData = LEVELS[currentLevelNum + 1] || currentLevelData;
    
    // Total de XP
    const totalPointsEl = document.getElementById('totalPoints');
    if (totalPointsEl) totalPointsEl.textContent = totalXp.toLocaleString('pt-BR');
    
    // Total de Moedas (se existir elemento)
    const totalCoinsEl = document.getElementById('totalCoins');
    if (totalCoinsEl) totalCoinsEl.textContent = totalCoins.toLocaleString('pt-BR');
    
    // Nível atual
    const currentLevelEl = document.getElementById('currentLevel');
    if (currentLevelEl) currentLevelEl.textContent = currentLevelNum;
    
    // Nome e emoji do nível
    const levelNameEl = document.getElementById('levelName');
    if (levelNameEl) levelNameEl.textContent = currentLevelData.name;
    
    const levelEmojiEl = document.getElementById('levelEmoji');
    if (levelEmojiEl) levelEmojiEl.textContent = currentLevelData.emoji;
    
    // Calcular progresso para próximo nível (baseado em XP)
    const xpInCurrentLevel = totalXp - currentLevelData.minXp;
    const xpNeededForNext = (nextLevelData.minXp || getXpForNextLevel(currentLevelNum)) - currentLevelData.minXp;
    const progressPercent = currentLevelNum >= 5 ? 100 : Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100);
    const xpToNext = currentLevelNum >= 5 ? 0 : Math.max(getXpForNextLevel(currentLevelNum) - totalXp, 0);
    
    // Atualizar barra de progresso
    const progressBar = document.getElementById('levelProgressBar');
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    
    // XP para próximo nível
    const pointsToNextEl = document.getElementById('pointsToNext');
    if (pointsToNextEl) pointsToNextEl.textContent = xpToNext.toLocaleString('pt-BR');
    
    // XP atuais no nível
    const currentLevelPointsEl = document.getElementById('currentLevelPoints');
    if (currentLevelPointsEl) currentLevelPointsEl.textContent = totalXp.toLocaleString('pt-BR');
    
    // XP do próximo nível
    const nextLevelPointsEl = document.getElementById('nextLevelPoints');
    if (nextLevelPointsEl) nextLevelPointsEl.textContent = (nextLevelData.minXp || getXpForNextLevel(currentLevelNum)).toLocaleString('pt-BR');
}

// Carregar histórico do backend
async function loadHistoryFromBackend() {
    try {
        const data = await window.api.get('/points/history');
        pointsHistory = data.history || [];
        
        if (pointsHistory.length === 0) {
            logger.info('Nenhum histórico de pontos encontrado');
        } else {
            logger.info(`${pointsHistory.length} registros de histórico carregados`);
        }
        
        displayHistory();
    } catch (error) {
        logger.error('Erro ao carregar histórico:', error);
        pointsHistory = [];
        displayHistory();
    }
}

// Exibir histórico
function displayHistory() {
    const tableBody = document.getElementById('historyTableBody');
    const emptyHistory = document.getElementById('emptyHistory');
    
    if (!tableBody) return;
    
    if (pointsHistory.length === 0) {
        tableBody.innerHTML = '';
        if (emptyHistory) emptyHistory.style.display = 'block';
        return;
    }
    
    if (emptyHistory) emptyHistory.style.display = 'none';
    
    tableBody.innerHTML = pointsHistory.map(item => {
        // Tratar data (pode vir como string ou objeto Date)
        let date;
        if (item.date) {
            date = new Date(item.date);
        } else if (item.createdAt) {
            date = new Date(item.createdAt);
        } else {
            date = new Date();
        }
        
        const dateStr = formatDate(date);
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // XP e Moedas separados (com fallback para points antigo)
        const xp = item.xp !== undefined ? item.xp : item.points;
        const coins = item.coins !== undefined ? item.coins : item.points;
        
        // Determinar se é ganho, gasto ou penalização
        const isPenalty = item.type === 'admin_penalty';
        const isSpent = item.type === 'spent' || item.type === 'reward_redeemed';
        const isEarned = !isPenalty && !isSpent && (xp > 0 || coins > 0);
        
        // Classe de estilo
        let pointsClass = 'points-positive';
        if (isPenalty) pointsClass = 'points-penalty';
        else if (isSpent || xp < 0 || coins < 0) pointsClass = 'points-negative';
        
        // Montar string de pontos
        let pointsDisplay = [];
        if (xp !== undefined && xp !== 0) {
            const xpSign = xp > 0 ? '+' : '';
            pointsDisplay.push(`${xpSign}${xp} XP`);
        }
        if (coins !== undefined && coins !== 0 && coins !== xp) {
            const coinsSign = coins > 0 ? '+' : '';
            pointsDisplay.push(`${coinsSign}${coins} 🪙`);
        }
        // Fallback para points antigo
        if (pointsDisplay.length === 0 && item.points !== undefined && item.points !== 0) {
            const sign = item.points > 0 ? '+' : '';
            pointsDisplay.push(`${sign}${item.points} pts`);
        }
        
        // Obter descrição da ação
        const actionText = item.reason || item.action || 'Pontos';
        const icon = item.icon || getIconForType(item.type);
        
        return `
            <tr class="${isPenalty ? 'penalty-row' : ''}">
                <td class="history-date">${dateStr}, ${timeStr}</td>
                <td class="history-action">${icon} ${actionText}</td>
                <td class="history-points ${pointsClass}">${pointsDisplay.join(' / ') || '0'}</td>
            </tr>
        `;
    }).join('');
}

// Obter ícone baseado no tipo
function getIconForType(type) {
    const icons = {
        'goal_completed': '🎯',
        'mission_completed': '⭐',
        'admin_grant': '🎁',
        'admin_penalty': '⚠️',
        'streak_bonus': '🔥',
        'profile_complete': '👤',
        'reward_redeemed': '🛍️',
        'checkin': '✅',
        'earned': '✨',
        'spent': '💸'
    };
    return icons[type] || '✨';
}

// Formatar data de forma amigável
function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
    } else {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
}

// Filtrar histórico
window.filterHistory = function(filter) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Por enquanto apenas visual
    logger.info(`Filtro aplicado: ${filter}`);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    logger.info('💎 Carregando histórico de pontos...');
    loadPointsHistory();
});