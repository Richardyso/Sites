// ===== PAINEL DE ADMINISTRAÇÃO =====
// Usando IIFE para evitar conflitos de variáveis globais

(function() {
    'use strict';
    
    // Logger local com todas as funções necessárias
    const log = {
        info: (msg, data) => console.log(`ℹ️ ${msg}`, data || ''),
        error: (msg, error) => console.error(`❌ ${msg}`, error || ''),
        warn: (msg, data) => console.warn(`⚠️ ${msg}`, data || ''),
        success: (msg, data) => console.log(`✅ ${msg}`, data || '')
    };
    
    // Estado da aplicação
    let currentUser = null;
    let allUsers = [];
    let allRewards = [];
    let allFlashMissions = [];
    let currentUserHistory = [];
    let currentHistoryFilter = 'all';
    let rewardImageBase64 = null; // Imagem da recompensa em base64
    let editingFlashMissionId = null; // ID da missão relâmpago sendo editada
    
    // ===== AUTENTICAÇÃO E ACESSO =====
    
    async function checkAdminAccess() {
        const token = window.api.getToken();
        
        if (!token) {
            log.warn('Token não encontrado, redirecionando para login');
            window.location.href = 'login.html';
            return false;
        }
        
        try {
            const data = await window.api.get('/auth/me');
            currentUser = data.user;
            
            if (currentUser.role !== 'admin') {
                alert('Acesso negado. Apenas administradores podem acessar esta página.');
                window.location.href = 'dashboard.html';
                return false;
            }
            
            updateHeaderAvatar();
            return true;
        } catch (error) {
            log.error('Erro ao verificar acesso:', error);
            window.location.href = 'login.html';
            return false;
        }
    }
    
    function updateHeaderAvatar() {
        if (!currentUser) return;
        
        const avatarInitial = document.getElementById('avatarInitial');
        const avatarImage = document.getElementById('avatarImage');
        const headerAvatar = document.getElementById('headerAvatar');
        const headerUserName = document.getElementById('headerUserName');
        
        if (headerUserName) {
            headerUserName.textContent = currentUser.name || 'Admin';
        }
        
        if (currentUser.profileImage) {
            if (avatarImage) {
                avatarImage.src = currentUser.profileImage;
                avatarImage.style.display = 'block';
            }
            if (avatarInitial) {
                avatarInitial.style.display = 'none';
            }
        } else {
            const initial = (currentUser.name || 'A').charAt(0).toUpperCase();
            if (avatarInitial) {
                avatarInitial.textContent = initial;
                avatarInitial.style.display = 'block';
            }
            if (avatarImage) {
                avatarImage.style.display = 'none';
            }
            if (headerAvatar && currentUser.preferredColor) {
                headerAvatar.style.background = currentUser.preferredColor;
            }
        }
    }
    
    // ===== USUÁRIOS =====
    
    async function loadAllUsers() {
        log.info('Carregando lista de usuários...');
        
        try {
            const data = await window.api.get('/admin/users');
            log.info('Resposta da API:', data);
            
            if (!data || !data.users) {
                log.warn('Nenhum usuário retornado pela API');
                allUsers = [];
            } else {
                allUsers = data.users
                    .filter(user => user.role !== 'admin')
                    .sort((a, b) => {
                        // Ordenar por XP (não moedas!)
                        const xpA = a.xp || a.totalPoints || 0;
                        const xpB = b.xp || b.totalPoints || 0;
                        return xpB - xpA;
                    });
                
                log.info(`${allUsers.length} usuários carregados`);
            }
            
            displayUsers(allUsers);
        } catch (error) {
            log.error('Erro ao carregar usuários:', error);
            showToast('Erro ao carregar usuários', 'error');
            
            const usersList = document.getElementById('usersList');
            const emptyUsers = document.getElementById('emptyUsers');
            if (usersList) usersList.style.display = 'none';
            if (emptyUsers) emptyUsers.style.display = 'block';
        }
    }
    
    function displayUsers(users, filter = '') {
        const usersList = document.getElementById('usersList');
        const emptyUsers = document.getElementById('emptyUsers');
        
        if (!usersList) {
            log.error('Elemento usersList não encontrado!');
            return;
        }
        
        let filteredUsers = users || [];
        if (filter) {
            filteredUsers = filteredUsers.filter(user => user.focusArea === filter);
        }
        
        if (filteredUsers.length === 0) {
            usersList.style.display = 'none';
            if (emptyUsers) emptyUsers.style.display = 'block';
            return;
        }
        
        usersList.style.display = 'flex';
        if (emptyUsers) emptyUsers.style.display = 'none';
        
        usersList.innerHTML = filteredUsers.map((user, index) => {
            const initial = (user.name || 'U').charAt(0).toUpperCase();
            const firstName = (user.name || 'Usuário').split(' ')[0];
            const rank = index + 1;
            
            // XP e Moedas separados
            const xp = user.xp || user.totalPoints || 0;
            const coins = user.coins !== undefined ? user.coins : xp;
            
            return `
                <div class="user-card" onclick="window.adminOpenEditUserModal('${user.uid}')">
                    <div class="user-rank">${rank}º</div>
                    <div class="user-card-avatar" style="${user.profileImage ? 
                        `background: url('${user.profileImage}') center/cover;` : 
                        `background: ${user.preferredColor || '#8B5CF6'};`}">
                        ${user.profileImage ? '' : initial}
                    </div>
                    <div class="user-card-info">
                        <span class="user-card-name">${firstName}</span>
                        <div class="user-card-details">
                            <span class="user-xp" title="XP (Experiência)">
                                <i class="fas fa-star"></i> ${xp.toLocaleString('pt-BR')} XP
                            </span>
                            <span class="user-coins" title="Moedas">
                                <i class="fas fa-coins"></i> ${coins.toLocaleString('pt-BR')}
                            </span>
                            ${user.focusArea ? `
                                <span class="user-area-focus">
                                    <i class="fas fa-bullseye"></i> ${user.focusArea}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // ===== RECOMPENSAS =====
    
    async function loadRewards() {
        try {
            const data = await window.api.get('/rewards');
            allRewards = data.rewards || [];
            displayRewards();
        } catch (error) {
            log.error('Erro ao carregar recompensas:', error);
            const rewardsList = document.getElementById('rewardsList');
            const emptyRewards = document.getElementById('emptyRewards');
            if (rewardsList) rewardsList.style.display = 'none';
            if (emptyRewards) emptyRewards.style.display = 'block';
        }
    }
    
    function displayRewards() {
        const rewardsList = document.getElementById('rewardsList');
        const emptyRewards = document.getElementById('emptyRewards');
        
        if (!rewardsList) return;
        
        if (allRewards.length === 0) {
            rewardsList.style.display = 'none';
            if (emptyRewards) emptyRewards.style.display = 'block';
            return;
        }
        
        rewardsList.style.display = 'grid';
        if (emptyRewards) emptyRewards.style.display = 'none';
        
        const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3C/svg%3E";
        
        rewardsList.innerHTML = allRewards.map(reward => `
            <div class="reward-card">
                <img class="reward-image" src="${reward.image || placeholder}" alt="${reward.title}" onerror="this.src='${placeholder}'">
                <div class="reward-info">
                    <h4 class="reward-title">${reward.title}</h4>
                    <p class="reward-description">${reward.description || ''}</p>
                    <div class="reward-meta">
                        <span class="reward-points">
                            <i class="fas fa-coins"></i> ${reward.points} pontos
                        </span>
                        <span>${reward.available ? 'Disponível' : 'Indisponível'}</span>
                    </div>
                    <div class="reward-actions">
                        <button class="btn btn-secondary btn-sm" onclick="window.adminEditReward('${reward.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.adminDeleteReward('${reward.id}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // ===== MODAIS =====
    
    function openAddRewardModal() {
        log.info('Abrindo modal de nova recompensa');
        
        const modal = document.getElementById('rewardModal');
        if (!modal) {
            log.error('Modal não encontrado!');
            return;
        }
        
        // Limpar formulário
        const form = document.getElementById('rewardForm');
        if (form) form.reset();
        
        const rewardId = document.getElementById('rewardId');
        if (rewardId) rewardId.value = '';
        
        const modalTitle = document.getElementById('rewardModalTitle');
        if (modalTitle) modalTitle.textContent = 'Nova Recompensa';
        
        const toggle = document.getElementById('rewardAvailableToggle');
        if (toggle) toggle.classList.add('active');
        
        // Limpar imagem
        rewardImageBase64 = null;
        
        const imgElement = document.getElementById('rewardImageElement');
        if (imgElement) {
            imgElement.src = '';
            imgElement.style.display = 'none';
        }
        
        const imgEmpty = document.querySelector('#rewardImagePreview .image-preview-empty');
        if (imgEmpty) imgEmpty.style.display = 'block';
        
        modal.classList.add('active');
    }
    
    function openEditRewardModal(rewardId) {
        const reward = allRewards.find(r => r.id === rewardId);
        if (!reward) return;
        
        document.getElementById('rewardId').value = reward.id;
        document.getElementById('rewardTitle').value = reward.title || '';
        document.getElementById('rewardDescription').value = reward.description || '';
        document.getElementById('rewardPoints').value = reward.points || 0;
        
        const linkField = document.getElementById('rewardLink');
        if (linkField) linkField.value = reward.link || '';
        
        const toggle = document.getElementById('rewardAvailableToggle');
        if (toggle) {
            if (reward.available) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
        
        // Carregar imagem existente
        const imgElement = document.getElementById('rewardImageElement');
        const imgEmpty = document.querySelector('#rewardImagePreview .image-preview-empty');
        
        if (reward.image) {
            rewardImageBase64 = reward.image;
            if (imgElement) {
                imgElement.src = reward.image;
                imgElement.style.display = 'block';
            }
            if (imgEmpty) imgEmpty.style.display = 'none';
        } else {
            rewardImageBase64 = null;
            if (imgElement) {
                imgElement.src = '';
                imgElement.style.display = 'none';
            }
            if (imgEmpty) imgEmpty.style.display = 'block';
        }
        
        document.getElementById('rewardModalTitle').textContent = 'Editar Recompensa';
        document.getElementById('rewardModal').classList.add('active');
    }
    
    function openEditUserModal(userId) {
        const user = allUsers.find(u => u.uid === userId);
        if (!user) return;
        
        // XP e Moedas separados
        const userXp = user.xp || user.totalPoints || 0;
        const userCoins = user.coins !== undefined ? user.coins : userXp;
        
        // Campos do formulário
        document.getElementById('editUserId').value = user.uid;
        document.getElementById('editPoints').value = userXp;
        
        // ===== Profile Header =====
        const userAvatar = document.getElementById('editUserAvatar');
        const userInitial = document.getElementById('editUserInitial');
        const displayName = document.getElementById('editUserDisplayName');
        const emailDisplay = document.getElementById('editUserEmailDisplay');
        const userLevel = document.getElementById('editUserLevel');
        
        // Nome e inicial
        const firstName = (user.name || 'Usuária').split(' ')[0];
        const initial = (user.name || 'U').charAt(0).toUpperCase();
        
        if (displayName) displayName.textContent = user.name || 'Usuária';
        if (emailDisplay) emailDisplay.textContent = user.email || '';
        if (userInitial) userInitial.textContent = initial;
        const phoneDisplay = document.getElementById('editUserPhoneDisplay');
        if (phoneDisplay) {
            phoneDisplay.textContent = user.phone ? formatPhoneForDisplay(user.phone) : 'Telefone não cadastrado';
        }
        
        // Avatar com imagem ou cor de fundo
        if (userAvatar) {
            if (user.profileImage) {
                userAvatar.innerHTML = `<img src="${user.profileImage}" alt="${firstName}">`;
            } else {
                userAvatar.innerHTML = `<span id="editUserInitial">${initial}</span>`;
                userAvatar.style.background = user.preferredColor || 'linear-gradient(135deg, var(--admin-primary), var(--admin-secondary))';
            }
        }
        
        // Nível baseado em XP (não moedas!)
        if (userLevel) {
            const levelInfo = getLevelInfo(userXp);
            userLevel.textContent = `${levelInfo.emoji} ${levelInfo.name}`;
        }
        
        // ===== Info Cards =====
        // XP (Experiência)
        const xpDisplay = document.getElementById('editUserXpDisplay');
        if (xpDisplay) {
            xpDisplay.textContent = userXp.toLocaleString('pt-BR');
        }
        
        // Moedas
        const coinsDisplay = document.getElementById('editUserCoinsDisplay');
        if (coinsDisplay) {
            coinsDisplay.textContent = userCoins.toLocaleString('pt-BR');
        }
        
        // Fallback para elemento antigo de pontos
        const pointsDisplay = document.getElementById('editUserPointsDisplay');
        if (pointsDisplay) {
            pointsDisplay.textContent = userXp.toLocaleString('pt-BR');
        }
        
        // Cor Favorita
        const colorIcon = document.getElementById('editUserColorIcon');
        const colorName = document.getElementById('editUserColorName');
        
        if (colorIcon && colorName) {
            const userColor = user.preferredColor || '#8B5CF6';
            colorIcon.style.background = userColor + '30'; // 30% opacity
            colorIcon.innerHTML = `<i class="fas fa-palette" style="color: ${userColor};"></i>`;
            colorName.innerHTML = `<span class="color-swatch" style="background: ${userColor};"></span>${getColorName(userColor)}`;
        }
        
        // Área de Foco
        const focusArea = document.getElementById('editUserFocusArea');
        if (focusArea) {
            focusArea.textContent = user.focusArea || 'Não definida';
        }
        
        // Limpar campos de grant points
        const grantXp = document.getElementById('grantXpAmount');
        const grantCoins = document.getElementById('grantCoinsAmount');
        const grantReason = document.getElementById('grantPointsReason');
        if (grantXp) grantXp.value = '';
        if (grantCoins) grantCoins.value = '';
        if (grantReason) grantReason.value = '';
        
        // Limpar campos de penalização
        const penaltyXp = document.getElementById('penaltyXpAmount');
        const penaltyCoins = document.getElementById('penaltyCoinsAmount');
        const penaltyReason = document.getElementById('penaltyReason');
        if (penaltyXp) penaltyXp.value = '';
        if (penaltyCoins) penaltyCoins.value = '';
        if (penaltyReason) penaltyReason.value = '';
        
        document.getElementById('editUserModal').classList.add('active');
        
        // Carregar metas do usuário
        loadUserGoals(userId);
        
        // Carregar histórico do usuário
        loadUserHistory(userId);
    }
    
    // ===== METAS DO USUÁRIO =====
    
    async function loadUserGoals(userId) {
        const goalsList = document.getElementById('userGoalsList');
        const goalsEmpty = document.getElementById('userGoalsEmpty');
        
        if (!goalsList) return;
        
        // Mostrar loading
        goalsList.innerHTML = `
            <div class="goals-loading">
                <i class="fas fa-spinner fa-spin"></i> Carregando metas...
            </div>
        `;
        if (goalsEmpty) goalsEmpty.style.display = 'none';
        
        try {
            // Buscar metas do usuário via API
            const data = await window.api.get(`/admin/users/${userId}/goals`);
            const goals = data.goals || [];
            
            log.info(`${goals.length} metas encontradas`);
            
            // Exibir metas
            displayUserGoals(goals);
            
        } catch (error) {
            log.error('Erro ao carregar metas:', error);
            goalsList.innerHTML = '';
            if (goalsEmpty) {
                goalsEmpty.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Erro ao carregar metas</p>
                `;
                goalsEmpty.style.display = 'block';
            }
        }
    }
    
    function displayUserGoals(goals) {
        const goalsList = document.getElementById('userGoalsList');
        const goalsEmpty = document.getElementById('userGoalsEmpty');
        
        if (!goalsList) return;
        
        if (goals.length === 0) {
            goalsList.innerHTML = '';
            if (goalsEmpty) {
                goalsEmpty.innerHTML = `
                    <i class="fas fa-bullseye"></i>
                    <p>Nenhuma meta criada</p>
                `;
                goalsEmpty.style.display = 'block';
            }
            return;
        }
        
        if (goalsEmpty) goalsEmpty.style.display = 'none';
        
        // Ícones por categoria
        const categoryIcons = {
            'Mental': '🧠',
            'Físico': '💪',
            'Emocional': '💜',
            'Espiritual': '✨',
            'Financeiro': '💰',
            'Aparência': '💅'
        };
        
        // Labels por período
        const periodLabels = {
            'weekly': { icon: 'calendar-week', label: 'Semanal', class: 'weekly' },
            'monthly': { icon: 'calendar-alt', label: 'Mensal', class: 'monthly' },
            'yearly': { icon: 'calendar', label: 'Anual', class: 'yearly' }
        };
        
        goalsList.innerHTML = goals.map(goal => {
            const icon = categoryIcons[goal.category] || '🎯';
            const isCompleted = goal.completed;
            const statusClass = isCompleted ? 'completed' : 'active';
            const statusText = isCompleted ? 'Concluída' : 'Em andamento';
            const description = goal.description ? `<div class="goal-item-description">${goal.description}</div>` : '';
            
            // Período
            const periodInfo = periodLabels[goal.period] || periodLabels['monthly'];
            const periodBadge = `<span class="goal-period-badge ${periodInfo.class}"><i class="fas fa-${periodInfo.icon}"></i> ${periodInfo.label}</span>`;
            
            // Anotações
            const notes = goal.notes ? `
                <div class="goal-item-notes">
                    <div class="notes-label"><i class="fas fa-sticky-note"></i> Anotações:</div>
                    <p>${goal.notes}</p>
                </div>
            ` : '';
            
            return `
                <div class="goal-item ${isCompleted ? 'completed' : ''}">
                    <div class="goal-item-icon">
                        ${icon}
                    </div>
                    <div class="goal-item-info">
                        <div class="goal-item-badges">
                            ${periodBadge}
                            <span class="goal-category-badge">${goal.category || 'Geral'}</span>
                        </div>
                        <div class="goal-item-title">${goal.title}</div>
                        ${description}
                        ${notes}
                    </div>
                    <div class="goal-item-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // ===== HISTÓRICO DO USUÁRIO =====
    
    async function loadUserHistory(userId) {
        const historyList = document.getElementById('userHistoryList');
        const historyEmpty = document.getElementById('userHistoryEmpty');
        
        if (!historyList) return;
        
        // Mostrar loading
        historyList.innerHTML = `
            <div class="history-loading">
                <i class="fas fa-spinner fa-spin"></i> Carregando histórico...
            </div>
        `;
        if (historyEmpty) historyEmpty.style.display = 'none';
        
        try {
            // Buscar histórico do usuário via API
            const data = await window.api.get(`/admin/users/${userId}/history`);
            currentUserHistory = data.history || [];
            
            log.info(`${currentUserHistory.length} registros de histórico carregados`);
            
            // Exibir histórico
            displayUserHistory();
            
        } catch (error) {
            log.error('Erro ao carregar histórico:', error);
            currentUserHistory = [];
            historyList.innerHTML = '';
            if (historyEmpty) {
                historyEmpty.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Erro ao carregar histórico</p>
                `;
                historyEmpty.style.display = 'block';
            }
        }
    }
    
    function displayUserHistory() {
        const historyList = document.getElementById('userHistoryList');
        const historyEmpty = document.getElementById('userHistoryEmpty');
        const historyTable = document.getElementById('userHistoryTable');
        
        if (!historyList) return;
        
        // Aplicar filtro
        let filteredHistory = currentUserHistory;
        if (currentHistoryFilter === 'earned') {
            filteredHistory = currentUserHistory.filter(item => {
                const xp = item.xp !== undefined ? item.xp : (item.points || 0);
                const coins = item.coins !== undefined ? item.coins : (item.points || 0);
                return (xp > 0 || coins > 0) && item.type !== 'admin_penalty';
            });
        } else if (currentHistoryFilter === 'spent') {
            filteredHistory = currentUserHistory.filter(item => {
                const xp = item.xp !== undefined ? item.xp : (item.points || 0);
                const coins = item.coins !== undefined ? item.coins : (item.points || 0);
                return (xp < 0 || coins < 0 || item.type === 'spent' || item.type === 'reward_redeemed') && item.type !== 'admin_penalty';
            });
        } else if (currentHistoryFilter === 'penalty') {
            filteredHistory = currentUserHistory.filter(item => item.type === 'admin_penalty');
        }
        
        if (filteredHistory.length === 0) {
            historyList.innerHTML = '<tr><td colspan="4" class="history-empty-row">Nenhum registro encontrado</td></tr>';
            if (historyTable) historyTable.style.display = 'table';
            if (historyEmpty) {
                const filterMessages = {
                    'all': 'Nenhum histórico de transações',
                    'earned': 'Nenhum ganho registrado',
                    'spent': 'Nenhum gasto ou resgate registrado',
                    'penalty': 'Nenhuma penalidade registrada'
                };
                historyEmpty.innerHTML = `
                    <i class="fas fa-inbox"></i>
                    <p>${filterMessages[currentHistoryFilter] || filterMessages['all']}</p>
                `;
                historyEmpty.style.display = 'block';
            }
            return;
        }
        
        if (historyEmpty) historyEmpty.style.display = 'none';
        if (historyTable) historyTable.style.display = 'table';
        
        historyList.innerHTML = filteredHistory.map(item => {
            // XP e Moedas separados (com fallback para points antigo)
            const xp = item.xp !== undefined ? item.xp : (item.points || 0);
            const coins = item.coins !== undefined ? item.coins : (item.points || 0);
            
            const isPenalty = item.type === 'admin_penalty';
            const isSpent = item.type === 'spent' || item.type === 'reward_redeemed';
            const icon = getHistoryIcon(item.type);
            
            // Formatar data
            let dateStr = '-';
            if (item.date || item.createdAt) {
                const date = new Date(item.date || item.createdAt);
                dateStr = date.toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            // Classes de estilo para moedas
            let coinsClass = 'positive';
            if (isPenalty || coins < 0) coinsClass = 'negative';
            else if (isSpent) coinsClass = 'negative';
            else if (coins === 0) coinsClass = 'neutral';
            
            // Classes de estilo para XP
            let xpClass = 'positive';
            if (isPenalty || xp < 0) xpClass = 'negative';
            else if (xp === 0) xpClass = 'neutral';
            
            // Formatar valores
            const coinsSign = coins > 0 ? '+' : '';
            const xpSign = xp > 0 ? '+' : '';
            const coinsDisplay = coins !== 0 ? `${coinsSign}${coins}` : '-';
            const xpDisplay = xp !== 0 ? `${xpSign}${xp}` : '-';
            
            const obsSafe = item.observation ? String(item.observation).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';
            const actionContent = item.type === 'mission_completed' && item.observation
                ? `${icon} ${item.reason || item.action || 'Transação'}<br><span class="history-observation"><i class="fas fa-sticky-note"></i> ${obsSafe}</span>`
                : `${icon} ${item.reason || item.action || 'Transação'}`;
            return `
                <tr class="${isPenalty ? 'penalty-row' : ''}">
                    <td class="history-date">${dateStr}</td>
                    <td class="history-action">${actionContent}</td>
                    <td class="history-coins ${coinsClass}">${coinsDisplay}</td>
                    <td class="history-xp ${xpClass}">${xpDisplay}</td>
                </tr>
            `;
        }).join('');
    }
    
    function getHistoryIcon(type) {
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
    
    function filterHistory(filter, button) {
        currentHistoryFilter = filter;
        
        // Atualizar visual dos botões
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        if (button) button.classList.add('active');
        
        // Reexibir histórico com novo filtro
        displayUserHistory();
    }
    
    // Obter informações do nível baseado em XP (MESMA DEFINIÇÃO DO BACKEND)
    function getLevelInfo(xp) {
        const levels = [
            { level: 1, name: 'Plebeia', emoji: '🌱', minXp: 0, maxXp: 499 },
            { level: 2, name: 'Princesa', emoji: '👑', minXp: 500, maxXp: 1499 },
            { level: 3, name: 'Rainha', emoji: '✨', minXp: 1500, maxXp: 2999 },
            { level: 4, name: 'Imperatriz', emoji: '💎', minXp: 3000, maxXp: 4999 },
            { level: 5, name: 'Deusa Glow', emoji: '🔥', minXp: 5000, maxXp: Infinity }
        ];
        
        for (let i = levels.length - 1; i >= 0; i--) {
            if (xp >= levels[i].minXp) {
                return levels[i];
            }
        }
        return levels[0];
    }
    
    // Calcular nível numérico baseado em pontos
    function calculateLevel(points) {
        return getLevelInfo(points).level;
    }
    
    // Obter nome da cor baseado no hex
    function getColorName(hex) {
        const colors = {
            '#8B5CF6': 'Roxo',
            '#EC4899': 'Rosa',
            '#F59E0B': 'Laranja',
            '#10B981': 'Verde',
            '#3B82F6': 'Azul',
            '#EF4444': 'Vermelho',
            '#6366F1': 'Índigo',
            '#14B8A6': 'Turquesa',
            '#F97316': 'Laranja Forte',
            '#A855F7': 'Violeta',
            '#06B6D4': 'Ciano',
            '#84CC16': 'Lima'
        };
        
        // Procurar cor exata ou similar
        const upperHex = hex?.toUpperCase();
        if (colors[upperHex]) return colors[upperHex];
        
        // Se não encontrar, retornar o próprio hex
        return hex || 'Padrão';
    }
    
    // Formatar telefone para exibição no admin
    // Brasil (+55): +55 (XX) 9 XXXX-XXXX
    // Outros países: DDI + espaço + dígitos (sem formatação específica)
    function formatPhoneForDisplay(phone) {
        if (!phone || typeof phone !== 'string') return '';
        const raw = phone.trim();
        const digits = raw.replace(/\D/g, '');
        if (digits.length < 10) return raw;
        const ddiMatch = raw.match(/^(\+\d{1,4})/);
        const ddi = ddiMatch ? ddiMatch[1] : '';
        const ddiDigits = ddi.replace(/\D/g, '');
        const afterDdi = digits.slice(ddiDigits.length);
        if (!afterDdi.length) return raw;
        if (ddi === '+55') {
            if (afterDdi.length !== 11) return raw;
            const ddd = afterDdi.slice(0, 2);
            const num = afterDdi.slice(2);
            return `+55 (${ddd}) ${num.slice(0, 1)} ${num.slice(1, 5)}-${num.slice(5)}`;
        }
        return ddi + ' ' + afterDdi;
    }
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }
    
    // ===== UPLOAD DE IMAGEM =====
    
    // Handler para seleção de imagem da recompensa
    function handleRewardImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione uma imagem válida', 'error');
            return;
        }
        
        // Validar tamanho inicial (máximo 5MB antes de comprimir)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Imagem muito grande. Máximo 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                log.info('Comprimindo imagem...');
                
                // Comprimir imagem
                const compressedImage = await compressImage(event.target.result, {
                    maxWidth: 400,
                    maxHeight: 400,
                    quality: 0.8,
                    maxSizeKB: 150 // Máximo 150KB para recompensas
                });
                
                // Salvar base64
                rewardImageBase64 = compressedImage;
                
                // Mostrar preview
                const imgElement = document.getElementById('rewardImageElement');
                const imgEmpty = document.querySelector('#rewardImagePreview .image-preview-empty');
                
                if (imgElement) {
                    imgElement.src = compressedImage;
                    imgElement.style.display = 'block';
                }
                
                if (imgEmpty) {
                    imgEmpty.style.display = 'none';
                }
                
                log.success('Imagem carregada com sucesso!');
                
            } catch (error) {
                log.error('Erro ao processar imagem:', error);
                showToast('Erro ao processar imagem. Tente outra.', 'error');
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    // Função de compressão de imagem
    async function compressImage(imageSrc, options = {}) {
        const {
            maxWidth = 400,
            maxHeight = 400,
            quality = 0.8,
            maxSizeKB = 150
        } = options;
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                // Calcular novo tamanho mantendo proporção
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                
                // Criar canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                
                // Fundo branco e desenhar imagem
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para base64 com qualidade ajustável
                let currentQuality = quality;
                let base64 = canvas.toDataURL('image/jpeg', currentQuality);
                
                // Reduzir qualidade até atingir tamanho máximo
                while (getBase64SizeKB(base64) > maxSizeKB && currentQuality > 0.1) {
                    currentQuality -= 0.1;
                    base64 = canvas.toDataURL('image/jpeg', currentQuality);
                }
                
                // Se ainda estiver muito grande, reduzir dimensões
                if (getBase64SizeKB(base64) > maxSizeKB) {
                    const scale = Math.sqrt(maxSizeKB / getBase64SizeKB(base64));
                    canvas.width = Math.round(width * scale);
                    canvas.height = Math.round(height * scale);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    base64 = canvas.toDataURL('image/jpeg', 0.6);
                }
                
                log.info(`Imagem comprimida: ${getBase64SizeKB(base64).toFixed(2)}KB`);
                resolve(base64);
            };
            
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = imageSrc;
        });
    }
    
    // Calcular tamanho do base64 em KB
    function getBase64SizeKB(base64String) {
        // Remover o prefixo data:image/xxx;base64,
        const base64 = base64String.split(',')[1] || base64String;
        // Calcular tamanho aproximado em bytes
        const padding = (base64.match(/=/g) || []).length;
        const sizeInBytes = (base64.length * 3) / 4 - padding;
        return sizeInBytes / 1024;
    }
    
    // ===== AÇÕES =====
    
    async function saveReward(e) {
        e.preventDefault();
        
        const rewardId = document.getElementById('rewardId').value;
        const toggle = document.getElementById('rewardAvailableToggle');
        const isAvailable = toggle ? toggle.classList.contains('active') : true;
        
        const rewardData = {
            title: document.getElementById('rewardTitle').value,
            description: document.getElementById('rewardDescription').value,
            points: parseInt(document.getElementById('rewardPoints').value) || 0,
            available: isAvailable
        };
        
        const linkField = document.getElementById('rewardLink');
        if (linkField && linkField.value) {
            rewardData.link = linkField.value;
        }
        
        // Adicionar imagem se houver
        if (rewardImageBase64) {
            rewardData.image = rewardImageBase64;
        }
        
        try {
            const saveBtn = document.getElementById('saveRewardBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            }
            
            if (rewardId) {
                await window.api.put(`/rewards/${rewardId}`, rewardData);
                showToast('Recompensa atualizada!', 'success');
            } else {
                await window.api.post('/rewards', rewardData);
                showToast('Recompensa criada!', 'success');
            }
            
            closeModal('rewardModal');
            rewardImageBase64 = null; // Limpar após salvar
            await loadRewards();
        } catch (error) {
            log.error('Erro ao salvar recompensa:', error);
            showToast('Erro ao salvar recompensa', 'error');
        } finally {
            const saveBtn = document.getElementById('saveRewardBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Salvar Recompensa';
            }
        }
    }
    
    async function deleteReward(rewardId) {
        if (!confirm('Excluir esta recompensa?')) return;
        
        try {
            await window.api.delete(`/rewards/${rewardId}`);
            allRewards = allRewards.filter(r => r.id !== rewardId);
            displayRewards();
            showToast('Recompensa excluída!', 'success');
        } catch (error) {
            log.error('Erro ao excluir:', error);
            showToast('Erro ao excluir', 'error');
        }
    }
    
    async function saveUserEdit(e) {
        e.preventDefault();
        
        const userId = document.getElementById('editUserId').value;
        const data = {
            name: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value
        };
        
        try {
            await window.api.put(`/admin/users/${userId}`, data);
            
            const idx = allUsers.findIndex(u => u.uid === userId);
            if (idx !== -1) {
                allUsers[idx] = { ...allUsers[idx], ...data };
                displayUsers(allUsers);
            }
            
            closeModal('editUserModal');
            showToast('Usuária atualizada!', 'success');
        } catch (error) {
            log.error('Erro ao atualizar:', error);
            showToast('Erro ao atualizar', 'error');
        }
    }
    
    async function grantPoints() {
        const userId = document.getElementById('editUserId').value;
        
        // Pegar valores de XP e Moedas separadamente
        const xpInput = document.getElementById('grantXpAmount');
        const coinsInput = document.getElementById('grantCoinsAmount');
        const reasonInput = document.getElementById('grantPointsReason');
        
        // Fallback para campo antigo se os novos não existirem
        const oldAmountInput = document.getElementById('grantPointsAmount');
        
        let xpAmount = 0;
        let coinsAmount = 0;
        
        if (xpInput && coinsInput) {
            xpAmount = parseInt(xpInput.value) || 0;
            coinsAmount = parseInt(coinsInput.value) || 0;
        } else if (oldAmountInput) {
            // Compatibilidade: se usar campo antigo, dar XP e moedas iguais
            const amount = parseInt(oldAmountInput.value) || 0;
            xpAmount = amount;
            coinsAmount = amount;
        }
        
        const reason = reasonInput ? reasonInput.value : '';
        
        // Debug: Log dos valores que serão enviados
        log.info('Valores a serem concedidos:', { xp: xpAmount, coins: coinsAmount, reason });
        
        if (xpAmount <= 0 && coinsAmount <= 0) {
            showToast('Digite uma quantidade válida de XP ou moedas', 'error');
            return;
        }
        
        // Confirmação antes de enviar
        const confirmMsg = `Conceder:\n• ${xpAmount} XP\n• ${coinsAmount} Moedas\n\nConfirmar?`;
        if (!confirm(confirmMsg)) {
            return;
        }
        
        try {
            log.info('Enviando para API:', { xp: xpAmount, coins: coinsAmount });
            
            await window.api.post(`/admin/users/${userId}/grant-points`, {
                xp: xpAmount,
                coins: coinsAmount,
                reason: reason || 'Pontos concedidos pelo admin'
            });
            
            const idx = allUsers.findIndex(u => u.uid === userId);
            if (idx !== -1) {
                allUsers[idx].xp = (allUsers[idx].xp || allUsers[idx].totalPoints || 0) + xpAmount;
                allUsers[idx].coins = (allUsers[idx].coins !== undefined ? allUsers[idx].coins : allUsers[idx].xp) + coinsAmount;
                allUsers[idx].totalPoints = allUsers[idx].xp; // Compatibilidade
                
                // Atualizar displays
                const xpDisplay = document.getElementById('editUserXpDisplay');
                const coinsDisplay = document.getElementById('editUserCoinsDisplay');
                if (xpDisplay) xpDisplay.textContent = allUsers[idx].xp.toLocaleString('pt-BR');
                if (coinsDisplay) coinsDisplay.textContent = allUsers[idx].coins.toLocaleString('pt-BR');
                
                // Atualizar nível
                const userLevel = document.getElementById('editUserLevel');
                if (userLevel) {
                    const levelInfo = getLevelInfo(allUsers[idx].xp);
                    userLevel.textContent = `${levelInfo.emoji} ${levelInfo.name}`;
                }
                
                allUsers.sort((a, b) => (b.xp || b.totalPoints || 0) - (a.xp || a.totalPoints || 0));
                displayUsers(allUsers);
            }
            
            // Limpar campos
            if (xpInput) xpInput.value = '';
            if (coinsInput) coinsInput.value = '';
            if (oldAmountInput) oldAmountInput.value = '';
            if (reasonInput) reasonInput.value = '';
            
            // Recarregar histórico
            loadUserHistory(userId);
            
            const message = [];
            if (xpAmount > 0) message.push(`${xpAmount} XP`);
            if (coinsAmount > 0) message.push(`${coinsAmount} moedas`);
            showToast(`${message.join(' e ')} concedidos!`, 'success');
        } catch (error) {
            log.error('Erro ao conceder pontos:', error);
            showToast('Erro ao conceder pontos', 'error');
        }
    }
    
    async function penalizeUser() {
        const userId = document.getElementById('editUserId').value;
        
        const xpInput = document.getElementById('penaltyXpAmount');
        const coinsInput = document.getElementById('penaltyCoinsAmount');
        const reasonInput = document.getElementById('penaltyReason');
        
        const xpAmount = parseInt(xpInput?.value) || 0;
        const coinsAmount = parseInt(coinsInput?.value) || 0;
        const reason = reasonInput?.value || '';
        
        if (xpAmount <= 0 && coinsAmount <= 0) {
            showToast('Digite uma quantidade válida de XP ou moedas a remover', 'error');
            return;
        }
        
        if (!reason.trim()) {
            showToast('É obrigatório informar o motivo da penalização', 'error');
            return;
        }
        
        // Confirmar ação
        const user = allUsers.find(u => u.uid === userId);
        const userName = user?.name || 'Usuária';
        const confirmMsg = `Tem certeza que deseja penalizar ${userName}?\n\nSerá removido:\n${xpAmount > 0 ? `- ${xpAmount} XP\n` : ''}${coinsAmount > 0 ? `- ${coinsAmount} Moedas\n` : ''}\nMotivo: ${reason}`;
        
        if (!confirm(confirmMsg)) return;
        
        try {
            const response = await window.api.post(`/admin/users/${userId}/penalize`, {
                xp: xpAmount,
                coins: coinsAmount,
                reason: reason
            });
            
            const idx = allUsers.findIndex(u => u.uid === userId);
            if (idx !== -1) {
                allUsers[idx].xp = response.newXp;
                allUsers[idx].coins = response.newCoins;
                allUsers[idx].totalPoints = response.newXp; // Compatibilidade
                
                // Atualizar displays
                const xpDisplay = document.getElementById('editUserXpDisplay');
                const coinsDisplay = document.getElementById('editUserCoinsDisplay');
                if (xpDisplay) xpDisplay.textContent = allUsers[idx].xp.toLocaleString('pt-BR');
                if (coinsDisplay) coinsDisplay.textContent = allUsers[idx].coins.toLocaleString('pt-BR');
                
                // Atualizar nível
                const userLevel = document.getElementById('editUserLevel');
                if (userLevel) {
                    const levelInfo = getLevelInfo(allUsers[idx].xp);
                    userLevel.textContent = `${levelInfo.emoji} ${levelInfo.name}`;
                }
                
                allUsers.sort((a, b) => (b.xp || b.totalPoints || 0) - (a.xp || a.totalPoints || 0));
                displayUsers(allUsers);
            }
            
            // Limpar campos
            if (xpInput) xpInput.value = '';
            if (coinsInput) coinsInput.value = '';
            if (reasonInput) reasonInput.value = '';
            
            // Recarregar histórico
            loadUserHistory(userId);
            
            const message = [];
            if (xpAmount > 0) message.push(`${xpAmount} XP`);
            if (coinsAmount > 0) message.push(`${coinsAmount} moedas`);
            showToast(`Penalização aplicada: -${message.join(' e -')}`, 'success');
        } catch (error) {
            log.error('Erro ao penalizar usuário:', error);
            showToast(error.message || 'Erro ao penalizar usuário', 'error');
        }
    }
    
    async function deleteUserInAdmin() {
        const userId = document.getElementById('editUserId').value;
        if (!userId) return;
        const user = allUsers.find(u => u.uid === userId);
        const name = user ? (user.name || user.email || 'Usuária') : 'Usuária';
        if (!confirm(`Excluir permanentemente "${name}"? Esta ação não pode ser desfeita.`)) return;
        try {
            await window.api.delete(`/admin/users/${userId}`);
            allUsers = allUsers.filter(u => u.uid !== userId);
            displayUsers(allUsers);
            closeModal('editUserModal');
            showToast('Usuária excluída.', 'success');
        } catch (error) {
            log.error('Erro ao excluir usuária:', error);
            showToast(error.message || 'Erro ao excluir usuária', 'error');
        }
    }
    
    // ===== UTILIDADES =====
    
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    // ===== EXPOR FUNÇÕES GLOBAIS =====
    window.adminOpenEditUserModal = openEditUserModal;
    window.adminEditReward = openEditRewardModal;
    window.adminDeleteReward = deleteReward;
    window.adminOpenAddReward = openAddRewardModal;
    window.adminFilterHistory = filterHistory;
    window.adminPenalizeUser = penalizeUser;
    
    // ===== MISSÕES RELÂMPAGO =====
    
    async function loadFlashMissions() {
        try {
            const data = await window.api.get('/missions/flash/admin');
            
            if (data.success && data.flashMissions) {
                allFlashMissions = data.flashMissions;
                displayFlashMissions();
            } else {
                allFlashMissions = [];
                displayFlashMissions();
            }
        } catch (error) {
            log.error('Erro ao carregar missões relâmpago:', error);
            allFlashMissions = [];
            displayFlashMissions();
        }
    }
    
    function displayFlashMissions() {
        const flashList = document.getElementById('flashMissionsAdminList');
        const emptyState = document.getElementById('emptyFlashMissions');
        
        if (!flashList) return;
        
        if (allFlashMissions.length === 0) {
            flashList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        
        flashList.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        
        flashList.innerHTML = allFlashMissions.map(mission => {
            const expiresAt = new Date(mission.expiresAt);
            const now = new Date();
            const isExpired = expiresAt < now;
            const isActive = mission.active && !isExpired;
            
            const timeLeft = isExpired ? 'Expirada' : getFlashTimeLeft(expiresAt);
            
            return `
                <div class="flash-mission-admin-card ${isActive ? 'active' : 'expired'}">
                    <div class="flash-admin-header">
                        <span class="flash-status ${isActive ? 'active' : 'expired'}">
                            ${isActive ? '<i class="fas fa-bolt"></i> Ativa' : '<i class="fas fa-times"></i> Expirada'}
                        </span>
                        <span class="flash-timer-admin">${timeLeft}</span>
                    </div>
                    <h4 class="flash-admin-title">${mission.title}</h4>
                    ${mission.description ? `<p class="flash-admin-desc">${mission.description}</p>` : ''}
                    <div class="flash-admin-rewards">
                        <span><i class="fas fa-star"></i> ${mission.xp || 0} XP</span>
                        <span><i class="fas fa-coins"></i> ${mission.coins || 0} Moedas</span>
                        <span><i class="fas fa-users"></i> ${mission.totalClaims || 0} resgates</span>
                    </div>
                    <div class="flash-admin-link">
                        <a href="${mission.link}" target="_blank" title="Abrir link">
                            <i class="fas fa-external-link-alt"></i> ${mission.link.substring(0, 40)}...
                        </a>
                    </div>
                    <div class="flash-admin-actions">
                        <button class="btn btn-sm btn-secondary" onclick="editFlashMission('${mission.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteFlashMission('${mission.id}')">
                            <i class="fas fa-trash"></i> Deletar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function getFlashTimeLeft(expiresAt) {
        const now = new Date();
        const diff = expiresAt - now;
        
        if (diff <= 0) return 'Expirada';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h restantes`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m restantes`;
        } else {
            return `${minutes}m restantes`;
        }
    }
    
    function openFlashMissionModal(flashMission = null) {
        editingFlashMissionId = flashMission ? flashMission.id : null;
        
        const modal = document.getElementById('flashMissionModal');
        const modalTitle = document.getElementById('flashModalTitle');
        const saveBtn = document.getElementById('saveFlashBtn');
        
        // Limpar formulário
        document.getElementById('flashMissionId').value = '';
        document.getElementById('flashTitle').value = '';
        document.getElementById('flashDescription').value = '';
        document.getElementById('flashXp').value = '20';
        document.getElementById('flashCoins').value = '20';
        document.getElementById('flashLink').value = '';
        document.getElementById('flashExpiresIn').value = '24';
        
        if (flashMission) {
            // Modo edição
            modalTitle.textContent = 'Editar Missão Relâmpago';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
            
            document.getElementById('flashMissionId').value = flashMission.id;
            document.getElementById('flashTitle').value = flashMission.title || '';
            document.getElementById('flashDescription').value = flashMission.description || '';
            document.getElementById('flashXp').value = flashMission.xp || 0;
            document.getElementById('flashCoins').value = flashMission.coins || 0;
            document.getElementById('flashLink').value = flashMission.link || '';
        } else {
            // Modo criação
            modalTitle.textContent = 'Nova Missão Relâmpago';
            saveBtn.innerHTML = '<i class="fas fa-bolt"></i> Criar Missão';
        }
        
        modal.classList.add('active');
    }
    
    async function saveFlashMission(e) {
        e.preventDefault();
        
        const id = document.getElementById('flashMissionId').value;
        const title = document.getElementById('flashTitle').value.trim();
        const description = document.getElementById('flashDescription').value.trim();
        const xp = parseInt(document.getElementById('flashXp').value) || 0;
        const coins = parseInt(document.getElementById('flashCoins').value) || 0;
        const link = document.getElementById('flashLink').value.trim();
        const expiresInHours = document.getElementById('flashExpiresIn').value;
        
        if (!title || !link) {
            alert('Título e Link são obrigatórios!');
            return;
        }
        
        const saveBtn = document.getElementById('saveFlashBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        
        try {
            let response;
            
            if (id) {
                // Atualizar
                response = await window.api.put(`/missions/flash/${id}`, {
                    title, description, xp, coins, link, expiresInHours
                });
            } else {
                // Criar
                response = await window.api.post('/missions/flash', {
                    title, description, xp, coins, link, expiresInHours
                });
            }
            
            if (response.success) {
                closeModal('flashMissionModal');
                await loadFlashMissions();
                showToast(id ? 'Missão relâmpago atualizada!' : 'Missão relâmpago criada!', 'success');
            }
        } catch (error) {
            log.error('Erro ao salvar missão relâmpago:', error);
            alert('Erro ao salvar missão relâmpago: ' + (error.message || 'Erro desconhecido'));
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = id ? '<i class="fas fa-save"></i> Salvar Alterações' : '<i class="fas fa-bolt"></i> Criar Missão';
        }
    }
    
    window.editFlashMission = function(id) {
        const mission = allFlashMissions.find(m => m.id === id);
        if (mission) {
            openFlashMissionModal(mission);
        }
    };
    
    window.deleteFlashMission = async function(id) {
        if (!confirm('Tem certeza que deseja deletar esta missão relâmpago? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        try {
            const response = await window.api.delete(`/missions/flash/${id}`);
            
            if (response.success) {
                await loadFlashMissions();
                showToast('Missão relâmpago deletada!', 'success');
            }
        } catch (error) {
            log.error('Erro ao deletar missão relâmpago:', error);
            alert('Erro ao deletar missão relâmpago');
        }
    };
    
    function showToast(message, type = 'info') {
        const existingToast = document.querySelector('.admin-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `admin-toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
    
    // ===== INICIALIZAÇÃO =====
    document.addEventListener('DOMContentLoaded', async () => {
        log.info('Carregando painel administrativo...');
        
        if (!window.api) {
            log.error('API não inicializada!');
            return;
        }
        
        const hasAccess = await checkAdminAccess();
        if (!hasAccess) return;
        
        await loadAllUsers();
        await loadRewards();
        await loadFlashMissions();
        
        // Event listeners
        const focusFilter = document.getElementById('focusFilter');
        if (focusFilter) {
            focusFilter.addEventListener('change', (e) => displayUsers(allUsers, e.target.value));
        }
        
        // Botão Nova Recompensa
        const addRewardBtn = document.getElementById('addRewardBtn');
        if (addRewardBtn) {
            addRewardBtn.onclick = function(e) {
                e.preventDefault();
                openAddRewardModal();
            };
        }
        
        // Formulário de recompensa
        const rewardForm = document.getElementById('rewardForm');
        if (rewardForm) {
            rewardForm.onsubmit = saveReward;
        }
        
        // Input de imagem da recompensa
        const rewardImageInput = document.getElementById('rewardImage');
        if (rewardImageInput) {
            rewardImageInput.onchange = handleRewardImageSelect;
        }
        
        // Permitir clicar na área de preview para selecionar imagem
        const rewardImagePreview = document.getElementById('rewardImagePreview');
        if (rewardImagePreview && rewardImageInput) {
            rewardImagePreview.onclick = () => rewardImageInput.click();
            rewardImagePreview.style.cursor = 'pointer';
        }
        
        // Botão conceder pontos
        const grantBtn = document.getElementById('grantPointsBtn');
        if (grantBtn) {
            grantBtn.onclick = grantPoints;
        }
        
        // Botão penalizar
        const penalizeBtn = document.getElementById('penalizeBtn');
        if (penalizeBtn) {
            penalizeBtn.onclick = penalizeUser;
        }
        
        // Fechar modais
        const closeEditModal = document.getElementById('closeEditModal');
        if (closeEditModal) closeEditModal.onclick = () => closeModal('editUserModal');
        
        const cancelEditUser = document.getElementById('cancelEditUser');
        if (cancelEditUser) cancelEditUser.onclick = () => closeModal('editUserModal');
        
        const deleteUserBtn = document.getElementById('deleteUserBtn');
        if (deleteUserBtn) deleteUserBtn.onclick = deleteUserInAdmin;
        
        const closeRewardModal = document.getElementById('closeRewardModal');
        if (closeRewardModal) closeRewardModal.onclick = () => closeModal('rewardModal');
        
        const cancelReward = document.getElementById('cancelReward');
        if (cancelReward) cancelReward.onclick = () => closeModal('rewardModal');
        
        // Toggle disponibilidade
        const toggle = document.getElementById('rewardAvailableToggle');
        if (toggle) {
            toggle.onclick = function() { this.classList.toggle('active'); };
        }
        
        // Botão Nova Missão Relâmpago
        const addFlashBtn = document.getElementById('addFlashMissionBtn');
        if (addFlashBtn) {
            addFlashBtn.onclick = () => openFlashMissionModal();
        }
        
        // Formulário de missão relâmpago
        const flashForm = document.getElementById('flashMissionForm');
        if (flashForm) {
            flashForm.onsubmit = saveFlashMission;
        }
        
        // Fechar modal de missão relâmpago
        const closeFlashModal = document.getElementById('closeFlashModal');
        if (closeFlashModal) closeFlashModal.onclick = () => closeModal('flashMissionModal');
        
        const cancelFlashBtn = document.getElementById('cancelFlashBtn');
        if (cancelFlashBtn) cancelFlashBtn.onclick = () => closeModal('flashMissionModal');
        
        // Fechar modal ao clicar fora
        const flashMissionModal = document.getElementById('flashMissionModal');
        if (flashMissionModal) {
            flashMissionModal.onclick = (e) => {
                if (e.target === flashMissionModal) closeModal('flashMissionModal');
            };
        }
        
        // Fechar modal ao clicar fora
        const editUserModal = document.getElementById('editUserModal');
        if (editUserModal) {
            editUserModal.onclick = (e) => {
                if (e.target === editUserModal) closeModal('editUserModal');
            };
        }
        
        const rewardModal = document.getElementById('rewardModal');
        if (rewardModal) {
            rewardModal.onclick = (e) => {
                if (e.target === rewardModal) closeModal('rewardModal');
            };
        }
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                window.location.href = 'login.html';
            };
        }
        
        log.success('Painel administrativo carregado!');
    });
    
})();
