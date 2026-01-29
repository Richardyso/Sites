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

// Atualizar estatísticas
function updateStats() {
    if (!currentUser) return;
    
    const totalPoints = currentUser.totalPoints || 0;
    const currentLevel = Math.floor(totalPoints / 500) + 1;
    
    // Configuração de níveis
    const levels = [
        { name: 'Plebeia', emoji: '🌱', minPoints: 0 },
        { name: 'Aprendiz', emoji: '🌿', minPoints: 500 },
        { name: 'Dedicada', emoji: '🌸', minPoints: 1000 },
        { name: 'Guerreira', emoji: '💪', minPoints: 2000 },
        { name: 'Mestre', emoji: '👑', minPoints: 5000 },
        { name: 'Lenda', emoji: '✨', minPoints: 10000 }
    ];
    
    // Encontrar nível atual e próximo
    let currentLevelData = levels[0];
    let nextLevelData = levels[1];
    
    for (let i = levels.length - 1; i >= 0; i--) {
        if (totalPoints >= levels[i].minPoints) {
            currentLevelData = levels[i];
            nextLevelData = levels[i + 1] || levels[i];
            break;
        }
    }
    
    // Total de pontos
    const totalPointsEl = document.getElementById('totalPoints');
    if (totalPointsEl) totalPointsEl.textContent = totalPoints;
    
    // Nível atual
    const currentLevelEl = document.getElementById('currentLevel');
    if (currentLevelEl) currentLevelEl.textContent = currentLevel;
    
    // Nome e emoji do nível
    const levelNameEl = document.getElementById('levelName');
    if (levelNameEl) levelNameEl.textContent = currentLevelData.name;
    
    const levelEmojiEl = document.getElementById('levelEmoji');
    if (levelEmojiEl) levelEmojiEl.textContent = currentLevelData.emoji;
    
    // Calcular progresso para próximo nível
    const pointsInCurrentLevel = totalPoints - currentLevelData.minPoints;
    const pointsNeededForNext = nextLevelData.minPoints - currentLevelData.minPoints;
    const progressPercent = Math.min((pointsInCurrentLevel / pointsNeededForNext) * 100, 100);
    const pointsToNext = Math.max(nextLevelData.minPoints - totalPoints, 0);
    
    // Atualizar barra de progresso
    const progressBar = document.getElementById('levelProgressBar');
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    
    // Pontos para próximo nível
    const pointsToNextEl = document.getElementById('pointsToNext');
    if (pointsToNextEl) pointsToNextEl.textContent = pointsToNext;
    
    // Pontos atuais no nível
    const currentLevelPointsEl = document.getElementById('currentLevelPoints');
    if (currentLevelPointsEl) currentLevelPointsEl.textContent = totalPoints;
    
    // Pontos do próximo nível
    const nextLevelPointsEl = document.getElementById('nextLevelPoints');
    if (nextLevelPointsEl) nextLevelPointsEl.textContent = nextLevelData.minPoints;
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
        
        // Determinar se é ganho ou gasto
        const points = item.points || 0;
        const isEarned = item.type !== 'spent' && item.type !== 'reward_redeemed' && points > 0;
        const pointsClass = isEarned ? 'points-positive' : 'points-negative';
        const pointsSign = isEarned ? '+' : '-';
        
        // Obter descrição da ação
        const actionText = item.reason || item.action || 'Pontos';
        const icon = item.icon || getIconForType(item.type);
        
        return `
            <tr>
                <td class="history-date">${dateStr}, ${timeStr}</td>
                <td class="history-action">${icon} ${actionText}</td>
                <td class="history-points ${pointsClass}">${pointsSign}${Math.abs(points)} pts</td>
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