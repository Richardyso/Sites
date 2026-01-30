// ===== DASHBOARD UNIFICADO =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// Dados do usuário atual
let currentUser = null;

// Mensagens Motivacionais
const motivationalMessages = [
    "Você é a sua maior prioridade hoje. ✨",
    "Cada pequeno passo é uma vitória. 💜",
    "Brilhe do seu jeito, no seu tempo. 🌟",
    "O autocuidado é a melhor forma de se amar. 🧘‍♀️",
    "Sua evolução é constante, acredite! 💪",
    "Hoje é um ótimo dia para ser incrível. 🌈",
    "Você merece todo o amor que oferece. 💖",
    "Respire fundo e continue brilhando. ✨",
    "Seu brilho é único e necessário. 💎",
    "Transforme seus sonhos em realidade. 🚀"
];

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
    
    // Mensagem Motivacional do Dia
    updateMotivationalMessage();

    // Avatar no header (usa função compartilhada que suporta imagem de perfil)
    if (window.updateHeaderAvatar) {
        window.updateHeaderAvatar(currentUser);
    }
    
    // XP determina nível (não moedas!)
    const totalXp = currentUser.xp || currentUser.totalPoints || 0;
    // Moedas são para recompensas (gastável)
    const totalCoins = currentUser.coins !== undefined ? currentUser.coins : totalXp;
    
    // Preferências
    const userFocusArea = document.getElementById('userFocusArea');
    if (userFocusArea) userFocusArea.textContent = currentUser.focusArea || 'Não definido';
    
    const userColorPreview = document.getElementById('userColorPreview');
    if (userColorPreview) userColorPreview.style.background = currentUser.preferredColor || '#8B5CF6';

    // Calcular nível baseado em XP (mesma lógica do backend)
    let currentLevel;
    if (totalXp < 500) currentLevel = 1;
    else if (totalXp < 1500) currentLevel = 2;
    else if (totalXp < 3000) currentLevel = 3;
    else if (totalXp < 5000) currentLevel = 4;
    else currentLevel = 5;
    
    // Atualizar XP
    const totalPointsElement = document.getElementById('totalPoints');
    if (totalPointsElement) {
        totalPointsElement.textContent = totalXp.toLocaleString('pt-BR');
    }
    
    // Dados de nível com mensagens motivacionais e imagens
    const levels = {
        1: { 
            name: 'Plebeia', 
            message: 'Toda rainha começa aqui.',
            xpNeeded: 500,
            image: 'plebeia.png'
        },
        2: { 
            name: 'Princesa', 
            message: 'Consistência é o teu novo luxo.',
            xpNeeded: 1500,
            image: 'princesa.png'
        },
        3: { 
            name: 'Rainha', 
            message: 'Tu assumes o teu lugar.',
            xpNeeded: 3000,
            image: 'rainha.png'
        },
        4: { 
            name: 'Imperatriz', 
            message: 'Tu não pedes permissão, tu lideras.',
            xpNeeded: 5000,
            image: 'imperatriz.png'
        },
        5: { 
            name: 'Deusa Glow', 
            message: 'O glow agora é natural.',
            xpNeeded: Infinity,
            image: 'deusa.png'
        }
    };
    
    const levelInfo = levels[Math.min(currentLevel, 5)];
    
    // Atualizar nome do nível
    const levelNameEl = document.getElementById('levelName');
    if (levelNameEl) levelNameEl.textContent = levelInfo.name;
    
    // Atualizar imagem do nível
    const levelImage = document.getElementById('levelImage');
    if (levelImage) {
        levelImage.src = `../assets/images/${levelInfo.image}`;
        levelImage.alt = `Nível ${levelInfo.name}`;
    }
    
    // Adicionar mensagem do nível
    const levelQuote = document.getElementById('levelQuote');
    if (levelQuote) {
        levelQuote.textContent = `"${levelInfo.message}"`;
    }
    
    // Progresso do nível baseado em XP
    const levelThresholds = [0, 500, 1500, 3000, 5000];
    const currentLevelMin = levelThresholds[currentLevel - 1];
    const nextLevelMin = currentLevel < 5 ? levelThresholds[currentLevel] : 5000;
    const xpInCurrentLevel = totalXp - currentLevelMin;
    const xpNeededForNext = nextLevelMin - currentLevelMin;
    const progress = currentLevel < 5 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;
    
    const levelProgressFill = document.getElementById('levelProgress');
    if (levelProgressFill) {
        levelProgressFill.style.width = `${Math.min(100, progress)}%`;
    }
    
    // Texto de progresso
    const nextLevel = currentLevel < 5 ? currentLevel + 1 : 5;
    const progressText = currentLevel < 5 
        ? `${xpInCurrentLevel.toLocaleString('pt-BR')}/${xpNeededForNext.toLocaleString('pt-BR')} XP para ${levels[nextLevel].name}`
        : 'Nível máximo alcançado! ✨';
    
    const levelProgressText = document.getElementById('levelProgressText');
    if (levelProgressText) {
        levelProgressText.textContent = progressText;
    }
    
    // Mostrar link de admin se for admin
    if (currentUser.role === 'admin') {
        showAdminLink();
    }
}

// Atualizar mensagem motivacional (uma por dia baseada na data)
function updateMotivationalMessage() {
    const msgEl = document.getElementById('motivationalMessage');
    if (!msgEl) return;

    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % motivationalMessages.length;
    
    msgEl.textContent = `"${motivationalMessages[index]}"`;
}

// Mostrar link de admin
function showAdminLink() {
    // ... (restante da função showAdminLink igual) ...
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
    const userData = currentUser || JSON.parse(localStorage.getItem('cachedUserData') || '{}');
    
    // Missões do dia
    const totalMissions = 5;
    const completedMissions = userData.missionsCompletedToday || 0;
    const streak = userData.streak || 0;
    
    // Atualizar contadores
    const completedEl = document.getElementById('completedMissions');
    const totalEl = document.getElementById('totalMissions');
    if (completedEl) completedEl.textContent = completedMissions;
    if (totalEl) totalEl.textContent = totalMissions;
    
    const streakCount = document.getElementById('streakCount');
    if (streakCount) streakCount.textContent = streak;

    const streakEmoji = document.getElementById('streakEmoji');
    if (streakEmoji) {
        if (streak === 0) streakEmoji.textContent = '💜';
        else if (streak < 3) streakEmoji.textContent = '🔥';
        else if (streak < 7) streakEmoji.textContent = '💪';
        else streakEmoji.textContent = '⭐';
    }

    // Carregar metas ativas do backend
    await loadActiveGoals();
    
    // Carregar recompensas disponíveis do backend
    await loadAvailableRewards();
    
    // Atualizar check-in
    updateCheckinStatus(userData);
    
    // Carregar ranking
    loadRanking();
}

// ... (restante das funções loadActiveGoals e loadAvailableRewards iguais) ...
// Carregar metas ativas do backend
async function loadActiveGoals() {
    const activeGoalsEl = document.getElementById('activeGoalsCount');
    if (!activeGoalsEl) return;
    
    try {
        const data = await window.api.get('/goals');
        const goals = data.goals || [];
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
        const availableRewards = rewards.filter(r => r.available !== false).length;
        availableRewardsEl.textContent = availableRewards;
    } catch (error) {
        logger.warn('Não foi possível carregar recompensas:', error);
        availableRewardsEl.textContent = '0';
    }
}

// Verificar e atualizar status do check-in
function updateCheckinStatus(userData) {
    const checkinBtn = document.getElementById('checkinBtn');
    const checkinStatus = document.getElementById('checkinStatus');
    
    if (!checkinBtn) return;
    
    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = userData.lastCheckinDate || null;
    const alreadyCheckedIn = lastCheckin === today;
    
    if (alreadyCheckedIn) {
        checkinBtn.disabled = true;
        checkinBtn.innerHTML = '<i class="fas fa-check"></i> <span>Check-in Feito!</span>';
        if (checkinStatus) {
            checkinStatus.textContent = '✨ Volte amanhã para brilhar mais!';
            checkinStatus.classList.add('success');
        }
    } else {
        checkinBtn.disabled = false;
        checkinBtn.innerHTML = '<i class="fas fa-heart"></i> <span>Fazer Check-in (+10 pts)</span>';
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
    
    checkinBtn.disabled = true;
    checkinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Brilhando...</span>';
    
    try {
        const response = await window.api.post('/user/checkin');
        
        if (response.success) {
            if (streakCount) {
                streakCount.textContent = response.newStreak || (parseInt(streakCount.textContent) + 1);
            }
            
            const totalPointsEl = document.getElementById('totalPoints');
            if (totalPointsEl && response.newTotalPoints !== undefined) {
                totalPointsEl.textContent = response.newTotalPoints.toLocaleString('pt-BR');
            }
            
            checkinBtn.innerHTML = '<i class="fas fa-check"></i> <span>Check-in Feito!</span>';
            if (checkinStatus) {
                checkinStatus.textContent = '✨ +10 BabiPoints conquistados!';
                checkinStatus.classList.add('success');
            }
            
            if (currentUser) {
                currentUser.streak = response.newStreak || (currentUser.streak || 0) + 1;
                currentUser.xp = response.newTotalPoints || currentUser.xp; // XP é o novo totalPoints
                currentUser.lastCheckinDate = new Date().toISOString().split('T')[0];
                localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
            }
            
            showCheckinCelebration();
        }
    } catch (error) {
        logger.error('Erro ao fazer check-in:', error);
        checkinBtn.disabled = false;
        checkinBtn.innerHTML = '<i class="fas fa-heart"></i> <span>Fazer Check-in</span>';
        if (checkinStatus) {
            checkinStatus.textContent = 'Erro ao fazer check-in';
        }
    }
}

// ... (showCheckinCelebration continua igual) ...
function showCheckinCelebration() {
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
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `@keyframes confetti-fall { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; } }`;
        document.head.appendChild(style);
    }
}

// Expor funções globalmente
window.doCheckin = doCheckin;

// Carregar ranking
async function loadRanking() {
    const rankingList = document.getElementById('rankingList');
    const userRankPosition = document.getElementById('userRankPosition');
    
    if (!rankingList) return;
    
    try {
        const data = await window.api.get('/users/ranking');
        const rankingData = data.users || data.ranking || [];
        
        if (rankingData.length > 0) {
            displayRanking(rankingData);
        } else {
            showEmptyRanking();
        }
    } catch (error) {
        logger.warn('Não foi possível carregar ranking do servidor:', error);
        const cachedRanking = localStorage.getItem('cachedRanking');
        if (cachedRanking) {
            displayRanking(JSON.parse(cachedRanking));
        } else {
            showEmptyRanking();
        }
    }
}

// Exibir ranking com novo layout cute
function displayRanking(rankingData) {
    const rankingList = document.getElementById('rankingList');
    const userRankPosition = document.getElementById('userRankPosition');
    if (!rankingList) return;
    
    const top10 = rankingData.slice(0, 10);
    
    rankingList.innerHTML = top10.map((user, index) => {
        const isCurrentUser = currentUser && user.uid === currentUser.uid;
        
        let avatarHtml;
        if (user.profileImage) {
            avatarHtml = `<img src="${user.profileImage}" alt="${user.name || 'Usuária'}">`;
        } else {
            const initial = (user.name || 'U').charAt(0).toUpperCase();
            const bgColor = user.preferredColor || '#8B5CF6';
            avatarHtml = `<span style="background:${bgColor};width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:50%;color:white;font-weight:bold;">${initial}</span>`;
        }
        
        return `
            <div class="ranking-item-cute ${isCurrentUser ? 'current-user' : ''}">
                <div class="rank-pos-cute">${index + 1}</div>
                <div class="rank-avatar-cute">
                    ${avatarHtml}
                </div>
                <div class="rank-name-cute">${user.name || 'Usuária'}</div>
                <div class="rank-xp-cute">${(user.xp || user.totalPoints || 0).toLocaleString('pt-BR')} XP</div>
            </div>
        `;
    }).join('');
    
    if (userRankPosition && currentUser) {
        const userPosition = rankingData.findIndex(u => u.uid === currentUser.uid);
        if (userPosition !== -1) {
            userRankPosition.textContent = `${userPosition + 1}º`;
        } else {
            userRankPosition.textContent = '-';
        }
    }
    
    localStorage.setItem('cachedRanking', JSON.stringify(rankingData));
}

function showEmptyRanking() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;
    
    rankingList.innerHTML = `
        <div class="ranking-empty">
            <p style="color: #999; text-align: center; padding: 1rem;">
                Ranking em breve... ✨
            </p>
        </div>
    `;
    
    if (userRankPosition) userRankPosition.textContent = '-';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setInterval(() => {
        loadAdditionalData();
    }, 30000);
});