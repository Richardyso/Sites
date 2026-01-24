// ===== RECOMPENSAS UNIFICADO =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// Dados
let currentUser = null;
let availableRewards = [];
let userPoints = 0;

// Carregar recompensas
async function loadRewards() {
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
        userPoints = currentUser.totalPoints || 0;
        
        // Atualizar header e pontos
        updateHeader();
        updatePointsDisplay();
        
        // Carregar recompensas
        await loadRewardsFromBackend();
        
    } catch (error) {
        logger.error('Erro ao carregar recompensas:', error);
        
        // Tentar usar dados do cache primeiro
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                currentUser = JSON.parse(cachedData);
                userPoints = currentUser.totalPoints || 0;
                updateHeader();
                updatePointsDisplay();
                loadMockRewards();
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
            loadMockRewards();
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

// Atualizar display de pontos
function updatePointsDisplay() {
    document.getElementById('userPoints').textContent = userPoints;
}

// Carregar recompensas do backend
async function loadRewardsFromBackend() {
    try {
        const data = await window.api.get('/rewards');
        availableRewards = data.rewards || [];
        displayRewards();
    } catch (error) {
        loadMockRewards();
    }
}

// Carregar recompensas mockadas
function loadMockRewards() {
    availableRewards = [
        {
            id: '1',
            title: 'Day Spa Relaxante',
            description: 'Um dia completo de spa com massagem e tratamentos',
            points: 1000,
            category: 'Bem-estar',
            icon: '💆‍♀️'
        },
        {
            id: '2',
            title: 'Kit Skincare Premium',
            description: 'Conjunto completo de produtos para cuidados com a pele',
            points: 750,
            category: 'Beleza',
            icon: '✨'
        },
        {
            id: '3',
            title: 'Aula de Yoga Particular',
            description: '1 mês de aulas particulares de yoga',
            points: 500,
            category: 'Fitness',
            icon: '🧘‍♀️'
        },
        {
            id: '4',
            title: 'Sessão de Coaching',
            description: '3 sessões de coaching pessoal',
            points: 800,
            category: 'Desenvolvimento',
            icon: '🌟'
        },
        {
            id: '5',
            title: 'Box de Livros',
            description: 'Caixa com 5 livros de desenvolvimento pessoal',
            points: 400,
            category: 'Educação',
            icon: '📚'
        }
    ];
    
    displayRewards();
}

// Exibir recompensas
function displayRewards() {
    const container = document.getElementById('rewardsContainer');
    if (!container) return;
    
    container.innerHTML = availableRewards.map(reward => {
        const canRedeem = userPoints >= reward.points;
        
        return `
            <div class="reward-card ${!canRedeem ? 'disabled' : ''}">
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-content">
                    <h3>${reward.title}</h3>
                    <p>${reward.description}</p>
                    <div class="reward-meta">
                        <span class="reward-category">${reward.category}</span>
                        <span class="reward-points">
                            <i class="fas fa-gem"></i> ${reward.points} pontos
                        </span>
                    </div>
                </div>
                <button 
                    class="redeem-btn ${!canRedeem ? 'disabled' : ''}" 
                    onclick="redeemReward('${reward.id}')"
                    ${!canRedeem ? 'disabled' : ''}
                >
                    ${canRedeem ? 'Resgatar' : 'Pontos insuficientes'}
                </button>
            </div>
        `;
    }).join('');
}

// Resgatar recompensa
window.redeemReward = async function(rewardId) {
    const reward = availableRewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    if (userPoints < reward.points) {
        showError('Pontos insuficientes!');
        return;
    }
    
    if (!confirm(`Deseja resgatar "${reward.title}" por ${reward.points} pontos?`)) {
        return;
    }
    
    try {
        await window.api.post(`/rewards/${rewardId}/redeem`);
        
        // Atualizar pontos localmente
        userPoints -= reward.points;
        currentUser.totalPoints = userPoints;
        localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
        
        updatePointsDisplay();
        displayRewards();
        showSuccess(`"${reward.title}" resgatado com sucesso!`);
        
    } catch (error) {
        if (window.api.isNetworkError(error)) {
            showError('Não foi possível resgatar no modo offline');
        } else {
            showError('Erro ao resgatar recompensa');
        }
    }
}

// Mostrar mensagens
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function showError(message) {
    alert(message); // Simplificado
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    logger.info('🎁 Carregando recompensas...');
    loadRewards();
});