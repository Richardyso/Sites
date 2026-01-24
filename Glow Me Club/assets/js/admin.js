// ===== PAINEL DE ADMINISTRAÇÃO =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas.');
}

// Dados
let currentUser = null;
let allUsers = [];

// Verificar se é admin
async function checkAdminAccess() {
    const token = window.api.getToken();
    
    if (!token) {
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
        
        return true;
    } catch (error) {
        logger.error('Erro ao verificar acesso:', error);
        
        // Tentar usar cache
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            currentUser = JSON.parse(cachedData);
            if (currentUser.role !== 'admin') {
                window.location.href = 'dashboard.html';
                return false;
            }
            return true;
        }
        
        window.location.href = 'login.html';
        return false;
    }
}

// Carregar todos os usuários
async function loadAllUsers() {
    try {
        const data = await window.api.get('/admin/users');
        allUsers = data.users || [];
        displayUsers(allUsers);
        updateStats();
    } catch (error) {
        logger.error('Erro ao carregar usuários:', error);
        
        // Tentar carregar do localStorage (para modo offline)
        const cachedUsers = localStorage.getItem('cachedAdminUsers');
        if (cachedUsers) {
            allUsers = JSON.parse(cachedUsers);
            displayUsers(allUsers);
            updateStats();
        } else {
            showError('Não foi possível carregar a lista de usuários.');
        }
    }
}

// Exibir usuários na tabela
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const levelNames = {
        1: 'Plebeia',
        2: 'Princesa',
        3: 'Rainha',
        4: 'Imperatriz',
        5: 'Deusa Glow'
    };
    
    tbody.innerHTML = users.map(user => {
        const level = Math.min(Math.floor((user.totalPoints || 0) / 500) + 1, 5);
        const initial = (user.name || 'U').charAt(0).toUpperCase();
        const isAdmin = user.role === 'admin';
        
        return `
            <tr data-user-id="${user.uid}">
                <td>
                    <div class="user-info">
                        <div class="user-avatar" style="background: ${user.preferredColor || '#8B5CF6'}">
                            ${initial}
                        </div>
                        <div>
                            <div class="user-name">${user.name || 'Sem nome'}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${levelNames[level]}</td>
                <td>${(user.totalPoints || 0).toLocaleString('pt-BR')}</td>
                <td>${user.focusArea || '-'}</td>
                <td>
                    <span class="badge ${isAdmin ? 'badge-admin' : 'badge-user'}">
                        ${isAdmin ? 'Admin' : 'Usuária'}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit" data-action="edit" data-id="${user.uid}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn reset" data-action="reset" data-id="${user.uid}" data-name="${user.name}" title="Resetar senha">
                        <i class="fas fa-key"></i>
                    </button>
                    ${!isAdmin ? `
                        <button class="action-btn delete" data-action="delete" data-id="${user.uid}" data-name="${user.name}" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
    
    // Salvar no cache
    localStorage.setItem('cachedAdminUsers', JSON.stringify(users));
}

// Atualizar estatísticas
function updateStats() {
    const totalUsersEl = document.getElementById('totalUsers');
    const totalPointsEl = document.getElementById('totalPoints');
    
    if (totalUsersEl) {
        totalUsersEl.textContent = allUsers.length;
    }
    
    if (totalPointsEl) {
        const total = allUsers.reduce((sum, user) => sum + (user.totalPoints || 0), 0);
        totalPointsEl.textContent = total.toLocaleString('pt-BR');
    }
    
    // Simulado por enquanto
    const totalGoalsEl = document.getElementById('totalGoals');
    const totalMissionsEl = document.getElementById('totalMissions');
    if (totalGoalsEl) totalGoalsEl.textContent = '-';
    if (totalMissionsEl) totalMissionsEl.textContent = '-';
}

// Buscar usuários
function searchUsers(query) {
    if (!query) {
        displayUsers(allUsers);
        return;
    }
    
    const filtered = allUsers.filter(user => 
        (user.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(query.toLowerCase())
    );
    
    displayUsers(filtered);
}

// Abrir modal de edição
function openEditModal(userId) {
    const user = allUsers.find(u => u.uid === userId);
    if (!user) return;
    
    document.getElementById('editUserId').value = user.uid;
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editPoints').value = user.totalPoints || 0;
    document.getElementById('editFocusArea').value = user.focusArea || 'Mental';
    
    document.getElementById('editModal').classList.add('active');
}

// Fechar modal de edição
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

// Salvar edição
async function saveUserEdit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const updatedData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        totalPoints: parseInt(document.getElementById('editPoints').value) || 0,
        focusArea: document.getElementById('editFocusArea').value
    };
    
    try {
        await window.api.put(`/admin/users/${userId}`, updatedData);
        
        // Atualizar localmente
        const userIndex = allUsers.findIndex(u => u.uid === userId);
        if (userIndex !== -1) {
            allUsers[userIndex] = { ...allUsers[userIndex], ...updatedData };
            displayUsers(allUsers);
            updateStats();
        }
        
        closeEditModal();
        showSuccess('Usuária atualizada com sucesso!');
    } catch (error) {
        logger.error('Erro ao atualizar usuária:', error);
        showError('Erro ao atualizar usuária.');
    }
}

// Abrir modal de reset de senha
function openResetModal(userId, userName) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetUserName').textContent = userName;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    
    document.getElementById('resetModal').classList.add('active');
}

// Fechar modal de reset
function closeResetModal() {
    document.getElementById('resetModal').classList.remove('active');
}

// Resetar senha
async function resetUserPassword(e) {
    e.preventDefault();
    
    const userId = document.getElementById('resetUserId').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        showError('As senhas não coincidem!');
        return;
    }
    
    if (newPassword.length < 8) {
        showError('A senha deve ter pelo menos 8 caracteres!');
        return;
    }
    
    try {
        await window.api.post(`/admin/users/${userId}/reset-password`, { newPassword });
        
        closeResetModal();
        showSuccess('Senha resetada com sucesso!');
    } catch (error) {
        logger.error('Erro ao resetar senha:', error);
        showError('Erro ao resetar senha.');
    }
}

// Deletar usuário
async function deleteUser(userId, userName) {
    if (!confirm(`Tem certeza que deseja excluir a usuária "${userName}"? Esta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        await window.api.delete(`/admin/users/${userId}`);
        
        // Remover localmente
        allUsers = allUsers.filter(u => u.uid !== userId);
        displayUsers(allUsers);
        updateStats();
        
        showSuccess('Usuária excluída com sucesso!');
    } catch (error) {
        logger.error('Erro ao excluir usuária:', error);
        showError('Erro ao excluir usuária.');
    }
}

// Mostrar mensagens
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10B981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #DC2626;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    logger.info('🔐 Carregando painel de administração...');
    
    // Verificar acesso
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;
    
    // Carregar usuários
    loadAllUsers();
    
    // Busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchUsers(e.target.value);
        });
    }
    
    // Event delegation para ações
    document.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        
        const action = actionBtn.dataset.action;
        const userId = actionBtn.dataset.id;
        const userName = actionBtn.dataset.name;
        
        if (action === 'edit') {
            openEditModal(userId);
        } else if (action === 'reset') {
            openResetModal(userId, userName);
        } else if (action === 'delete') {
            deleteUser(userId, userName);
        }
    });
    
    // Modal de edição
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
    document.getElementById('editForm').addEventListener('submit', saveUserEdit);
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeEditModal();
    });
    
    // Modal de reset
    document.getElementById('closeResetModal').addEventListener('click', closeResetModal);
    document.getElementById('cancelReset').addEventListener('click', closeResetModal);
    document.getElementById('resetForm').addEventListener('submit', resetUserPassword);
    document.getElementById('resetModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeResetModal();
    });
});

// CSS
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