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
                loadMockHistory();
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
            // Para outros erros, apenas mostrar dados vazios
            loadMockHistory();
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
        displayHistory();
    } catch (error) {
        loadMockHistory();
    }
}

// Carregar histórico mockado
function loadMockHistory() {
    // Gerar histórico simulado
    const activities = [
        { action: 'Meta concluída', points: 100, icon: '🎯' },
        { action: 'Missão diária', points: 50, icon: '⭐' },
        { action: 'Série de 7 dias', points: 150, icon: '🔥' },
        { action: 'Perfil completo', points: 30, icon: '👤' },
        { action: 'Primeira meta', points: 75, icon: '🌟' }
    ];
    
    pointsHistory = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
        const activity = activities[Math.floor(Math.random() * activities.length)];
        pointsHistory.push({
            id: i + 1,
            ...activity,
            date: new Date(now - i * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000),
            type: activity.points > 0 ? 'earned' : 'spent'
        });
    }
    
    displayHistory();
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
        const date = new Date(item.date);
        const dateStr = formatDate(date);
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const pointsClass = item.type === 'earned' ? 'points-positive' : 'points-negative';
        const pointsSign = item.type === 'earned' ? '+' : '-';
        
        return `
            <tr>
                <td class="history-date">${dateStr}, ${timeStr}</td>
                <td class="history-action">${item.icon} ${item.action}</td>
                <td class="history-points ${pointsClass}">${pointsSign}${item.points} pts</td>
            </tr>
        `;
    }).join('');
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