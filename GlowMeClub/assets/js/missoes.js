// ===== MISSÕES DIÁRIAS =====

// Verificar dependências
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas.');
}

// Dados
let currentUser = null;
let dailyMissions = [];
let flashMissions = [];
let missionHistory = [];
let historyDays = 30;

// Ícones por área de foco
const FOCUS_ICONS = {
    Mental: '🧠',
    Físico: '🏋️',
    Emocional: '❤️',
    Espiritual: '✨',
    Financeiro: '💰',
    Aparência: '🧴'
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    logger.info('⭐ Carregando missões do dia...');
    loadDailyMissions();
    setupEventListeners();
});

// Carregar missões do dia
async function loadDailyMissions() {
    const token = window.api.getToken();
    
    if (!token) {
        logger.error('Sem token, redirecionando para login...');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Verificar autenticação
        const authData = await window.api.get('/auth/me');
        currentUser = authData.user;
        
        // Atualizar header e área de foco
        updateHeader();
        updateFocusAreaBadge();
        
        // Carregar missões relâmpago primeiro (destaque)
        await loadFlashMissions();
        
        // Carregar missões do backend
        await loadMissionsFromBackend();
        
        // Carregar histórico
        await loadMissionHistory();
        
    } catch (error) {
        logger.error('Erro ao carregar missões:', error);
        
        // Tentar usar dados do cache
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                currentUser = JSON.parse(cachedData);
                updateHeader();
                updateFocusAreaBadge();
                await loadMissionsFromBackend();
                await loadMissionHistory();
                return;
            } catch (e) {
                logger.error('Erro ao parsear cache');
            }
        }
        
        if (error.status === 401) {
            window.api.removeToken();
            window.location.href = 'login.html';
        } else {
            dailyMissions = [];
            displayMissions();
        }
    }
}

// Atualizar header
function updateHeader() {
    if (!currentUser) return;
    if (window.updateHeaderAvatar) {
        window.updateHeaderAvatar(currentUser);
    }
}

// Atualizar badge de área de foco
function updateFocusAreaBadge() {
    if (!currentUser) return;
    
    const focusArea = currentUser.focusArea || 'Mental';
    const focusIcon = document.getElementById('focusIcon');
    const focusName = document.getElementById('focusName');
    
    if (focusIcon) {
        focusIcon.textContent = FOCUS_ICONS[focusArea] || '🧠';
    }
    
    if (focusName) {
        focusName.textContent = focusArea;
    }
}

// Carregar missões do backend
async function loadMissionsFromBackend() {
    try {
        const data = await window.api.get('/missions/today');
        
        if (data.missions && data.missions.length > 0) {
            dailyMissions = data.missions.map(mission => ({
                id: mission.id,
                title: mission.description,
                description: mission.description,
                category: mission.category,
                icon: mission.icon || '⭐',
                points: mission.pointsEarned || 10,
                completed: mission.completed || false,
                observation: mission.observation || ''
            }));
            
            logger.info(`${dailyMissions.length} missões carregadas`);
        } else {
            dailyMissions = [];
        }
        
        displayMissions();
        
    } catch (error) {
        logger.error('Erro ao carregar missões:', error);
        dailyMissions = [];
        displayMissions();
    }
}

// Exibir missões
function displayMissions() {
    const missionsGrid = document.getElementById('missionsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!missionsGrid) return;
    
    if (dailyMissions.length === 0) {
        missionsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    missionsGrid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    missionsGrid.innerHTML = '';
    
    dailyMissions.forEach(mission => {
        const card = document.createElement('div');
        card.className = `mission-card ${mission.completed ? 'completed' : ''}`;
        card.setAttribute('data-mission-id', mission.id);
        
        card.innerHTML = `
            <div class="mission-item">
                <div class="mission-content">
                    <span class="mission-category">
                        <span class="mission-category-icon">${FOCUS_ICONS[currentUser?.focusArea] || mission.icon}</span>
                        ${currentUser?.focusArea || mission.category}
                    </span>
                    <h3 class="mission-title">${mission.title}</h3>
                    <div class="mission-reward">
                        <i class="fas fa-coins"></i>
                        +${mission.points} pontos
                    </div>
                    
                    <!-- Campo de Observação -->
                    <div class="mission-observation">
                        <label class="observation-label">
                            <i class="fas fa-sticky-note"></i>
                            Observação
                        </label>
                        <textarea 
                            class="observation-input" 
                            data-mission-id="${mission.id}"
                            placeholder="Anote algo sobre esta missão..."
                            ${mission.completed ? 'readonly' : ''}
                        >${mission.observation || ''}</textarea>
                    </div>
                </div>
                <div class="mission-action">
                    <button class="btn btn-complete ${mission.completed ? 'completed' : ''}" 
                            data-mission-id="${mission.id}"
                            data-points="${mission.points}"
                            ${mission.completed ? 'disabled' : ''}>
                        ${mission.completed ? '<i class="fas fa-check"></i> Completa' : 'Completar'}
                    </button>
                </div>
            </div>
        `;
        
        missionsGrid.appendChild(card);
    });
    
    updateProgress();
}

// Completar missão
async function completeMission(missionId, points) {
    const missionIndex = dailyMissions.findIndex(m => m.id === missionId);
    
    if (missionIndex === -1 || dailyMissions[missionIndex].completed) return;
    
    // Pegar observação do textarea
    const observationInput = document.querySelector(`.observation-input[data-mission-id="${missionId}"]`);
    const observation = observationInput ? observationInput.value.trim() : '';
    
    try {
        const response = await window.api.post(`/missions/${missionId}/complete`, {
            observation: observation
        });
        
        if (response.success) {
            dailyMissions[missionIndex].completed = true;
            dailyMissions[missionIndex].observation = observation;
            
            displayMissions();
            
            const earnedPoints = response.pointsEarned || points;
            showSuccessToast(`+${earnedPoints} pontos ganhos!`);
            
            // Atualizar dados do usuário
            try {
                const userData = await window.api.get('/auth/me');
                if (userData.user) {
                    currentUser = userData.user;
                    localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
                    updateHeader();
                }
            } catch (e) {}
            
            // Level up
            if (response.levelUp) {
                setTimeout(() => {
                    showSuccessToast(`🎉 Você subiu para o nível ${response.levelUp.newLevel}: ${response.levelUp.levelName}!`);
                }, 1500);
            }
        }
    } catch (error) {
        logger.error('Erro ao completar missão:', error);
        showSuccessToast(`❌ Erro ao completar missão`);
    }
}

// Atualizar progresso
function updateProgress() {
    const completed = dailyMissions.filter(m => m.completed).length;
    const total = dailyMissions.length;
    
    const counter = document.getElementById('missionCounter');
    if (counter) counter.textContent = `${completed}/${total}`;
    
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const progressBar = document.getElementById('missionProgressBar');
    if (progressBar) progressBar.style.width = `${percentage}%`;
    
    const progressMessage = document.getElementById('progressMessage');
    if (progressMessage) {
        if (completed === 0) {
            progressMessage.textContent = 'Complete suas missões diárias para ganhar pontos!';
        } else if (completed === total) {
            progressMessage.textContent = '🎉 Parabéns! Você completou todas as missões de hoje!';
        } else {
            progressMessage.textContent = `Continue assim! Faltam ${total - completed} missões.`;
        }
    }
}

// ===== MISSÕES RELÂMPAGO =====
async function loadFlashMissions() {
    const flashSection = document.getElementById('flashMissionsSection');
    const flashList = document.getElementById('flashMissionsList');
    
    try {
        const data = await window.api.get('/missions/flash');
        
        if (data.success && data.flashMissions && data.flashMissions.length > 0) {
            // Filtrar missões não resgatadas
            flashMissions = data.flashMissions.filter(m => !m.alreadyClaimed);
            
            if (flashMissions.length > 0) {
                displayFlashMissions();
                if (flashSection) flashSection.style.display = 'block';
            } else {
                if (flashSection) flashSection.style.display = 'none';
            }
        } else {
            flashMissions = [];
            if (flashSection) flashSection.style.display = 'none';
        }
        
    } catch (error) {
        logger.error('Erro ao carregar missões relâmpago:', error);
        flashMissions = [];
        if (flashSection) flashSection.style.display = 'none';
    }
}

function displayFlashMissions() {
    const flashList = document.getElementById('flashMissionsList');
    
    if (!flashList || flashMissions.length === 0) return;
    
    flashList.innerHTML = flashMissions.map(mission => {
        const expiresAt = new Date(mission.expiresAt);
        const timeLeft = getTimeLeft(expiresAt);
        
        return `
            <div class="flash-mission-card" data-flash-id="${mission.id}">
                <div class="flash-mission-content">
                    <div class="flash-timer">
                        <i class="fas fa-clock"></i>
                        <span>${timeLeft}</span>
                    </div>
                    <h3 class="flash-mission-title">${mission.title}</h3>
                    ${mission.description ? `<p class="flash-mission-desc">${mission.description}</p>` : ''}
                    <div class="flash-rewards">
                        ${mission.xp > 0 ? `<span class="flash-reward"><i class="fas fa-star"></i> +${mission.xp} XP</span>` : ''}
                        ${mission.coins > 0 ? `<span class="flash-reward"><i class="fas fa-coins"></i> +${mission.coins} Moedas</span>` : ''}
                    </div>
                </div>
                <div class="flash-mission-action">
                    <button class="btn-flash-claim" data-flash-id="${mission.id}" data-flash-link="${mission.link}">
                        <i class="fas fa-bolt"></i>
                        Concluir Missão Relâmpago
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeLeft(expiresAt) {
    const now = new Date();
    const diff = expiresAt - now;
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

async function claimFlashMission(missionId, link) {
    try {
        // Abrir o link em nova aba primeiro
        if (link) {
            window.open(link, '_blank');
        }
        
        const response = await window.api.post(`/missions/flash/${missionId}/claim`);
        
        if (response.success) {
            // Remover da lista local
            flashMissions = flashMissions.filter(m => m.id !== missionId);
            
            // Atualizar display
            if (flashMissions.length === 0) {
                const flashSection = document.getElementById('flashMissionsSection');
                if (flashSection) flashSection.style.display = 'none';
            } else {
                displayFlashMissions();
            }
            
            // Mostrar toast de sucesso
            let message = '⚡ Missão Relâmpago concluída!';
            if (response.xpEarned > 0) message += ` +${response.xpEarned} XP`;
            if (response.coinsEarned > 0) message += ` +${response.coinsEarned} Moedas`;
            
            showSuccessToast(message);
            
            // Level up
            if (response.levelUp) {
                setTimeout(() => {
                    showSuccessToast(`🎉 Você subiu para o nível ${response.levelUp.newLevel}: ${response.levelUp.levelName}!`);
                }, 1500);
            }
            
            // Atualizar dados do usuário
            try {
                const userData = await window.api.get('/auth/me');
                if (userData.user) {
                    currentUser = userData.user;
                    localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
                    updateHeader();
                }
            } catch (e) {}
        }
        
    } catch (error) {
        logger.error('Erro ao resgatar missão relâmpago:', error);
        showSuccessToast(`❌ ${error.message || 'Erro ao resgatar'}`);
    }
}

// ===== HISTÓRICO DE MISSÕES =====
async function loadMissionHistory() {
    const historyTimeline = document.getElementById('historyTimeline');
    
    try {
        const data = await window.api.get(`/missions/history?days=${historyDays}`);
        
        if (data.success) {
            missionHistory = data.history;
            displayMissionHistory();
            updateHistoryStats(data.stats);
        }
        
    } catch (error) {
        logger.error('Erro ao carregar histórico:', error);
        if (historyTimeline) {
            historyTimeline.innerHTML = '<p class="history-empty">Não foi possível carregar o histórico.</p>';
        }
    }
}

function displayMissionHistory() {
    const historyTimeline = document.getElementById('historyTimeline');
    
    if (!historyTimeline) return;
    
    if (missionHistory.length === 0) {
        historyTimeline.innerHTML = '<p class="history-empty">Nenhum histórico disponível ainda.</p>';
        return;
    }
    
    historyTimeline.innerHTML = missionHistory.map(day => {
        const date = new Date(day.date + 'T12:00:00');
        const dateStr = formatDate(date);
        const isPerfect = day.totalCompleted === day.totalMissions;
        
        return `
            <div class="history-day ${isPerfect ? 'perfect-day' : ''}">
                <div class="history-day-header">
                    <div class="history-date">
                        <span class="date-day">${dateStr}</span>
                        ${isPerfect ? '<span class="perfect-badge">🏆 Dia Perfeito!</span>' : ''}
                    </div>
                    <div class="history-count">
                        ${day.totalCompleted}/${day.totalMissions}
                    </div>
                </div>
                <div class="history-missions">
                    ${day.missions.map(m => `
                        <div class="history-mission ${m.completed ? 'completed' : 'missed'}">
                            <span class="history-mission-icon">${m.icon}</span>
                            <div class="history-mission-info">
                                <span class="history-mission-title">${m.description}</span>
                                ${m.observation ? `<span class="history-mission-obs"><i class="fas fa-sticky-note"></i> ${m.observation}</span>` : ''}
                            </div>
                            <span class="history-mission-status">
                                ${m.completed ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function updateHistoryStats(stats) {
    const completionRate = document.getElementById('historyCompletionRate');
    const perfectDays = document.getElementById('historyPerfectDays');
    const totalCompleted = document.getElementById('historyTotalCompleted');
    
    if (completionRate) completionRate.textContent = `${stats.completionRate}%`;
    if (perfectDays) perfectDays.textContent = stats.daysWithFullCompletion;
    if (totalCompleted) totalCompleted.textContent = stats.totalCompleted;
}

function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
    } else {
        return date.toLocaleDateString('pt-BR', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Botões de completar missão
    document.addEventListener('click', function(e) {
        const completeBtn = e.target.closest('.btn-complete');
        if (completeBtn && !completeBtn.disabled) {
            const missionId = completeBtn.dataset.missionId;
            const points = parseInt(completeBtn.dataset.points);
            completeMission(missionId, points);
        }
        
        // Botão de resgatar missão relâmpago (abre link + resgata)
        const claimBtn = e.target.closest('.btn-flash-claim');
        if (claimBtn) {
            const flashId = claimBtn.dataset.flashId;
            const flashLink = claimBtn.dataset.flashLink;
            claimFlashMission(flashId, flashLink);
        }
    });
    
    // Auto-save observação ao sair do campo
    document.addEventListener('blur', async function(e) {
        if (e.target.classList.contains('observation-input') && !e.target.readOnly) {
            const missionId = e.target.dataset.missionId;
            const observation = e.target.value.trim();
            
            // Atualizar localmente
            const mission = dailyMissions.find(m => m.id === missionId);
            if (mission) {
                mission.observation = observation;
            }
            
            // Não salvar no servidor se a missão não foi completada ainda
            // A observação será salva quando completar a missão
        }
    }, true);
    
    // Carregar mais histórico
    const loadMoreBtn = document.getElementById('loadMoreHistory');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            historyDays += 30;
            loadMissionHistory();
        });
    }
}

// Toast de sucesso
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// CSS para toast e componentes novos
const style = document.createElement('style');
style.textContent = `
/* Flash Missions Section */
.flash-missions-section {
    margin-bottom: 1rem;
    animation: flashPulse 2s infinite;
}

@keyframes flashPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.95; }
}

.flash-header {
    text-align: center;
    margin-bottom: 0.75rem;
}

.flash-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: linear-gradient(135deg, #F59E0B, #EF4444);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 0.35rem;
    animation: flashBadge 1.5s infinite;
}

@keyframes flashBadge {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.flash-badge i {
    font-size: 0.7rem;
}

.flash-title {
    font-size: 1.1rem;
    color: #1F2937;
    margin: 0.25rem 0 0.15rem;
    font-weight: 700;
}

.flash-subtitle {
    font-size: 0.75rem;
    color: #9CA3AF;
    margin: 0;
}

.flash-missions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.flash-mission-card {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    border: 2px solid #F59E0B;
    border-radius: 14px;
    padding: 1rem;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
    position: relative;
    overflow: hidden;
}

.flash-mission-card::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: flashShine 3s infinite;
}

@keyframes flashShine {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(100%) rotate(45deg); }
}

.flash-mission-content {
    position: relative;
    z-index: 1;
}

.flash-timer {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: #EF4444;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.flash-mission-title {
    font-size: 1rem;
    color: #92400E;
    margin: 0 0 0.25rem;
    font-weight: 700;
}

.flash-mission-desc {
    font-size: 0.8rem;
    color: #B45309;
    margin: 0 0 0.5rem;
}

.flash-rewards {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.flash-reward {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #92400E;
}

.flash-reward i {
    color: #F59E0B;
}

.flash-mission-action {
    display: flex;
    margin-top: 0.75rem;
    position: relative;
    z-index: 1;
}

.btn-flash-claim {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #F59E0B, #EF4444);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn-flash-claim:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.5);
}

.btn-flash-claim:active {
    transform: scale(0.98);
}

/* Focus Area Badge */
.focus-area-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: white;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.focus-icon {
    font-size: 1.5rem;
}

.focus-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.focus-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #9CA3AF;
}

.focus-name {
    font-size: 1rem;
    font-weight: 700;
    color: #1F2937;
}

.focus-change-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #F3F4F6;
    color: #6B7280;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: all 0.2s;
}

.focus-change-btn:hover {
    background: #8B5CF6;
    color: white;
}

/* Mission Observation */
.mission-observation {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #F3F4F6;
}

.observation-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    color: #9CA3AF;
    margin-bottom: 0.35rem;
}

.observation-input {
    width: 100%;
    min-height: 50px;
    padding: 0.5rem;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    font-size: 0.8rem;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.2s;
}

.observation-input:focus {
    outline: none;
    border-color: #8B5CF6;
}

.observation-input[readonly] {
    background: #F9FAFB;
    cursor: default;
}

/* Mission History Section */
.mission-history-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid #F3F4F6;
}

.history-header {
    text-align: center;
    margin-bottom: 1rem;
}

.history-title {
    font-size: 1.1rem;
    color: #1F2937;
    margin: 0 0 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.history-title i {
    color: #8B5CF6;
}

.history-subtitle {
    font-size: 0.8rem;
    color: #9CA3AF;
    margin: 0;
}

/* History Stats */
.history-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.history-stat {
    background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
    color: white;
    padding: 0.75rem 0.5rem;
    border-radius: 10px;
    text-align: center;
}

.history-stat .stat-value {
    display: block;
    font-size: 1.25rem;
    font-weight: 700;
}

.history-stat .stat-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    opacity: 0.9;
}

/* History Timeline */
.history-timeline {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.history-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem;
    color: #9CA3AF;
}

.history-empty {
    text-align: center;
    color: #9CA3AF;
    padding: 2rem;
}

.history-day {
    background: white;
    border-radius: 12px;
    padding: 0.75rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.history-day.perfect-day {
    border: 2px solid #10B981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, white 100%);
}

.history-day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #F3F4F6;
}

.history-date {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.date-day {
    font-weight: 600;
    color: #374151;
    font-size: 0.85rem;
}

.perfect-badge {
    font-size: 0.65rem;
    background: #10B981;
    color: white;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
}

.history-count {
    font-size: 0.8rem;
    font-weight: 600;
    color: #8B5CF6;
}

.history-missions {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.history-mission {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.4rem;
    border-radius: 8px;
    background: #F9FAFB;
}

.history-mission.completed {
    background: rgba(16, 185, 129, 0.08);
}

.history-mission.missed {
    background: rgba(239, 68, 68, 0.05);
    opacity: 0.7;
}

.history-mission-icon {
    font-size: 1rem;
    flex-shrink: 0;
}

.history-mission-info {
    flex: 1;
    min-width: 0;
}

.history-mission-title {
    font-size: 0.75rem;
    color: #374151;
    display: block;
}

.history-mission-obs {
    font-size: 0.65rem;
    color: #9CA3AF;
    font-style: italic;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.15rem;
}

.history-mission-status {
    flex-shrink: 0;
}

.history-mission.completed .history-mission-status {
    color: #10B981;
}

.history-mission.missed .history-mission-status {
    color: #EF4444;
}

.btn-load-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: #F3F4F6;
    border: none;
    border-radius: 10px;
    color: #6B7280;
    font-weight: 500;
    cursor: pointer;
    margin-top: 0.75rem;
    transition: all 0.2s;
}

.btn-load-more:hover {
    background: #E5E7EB;
    color: #374151;
}

/* Toast */
.success-toast {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #10B981, #34D399);
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: toastSlideUp 0.3s ease, toastFadeOut 0.3s ease 2.7s forwards;
    z-index: 3000;
    font-weight: 500;
    font-size: 0.875rem;
    max-width: calc(100vw - 2rem);
}

@keyframes toastSlideUp {
    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

@keyframes toastFadeOut {
    to { opacity: 0; transform: translateX(-50%) translateY(20px); }
}

/* Desktop */
@media (min-width: 768px) {
    .history-stats {
        gap: 1rem;
    }
    
    .history-stat {
        padding: 1rem;
    }
    
    .history-stat .stat-value {
        font-size: 1.5rem;
    }
    
    .success-toast {
        top: 20px;
        bottom: auto;
        right: 20px;
        left: auto;
        transform: none;
        animation: desktopSlideIn 0.3s ease, desktopFadeOut 0.3s ease 2.7s forwards;
    }
    
    @keyframes desktopSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes desktopFadeOut {
        to { opacity: 0; transform: translateX(20px); }
    }
}
`;
document.head.appendChild(style);
