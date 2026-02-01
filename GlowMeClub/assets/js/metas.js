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
        logger.info('✅ Metas carregadas do servidor:', userGoals.length);
        
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
        // Começar sem metas de exemplo
        userGoals = [];
    }
    displayGoals();
}

// Filtro de período atual
let currentPeriodFilter = 'all';

// Exibir metas
function displayGoals() {
    const goalsGrid = document.getElementById('goalsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!goalsGrid) return;
    
    // Filtrar metas por período
    let filteredGoals = userGoals;
    if (currentPeriodFilter !== 'all') {
        filteredGoals = userGoals.filter(goal => goal.period === currentPeriodFilter);
    }
    
    if (filteredGoals.length === 0) {
        goalsGrid.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
    } else {
        goalsGrid.style.display = 'grid';
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Usar a função createGoalCard que já está definida na página
        goalsGrid.innerHTML = '';
        filteredGoals.forEach(goal => {
            if (window.createGoalCard) {
                goalsGrid.appendChild(window.createGoalCard(goal));
            }
        });
    }
    
    // Atualizar progresso
    updateProgressOverview();
}

// Atualizar visão geral do progresso
function updateProgressOverview() {
    // Contar metas por período
    const weeklyGoals = userGoals.filter(g => g.period === 'weekly');
    const monthlyGoals = userGoals.filter(g => g.period === 'monthly');
    const yearlyGoals = userGoals.filter(g => g.period === 'yearly');
    
    const weeklyCompleted = weeklyGoals.filter(g => g.completed).length;
    const monthlyCompleted = monthlyGoals.filter(g => g.completed).length;
    const yearlyCompleted = yearlyGoals.filter(g => g.completed).length;
    
    const totalGoals = userGoals.length;
    const totalCompleted = userGoals.filter(g => g.completed).length;
    
    // Atualizar barras de progresso
    updateProgressBar('weekly', weeklyCompleted, weeklyGoals.length);
    updateProgressBar('monthly', monthlyCompleted, monthlyGoals.length);
    updateProgressBar('yearly', yearlyCompleted, yearlyGoals.length);
    
    // Atualizar progresso total
    const totalPercent = totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;
    const totalFill = document.getElementById('totalProgressFill');
    const totalPercentEl = document.getElementById('totalProgressPercent');
    
    if (totalFill) totalFill.style.width = `${totalPercent}%`;
    if (totalPercentEl) totalPercentEl.textContent = `${totalPercent}%`;
}

function updateProgressBar(period, completed, total) {
    const fill = document.getElementById(`${period}ProgressFill`);
    const text = document.getElementById(`${period}ProgressText`);
    
    if (fill && text) {
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        fill.style.width = `${percent}%`;
        text.textContent = `${completed}/${total}`;
    }
}

// Filtrar metas por período
function filterGoalsByPeriod(period) {
    currentPeriodFilter = period;
    
    // Atualizar tabs
    document.querySelectorAll('.goals-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.period === period);
    });
    
    displayGoals();
}

// Setup event listeners para tabs
function setupGoalsTabs() {
    document.querySelectorAll('.goals-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            filterGoalsByPeriod(tab.dataset.period);
        });
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
    
    // Pegar período do select
    const periodSelect = form.goalPeriod || form.querySelector('#goalPeriod');
    const period = periodSelect ? periodSelect.value : 'monthly';
    
    // Pegar categoria do select
    const categorySelect = form.goalCategory || form.querySelector('#goalCategory');
    const category = categorySelect ? categorySelect.value : 'Mental';
    
    // Validar categoria
    if (!category) {
        showError('Por favor, selecione uma área de foco');
        return;
    }
    
    // Pegar descrição
    const descriptionField = form.goalDescription || form.querySelector('#goalDescription');
    const description = descriptionField ? descriptionField.value.trim() : '';
    
    // Pegar anotações
    const notesField = form.goalNotes || form.querySelector('#goalNotes');
    const notes = notesField ? notesField.value.trim() : '';
    
    const newGoal = {
        title: form.goalTitle.value.trim(),
        period: period,
        category: category,
        deadline: form.goalDeadline.value || null,
        description: description || null,
        notes: notes || null
    };
    
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
    
    // Só permitir marcar como completa (não desmarcar)
    if (goal.completed) {
        showError('Esta meta já foi completada!');
        return;
    }
    
    // Sempre 50 pontos ao completar
    const pointsEarned = 50;
    goal.points = pointsEarned;
    goal.completed = true;
    goal.current = goal.target; // Marcar como 100%
    
    // Salvar no localStorage imediatamente
    localStorage.setItem('userGoals', JSON.stringify(userGoals));
    
    // Atualizar UI imediatamente
    displayGoals();
    
    // Mostrar celebração
    showCelebration(pointsEarned);
    
    // Sincronizar com o servidor
    try {
        const response = await window.api.post(`/goals/${goalId}/complete`);
        
        if (response.success) {
            logger.info('✅ Meta sincronizada com o servidor');
            
            // Atualizar pontos do usuário no cache
            if (response.pointsEarned) {
                try {
                    const userData = await window.api.get('/auth/me');
                    if (userData.user) {
                        currentUser = userData.user;
                        localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
                        updateHeader();
                    }
                } catch (e) {
                    // Atualizar localmente como fallback
                    if (currentUser) {
                        currentUser.totalPoints = (currentUser.totalPoints || 0) + 50;
                        localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
                    }
                }
            }
        }
    } catch (error) {
        logger.warn('Não foi possível sincronizar com o servidor:', error);
        
        // Atualizar pontos localmente como fallback
        if (currentUser) {
            currentUser.totalPoints = (currentUser.totalPoints || 0) + 50;
            localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
        }
    }
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
    
    // Atualizar pontos do usuário localmente
    if (currentUser) {
        currentUser.totalPoints = (currentUser.totalPoints || 0) + pointsEarned;
        localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
    }
    
    // Atualizar UI imediatamente
    displayGoals();
    
    // Mostrar feedback
    showCheckinSuccess(pointsEarned, goal.checkins.completed, goal.checkins.total);
    
    // Sincronizar com o servidor
    try {
        const response = await window.api.post(`/goals/${goalId}/checkin`, {
            pointsEarned: pointsEarned
        });
        
        if (response.success) {
            logger.info('✅ Check-in sincronizado com o servidor');
            
            // Atualizar dados do usuário do servidor
            try {
                const userData = await window.api.get('/auth/me');
                if (userData.user) {
                    currentUser = userData.user;
                    localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
                    updateHeader();
                }
            } catch (e) {
                // Já atualizamos localmente, então está ok
            }
        }
    } catch (error) {
        logger.warn('Não foi possível sincronizar check-in com o servidor:', error);
        // Os pontos locais já foram atualizados
    }
    
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
    
    // Setup tabs de período
    setupGoalsTabs();
    
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
    
    // Event delegation para editar anotações
    document.addEventListener('click', function(e) {
        const editBtn = e.target.closest('[data-action="edit"]');
        if (editBtn) {
            const goalId = editBtn.dataset.id;
            openEditNotesModal(goalId);
        }
    });
});

// Abrir modal para editar anotações
function openEditNotesModal(goalId) {
    const goal = userGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    const notes = prompt('Anotações para esta meta:', goal.notes || '');
    if (notes !== null) {
        updateGoalNotes(goalId, notes);
    }
}

// Atualizar anotações de uma meta
async function updateGoalNotes(goalId, notes) {
    try {
        await window.api.put(`/goals/${goalId}`, { notes: notes.trim() || null });
        
        // Atualizar localmente
        const goalIndex = userGoals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1) {
            userGoals[goalIndex].notes = notes.trim() || null;
            localStorage.setItem('userGoals', JSON.stringify(userGoals));
            displayGoals();
        }
        
        showSuccessToast('Anotações atualizadas!');
    } catch (error) {
        logger.error('Erro ao atualizar anotações:', error);
        showError('Erro ao salvar anotações');
    }
}

// CSS para toast e celebration - responsivo
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
    font-weight: 500;
    font-size: 0.875rem;
    max-width: calc(100vw - 2rem);
    width: auto;
    text-align: center;
    word-break: break-word;
    animation: metasToastIn 0.3s ease, metasToastOut 0.3s ease 2.7s forwards;
    z-index: 3000;
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
    padding: 1rem;
}

.celebration-content {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    text-align: center;
    animation: scaleIn 0.5s ease;
    max-width: 90vw;
    width: 100%;
    max-width: 320px;
}

.celebration-icon {
    font-size: 3rem;
    margin-bottom: 0.75rem;
}

.confetti {
    position: fixed;
    top: -10px;
    width: 8px;
    height: 8px;
    animation: confettiFall 3s linear;
    z-index: 2001;
}

@keyframes metasToastIn {
    from { 
        transform: translateX(-50%) translateY(20px);
        opacity: 0;
    }
    to { 
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
}

@keyframes metasToastOut {
    to { 
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

@keyframes confettiFall {
    to {
        transform: translateY(100vh) rotate(360deg);
    }
}
`;
document.head.appendChild(style);