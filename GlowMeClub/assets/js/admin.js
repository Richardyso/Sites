// ===== PAINEL DE ADMINISTRAÇÃO =====
// Usando IIFE para evitar conflitos de variáveis globais

(function() {
    'use strict';
    
    // Usar logger global ou criar um local
    const log = window.logger || {
        info: (msg, data) => console.log(`ℹ️ ${msg}`, data || ''),
        error: (msg, error) => console.error(`❌ ${msg}`, error || ''),
        warn: (msg, data) => console.warn(`⚠️ ${msg}`, data || ''),
        success: (msg, data) => console.log(`✅ ${msg}`, data || '')
    };
    
    // Estado da aplicação
    let currentUser = null;
    let allUsers = [];
    let allRewards = [];
    let currentUserHistory = [];
    let currentHistoryFilter = 'all';
    
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
                    .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
                
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
                            <span class="user-points">
                                <i class="fas fa-coins"></i> ${(user.totalPoints || 0).toLocaleString('pt-BR')}
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
        
        const imgElement = document.getElementById('rewardImageElement');
        if (imgElement) imgElement.style.display = 'none';
        
        const imgEmpty = document.querySelector('.image-preview-empty');
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
        
        document.getElementById('rewardModalTitle').textContent = 'Editar Recompensa';
        document.getElementById('rewardModal').classList.add('active');
    }
    
    function openEditUserModal(userId) {
        const user = allUsers.find(u => u.uid === userId);
        if (!user) return;
        
        // Campos do formulário
        document.getElementById('editUserId').value = user.uid;
        document.getElementById('editName').value = user.name || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editPoints').value = user.totalPoints || 0;
        
        // ===== NOVO: Profile Header =====
        const userAvatar = document.getElementById('editUserAvatar');
        const userInitial = document.getElementById('editUserInitial');
        const displayName = document.getElementById('editUserDisplayName');
        const userLevel = document.getElementById('editUserLevel');
        
        // Nome e inicial
        const firstName = (user.name || 'Usuária').split(' ')[0];
        const initial = (user.name || 'U').charAt(0).toUpperCase();
        
        if (displayName) displayName.textContent = firstName;
        if (userInitial) userInitial.textContent = initial;
        
        // Avatar com imagem ou cor de fundo
        if (userAvatar) {
            if (user.profileImage) {
                userAvatar.innerHTML = `<img src="${user.profileImage}" alt="${firstName}">`;
            } else {
                userAvatar.innerHTML = `<span id="editUserInitial">${initial}</span>`;
                userAvatar.style.background = user.preferredColor || 'linear-gradient(135deg, var(--admin-primary), var(--admin-secondary))';
            }
        }
        
        // Nível baseado em pontos - mostrar categoria (Plebeia, Princesa, etc.)
        if (userLevel) {
            const levelInfo = getLevelInfo(user.totalPoints || 0);
            userLevel.textContent = `${levelInfo.emoji} ${levelInfo.name}`;
        }
        
        // ===== NOVO: Info Cards =====
        // Pontos
        const pointsDisplay = document.getElementById('editUserPointsDisplay');
        if (pointsDisplay) {
            pointsDisplay.textContent = (user.totalPoints || 0).toLocaleString('pt-BR');
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
        const grantAmount = document.getElementById('grantPointsAmount');
        const grantReason = document.getElementById('grantPointsReason');
        if (grantAmount) grantAmount.value = '';
        if (grantReason) grantReason.value = '';
        
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
        
        goalsList.innerHTML = goals.map(goal => {
            const icon = categoryIcons[goal.category] || '🎯';
            const isCompleted = goal.completed;
            const statusClass = isCompleted ? 'completed' : 'active';
            const statusText = isCompleted ? 'Concluída' : 'Em andamento';
            
            return `
                <div class="goal-item ${isCompleted ? 'completed' : ''}">
                    <div class="goal-item-icon">
                        ${icon}
                    </div>
                    <div class="goal-item-info">
                        <div class="goal-item-title">${goal.title}</div>
                        <div class="goal-item-category">${goal.category || 'Geral'}</div>
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
        
        if (!historyList) return;
        
        // Aplicar filtro
        let filteredHistory = currentUserHistory;
        if (currentHistoryFilter === 'earned') {
            filteredHistory = currentUserHistory.filter(item => item.points > 0);
        } else if (currentHistoryFilter === 'spent') {
            filteredHistory = currentUserHistory.filter(item => item.points < 0);
        }
        
        if (filteredHistory.length === 0) {
            historyList.innerHTML = '';
            if (historyEmpty) {
                historyEmpty.innerHTML = `
                    <i class="fas fa-inbox"></i>
                    <p>Nenhum registro encontrado</p>
                `;
                historyEmpty.style.display = 'block';
            }
            return;
        }
        
        if (historyEmpty) historyEmpty.style.display = 'none';
        
        historyList.innerHTML = filteredHistory.map(item => {
            const isEarned = item.points > 0;
            const pointsClass = isEarned ? 'positive' : 'negative';
            const pointsSign = isEarned ? '+' : '';
            const iconClass = isEarned ? 'earned' : 'spent';
            const icon = getHistoryIcon(item.type);
            
            // Formatar data
            let dateStr = 'Data desconhecida';
            if (item.date || item.createdAt) {
                const date = new Date(item.date || item.createdAt);
                dateStr = date.toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            return `
                <div class="history-item">
                    <div class="history-item-icon ${iconClass}">
                        ${icon}
                    </div>
                    <div class="history-item-info">
                        <div class="history-item-reason">${item.reason || item.action || 'Pontos'}</div>
                        <div class="history-item-date">${dateStr}</div>
                    </div>
                    <div class="history-item-points ${pointsClass}">
                        ${pointsSign}${item.points} pts
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function getHistoryIcon(type) {
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
    
    // Obter informações do nível baseado em pontos
    function getLevelInfo(points) {
        const levels = [
            { level: 1, name: 'Plebeia', emoji: '🌱', minPoints: 0, maxPoints: 500 },
            { level: 2, name: 'Princesa', emoji: '👑', minPoints: 500, maxPoints: 1500 },
            { level: 3, name: 'Rainha', emoji: '💎', minPoints: 1500, maxPoints: 3000 },
            { level: 4, name: 'Imperatriz', emoji: '✨', minPoints: 3000, maxPoints: 5000 },
            { level: 5, name: 'Deusa Glow', emoji: '🌟', minPoints: 5000, maxPoints: Infinity }
        ];
        
        for (let i = levels.length - 1; i >= 0; i--) {
            if (points >= levels[i].minPoints) {
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
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
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
        if (linkField) rewardData.link = linkField.value;
        
        try {
            if (rewardId) {
                await window.api.put(`/rewards/${rewardId}`, rewardData);
                showToast('Recompensa atualizada!', 'success');
            } else {
                await window.api.post('/rewards', rewardData);
                showToast('Recompensa criada!', 'success');
            }
            
            closeModal('rewardModal');
            await loadRewards();
        } catch (error) {
            log.error('Erro ao salvar recompensa:', error);
            showToast('Erro ao salvar recompensa', 'error');
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
        const amount = parseInt(document.getElementById('grantPointsAmount').value);
        const reason = document.getElementById('grantPointsReason').value;
        
        if (!amount || amount <= 0) {
            showToast('Digite uma quantidade válida', 'error');
            return;
        }
        
        try {
            await window.api.post(`/admin/users/${userId}/grant-points`, {
                points: amount,
                reason: reason || 'Pontos concedidos pelo admin'
            });
            
            const idx = allUsers.findIndex(u => u.uid === userId);
            if (idx !== -1) {
                allUsers[idx].totalPoints = (allUsers[idx].totalPoints || 0) + amount;
                document.getElementById('editPoints').value = allUsers[idx].totalPoints;
                allUsers.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
                displayUsers(allUsers);
            }
            
            document.getElementById('grantPointsAmount').value = '';
            document.getElementById('grantPointsReason').value = '';
            
            showToast(`${amount} pontos concedidos!`, 'success');
        } catch (error) {
            log.error('Erro ao conceder pontos:', error);
            showToast('Erro ao conceder pontos', 'error');
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
        
        // Formulário de usuário
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.onsubmit = saveUserEdit;
        }
        
        // Botão conceder pontos
        const grantBtn = document.getElementById('grantPointsBtn');
        if (grantBtn) {
            grantBtn.onclick = grantPoints;
        }
        
        // Fechar modais
        const closeEditModal = document.getElementById('closeEditModal');
        if (closeEditModal) closeEditModal.onclick = () => closeModal('editUserModal');
        
        const cancelEditUser = document.getElementById('cancelEditUser');
        if (cancelEditUser) cancelEditUser.onclick = () => closeModal('editUserModal');
        
        const closeRewardModal = document.getElementById('closeRewardModal');
        if (closeRewardModal) closeRewardModal.onclick = () => closeModal('rewardModal');
        
        const cancelReward = document.getElementById('cancelReward');
        if (cancelReward) cancelReward.onclick = () => closeModal('rewardModal');
        
        // Toggle disponibilidade
        const toggle = document.getElementById('rewardAvailableToggle');
        if (toggle) {
            toggle.onclick = function() { this.classList.toggle('active'); };
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
