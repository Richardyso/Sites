// ===== MISSÕES UNIFICADO =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// Dados do usuário atual
let currentUser = null;
let dailyMissions = [];

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
        
        // Carregar missões do backend
        await loadMissionsFromBackend();
        
    } catch (error) {
        logger.error('Erro ao carregar missões:', error);
        
        // Tentar usar dados do cache primeiro
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                currentUser = JSON.parse(cachedData);
                updateHeader();
                await loadMissionsFromBackend();
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
            // Para outros erros, mostrar lista vazia
            dailyMissions = [];
            displayMissions();
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

// Carregar missões do backend
async function loadMissionsFromBackend() {
    try {
        // Buscar missões de hoje do servidor
        const data = await window.api.get('/missions/today');
        
        if (data.missions && data.missions.length > 0) {
            // Mapear missões do backend para o formato do frontend
            dailyMissions = data.missions.map(mission => ({
                id: mission.id,
                title: mission.description,
                description: mission.description,
                category: mission.category,
                icon: mission.icon || '⭐',
                points: mission.pointsEarned || 10,
                completed: mission.completed || false
            }));
            
            logger.info(`${dailyMissions.length} missões carregadas do servidor`);
        } else {
            dailyMissions = [];
            logger.info('Nenhuma missão disponível hoje');
        }
        
        displayMissions();
        
    } catch (error) {
        logger.error('Erro ao carregar missões do servidor:', error);
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
async function completeMission(missionId, points) {
    const missionIndex = dailyMissions.findIndex(m => m.id === missionId);
    
    if (missionIndex !== -1 && !dailyMissions[missionIndex].completed) {
        try {
            // Completar missão no servidor
            const response = await window.api.post(`/missions/${missionId}/complete`);
            
            if (response.success) {
                // Marcar como completada localmente
                dailyMissions[missionIndex].completed = true;
                
                // Atualizar interface
                displayMissions();
                
                // Mostrar toast de sucesso
                const earnedPoints = response.pointsEarned || points;
                showSuccessToast(`+${earnedPoints} pontos ganhos!`);
                
                logger.info('✅ Missão completada no servidor');
                
                // Buscar dados atualizados do usuário
                try {
                    const userData = await window.api.get('/auth/me');
                    if (userData.user) {
                        currentUser = userData.user;
                        localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
                        updateHeader();
                        logger.info(`💎 Total de pontos: ${currentUser.totalPoints}`);
                    }
                } catch (e) {
                    logger.warn('Não foi possível atualizar dados do usuário');
                }
                
                // Verificar level up
                if (response.levelUp) {
                    setTimeout(() => {
                        showSuccessToast(`🎉 Parabéns! Você subiu para o nível ${response.levelUp.newLevel}: ${response.levelUp.levelName}!`);
                    }, 1500);
                }
            }
        } catch (error) {
            logger.error('❌ Erro ao completar missão:', error);
            showSuccessToast(`❌ Erro ao completar missão`);
        }
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

// CSS para toast - responsivo para mobile e desktop
const style = document.createElement('style');
style.textContent = `
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
    width: auto;
    text-align: center;
    word-break: break-word;
}

.success-toast i {
    font-size: 1rem;
    flex-shrink: 0;
}

@keyframes toastSlideUp {
    from {
        transform: translateX(-50%) translateY(20px);
        opacity: 0;
    }
    to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
}

@keyframes toastFadeOut {
    to {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
    }
}

/* Desktop - toast no canto superior direito */
@media (min-width: 768px) {
    .success-toast {
        top: 20px;
        bottom: auto;
        right: 20px;
        left: auto;
        transform: none;
        animation: desktopSlideIn 0.3s ease, desktopFadeOut 0.3s ease 2.7s forwards;
    }
    
    @keyframes desktopSlideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes desktopFadeOut {
        to {
            opacity: 0;
            transform: translateX(20px);
        }
    }
}
`;
document.head.appendChild(style);