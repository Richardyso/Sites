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
    
    // Total de BabiPoints (Moedas - gastáveis)
    const totalPointsEl = document.getElementById('totalPoints');
    if (totalPointsEl) totalPointsEl.textContent = totalCoins.toLocaleString('pt-BR');
    
    // Total de XP (se existir elemento separado)
    const totalXpEl = document.getElementById('totalXp');
    if (totalXpEl) totalXpEl.textContent = totalXp.toLocaleString('pt-BR');
    
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

// Filtro atual
let currentFilter = 'all';

// Exibir histórico
function displayHistory() {
    const tableBody = document.getElementById('historyTableBody');
    const emptyHistory = document.getElementById('emptyHistory');
    
    if (!tableBody) return;
    
    // Aplicar filtro
    let filteredHistory = pointsHistory;
    if (currentFilter === 'earned') {
        filteredHistory = pointsHistory.filter(item => {
            const xp = item.xp !== undefined ? item.xp : (item.points || 0);
            const coins = item.coins !== undefined ? item.coins : (item.points || 0);
            return (xp > 0 || coins > 0) && item.type !== 'admin_penalty';
        });
    } else if (currentFilter === 'spent') {
        filteredHistory = pointsHistory.filter(item => {
            const xp = item.xp !== undefined ? item.xp : (item.points || 0);
            const coins = item.coins !== undefined ? item.coins : (item.points || 0);
            return (xp < 0 || coins < 0 || item.type === 'spent' || item.type === 'reward_redeemed') && item.type !== 'admin_penalty';
        });
    } else if (currentFilter === 'penalty') {
        filteredHistory = pointsHistory.filter(item => item.type === 'admin_penalty');
    }
    
    if (filteredHistory.length === 0) {
        tableBody.innerHTML = '';
        if (emptyHistory) {
            emptyHistory.style.display = 'block';
            const filterMessages = {
                'all': 'Nenhum histórico de transações ainda',
                'earned': 'Nenhum ganho registrado ainda',
                'spent': 'Nenhum gasto ou resgate registrado ainda',
                'penalty': 'Nenhuma penalidade registrada'
            };
            emptyHistory.querySelector('p:first-of-type').textContent = filterMessages[currentFilter] || filterMessages['all'];
        }
        return;
    }
    
    if (emptyHistory) emptyHistory.style.display = 'none';
    
    tableBody.innerHTML = filteredHistory.map(item => {
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
        const xp = item.xp !== undefined ? item.xp : (item.points || 0);
        const coins = item.coins !== undefined ? item.coins : (item.points || 0);
        
        // Determinar se é ganho, gasto ou penalização
        const isPenalty = item.type === 'admin_penalty';
        const isSpent = item.type === 'spent' || item.type === 'reward_redeemed';
        
        // Classe de estilo para moedas
        let coinsClass = 'points-positive';
        if (isPenalty || coins < 0) coinsClass = 'points-negative';
        else if (isSpent) coinsClass = 'points-negative';
        else if (coins === 0) coinsClass = 'points-neutral';
        
        // Classe de estilo para XP
        let xpClass = 'points-positive';
        if (isPenalty || xp < 0) xpClass = 'points-negative';
        else if (xp === 0) xpClass = 'points-neutral';
        
        // Formatar valores
        const coinsSign = coins > 0 ? '+' : '';
        const xpSign = xp > 0 ? '+' : '';
        
        const coinsDisplay = coins !== 0 ? `${coinsSign}${coins}` : '-';
        const xpDisplay = xp !== 0 ? `${xpSign}${xp}` : '-';
        
        // Obter descrição da ação
        const actionText = item.reason || item.action || 'Transação';
        const icon = item.icon || getIconForType(item.type);
        
        return `
            <tr class="${isPenalty ? 'penalty-row' : ''}">
                <td class="history-date">${dateStr}, ${timeStr}</td>
                <td class="history-action">${icon} ${actionText}</td>
                <td class="history-coins ${coinsClass}">${coinsDisplay}</td>
                <td class="history-xp ${xpClass}">${xpDisplay}</td>
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
    currentFilter = filter;
    displayHistory();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    logger.info('💎 Carregando histórico de transações...');
    loadPointsHistory();
    
    // Listener para o filtro select
    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            currentFilter = this.value;
            displayHistory();
        });
    }
});