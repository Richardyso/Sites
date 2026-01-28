// ===== PAINEL DE ADMINISTRAÇÃO =====

// Usar logger do config.js ou criar fallback
const logger = window.logger || {
    info: (msg, data) => console.log(`ℹ️ ${msg}`, data || ''),
    error: (msg, error) => console.error(`❌ ${msg}`, error || ''),
    warn: (msg, data) => console.warn(`⚠️ ${msg}`, data || ''),
    success: (msg, data) => console.log(`✅ ${msg}`, data || '')
};

// Estado da aplicação
let currentUser = null;
let allUsers = [];
let allRewards = [];

// ===== AUTENTICAÇÃO E ACESSO =====

async function checkAdminAccess() {
    const token = window.api.getToken();
    
    if (!token) {
        logger.warn('⚠️ Token não encontrado, redirecionando para login');
        
        // Verificar se está em modo anônimo
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (e) {
            alert('⚠️ ATENÇÃO: O site não funciona em modo anônimo!\n\n' +
                  'Por favor, abra em uma janela normal do navegador para poder fazer login e acessar o painel administrativo.\n\n' +
                  'O modo anônimo bloqueia o armazenamento de dados necessários para autenticação.');
        }
        
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const data = await window.api.get('/auth/me');
        currentUser = data.user;
        
        // Verificar se é admin
        if (currentUser.role !== 'admin') {
            alert('Acesso negado. Apenas administradores podem acessar esta página.');
            window.location.href = 'dashboard.html';
            return false;
        }
        
        // Atualizar header
        updateHeaderAvatar();
        
        return true;
    } catch (error) {
        logger.error('Erro ao verificar acesso:', error);
        
        // Se for erro 401, token inválido
        if (error.status === 401) {
            logger.warn('⚠️ Token inválido ou expirado');
            window.api.removeToken();
            window.location.href = 'login.html';
            return false;
        }
        
        // Se for erro de rede, tentar usar dados em cache
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            logger.warn('⚠️ Erro de rede, tentando cache local');
            
            // Tentar obter dados do cache
            const cachedData = getCachedUserData();
            if (cachedData && cachedData.role === 'admin') {
                currentUser = cachedData;
                updateHeaderAvatar();
                showToast('Modo offline - alguns recursos podem estar limitados', 'warning');
                return true;
            }
        }
        
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
    
    // Atualizar nome
    if (headerUserName) {
        headerUserName.textContent = currentUser.name || 'Admin';
    }
    
    // Verificar se tem foto de perfil
    if (currentUser.profileImage) {
        if (avatarImage) {
            avatarImage.src = currentUser.profileImage;
            avatarImage.style.display = 'block';
        }
        if (avatarInitial) {
            avatarInitial.style.display = 'none';
        }
    } else {
        // Mostrar inicial
        const initial = (currentUser.name || 'A').charAt(0).toUpperCase();
        if (avatarInitial) {
            avatarInitial.textContent = initial;
            avatarInitial.style.display = 'block';
        }
        if (avatarImage) {
            avatarImage.style.display = 'none';
        }
        // Aplicar cor
        if (headerAvatar && currentUser.preferredColor) {
            headerAvatar.style.background = currentUser.preferredColor;
        }
    }
}

// ===== USUÁRIOS =====

async function loadAllUsers() {
    logger.info('👥 Carregando lista de usuários...');
    
    try {
        const data = await window.api.get('/admin/users');
        logger.info('📦 Resposta da API:', data);
        
        if (!data || !data.users) {
            logger.warn('⚠️ Nenhum usuário retornado pela API');
            allUsers = [];
        } else {
            allUsers = data.users
                // Filtrar admin do ranking
                .filter(user => user.role !== 'admin')
                // Ordenar por pontos (maior primeiro)
                .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
            
            logger.info(`✅ ${allUsers.length} usuários carregados`);
        }
        
        // Salvar no cache para modo offline
        saveCachedUsers(allUsers);
        
        displayUsers(allUsers);
    } catch (error) {
        logger.error('❌ Erro ao carregar usuários:', error);
        logger.error('Detalhes:', error.message);
        
        // Se for erro de rede, tentar usar dados em cache
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            logger.warn('⚠️ Erro de rede, tentando cache local');
            const cachedUsers = getCachedUsers();
            if (cachedUsers && cachedUsers.length > 0) {
                allUsers = cachedUsers;
                displayUsers(allUsers);
                showToast('Exibindo dados do cache - modo offline', 'warning');
                return;
            }
        }
        
        showToast('Erro ao carregar usuários', 'error');
        
        // Mostrar estado vazio
        const usersList = document.getElementById('usersList');
        const emptyUsers = document.getElementById('emptyUsers');
        if (usersList) usersList.style.display = 'none';
        if (emptyUsers) emptyUsers.style.display = 'block';
    }
}

function displayUsers(users, filter = '') {
    logger.info('🎨 Exibindo usuários...');
    
    const usersList = document.getElementById('usersList');
    const emptyUsers = document.getElementById('emptyUsers');
    
    if (!usersList) {
        logger.error('❌ Elemento usersList não encontrado!');
        return;
    }
    
    // Filtrar por área de foco se necessário
    let filteredUsers = users || [];
    if (filter) {
        filteredUsers = filteredUsers.filter(user => user.focusArea === filter);
    }
    
    logger.info(`📊 ${filteredUsers.length} usuários para exibir (filtro: ${filter || 'nenhum'})`);
    
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
            <div class="user-card" onclick="openEditUserModal('${user.uid}')">
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
    
    logger.success('✅ Usuários exibidos com sucesso');
}

// Abrir modal de edição de usuário
function openEditUserModal(userId) {
    const user = allUsers.find(u => u.uid === userId);
    if (!user) return;
    
    // Preencher campos
    document.getElementById('editUserId').value = user.uid;
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editPoints').value = user.totalPoints || 0;
    
    // Limpar campos de concessão de pontos
    document.getElementById('grantPointsAmount').value = '';
    document.getElementById('grantPointsReason').value = '';
    
    // Abrir modal
    document.getElementById('editUserModal').classList.add('active');
}

// Salvar edição de usuário
async function saveUserEdit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const updatedData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value
    };
    
    try {
        await window.api.put(`/admin/users/${userId}`, updatedData);
        
        // Atualizar localmente
        const userIndex = allUsers.findIndex(u => u.uid === userId);
        if (userIndex !== -1) {
            allUsers[userIndex] = { ...allUsers[userIndex], ...updatedData };
            displayUsers(allUsers);
        }
        
        closeModal('editUserModal');
        showToast('Usuária atualizada com sucesso!', 'success');
    } catch (error) {
        logger.error('Erro ao atualizar usuária:', error);
        showToast('Erro ao atualizar usuária', 'error');
    }
}

// Conceder pontos
async function grantPoints() {
    const userId = document.getElementById('editUserId').value;
    const amount = parseInt(document.getElementById('grantPointsAmount').value);
    const reason = document.getElementById('grantPointsReason').value;
    
    if (!amount || amount <= 0) {
        showToast('Digite uma quantidade válida de pontos', 'error');
        return;
    }
    
    if (!reason) {
        showToast('Digite o motivo da concessão', 'error');
        return;
    }
    
    try {
        await window.api.post(`/admin/users/${userId}/grant-points`, {
            points: amount,
            reason: reason
        });
        
        // Atualizar pontos localmente
        const userIndex = allUsers.findIndex(u => u.uid === userId);
        if (userIndex !== -1) {
            allUsers[userIndex].totalPoints = (allUsers[userIndex].totalPoints || 0) + amount;
            document.getElementById('editPoints').value = allUsers[userIndex].totalPoints;
        }
        
        // Limpar campos
        document.getElementById('grantPointsAmount').value = '';
        document.getElementById('grantPointsReason').value = '';
        
        showToast(`${amount} pontos concedidos com sucesso!`, 'success');
        
        // Reordenar e exibir usuários
        allUsers.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        displayUsers(allUsers);
    } catch (error) {
        logger.error('Erro ao conceder pontos:', error);
        showToast('Erro ao conceder pontos', 'error');
    }
}

// ===== RECOMPENSAS =====

async function loadRewards() {
    try {
        const data = await window.api.get('/rewards');
        allRewards = data.rewards || [];
        displayRewards();
    } catch (error) {
        logger.error('Erro ao carregar recompensas:', error);
        
        // Tentar carregar do cache
        try {
            let cached = localStorage.getItem('cachedRewards');
            if (!cached) {
                cached = sessionStorage.getItem('cachedRewards');
            }
            
            if (cached) {
                allRewards = JSON.parse(cached);
                displayRewards();
                showToast('Exibindo recompensas do cache - modo offline', 'warning');
            } else {
                // Mostrar estado vazio
                const rewardsList = document.getElementById('rewardsList');
                const emptyRewards = document.getElementById('emptyRewards');
                if (rewardsList) rewardsList.style.display = 'none';
                if (emptyRewards) emptyRewards.style.display = 'block';
            }
        } catch (e) {
            logger.warn('⚠️ Erro ao recuperar cache de recompensas:', e);
        }
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
    
    // Criar placeholder SVG para imagens ausentes
    const placeholderSVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Cpath d='M100 65c-9.4 0-17 7.6-17 17s7.6 17 17 17 17-7.6 17-17-7.6-17-17-17zm0 8.5c4.7 0 8.5 3.8 8.5 8.5s-3.8 8.5-8.5 8.5-8.5-3.8-8.5-8.5 3.8-8.5 8.5-8.5zM70 120h60c2.8 0 5 2.2 5 5v10c0 2.8-2.2 5-5 5H70c-2.8 0-5-2.2-5-5v-10c0-2.8 2.2-5 5-5z' fill='%239ca3af'/%3E%3C/svg%3E`;
    
    rewardsList.innerHTML = allRewards.map(reward => `
        <div class="reward-card">
            <img class="reward-image" src="${reward.image || placeholderSVG}" alt="${reward.title}" onerror="this.src='${placeholderSVG}'">
            <div class="reward-info">
                <h4 class="reward-title">${reward.title}</h4>
                <p class="reward-description">${reward.description}</p>
                <div class="reward-meta">
                    <span class="reward-points">
                        <i class="fas fa-coins"></i> ${reward.points} pontos
                    </span>
                    <div class="toggle-container">
                        <span>${reward.available ? 'Disponível' : 'Indisponível'}</span>
                        <div class="toggle-switch ${reward.available ? 'active' : ''}" 
                             onclick="toggleRewardAvailability('${reward.id}')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                </div>
                <div class="reward-actions">
                    <button class="btn btn-secondary btn-sm" onclick="openEditRewardModal('${reward.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="deleteReward('${reward.id}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Salvar no cache com fallback para sessionStorage
    try {
        localStorage.setItem('cachedRewards', JSON.stringify(allRewards));
    } catch (error) {
        try {
            sessionStorage.setItem('cachedRewards', JSON.stringify(allRewards));
        } catch (e) {
            logger.warn('⚠️ Não foi possível salvar recompensas em cache');
        }
    }
}

// Abrir modal de recompensa
function openAddRewardModal() {
    logger.info('🎁 Abrindo modal de nova recompensa');
    
    // Verificar se o modal existe
    const rewardModal = document.getElementById('rewardModal');
    if (!rewardModal) {
        logger.error('❌ Modal rewardModal não encontrado no DOM!');
        showToast('Erro: Modal de recompensa não encontrado', 'error');
        return;
    }
    
    try {
        // Limpar form
        const rewardId = document.getElementById('rewardId');
        const rewardTitle = document.getElementById('rewardTitle');
        const rewardDescription = document.getElementById('rewardDescription');
        const rewardPoints = document.getElementById('rewardPoints');
        const rewardLink = document.getElementById('rewardLink');
        const rewardImageElement = document.getElementById('rewardImageElement');
        const imagePreviewEmpty = document.querySelector('.image-preview-empty');
        const rewardModalTitle = document.getElementById('rewardModalTitle');
        const rewardAvailableToggle = document.getElementById('rewardAvailableToggle');
        const rewardModal = document.getElementById('rewardModal');
        
        if (rewardId) rewardId.value = '';
        if (rewardTitle) rewardTitle.value = '';
        if (rewardDescription) rewardDescription.value = '';
        if (rewardPoints) rewardPoints.value = '';
        if (rewardLink) rewardLink.value = '';
        
        if (rewardImageElement) {
            rewardImageElement.src = '';
            rewardImageElement.style.display = 'none';
        }
        
        if (imagePreviewEmpty) {
            imagePreviewEmpty.style.display = 'block';
        }
        
        // Configurar modal
        if (rewardModalTitle) {
            rewardModalTitle.textContent = 'Nova Recompensa';
        }
        
        if (rewardAvailableToggle) {
            rewardAvailableToggle.classList.add('active');
        }
        
        // Abrir modal
        if (rewardModal) {
            rewardModal.classList.add('active');
            logger.success('✅ Modal de recompensa aberto');
        } else {
            logger.error('❌ Modal rewardModal não encontrado!');
        }
    } catch (error) {
        logger.error('❌ Erro ao abrir modal:', error);
    }
}

function openEditRewardModal(rewardId) {
    const reward = allRewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    // Preencher form
    document.getElementById('rewardId').value = reward.id;
    document.getElementById('rewardTitle').value = reward.title;
    document.getElementById('rewardDescription').value = reward.description;
    document.getElementById('rewardPoints').value = reward.points;
    document.getElementById('rewardLink').value = reward.link || '';
    
    // Imagem
    if (reward.image) {
        document.getElementById('rewardImageElement').src = reward.image;
        document.getElementById('rewardImageElement').style.display = 'block';
        document.querySelector('.image-preview-empty').style.display = 'none';
    }
    
    // Toggle
    if (reward.available) {
        document.getElementById('rewardAvailableToggle').classList.add('active');
    } else {
        document.getElementById('rewardAvailableToggle').classList.remove('active');
    }
    
    // Configurar modal
    document.getElementById('rewardModalTitle').textContent = 'Editar Recompensa';
    
    // Abrir modal
    document.getElementById('rewardModal').classList.add('active');
}

// Salvar recompensa
async function saveReward(e) {
    e.preventDefault();
    
    const rewardId = document.getElementById('rewardId').value;
    const isAvailable = document.getElementById('rewardAvailableToggle').classList.contains('active');
    
    const rewardData = {
        title: document.getElementById('rewardTitle').value,
        description: document.getElementById('rewardDescription').value,
        points: parseInt(document.getElementById('rewardPoints').value),
        link: document.getElementById('rewardLink').value,
        available: isAvailable
    };
    
    // Processar imagem se houver
    const imageFile = document.getElementById('rewardImage').files[0];
    if (imageFile) {
        try {
            const base64 = await convertImageToBase64(imageFile);
            rewardData.image = base64;
        } catch (error) {
            logger.error('Erro ao processar imagem:', error);
        }
    }
    
    try {
        if (rewardId) {
            // Atualizar
            await window.api.put(`/rewards/${rewardId}`, rewardData);
            showToast('Recompensa atualizada com sucesso!', 'success');
        } else {
            // Criar
            await window.api.post('/rewards', rewardData);
            showToast('Recompensa criada com sucesso!', 'success');
        }
        
        closeModal('rewardModal');
        loadRewards();
    } catch (error) {
        logger.error('Erro ao salvar recompensa:', error);
        showToast('Erro ao salvar recompensa', 'error');
    }
}

// Toggle disponibilidade de recompensa
async function toggleRewardAvailability(rewardId) {
    const reward = allRewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    try {
        await window.api.put(`/rewards/${rewardId}`, {
            available: !reward.available
        });
        
        reward.available = !reward.available;
        displayRewards();
    } catch (error) {
        logger.error('Erro ao alterar disponibilidade:', error);
        showToast('Erro ao alterar disponibilidade', 'error');
    }
}

// Deletar recompensa
async function deleteReward(rewardId) {
    if (!confirm('Tem certeza que deseja excluir esta recompensa?')) {
        return;
    }
    
    try {
        await window.api.delete(`/rewards/${rewardId}`);
        
        allRewards = allRewards.filter(r => r.id !== rewardId);
        displayRewards();
        
        showToast('Recompensa excluída com sucesso!', 'success');
    } catch (error) {
        logger.error('Erro ao excluir recompensa:', error);
        showToast('Erro ao excluir recompensa', 'error');
    }
}

// ===== FUNÇÕES DE CACHE =====

function saveCachedUserData(userData) {
    try {
        localStorage.setItem('cachedAdminData', JSON.stringify({
            user: userData,
            timestamp: Date.now()
        }));
    } catch (error) {
        // Se falhar, usar sessionStorage
        try {
            sessionStorage.setItem('cachedAdminData', JSON.stringify({
                user: userData,
                timestamp: Date.now()
            }));
        } catch (e) {
            logger.warn('⚠️ Não foi possível salvar dados em cache');
        }
    }
}

function getCachedUserData() {
    try {
        let cached = localStorage.getItem('cachedAdminData');
        if (!cached) {
            cached = sessionStorage.getItem('cachedAdminData');
        }
        
        if (cached) {
            const data = JSON.parse(cached);
            // Verificar se o cache não está muito antigo (24 horas)
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                return data.user;
            }
        }
    } catch (error) {
        logger.warn('⚠️ Erro ao recuperar cache:', error);
    }
    return null;
}

function saveCachedUsers(users) {
    try {
        localStorage.setItem('cachedUsers', JSON.stringify({
            users: users,
            timestamp: Date.now()
        }));
    } catch (error) {
        try {
            sessionStorage.setItem('cachedUsers', JSON.stringify({
                users: users,
                timestamp: Date.now()
            }));
        } catch (e) {
            logger.warn('⚠️ Não foi possível salvar usuários em cache');
        }
    }
}

function getCachedUsers() {
    try {
        let cached = localStorage.getItem('cachedUsers');
        if (!cached) {
            cached = sessionStorage.getItem('cachedUsers');
        }
        
        if (cached) {
            const data = JSON.parse(cached);
            // Verificar se o cache não está muito antigo (1 hora)
            if (Date.now() - data.timestamp < 60 * 60 * 1000) {
                return data.users;
            }
        }
    } catch (error) {
        logger.warn('⚠️ Erro ao recuperar usuários do cache:', error);
    }
    return [];
}

// ===== UTILITÁRIOS =====

// Converter imagem para base64 com compressão
async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Redimensionar se necessário
                let width = img.width;
                let height = img.height;
                const maxSize = 400;
                
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height / width) * maxSize;
                        width = maxSize;
                    } else {
                        width = (width / height) * maxSize;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Desenhar e comprimir
                ctx.drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(base64);
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Preview de imagem
function handleImagePreview(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('rewardImageElement').src = e.target.result;
        document.getElementById('rewardImageElement').style.display = 'block';
        document.querySelector('.image-preview-empty').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Fechar modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Toast de notificação
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

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', async () => {
    logger.info('🔐 Carregando painel administrativo...');
    
    // Verificar se está em modo de desenvolvimento sem backend
    if (!window.api) {
        logger.error('❌ API não inicializada! Verificar se config.js e api.js foram carregados.');
        showToast('Erro ao carregar API. Verifique o console.', 'error');
        return;
    }
    
    // Verificar acesso
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;
    
    // Carregar dados
    await loadAllUsers();
    await loadRewards();
    
    // Filtro de área de foco
    const focusFilter = document.getElementById('focusFilter');
    if (focusFilter) {
        focusFilter.addEventListener('change', (e) => {
            displayUsers(allUsers, e.target.value);
        });
    }
    
    // Modal de usuário
    const closeEditModal = document.getElementById('closeEditModal');
    if (closeEditModal) {
        closeEditModal.addEventListener('click', () => closeModal('editUserModal'));
    }
    
    const cancelEditUser = document.getElementById('cancelEditUser');
    if (cancelEditUser) {
        cancelEditUser.addEventListener('click', () => closeModal('editUserModal'));
    }
    
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', saveUserEdit);
    }
    
    const grantPointsBtn = document.getElementById('grantPointsBtn');
    if (grantPointsBtn) {
        grantPointsBtn.addEventListener('click', grantPoints);
    }
    
    // Modal de recompensa - aguardar um pouco para garantir que o DOM esteja pronto
    setTimeout(() => {
        const addRewardBtn = document.getElementById('addRewardBtn');
        if (addRewardBtn) {
            logger.info('🎁 Botão Nova Recompensa encontrado');
            // Remover qualquer listener anterior
            addRewardBtn.replaceWith(addRewardBtn.cloneNode(true));
            const newBtn = document.getElementById('addRewardBtn');
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                logger.info('🎁 Clicou em Nova Recompensa');
                openAddRewardModal();
            });
            
            // Adicionar estilo de cursor para indicar que é clicável
            newBtn.style.cursor = 'pointer';
        } else {
            logger.error('❌ Botão addRewardBtn não encontrado!');
        }
    }, 100);
    
    const closeRewardModal = document.getElementById('closeRewardModal');
    if (closeRewardModal) {
        closeRewardModal.addEventListener('click', () => closeModal('rewardModal'));
    }
    
    const cancelReward = document.getElementById('cancelReward');
    if (cancelReward) {
        cancelReward.addEventListener('click', () => closeModal('rewardModal'));
    }
    
    const rewardForm = document.getElementById('rewardForm');
    if (rewardForm) {
        rewardForm.addEventListener('submit', saveReward);
    }
    
    // Upload de imagem
    const rewardImage = document.getElementById('rewardImage');
    if (rewardImage) {
        rewardImage.addEventListener('change', function() {
            handleImagePreview(this);
        });
    }
    
    // Toggle de disponibilidade
    const rewardAvailableToggle = document.getElementById('rewardAvailableToggle');
    if (rewardAvailableToggle) {
        rewardAvailableToggle.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    }
    
    // Preview de imagem clicável
    const rewardImagePreview = document.getElementById('rewardImagePreview');
    if (rewardImagePreview) {
        rewardImagePreview.addEventListener('click', () => {
            document.getElementById('rewardImage').click();
        });
    }
    
    // Fechar modais ao clicar fora
    const editUserModal = document.getElementById('editUserModal');
    if (editUserModal) {
        editUserModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal('editUserModal');
        });
    }
    
    const rewardModal = document.getElementById('rewardModal');
    if (rewardModal) {
        rewardModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal('rewardModal');
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.logout) {
                window.logout();
            } else {
                // Fallback logout
                localStorage.removeItem('authToken');
                localStorage.removeItem('cachedUserData');
                window.location.href = 'login.html';
            }
        });
    }
    
    logger.success('✅ Painel administrativo carregado com sucesso');
});