// ===== METAS UNIFICADO =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// Dados do usuário atual
let currentUser = null;
let userGoals = [];

// Carregar metas do usuário
async function loadUserGoals() {
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
        
        // Carregar metas
        await loadGoalsFromBackend();
        
    } catch (error) {
        logger.error('Erro ao carregar metas:', error);
        
        // Tentar usar dados do cache primeiro
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                currentUser = JSON.parse(cachedData);
                updateHeader();
                loadGoalsFromLocalStorage();
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
            // Para outros erros, apenas carregar metas locais
            loadGoalsFromLocalStorage();
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

// Carregar metas do backend
async function loadGoalsFromBackend() {
    try {
        const data = await window.api.get('/goals');
        userGoals = data.goals || [];
        
        // Salvar no localStorage para uso offline
        localStorage.setItem('userGoals', JSON.stringify(userGoals));
        
        displayGoals();
        
    } catch (error) {
        logger.error('Erro ao carregar metas do servidor:', error);
        
        // Usar dados locais como fallback
        loadGoalsFromLocalStorage();
    }
}

// Carregar metas do localStorage
function loadGoalsFromLocalStorage() {
    const savedGoals = localStorage.getItem('userGoals');
    if (savedGoals) {
        userGoals = JSON.parse(savedGoals);
    } else {
        // Metas de exemplo
        userGoals = [
            {
                id: '1',
                title: 'Beber 2L de água por dia',
                description: 'Manter-me hidratada para uma pele radiante',
                category: 'fisico',
                target: 30,
                current: 12,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                points: 100,
                completed: false
            },
            {
                id: '2',
                title: 'Meditar 15 minutos diariamente',
                description: 'Acalmar a mente e reduzir o stress',
                category: 'mental',
                target: 30,
                current: 8,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                points: 150,
                completed: false
            }
        ];
        // Salvar metas de exemplo
        localStorage.setItem('userGoals', JSON.stringify(userGoals));
    }
    displayGoals();
}

// Exibir metas
function displayGoals() {
    const goalsGrid = document.getElementById('goalsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!goalsGrid) return;
    
    if (userGoals.length === 0) {
        goalsGrid.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        return;
    }
    
    goalsGrid.style.display = 'grid';
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Usar a função createGoalCard que já está definida na página
    goalsGrid.innerHTML = '';
    userGoals.forEach(goal => {
        if (window.createGoalCard) {
            goalsGrid.appendChild(window.createGoalCard(goal));
        }
    });
}

// Abrir modal de criar meta
window.openGoalModal = function() {
    document.getElementById('goalModal').classList.add('active');
    document.getElementById('goalForm').reset();
}

// Fechar modal
window.closeGoalModal = function() {
    document.getElementById('goalModal').classList.remove('active');
}

// Criar nova meta
async function handleCreateGoal(e) {
    e.preventDefault();
    
    const form = e.target;
    const saveBtn = form.querySelector('[type="submit"]');
    const originalText = saveBtn.innerHTML;
    
    // Check-ins configuration
    const enableCheckins = document.getElementById('enableCheckins')?.checked || false;
    const numCheckins = parseInt(document.getElementById('numCheckins')?.value) || 5;
    const pointsPerCheckin = parseInt(document.getElementById('pointsPerCheckin')?.value) || 5;
    
    const newGoal = {
        id: Date.now().toString(),
        title: form.goalTitle.value.trim(),
        description: form.goalDescription.value.trim(),
        category: form.goalCategory.value,
        target: parseInt(form.goalTarget.value) || 30,
        current: 0,
        deadline: form.goalDeadline.value,
        points: parseInt(form.goalPoints.value) || 50,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Adicionar check-ins se habilitado
    if (enableCheckins) {
        newGoal.checkins = {
            enabled: true,
            total: numCheckins,
            completed: 0,
            pointsEach: pointsPerCheckin
        };
    }
    
    // Mostrar loading
    saveBtn.classList.add('btn-loading');
    saveBtn.disabled = true;
    
    try {
        // Tentar enviar para o backend
        const data = await window.api.post('/goals', newGoal);
        
        // Se sucesso, recarregar metas
        await loadGoalsFromBackend();
        
        closeGoalModal();
        showSuccess('Meta criada com sucesso!');
        
    } catch (error) {
        logger.error('Erro ao criar meta:', error);
        
        // Se offline, salvar localmente
        if (window.api.isNetworkError(error)) {
            logger.warn('⚠️ Salvando meta localmente');
            
            // Adicionar meta localmente
            userGoals.push(newGoal);
            
            // Salvar no localStorage
            localStorage.setItem('userGoals', JSON.stringify(userGoals));
            
            // Atualizar UI
            displayGoals();
            
            closeGoalModal();
            showSuccess('Meta salva localmente!');
        } else {
            showError('Erro ao criar meta');
        }
    } finally {
        saveBtn.classList.remove('btn-loading');
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

// Toggle goal completion
window.toggleGoal = async function(goalId) {
    const goal = userGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    goal.completed = !goal.completed;
    
    if (goal.completed) {
        goal.current = goal.target; // Marcar como 100%
        // Mostrar celebração
        showCelebration(goal.points);
    }
    
    // Salvar no localStorage
    localStorage.setItem('userGoals', JSON.stringify(userGoals));
    
    // Tentar sincronizar com o servidor
    try {
        await window.api.put(`/goals/${goalId}/complete`);
    } catch (error) {
        logger.warn('Não foi possível sincronizar com o servidor');
    }
    
    // Atualizar UI
    displayGoals();
}

// Editar meta
window.editGoal = function(goalId) {
    // Por enquanto, apenas mostrar alerta
    alert('Funcionalidade de editar meta em desenvolvimento');
}

// Deletar meta
window.deleteGoal = async function(goalId) {
    if (!confirm('Tem certeza que deseja deletar esta meta?')) return;
    
    try {
        // Remover meta localmente
        userGoals = userGoals.filter(g => g.id !== goalId);
        
        // Salvar no localStorage
        localStorage.setItem('userGoals', JSON.stringify(userGoals));
        
        // Tentar deletar no servidor
        await window.api.delete(`/goals/${goalId}`);
        
        // Atualizar UI
        displayGoals();
        
        showSuccess('Meta removida com sucesso');
        
    } catch (error) {
        logger.error('Erro ao deletar meta:', error);
        
        // Se offline, já foi removida localmente
        if (window.api.isNetworkError(error)) {
            displayGoals();
            showSuccess('Meta removida localmente');
        }
    }
}

// Fazer check-in em uma meta
window.doCheckin = async function(goalId) {
    const goal = userGoals.find(g => g.id === goalId);
    if (!goal || !goal.checkins) return;
    
    // Verificar se ainda tem check-ins disponíveis
    if (goal.checkins.completed >= goal.checkins.total) {
        showError('Todos os check-ins já foram concluídos!');
        return;
    }
    
    // Incrementar check-in
    goal.checkins.completed = (goal.checkins.completed || 0) + 1;
    
    // Atualizar progresso da meta proporcionalmente
    const progressPerCheckin = goal.target / goal.checkins.total;
    goal.current = Math.min(goal.target, Math.round(goal.checkins.completed * progressPerCheckin));
    
    // Pontos ganhos
    const pointsEarned = goal.checkins.pointsEach || 5;
    
    // Salvar no localStorage
    localStorage.setItem('userGoals', JSON.stringify(userGoals));
    
    // Atualizar pontos do usuário
    try {
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            const userData = JSON.parse(cachedData);
            userData.totalPoints = (userData.totalPoints || 0) + pointsEarned;
            localStorage.setItem('cachedUserData', JSON.stringify(userData));
        }
    } catch (e) {
        logger.warn('Não foi possível atualizar pontos localmente');
    }
    
    // Tentar sincronizar com o servidor
    try {
        await window.api.post(`/goals/${goalId}/checkin`);
    } catch (error) {
        logger.warn('Não foi possível sincronizar check-in com o servidor');
    }
    
    // Atualizar UI
    displayGoals();
    
    // Mostrar feedback
    showCheckinSuccess(pointsEarned, goal.checkins.completed, goal.checkins.total);
    
    // Se completou todos os check-ins, verificar se meta está completa
    if (goal.checkins.completed >= goal.checkins.total && goal.current >= goal.target && !goal.completed) {
        // Sugerir completar a meta
        setTimeout(() => {
            if (confirm(`Você completou todos os check-ins de "${goal.title}"! Deseja marcar a meta como concluída?`)) {
                window.toggleGoal(goalId);
            }
        }, 1500);
    }
}

// Mostrar feedback de check-in
function showCheckinSuccess(points, current, total) {
    const toast = document.createElement('div');
    toast.className = 'checkin-toast';
    toast.innerHTML = `
        <div class="checkin-toast-content">
            <span class="checkin-toast-icon">✅</span>
            <div class="checkin-toast-text">
                <strong>Check-in realizado!</strong>
                <span>+${points} pontos • ${current}/${total} check-ins</span>
            </div>
        </div>
    `;
    
    // Estilos inline do toast
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
    `;
    
    // Estilos do conteúdo
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .checkin-toast-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .checkin-toast-icon {
            font-size: 1.5rem;
        }
        .checkin-toast-text {
            display: flex;
            flex-direction: column;
        }
        .checkin-toast-text span {
            font-size: 0.85rem;
            opacity: 0.9;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease-in reverse';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Mostrar celebração
function showCelebration(points) {
    const celebration = document.createElement('div');
    celebration.className = 'celebration-overlay';
    celebration.innerHTML = `
        <div class="celebration-content">
            <div class="celebration-icon">🎉</div>
            <h2>Parabéns!</h2>
            <p>Você ganhou ${points} BabiPoints!</p>
        </div>
    `;
    
    document.body.appendChild(celebration);
    
    // Confetti animation
    createConfetti();
    
    setTimeout(() => {
        celebration.remove();
    }, 3000);
}

// Criar confetti
function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][Math.floor(Math.random() * 4)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Mostrar mensagens
function showError(message) {
    const errorElement = document.getElementById('goalErrorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    logger.info('📋 Carregando página de metas...');
    
    // Carregar metas
    loadUserGoals();
    
    // Botão de adicionar meta
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', openGoalModal);
    }
    
    // Botão de fechar modal
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeGoalModal);
    }
    
    // Botão de cancelar
    const cancelGoalBtn = document.getElementById('cancelGoalBtn');
    if (cancelGoalBtn) {
        cancelGoalBtn.addEventListener('click', closeGoalModal);
    }
    
    // Form de criar meta
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', handleCreateGoal);
    }
    
    // Fechar modal ao clicar fora
    const goalModal = document.getElementById('goalModal');
    if (goalModal) {
        goalModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeGoalModal();
            }
        });
    }
});

// CSS para toast e celebration (será movido para arquivo CSS)
const style = document.createElement('style');
style.textContent = `
.success-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10B981;
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease;
    z-index: 1000;
}

.celebration-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease;
}

.celebration-content {
    background: white;
    padding: 3rem;
    border-radius: 24px;
    text-align: center;
    animation: scaleIn 0.5s ease;
}

.celebration-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.confetti {
    position: fixed;
    top: -10px;
    width: 10px;
    height: 10px;
    animation: confettiFall 3s linear;
    z-index: 2001;
}

@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes scaleIn {
    from { transform: scale(0); }
    to { transform: scale(1); }
}

@keyframes confettiFall {
    to {
        transform: translateY(100vh) rotate(360deg);
    }
}
`;
document.head.appendChild(style);