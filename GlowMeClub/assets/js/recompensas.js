// ===== RECOMPENSAS UNIFICADO =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// Logger fallback
const log = window.logger || {
    info: (msg, data) => console.log(`ℹ️ ${msg}`, data || ''),
    error: (msg, error) => console.error(`❌ ${msg}`, error || ''),
    warn: (msg, data) => console.warn(`⚠️ ${msg}`, data || ''),
    success: (msg, data) => console.log(`✅ ${msg}`, data || '')
};

// Dados
let currentUser = null;
let availableRewards = [];
let userCoins = 0; // Moedas (gastáveis para recompensas)
let userXp = 0;    // XP (para nível - não gastável)
let currentCategory = 'all';

// Expor globalmente para o script inline poder acessar
window.availableRewards = availableRewards;

// Carregar recompensas
async function loadRewards() {
    const token = window.api.getToken();
    
    if (!token) {
        log.error('Sem token, redirecionando para login...');
        window.location.href = 'login.html';
        return;
    }
    
    // Mostrar loading
    showLoadingState();
    
    try {
        // Buscar dados do usuário
        const authData = await window.api.get('/auth/me');
        currentUser = authData.user;
        // Moedas são usadas para recompensas (gastável)
        userCoins = currentUser.coins !== undefined ? currentUser.coins : (currentUser.totalPoints || 0);
        // XP para referência (não gastável)
        userXp = currentUser.xp || currentUser.totalPoints || 0;
        
        // Atualizar header e moedas
        updateHeader();
        updatePointsDisplay();
        
        // Carregar recompensas
        await loadRewardsFromBackend();
        
    } catch (error) {
        log.error('Erro ao carregar recompensas:', error);
        
        // Tentar usar dados do cache primeiro
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                currentUser = JSON.parse(cachedData);
                userCoins = currentUser.coins !== undefined ? currentUser.coins : (currentUser.totalPoints || 0);
                userXp = currentUser.xp || currentUser.totalPoints || 0;
                updateHeader();
                updatePointsDisplay();
                await loadRewardsFromBackend();
                log.warn('⚠️ Usando dados do cache');
                return;
            } catch (e) {
                log.error('Erro ao parsear cache');
            }
        }
        
        // Se não conseguir usar cache e for erro de autenticação explícito (401)
        if (error.status === 401 || (error.message && error.message.includes('401'))) {
            window.api.removeToken();
            window.location.href = 'login.html';
        } else {
            // Para outros erros, mostrar lista vazia
            availableRewards = [];
            displayRewards();
        }
    }
}

// Mostrar estado de loading
function showLoadingState() {
    const container = document.getElementById('rewardsGrid');
    if (container) {
        container.innerHTML = `
            <div class="loading-rewards" style="grid-column: 1/-1;">
                <i class="fas fa-spinner"></i>
                <p>Carregando recompensas...</p>
            </div>
        `;
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

// Atualizar display de moedas (usadas para resgatar recompensas)
function updatePointsDisplay() {
    const pointsElement = document.getElementById('userPoints');
    if (pointsElement) {
        pointsElement.textContent = userCoins.toLocaleString('pt-BR');
    }
    
    // Se existir elemento separado para moedas
    const coinsElement = document.getElementById('userCoins');
    if (coinsElement) {
        coinsElement.textContent = userCoins.toLocaleString('pt-BR');
    }
}

// Carregar recompensas do backend
async function loadRewardsFromBackend() {
    try {
        const data = await window.api.get('/rewards');
        // Filtrar apenas recompensas disponíveis
        availableRewards = (data.rewards || []).filter(r => r.available !== false);
        
        // Atualizar referência global para o script inline poder acessar
        window.availableRewards = availableRewards;
        
        if (availableRewards.length === 0) {
            log.info('Nenhuma recompensa disponível');
        } else {
            log.info(`${availableRewards.length} recompensas carregadas`);
        }
        
        displayRewards();
    } catch (error) {
        log.error('Erro ao carregar recompensas:', error);
        availableRewards = [];
        window.availableRewards = availableRewards;
        displayRewards();
    }
}

// Mapear categoria para ícone
function getCategoryIcon(category) {
    const icons = {
        'ebooks': 'fa-book',
        'aulas': 'fa-video',
        'badges': 'fa-medal',
        'digital': 'fa-download',
        'mentoria': 'fa-comments',
        'default': 'fa-gift'
    };
    return icons[category?.toLowerCase()] || icons['default'];
}

// Exibir recompensas
function displayRewards() {
    const container = document.getElementById('rewardsGrid');
    const emptyState = document.getElementById('emptyRewardsState');
    
    if (!container) return;
    
    // Filtrar por categoria se necessário
    let filteredRewards = availableRewards;
    if (currentCategory && currentCategory !== 'all') {
        filteredRewards = availableRewards.filter(r => 
            r.category?.toLowerCase() === currentCategory.toLowerCase()
        );
    }
    
    if (filteredRewards.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = filteredRewards.map(reward => {
        // Usar moedas para verificar se pode resgatar (não XP!)
        const cost = reward.coinsCost || reward.points || reward.pointsCost || 0;
        const canRedeem = userCoins >= cost;
        const icon = getCategoryIcon(reward.category);
        
        return `
            <div class="reward-card" data-category="${reward.category || 'digital'}" data-reward-id="${reward.id}">
                <div class="reward-image">
                    ${reward.image ? 
                        `<img src="${reward.image}" alt="${reward.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                         <i class="fas ${icon}" style="display:none;"></i>` :
                        `<i class="fas ${icon}"></i>`
                    }
                </div>
                <div class="reward-content">
                    <h3 class="reward-title">${reward.title}</h3>
                    <p class="reward-description">
                        ${reward.description || 'Recompensa exclusiva para membros do GlowMeClub.'}
                    </p>
                    <div class="reward-footer">
                        <div class="reward-cost">
                            <i class="fas fa-coins"></i>
                            <span>${cost.toLocaleString('pt-BR')}</span>
                        </div>
                        ${canRedeem ? 
                            `<button class="btn btn-redeem" onclick="openRedeemModal('${reward.id}', '${reward.title.replace(/'/g, "\\'")}', ${cost})">
                                Resgatar
                            </button>` :
                            `<span class="insufficient-points">Faltam ${(cost - userCoins).toLocaleString('pt-BR')} moedas</span>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Filtrar por categoria (sobrescreve a função do HTML)
window.filterCategory = function(category) {
    currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayRewards();
}

// Nota: A função confirmRedeem está definida no script inline do HTML
// para ter acesso direto às variáveis do modal

// Mostrar mensagens
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #10B981;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #DC2626;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    log.info('🎁 Carregando recompensas...');
    loadRewards();
});