// ===== DASHBOARD UNIFICADO =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// Dados do usuário atual
let currentUser = null;

// Mostrar indicador de modo offline
function showOfflineIndicator() {
    const existingIndicator = document.querySelector('.offline-indicator');
    if (!existingIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.innerHTML = `
            <i class="fas fa-wifi-slash"></i>
            <span>Modo Offline - Os dados podem estar desatualizados</span>
        `;
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #F59E0B;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(indicator);
        
        // Adicionar animação CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Carregar dados do dashboard
async function loadDashboardData() {
    logger.info('📊 === CARREGANDO DASHBOARD ===');
    
    const token = window.api.getToken();
    
    if (!token) {
        logger.error('❌ Sem token, redirecionando para login...');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Buscar dados do usuário
        const data = await window.api.get('/auth/me');
        currentUser = data.user;
        logger.info('👤 Dados do usuário recebidos:', currentUser);
        
        // Atualizar UI
        updateDashboard();
        loadAdditionalData();
        
    } catch (error) {
        logger.error('❌ Erro ao carregar dashboard:', error);
        
        // Tentar usar dados do cache primeiro
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                currentUser = JSON.parse(cachedData);
                logger.info('💾 Usando dados do cache');
                updateDashboard();
                loadAdditionalData();
                showOfflineIndicator();
                return;
            } catch (e) {
                logger.error('Erro ao parsear cache:', e);
            }
        }
        
        // Se não tiver cache e for erro de autenticação
        if (error.status === 401 || (error.message && error.message.includes('401'))) {
            window.api.removeToken();
            window.location.href = 'login.html';
        } else {
            // Para outros erros, mostrar mensagem de erro
            logger.error('Não foi possível carregar dados do dashboard');
            showOfflineIndicator();
        }
    }
}

// Atualizar dashboard com dados do usuário
function updateDashboard() {
    if (!currentUser) return;
    
    // Nome do usuário
    document.getElementById('userName').textContent = currentUser.name || 'Usuária';
    
    // Avatar no header (usa função compartilhada que suporta imagem de perfil)
    if (window.updateHeaderAvatar) {
        window.updateHeaderAvatar(currentUser);
    }
    
    // Pontos e nível
    const totalPoints = currentUser.totalPoints || 0;
    const currentLevel = Math.floor(totalPoints / 500) + 1;
    
    // Atualizar pontos
    const totalPointsElement = document.getElementById('totalPoints');
    if (totalPointsElement) {
        totalPointsElement.textContent = totalPoints;
    }
    
    // Dados de nível com mensagens motivacionais e imagens
    const levels = {
        1: { 
            name: 'Plebeia', 
            emoji: '🌱',
            message: 'O primeiro passo para a transformação',
            pointsNeeded: 500,
            image: 'plebeia.png'
        },
        2: { 
            name: 'Princesa', 
            emoji: '👑',
            message: 'Consistência é o teu novo luxo',
            pointsNeeded: 1000,
            image: 'princesa.png'
        },
        3: { 
            name: 'Rainha', 
            emoji: '✨',
            message: 'Brilhas com confiança e propósito',
            pointsNeeded: 1500,
            image: 'rainha.png'
        },
        4: { 
            name: 'Imperatriz', 
            emoji: '💎',
            message: 'O poder da transformação está em ti',
            pointsNeeded: 2000,
            image: 'imperatriz.png'
        },
        5: { 
            name: 'Deusa Glow', 
            emoji: '🔥',
            message: 'És a melhor versão de ti mesma',
            pointsNeeded: Infinity,
            image: 'deusa.png'
        }
    };
    
    const levelInfo = levels[Math.min(currentLevel, 5)];
    
    // Atualizar emoji (se ainda existir)
    const levelEmoji = document.getElementById('levelEmoji');
    if (levelEmoji) {
        levelEmoji.textContent = levelInfo.emoji;
    }
    
    // Atualizar nome do nível
    document.getElementById('levelName').textContent = levelInfo.name;
    
    // Atualizar imagem do nível
    const levelImage = document.getElementById('levelImage');
    if (levelImage) {
        levelImage.src = `../assets/images/${levelInfo.image}`;
        levelImage.alt = `Nível ${levelInfo.name}`;
    }
    
    // Adicionar mensagem motivacional
    const levelMessage = document.querySelector('.level-message');
    if (levelMessage) {
        levelMessage.textContent = `"${levelInfo.message}"`;
    }
    
    // Progresso do nível
    const pointsInCurrentLevel = totalPoints % 500;
    const progress = (pointsInCurrentLevel / 500) * 100;
    document.getElementById('levelProgress').style.width = `${progress}%`;
    
    // Texto de progresso
    const nextLevel = currentLevel < 5 ? currentLevel + 1 : 5;
    const pointsForNext = 500 - pointsInCurrentLevel;
    const progressText = currentLevel < 5 
        ? `${pointsInCurrentLevel}/500 pontos para ${levels[nextLevel].name}`
        : 'Nível máximo alcançado!';
    
    const levelProgressText = document.getElementById('levelProgressText');
    if (levelProgressText) {
        levelProgressText.textContent = progressText;
    }
    
    // Mostrar link de admin se for admin
    if (currentUser.role === 'admin') {
        showAdminLink();
    }
}

// Mostrar link de admin
function showAdminLink() {
    // Verificar se já existe
    if (document.getElementById('adminLink')) return;
    
    // Adicionar no header
    const desktopNav = document.querySelector('.desktop-nav');
    if (desktopNav) {
        const adminLink = document.createElement('a');
        adminLink.id = 'adminLink';
        adminLink.href = 'admin.html';
        adminLink.className = 'nav-link admin-link';
        adminLink.innerHTML = '<i class="fas fa-cog"></i> Admin';
        desktopNav.appendChild(adminLink);
    }
    
    // Adicionar no menu mobile
    const bottomNav = document.querySelector('.bottom-nav-items');
    if (bottomNav) {
        const adminItem = document.createElement('a');
        adminItem.href = 'admin.html';
        adminItem.className = 'nav-item admin-item';
        adminItem.innerHTML = `
            <i class="fas fa-cog"></i>
            <span>Admin</span>
        `;
        bottomNav.appendChild(adminItem);
    }
    
    // Adicionar estilos
    const style = document.createElement('style');
    style.textContent = `
        .admin-link, .admin-item {
            color: #DC2626 !important;
        }
        .admin-link:hover {
            background: #FEE2E2 !important;
        }
    `;
    document.head.appendChild(style);
}

// Carregar dados adicionais
async function loadAdditionalData() {
    // Buscar dados do cache para missões e streaks
    const userData = currentUser || JSON.parse(localStorage.getItem('cachedUserData') || '{}');
    
    // Missões do dia
    const totalMissions = 5;
    const completedMissions = userData.missionsCompletedToday || 0;
    const streak = userData.streak || 0;
    
    // Atualizar contadores existentes
    const completedEl = document.getElementById('completedMissions');
    const totalEl = document.getElementById('totalMissions');
    if (completedEl) completedEl.textContent = completedMissions;
    if (totalEl) totalEl.textContent = totalMissions;
    
    // Carregar metas ativas do backend
    await loadActiveGoals();
    
    // Carregar recompensas disponíveis do backend
    await loadAvailableRewards();
    
    // === ACTION HUB ===
    updateActionHub(userData, completedMissions, streak);
    
    // Carregar ranking
    loadRanking();
}

// Carregar metas ativas do backend
async function loadActiveGoals() {
    const activeGoalsEl = document.getElementById('activeGoalsCount');
    if (!activeGoalsEl) return;
    
    try {
        const data = await window.api.get('/goals');
        const goals = data.goals || [];
        // Contar apenas metas não concluídas
        const activeGoals = goals.filter(g => !g.completed).length;
        activeGoalsEl.textContent = activeGoals;
    } catch (error) {
        logger.warn('Não foi possível carregar metas:', error);
        activeGoalsEl.textContent = '0';
    }
}

// Carregar recompensas disponíveis do backend
async function loadAvailableRewards() {
    const availableRewardsEl = document.getElementById('availableRewards');
    if (!availableRewardsEl) return;
    
    try {
        const data = await window.api.get('/rewards');
        const rewards = data.rewards || [];
        // Contar apenas recompensas disponíveis
        const availableRewards = rewards.filter(r => r.available !== false).length;
        availableRewardsEl.textContent = availableRewards;
    } catch (error) {
        logger.warn('Não foi possível carregar recompensas:', error);
        availableRewardsEl.textContent = '0';
    }
}

// Atualizar Action Hub
function updateActionHub(userData, missionsToday, streak) {
    // === STREAK ===
    const streakCount = document.getElementById('streakCount');
    const streakEmoji = document.getElementById('streakEmoji');
    
    if (streakCount) streakCount.textContent = streak;
    if (streakEmoji) {
        // Emojis baseados no streak
        if (streak === 0) streakEmoji.textContent = '💜';
        else if (streak < 3) streakEmoji.textContent = '🔥';
        else if (streak < 7) streakEmoji.textContent = '💪';
        else streakEmoji.textContent = '⭐';
    }
    
    // === CHECK-IN ===
    updateCheckinStatus(userData);
    
    // === RECOMENDAÇÃO ===
    const recommendationText = document.getElementById('recommendationText');
    if (recommendationText) {
        const recommendations = getRecommendation(missionsToday, streak, userData);
        recommendationText.textContent = recommendations.text;
        
        // Atualizar link da recomendação
        const recommendationCard = document.getElementById('recommendationCard');
        if (recommendationCard) {
            const link = recommendationCard.querySelector('.hub-action');
            if (link) link.href = recommendations.link;
        }
    }
}

// Verificar e atualizar status do check-in
function updateCheckinStatus(userData) {
    const checkinBtn = document.getElementById('checkinBtn');
    const checkinStatus = document.getElementById('checkinStatus');
    
    if (!checkinBtn) return;
    
    // Verificar se já fez check-in hoje
    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = userData.lastCheckinDate || null;
    const alreadyCheckedIn = lastCheckin === today;
    
    if (alreadyCheckedIn) {
        checkinBtn.disabled = true;
        checkinBtn.innerHTML = '<i class="fas fa-check"></i> <span>Feito hoje!</span>';
        if (checkinStatus) {
            checkinStatus.textContent = '✨ Volte amanhã!';
            checkinStatus.classList.add('success');
        }
    } else {
        checkinBtn.disabled = false;
        checkinBtn.innerHTML = '<i class="fas fa-check-circle"></i> <span>Check-in (+10 pts)</span>';
        if (checkinStatus) {
            checkinStatus.textContent = '';
            checkinStatus.classList.remove('success');
        }
    }
}

// Função de Check-in
async function doCheckin() {
    const checkinBtn = document.getElementById('checkinBtn');
    const checkinStatus = document.getElementById('checkinStatus');
    const streakCount = document.getElementById('streakCount');
    
    if (!checkinBtn || checkinBtn.disabled) return;
    
    // Desabilitar botão durante a requisição
    checkinBtn.disabled = true;
    checkinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Fazendo check-in...</span>';
    
    try {
        // Chamar API de check-in
        const response = await window.api.post('/user/checkin');
        
        if (response.success) {
            // Atualizar streak na tela
            if (streakCount) {
                streakCount.textContent = response.newStreak || (parseInt(streakCount.textContent) + 1);
            }
            
            // Atualizar pontos na tela
            const totalPointsEl = document.getElementById('totalPoints');
            if (totalPointsEl && response.newTotalPoints !== undefined) {
                totalPointsEl.textContent = response.newTotalPoints;
            }
            
            // Atualizar botão
            checkinBtn.innerHTML = '<i class="fas fa-check"></i> <span>Feito hoje!</span>';
            if (checkinStatus) {
                checkinStatus.textContent = '✨ +10 pontos!';
                checkinStatus.classList.add('success');
            }
            
            // Atualizar cache local
            if (currentUser) {
                currentUser.streak = response.newStreak || (currentUser.streak || 0) + 1;
                currentUser.totalPoints = response.newTotalPoints || currentUser.totalPoints;
                currentUser.lastCheckinDate = new Date().toISOString().split('T')[0];
                localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
            }
            
            // Animação de celebração
            showCheckinCelebration();
        }
    } catch (error) {
        logger.error('Erro ao fazer check-in:', error);
        
        // Reativar botão em caso de erro
        checkinBtn.disabled = false;
        checkinBtn.innerHTML = '<i class="fas fa-check-circle"></i> <span>Check-in (+10 pts)</span>';
        
        if (checkinStatus) {
            checkinStatus.textContent = 'Erro, tente novamente';
            checkinStatus.classList.remove('success');
        }
    }
}

// Animação de celebração do check-in
function showCheckinCelebration() {
    // Criar confetes simples
    const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
    
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            top: 50%;
            left: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: confetti-fall 1s ease-out forwards;
        `;
        
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const velocity = 100 + Math.random() * 100;
        const x = Math.cos(angle) * velocity;
        const y = Math.sin(angle) * velocity;
        
        confetti.style.setProperty('--x', `${x}px`);
        confetti.style.setProperty('--y', `${y}px`);
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 1000);
    }
    
    // Adicionar animação CSS se não existir
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
            @keyframes confetti-fall {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--x), var(--y)) scale(0);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Expor função globalmente
window.doCheckin = doCheckin;

// Gerar recomendação personalizada
function getRecommendation(missionsToday, streak, userData) {
    const totalPoints = userData.totalPoints || 0;
    
    // Prioridade 1: Completar missão se fez poucas hoje
    if (missionsToday < 3) {
        const pointsGain = 10 + (missionsToday * 2);
        return {
            text: `Complete 1 missão e ganhe +${pointsGain} pontos!`,
            link: 'missoes.html'
        };
    }
    
    // Prioridade 2: Se não tem streak, incentivar
    if (streak === 0) {
        return {
            text: 'Comece seu streak hoje! Cada dia conta 💜',
            link: 'missoes.html'
        };
    }
    
    // Prioridade 3: Verificar metas
    if (userData.activeGoals && userData.activeGoals > 0) {
        return {
            text: 'Que tal avançar em uma das suas metas?',
            link: 'metas.html'
        };
    }
    
    // Prioridade 4: Já completou bastante
    if (missionsToday >= 5) {
        return {
            text: 'Incrível! Você completou todas as missões! 🎉',
            link: 'recompensas.html'
        };
    }
    
    // Default
    return {
        text: `Mais ${5 - missionsToday} missões para completar o dia!`,
        link: 'missoes.html'
    };
}

// Carregar ranking (dados reais do servidor)
async function loadRanking() {
    const rankingList = document.getElementById('rankingList');
    const userRankPosition = document.getElementById('userRankPosition');
    
    if (!rankingList) return;
    
    try {
        // Tentar buscar ranking real do servidor
        const data = await window.api.get('/users/ranking');
        
        // API retorna 'users' não 'ranking'
        const rankingData = data.users || data.ranking || [];
        
        if (rankingData.length > 0) {
            displayRanking(rankingData);
        } else {
            showEmptyRanking();
        }
    } catch (error) {
        logger.warn('Não foi possível carregar ranking do servidor:', error);
        
        // Tentar carregar ranking do localStorage
        const cachedRanking = localStorage.getItem('cachedRanking');
        if (cachedRanking) {
            displayRanking(JSON.parse(cachedRanking));
        } else {
            showEmptyRanking();
        }
    }
}

// Exibir ranking
function displayRanking(rankingData) {
    const rankingList = document.getElementById('rankingList');
    const userRankPosition = document.getElementById('userRankPosition');
    if (!rankingList) return;
    
    // Limitar a 10 usuários para o Top 10
    const top10 = rankingData.slice(0, 10);
    
    rankingList.innerHTML = top10.map((user, index) => {
        const isCurrentUser = currentUser && user.uid === currentUser.uid;
        
        // Verificar se o usuário tem foto de perfil
        let avatarHtml;
        if (user.profileImage) {
            avatarHtml = `<img src="${user.profileImage}" alt="${user.name || 'Usuária'}">`;
        } else {
            // Sem foto - mostrar inicial com cor preferida
            const initial = (user.name || 'U').charAt(0).toUpperCase();
            const bgColor = user.preferredColor || '#8B5CF6';
            avatarHtml = `<span style="background:${bgColor};width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:50%;">${initial}</span>`;
        }
        
        return `
            <div class="ranking-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-avatar" style="background:${user.preferredColor || '#8B5CF6'}">
                    ${avatarHtml}
                </div>
                <div class="ranking-info">
                    <div class="ranking-name">${user.name || 'Usuária'}</div>
                </div>
                <div class="ranking-points">${(user.totalPoints || 0).toLocaleString('pt-BR')} pts</div>
            </div>
        `;
    }).join('');
    
    // Calcular posição do usuário atual
    if (userRankPosition && currentUser) {
        const userPosition = rankingData.findIndex(u => u.uid === currentUser.uid);
        if (userPosition !== -1) {
            userRankPosition.textContent = `${userPosition + 1}º`;
        } else {
            // Usuário não está no ranking
            userRankPosition.textContent = '-';
        }
    }
    
    // Salvar no cache
    localStorage.setItem('cachedRanking', JSON.stringify(rankingData));
}

// Exibir ranking vazio
function showEmptyRanking() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;
    
    rankingList.innerHTML = `
        <div class="ranking-empty">
            <i class="fas fa-trophy" style="font-size: 2rem; color: #DDD6FE; margin-bottom: 1rem;"></i>
            <p style="color: #999; text-align: center;">
                O ranking será atualizado quando<br>houver mais usuárias ativas!
            </p>
        </div>
    `;
    
    const userRankPosition = document.getElementById('userRankPosition');
    if (userRankPosition) {
        userRankPosition.textContent = '-';
    }
}

// Logout
window.logout = async function() {
    try {
        await window.api.post('/auth/logout');
    } catch (error) {
        logger.error('Erro ao fazer logout:', error);
    }
    
    window.api.removeToken();
    localStorage.removeItem('cachedUserData');
    window.location.href = 'login.html';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    logger.info('🚀 === INICIANDO DASHBOARD ===');
    logger.info('📍 URL atual:', window.location.href);
    logger.info('🔑 Token presente:', !!window.api.getToken());
    
    // Carregar dados do dashboard
    loadDashboardData();
    
    // Atualizar dados a cada 30 segundos
    setInterval(() => {
        loadAdditionalData();
    }, 30000);
});