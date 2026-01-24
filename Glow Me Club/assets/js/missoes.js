// ===== MISSÕES UNIFICADO =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// Dados do usuário atual
let currentUser = null;
let dailyMissions = [];

// Missões padrão
const defaultMissions = [
    {
        id: '1',
        title: 'Beber 2L de água',
        description: 'Mantenha-se hidratada ao longo do dia',
        category: 'Saúde',
        icon: '💧',
        points: 10,
        completed: false
    },
    {
        id: '2',
        title: 'Fazer 10 min de alongamento',
        description: 'Relaxe e alongue seu corpo',
        category: 'Físico',
        icon: '🧘‍♀️',
        points: 15,
        completed: false
    },
    {
        id: '3',
        title: 'Escrever 3 gratidões',
        description: 'Reflita sobre coisas boas do seu dia',
        category: 'Mental',
        icon: '✨',
        points: 10,
        completed: false
    },
    {
        id: '4',
        title: 'Meditar 5 minutos',
        description: 'Reserve um momento para acalmar a mente',
        category: 'Espiritual',
        icon: '🧘',
        points: 15,
        completed: false
    },
    {
        id: '5',
        title: 'Ler 15 minutos',
        description: 'Alimente sua mente com conhecimento',
        category: 'Mental',
        icon: '📚',
        points: 10,
        completed: false
    }
];

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
        
        // Atualizar header
        updateHeader();
        
        // Carregar missões
        loadMissionsFromStorage();
        
    } catch (error) {
        logger.error('Erro ao carregar missões:', error);
        
        // Tentar usar dados do cache primeiro
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                currentUser = JSON.parse(cachedData);
                updateHeader();
                loadMissionsFromStorage();
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
            // Para outros erros, apenas carregar missões locais
            loadMissionsFromStorage();
        }
    }
}

// Atualizar header com dados do usuário
function updateHeader() {
    if (!currentUser) return;
    
    // Usa função compartilhada que suporta imagem de perfil
    if (window.updateHeaderAvatar) {
        window.updateHeaderAvatar(currentUser);
    }
}

// Carregar missões do storage
function loadMissionsFromStorage() {
    const savedMissions = localStorage.getItem('dailyMissions');
    const today = new Date().toDateString();
    const lastMissionDate = localStorage.getItem('lastMissionDate');
    
    // Se não houver missões salvas ou for um novo dia, usar as padrão
    if (!savedMissions || !lastMissionDate || lastMissionDate !== today) {
        dailyMissions = JSON.parse(JSON.stringify(defaultMissions)); // Clone
        localStorage.setItem('dailyMissions', JSON.stringify(dailyMissions));
        localStorage.setItem('lastMissionDate', today);
    } else {
        dailyMissions = JSON.parse(savedMissions);
    }
    
    displayMissions();
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
    
    // Limpar grid
    missionsGrid.innerHTML = '';
    
    // Adicionar cada missão
    dailyMissions.forEach(mission => {
        const card = document.createElement('div');
        card.className = `mission-card ${mission.completed ? 'completed' : ''}`;
        card.setAttribute('data-mission-id', mission.id);
        
        card.innerHTML = `
            <div class="mission-item">
                <div class="mission-content">
                    <span class="mission-category">
                        <span class="mission-category-icon">${mission.icon}</span>
                        ${mission.category}
                    </span>
                    <h3 class="mission-title">${mission.title}</h3>
                    <p class="mission-description">${mission.description}</p>
                    <div class="mission-reward">
                        <i class="fas fa-coins"></i>
                        +${mission.points} pontos
                    </div>
                </div>
                <div class="mission-action">
                    <button class="btn btn-complete ${mission.completed ? 'completed' : ''}" 
                            data-mission-id="${mission.id}"
                            data-points="${mission.points}"
                            ${mission.completed ? 'disabled' : ''}>
                        ${mission.completed ? 'Completa' : 'Completar'}
                    </button>
                </div>
            </div>
        `;
        
        missionsGrid.appendChild(card);
    });
    
    updateProgress();
}

// Completar missão
function completeMission(missionId, points) {
    const missionIndex = dailyMissions.findIndex(m => m.id === missionId);
    
    if (missionIndex !== -1 && !dailyMissions[missionIndex].completed) {
        dailyMissions[missionIndex].completed = true;
        localStorage.setItem('dailyMissions', JSON.stringify(dailyMissions));
        
        // Atualizar pontos do usuário
        if (currentUser) {
            currentUser.totalPoints = (currentUser.totalPoints || 0) + points;
            localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
        }
        
        // Tentar sincronizar com servidor
        window.api.post(`/missions/${missionId}/complete`).catch(() => {
            logger.warn('Não foi possível sincronizar com o servidor');
        });
        
        // Recarregar missões
        displayMissions();
        
        // Mostrar toast de sucesso
        showSuccessToast(`+${points} pontos ganhos!`);
    }
}

// Atualizar progresso
function updateProgress() {
    const completed = dailyMissions.filter(m => m.completed).length;
    const total = dailyMissions.length;
    
    // Atualizar contador
    const counter = document.getElementById('missionCounter');
    if (counter) counter.textContent = `${completed}/${total}`;
    
    // Atualizar barra de progresso
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const progressBar = document.getElementById('missionProgressBar');
    if (progressBar) progressBar.style.width = `${percentage}%`;
    
    // Atualizar mensagem
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

// Mostrar toast de sucesso
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    logger.info('⭐ Carregando missões do dia...');
    
    // Carregar missões
    loadDailyMissions();
    
    // Event delegation para botões de completar missão
    document.addEventListener('click', function(e) {
        const completeBtn = e.target.closest('.btn-complete');
        if (completeBtn && !completeBtn.disabled) {
            const missionId = completeBtn.dataset.missionId;
            const points = parseInt(completeBtn.dataset.points);
            completeMission(missionId, points);
        }
    });
});

// CSS para toast
const style = document.createElement('style');
style.textContent = `
.success-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10B981, #34D399);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
    z-index: 1000;
    font-weight: 500;
}

.success-toast i {
    font-size: 1.2rem;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes fadeOut {
    to {
        opacity: 0;
        transform: translateY(-10px);
    }
}
`;
document.head.appendChild(style);