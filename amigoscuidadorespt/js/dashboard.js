// Dashboard JavaScript - Amigos Cuidadores

// Estado global
let currentUser = null;
let currentPage = 'home';
let adminUsersCache = [];
let currentAdminUserId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação
    const authResult = await api.verifyAuth();
    
    if (!authResult.authenticated) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = authResult.user;
    
    // Configurar UI baseado no tipo de usuário
    setupUserInterface();
    
    // Configurar navegação
    setupNavigation();
    
    // Configurar logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Configurar menu mobile
    setupMobileMenu();
    
    // Carregar página inicial
    loadPage('home');
});

// Configurar interface baseada no tipo de usuário
function setupUserInterface() {
    // Definir tipo de usuário no body para CSS
    document.body.setAttribute('data-user-type', currentUser.userType);
    
    // Atualizar informações do usuário no header
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userType').textContent = getUserTypeLabel(currentUser.userType);
    
    // Atualizar avatar
    updateAvatar('headerAvatar', currentUser.avatar);
    
    // Nome de boas-vindas
    document.getElementById('welcomeName').textContent = currentUser.name.split(' ')[0];
}

// Obter label do tipo de usuário
function getUserTypeLabel(type) {
    const labels = {
        'client': 'Cliente',
        'caregiver': 'Cuidador',
        'nurse': 'Enfermeiro',
        'admin': 'Administrador'
    };
    return labels[type] || type;
}

// Configurar navegação
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            if (page) {
                loadPage(page);
            }
        });
    });
}

// Carregar página
function loadPage(pageName) {
    // Se for configurações, redirecionar para profile
    const actualPage = pageName === 'settings' ? 'profile' : pageName;
    
    // Remover classe active de todos os nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adicionar classe active ao nav item atual
    document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');
    
    // Esconder todas as páginas
    document.querySelectorAll('.dashboard-page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostrar página atual (usando actualPage)
    const pageElement = document.getElementById(`page-${actualPage}`);
    if (pageElement) {
        pageElement.classList.add('active');
        currentPage = actualPage;
        
        // Carregar conteúdo específico da página
        loadPageContent(actualPage);
    }
}

// Carregar conteúdo específico de cada página
async function loadPageContent(pageName) {
    switch(pageName) {
        case 'home':
            await loadHomePage();
            break;
        case 'search':
            await loadSearchPage();
            break;
        case 'profile':
            await loadProfilePage();
            break;
        case 'users':
            await loadUsersPage();
            break;
        case 'payments':
            await loadPaymentsPage();
            break;
        case 'availability':
            await loadAvailabilityPage();
            break;
        case 'skills':
            await loadSkillsPage();
            break;
        case 'documents':
            await loadDocumentsPage();
            break;
        case 'my-clients':
            await loadMyClientsPage();
            break;
        case 'reports':
            await loadReportsPage();
            break;
    }
}

// Carregar página inicial
async function loadHomePage() {
    const statsGrid = document.getElementById('statsGrid');
    const quickActions = document.getElementById('quickActions');
    
    // Limpar conteúdo anterior
    statsGrid.innerHTML = '';
    quickActions.innerHTML = '';
    
    // Carregar estatísticas baseadas no tipo de usuário
    if (currentUser.userType === 'admin') {
        // Estatísticas do admin
        const stats = await getAdminStats();
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${stats.totalUsers || 0}</div>
                <div class="stat-label">Total de Usuários</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${stats.activeCaregivers || 0}</div>
                <div class="stat-label">Cuidadores Ativos</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon warning">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${stats.totalBookings || 0}</div>
                <div class="stat-label">Agendamentos</div>
            </div>
        `;
        
        // Ações rápidas do admin
        quickActions.innerHTML = `
            <a href="#" class="action-card" onclick="loadPage('users')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                <h3>Adicionar Usuário</h3>
                <p>Criar novo usuário no sistema</p>
            </a>
            
            <a href="#" class="action-card" onclick="loadPage('reports')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h3>Ver Relatórios</h3>
                <p>Relatórios do sistema</p>
            </a>
        `;
    } else if (currentUser.userType === 'client') {
        // Estatísticas do cliente
        quickActions.innerHTML = `
            <a href="#" class="action-card" onclick="loadPage('search')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3>Buscar Cuidador</h3>
                <p>Encontre o cuidador ideal</p>
            </a>
            
            <a href="#" class="action-card" onclick="loadPage('bookings')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h3>Meus Agendamentos</h3>
                <p>Ver agendamentos ativos</p>
            </a>
        `;
    } else if (currentUser.userType === 'caregiver') {
        // Estatísticas do cuidador
        quickActions.innerHTML = `
            <a href="#" class="action-card" onclick="loadPage('availability')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <h3>Atualizar Disponibilidade</h3>
                <p>Defina seus horários</p>
            </a>
            
            <a href="#" class="action-card" onclick="loadPage('skills')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <h3>Skills & Certificados</h3>
                <p>Atualize suas qualificações</p>
            </a>
        `;
    }
}

// Obter estatísticas do admin
async function getAdminStats() {
    try {
        const users = await api.findAll();
        const caregivers = users.filter(u => u.userType === 'caregiver' || u.userType === 'nurse');
        const activeCaregivers = caregivers.filter(c => c.verified);
        
        return {
            totalUsers: users.length,
            activeCaregivers: activeCaregivers.length,
            totalBookings: 0 // TODO: Implementar quando tiver sistema de bookings
        };
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        return {};
    }
}

// Carregar página de busca
async function loadSearchPage() {
    // Carregar distritos
    const distritoSelect = document.getElementById('searchDistrito');
    
    try {
        const response = await fetch('assets/json/portugal_distritos_municipios.json');
        const data = await response.json();
        
        distritoSelect.innerHTML = '<option value="">Todos os distritos</option>';
        data.distritos.forEach(distrito => {
            const option = document.createElement('option');
            option.value = distrito.nome;
            option.textContent = distrito.nome;
            distritoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar distritos:', error);
    }
    
    // Configurar formulário de busca
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', handleSearch);
}

// Lidar com busca
async function handleSearch(e) {
    e.preventDefault();
    
    const filters = {
        distrito: document.getElementById('searchDistrito').value,
        userType: document.getElementById('searchType').value,
        specialties: document.getElementById('searchSpecialties').value,
        maxRate: document.getElementById('searchMaxRate').value
    };
    
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="loading">Buscando...</div>';
    
    try {
        const professionals = await api.listProfessionals(filters);
        
        if (professionals.data.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <h3>Nenhum cuidador encontrado</h3>
                    <p>Tente ajustar os filtros de busca</p>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = professionals.data.map(prof => `
                <div class="caregiver-card">
                    <img src="${prof.avatar || 'assets/images/default-avatar.png'}" alt="${prof.name}" class="caregiver-avatar">
                    <div class="caregiver-info">
                        <h3 class="caregiver-name">${prof.name}</h3>
                        <p class="caregiver-specialties">${prof.professional?.specialties?.join(', ') || 'Sem especialidades definidas'}</p>
                        <div class="caregiver-rating">
                            <span class="rating-stars">${generateStars(prof.professional?.rating || 0)}</span>
                            <span>(${prof.professional?.totalReviews || 0} avaliações)</span>
                        </div>
                    </div>
                    <div class="caregiver-actions">
                        <div class="caregiver-rate">€${prof.professional?.hourlyRate || '0'}/hora</div>
                        <button class="btn btn-primary" onclick="viewProfessional('${prof.id}')">Ver Perfil</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro na busca:', error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <h3>Erro ao buscar</h3>
                <p>Ocorreu um erro ao buscar cuidadores. Tente novamente.</p>
            </div>
        `;
    }
}

// Gerar estrelas de avaliação
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '★'.repeat(fullStars);
    if (halfStar) stars += '☆';
    stars += '☆'.repeat(emptyStars);
    
    return stars;
}

// Ver perfil do profissional
async function viewProfessional(id) {
    try {
        const modal = document.getElementById('professionalModal');
        modal.classList.add('active');

        // Estado inicial de carregamento
        document.getElementById('professionalModalAvatar').src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRTVFN0VCIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUM5Q0EzIi8+CjxwYXRoIGQ9Ik0yMCA3MFE1MCA1MCA4MCA3MCIgc3Ryb2tlPSIjOUM5Q0EzIiBzdHJva2Utd2lkdGg9IjgiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';
        document.getElementById('professionalModalName').textContent = 'Carregando...';
        document.getElementById('professionalModalType').textContent = '';
        document.getElementById('professionalModalEmail').textContent = '';
        document.getElementById('professionalModalPhone').textContent = '';
        document.getElementById('professionalModalHourlyRate').textContent = '€0,00';
        document.getElementById('professionalModalExperience').textContent = 'Carregando...';
        document.getElementById('professionalModalAvailability').innerHTML = '<div class="loading">Carregando...</div>';
        document.getElementById('professionalModalSpecialties').innerHTML = '<div class="loading">Carregando...</div>';
        document.getElementById('professionalModalCertificates').innerHTML = '<div class="loading">Carregando...</div>';

        const response = await api.getProfessionalDetails(id);

        if (!response.success) {
            modal.classList.remove('active');
            showNotification(response.message || 'Erro ao carregar profissional', 'error');
            return;
        }

        console.log('Dados do profissional:', response.data); // Debug
        populateProfessionalModal(response.data);
    } catch (error) {
        console.error('Erro ao carregar profissional:', error);
        showNotification('Erro ao carregar profissional: ' + error.message, 'error');
        document.getElementById('professionalModal').classList.remove('active');
    }
}

// Carregar página de perfil
async function loadProfilePage() {
    // Atualizar informações do perfil
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileBadge').textContent = getUserTypeLabel(currentUser.userType);
    updateAvatar('profileAvatar', currentUser.avatar);
    
    // Carregar detalhes do perfil
    const detailsContainer = document.getElementById('profileDetails');
    detailsContainer.innerHTML = `
        <div class="detail-group">
            <span class="detail-label">Telefone:</span>
            <span class="detail-value">${currentUser.phone || 'Não informado'}</span>
        </div>
        <div class="detail-group">
            <span class="detail-label">Endereço:</span>
            <span class="detail-value">${formatAddress(currentUser.address) || 'Não informado'}</span>
        </div>
        <div class="detail-group">
            <span class="detail-label">Membro desde:</span>
            <span class="detail-value">${formatDate(currentUser.createdAt)}</span>
        </div>
        ${currentUser.userType === 'caregiver' ? `
            <div class="detail-group">
                <span class="detail-label">Biografia:</span>
                <span class="detail-value">${currentUser.professional?.bio || 'Não informada'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Taxa por hora:</span>
                <span class="detail-value">€${currentUser.professional?.hourlyRate || '0'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Especialidades:</span>
                <span class="detail-value">${currentUser.professional?.specialties?.join(', ') || 'Nenhuma'}</span>
            </div>
        ` : ''}
        ${currentUser.userType === 'client' ? `
            <div class="profile-section-divider"></div>
            <h3 class="profile-section-title">Informações do Beneficiário</h3>
            <div class="detail-group">
                <span class="detail-label">Idade:</span>
                <span class="detail-value">${currentUser.careRecipient?.age ? currentUser.careRecipient.age + ' anos' : 'Não informada'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Peso:</span>
                <span class="detail-value">${currentUser.careRecipient?.weight ? currentUser.careRecipient.weight + ' kg' : 'Não informado'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Limitações:</span>
                <span class="detail-value">${currentUser.careRecipient?.limitations || 'Não informadas'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Valor máximo por hora:</span>
                <span class="detail-value">${currentUser.careRecipient?.maxHourlyRate ? '€' + currentUser.careRecipient.maxHourlyRate : 'Não definido'}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Biografia:</span>
                <span class="detail-value">${currentUser.careRecipient?.bio || 'Não informada'}</span>
            </div>
        ` : ''}
    `;
    
    // Configurar botão de edição
    const editProfileBtn = document.getElementById('editProfileBtn');
    editProfileBtn.onclick = openEditProfileModal;
    
    // Configurar upload de avatar
    const avatarBtn = document.getElementById('avatarUploadBtn');
    avatarBtn.onclick = () => {
        document.getElementById('avatarInput').click();
    };
    
    document.getElementById('avatarInput').onchange = handleAvatarUpload;
}

// Formatar endereço
function formatAddress(address) {
    if (!address || Object.keys(address).length === 0) return null;
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// Abrir modal de edição de perfil
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    
    // Preencher formulário com dados atuais
    document.getElementById('editName').value = currentUser.name;
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('editAddress').value = formatAddress(currentUser.address) || '';
    
    if (currentUser.userType === 'caregiver') {
        document.getElementById('editBio').value = currentUser.professional?.bio || '';
        document.getElementById('editHourlyRate').value = currentUser.professional?.hourlyRate || '';
    }
    
    if (currentUser.userType === 'client') {
        document.getElementById('editRecipientAge').value = currentUser.careRecipient?.age || '';
        document.getElementById('editRecipientWeight').value = currentUser.careRecipient?.weight || '';
        document.getElementById('editRecipientLimitations').value = currentUser.careRecipient?.limitations || '';
        document.getElementById('editRecipientMaxRate').value = currentUser.careRecipient?.maxHourlyRate || '';
        document.getElementById('editRecipientBio').value = currentUser.careRecipient?.bio || '';
    }
    
    modal.classList.add('active');
    
    // Configurar formulário
    const form = document.getElementById('editProfileForm');
    form.addEventListener('submit', handleEditProfile);
}

// Lidar com edição de perfil
async function handleEditProfile(e) {
    e.preventDefault();
    
    const updateData = {
        name: document.getElementById('editName').value,
        phone: document.getElementById('editPhone').value
    };
    
    // Adicionar endereço se fornecido
    const addressValue = document.getElementById('editAddress').value;
    if (addressValue) {
        // Simplificado - em produção seria melhor ter campos separados
        updateData.address = { street: addressValue };
    }
    
    // Adicionar dados de cuidador se aplicável
    if (currentUser.userType === 'caregiver') {
        updateData.professional = {
            bio: document.getElementById('editBio').value,
            hourlyRate: parseFloat(document.getElementById('editHourlyRate').value) || null
        };
    }
    
    // Adicionar dados do beneficiário se o usuário for cliente
    if (currentUser.userType === 'client') {
        const age = document.getElementById('editRecipientAge').value;
        const weight = document.getElementById('editRecipientWeight').value;
        const maxRate = document.getElementById('editRecipientMaxRate').value;
        
        updateData.careRecipient = {
            age: age ? parseInt(age) : null,
            weight: weight ? parseFloat(weight) : null,
            limitations: document.getElementById('editRecipientLimitations').value,
            maxHourlyRate: maxRate ? parseFloat(maxRate) : null,
            bio: document.getElementById('editRecipientBio').value
        };
        
        console.log('📋 Dados do beneficiário a serem enviados:', updateData.careRecipient);
    }
    
    console.log('📤 Enviando dados para o servidor:', updateData);
    
    try {
        const result = await api.updateProfile(updateData);
        
        console.log('📥 Resposta do servidor:', result);
        
        if (result.success) {
            // Atualizar usuário atual
            currentUser = { ...currentUser, ...result.data };
            
            console.log('✅ Usuário atualizado no frontend:', currentUser);
            
            // Fechar modal
            closeModal('editProfileModal');
            
            // Recarregar página
            loadProfilePage();
            
            // Mostrar mensagem de sucesso
            showNotification('Perfil atualizado com sucesso!', 'success');
        } else {
            console.error('❌ Erro na resposta:', result.message);
            showNotification(result.message || 'Erro ao atualizar perfil', 'error');
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        showNotification('Erro ao atualizar perfil', 'error');
    }
}

// Lidar com upload de avatar
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione uma imagem', 'error');
        return;
    }
    
    try {
        const MAX_IMAGE_SIZE = 700 * 1024; // 700KB
        let imageData;
        
        if (file.size > MAX_IMAGE_SIZE) {
            imageData = await compressImage(file, 700);
        } else {
            // Se já está dentro do limite, usar direto
            const reader = new FileReader();
            imageData = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Erro ao ler imagem'));
                reader.readAsDataURL(file);
            });
        }
        
        // Atualizar avatares na UI temporariamente
        updateAvatar('headerAvatar', imageData);
        updateAvatar('profileAvatar', imageData);
        
        // Mostrar botão de salvar
        showSaveAvatarButton(imageData);
    } catch (error) {
        console.error('Erro ao processar avatar:', error);
        showNotification(error.message || 'Erro ao processar imagem', 'error');
    }
}

// Mostrar botão de salvar avatar
function showSaveAvatarButton(imageData) {
    // Verificar se já existe
    let saveBtn = document.getElementById('saveAvatarBtn');
    
    if (!saveBtn) {
        saveBtn = document.createElement('button');
        saveBtn.id = 'saveAvatarBtn';
        saveBtn.className = 'btn btn-success';
        saveBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Salvar Avatar
        `;
        
        // Adicionar ao lado do botão de editar perfil
        const editBtn = document.getElementById('editProfileBtn');
        editBtn.parentNode.insertBefore(saveBtn, editBtn.nextSibling);
    }
    
    // Configurar evento de clique
    saveBtn.onclick = async () => {
        try {
            const result = await api.updateProfile({ avatar: imageData });
            
            if (result.success) {
                currentUser.avatar = imageData;
                showNotification('Avatar salvo com sucesso!', 'success');
                saveBtn.remove();
            } else {
                const message = result.message || 'Erro ao salvar avatar';
                showNotification(message, 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar avatar:', error);
            showNotification('Erro ao salvar avatar', 'error');
        }
    };
}

// Atualizar avatar
function updateAvatar(elementId, avatarUrl) {
    const element = document.getElementById(elementId);
    if (element) {
        // Usar avatar padrão SVG se não houver imagem
        const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRTVFN0VCIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUM5Q0EzIi8+CjxwYXRoIGQ9Ik0yMCA3MFE1MCA1MCA4MCA3MCIgc3Ryb2tlPSIjOUM5Q0EzIiBzdHJva2Utd2lkdGg9IjgiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';
        element.src = avatarUrl || defaultAvatar;
    }
}

// Carregar página de usuários (Admin)
async function loadUsersPage() {
    if (currentUser.userType !== 'admin') {
        showNotification('Acesso negado', 'error');
        loadPage('home');
        return;
    }
    
    try {
        const users = await api.findAll();
        adminUsersCache = users;
        const tbody = document.getElementById('usersTableBody');
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <img src="${user.avatar || 'assets/images/default-avatar.png'}" alt="${user.name}" class="user-avatar-cell">
                </td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${getUserTypeLabel(user.userType)}</td>
                <td>
                    <span class="user-status ${user.verified ? 'active' : 'inactive'}">
                        ${user.verified ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <div class="user-actions">
                        <button class="action-btn edit" onclick="openAdminEditUser('${user.id}')">Editar</button>
                        <button class="action-btn delete" onclick="deleteUser('${user.id}')">Excluir</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Configurar busca de usuários
        const searchInput = document.getElementById('userSearch');
        searchInput.oninput = (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        };
        
        // Configurar botão adicionar usuário
        document.getElementById('addUserBtn').onclick = () => {
            window.location.href = 'cadastro.html';
        };
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showNotification('Erro ao carregar usuários', 'error');
    }
}

// Abrir modal de edição (Admin)
function openAdminEditUser(userId) {
    const user = adminUsersCache.find(u => u.id === userId);
    if (!user) {
        showNotification('Usuário não encontrado', 'error');
        return;
    }

    currentAdminUserId = userId;

    document.getElementById('adminEditUserId').value = userId;
    document.getElementById('adminEditName').value = user.name;
    document.getElementById('adminEditEmail').value = user.email;
    document.getElementById('adminEditPassword').value = ''; // Limpar campo de senha
    document.getElementById('adminEditType').value = user.userType;
    document.getElementById('adminEditVerified').checked = !!user.verified;

    const modal = document.getElementById('adminEditUserModal');
    modal.classList.add('active');

    const form = document.getElementById('adminEditUserForm');
    form.onsubmit = handleAdminEditUserSubmit;
}

// Submeter edição de usuário (Admin)
async function handleAdminEditUserSubmit(e) {
    e.preventDefault();
    if (!currentAdminUserId) return;

    const password = document.getElementById('adminEditPassword').value.trim();

    // Validar senha se foi preenchida
    if (password) {
        if (password.length < 6) {
            showNotification('A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }
        if (!/\d/.test(password)) {
            showNotification('A senha deve conter pelo menos um número', 'error');
            return;
        }
    }

    const payload = {
        name: document.getElementById('adminEditName').value.trim(),
        email: document.getElementById('adminEditEmail').value.trim(),
        userType: document.getElementById('adminEditType').value,
        verified: document.getElementById('adminEditVerified').checked
    };

    // Adicionar senha ao payload apenas se foi preenchida
    if (password) {
        payload.password = password;
    }

    try {
        const result = await api.adminUpdateUser(currentAdminUserId, payload);

        if (result.success) {
            const message = password 
                ? 'Usuário atualizado com sucesso! Senha alterada.' 
                : 'Usuário atualizado com sucesso!';
            showNotification(message, 'success');
            closeModal('adminEditUserModal');
            await loadUsersPage();
        } else {
            const errorMessage = formatValidationErrors(result) || 'Erro ao atualizar usuário';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showNotification('Erro ao atualizar usuário', 'error');
    }
}

// Excluir usuário (Admin)
async function deleteUser(userId) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
        const result = await api.adminDeleteUser(userId);
        if (result.success) {
            showNotification('Usuário excluído com sucesso', 'success');
            await loadUsersPage();
        } else {
            showNotification(result.message || 'Erro ao excluir usuário', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        showNotification('Erro ao excluir usuário', 'error');
    }
}

// Carregar página de pagamentos
async function loadPaymentsPage() {
    try {
        // Obter dados da carteira
        const walletResult = await api.getWallet();
        const transactionsResult = await api.getTransactions({ limit: 10 });

        if (!walletResult.success) {
            showNotification('Erro ao carregar carteira', 'error');
            return;
        }

        const wallet = walletResult.data;
        const transactions = transactionsResult.success ? transactionsResult.data : [];

        // Atualizar cartão de método de pagamento
        const paymentCards = document.getElementById('paymentCards');
        
        if (currentUser.userType === 'client') {
            // Clientes veem saldo gasto
            paymentCards.innerHTML = `
                <div class="wallet-card client-wallet">
                    <div class="wallet-header">
                        <h4>💳 Minha Carteira</h4>
                        <span class="wallet-currency">EUR</span>
                    </div>
                    <div class="wallet-balance">
                        <div class="balance-label">Total Gasto</div>
                        <div class="balance-value">€${(wallet.totalSpent || 0).toFixed(2)}</div>
                    </div>
                </div>
            `;
        } else if (currentUser.userType === 'caregiver' || currentUser.userType === 'nurse') {
            // Cuidadores veem saldo disponível e pendente
            paymentCards.innerHTML = `
                <div class="wallet-card caregiver-wallet">
                    <div class="wallet-header">
                        <h4>💰 Minha Carteira</h4>
                        <span class="wallet-currency">EUR</span>
                    </div>
                    <div class="wallet-balances">
                        <div class="balance-item">
                            <div class="balance-label">Saldo Disponível</div>
                            <div class="balance-value available">€${(wallet.balance || 0).toFixed(2)}</div>
                        </div>
                        <div class="balance-item">
                            <div class="balance-label">Saldo Pendente</div>
                            <div class="balance-value pending">€${(wallet.pendingBalance || 0).toFixed(2)}</div>
                        </div>
                        <div class="balance-item">
                            <div class="balance-label">Total Ganho</div>
                            <div class="balance-value earnings">€${(wallet.totalEarnings || 0).toFixed(2)}</div>
                        </div>
                    </div>
                    ${(wallet.balance || 0) >= 20 ? `
                        <button class="btn-primary" onclick="requestWithdrawal()" style="margin-top: 15px; width: 100%;">
                            Solicitar Saque
                        </button>
                    ` : `
                        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 8px; font-size: 13px; color: #856404;">
                            ℹ️ Saldo mínimo para saque: €20.00
                        </div>
                    `}
                </div>
            `;
        } else {
            // Admin vê estatísticas gerais
            paymentCards.innerHTML = `
                <div class="wallet-card admin-wallet">
                    <div class="wallet-header">
                        <h4>📊 Visão Geral</h4>
                        <span class="wallet-currency">EUR</span>
                    </div>
                    <div class="wallet-balance">
                        <div class="balance-label">Plataforma</div>
                        <div class="balance-value">Administrador</div>
                    </div>
                </div>
            `;
        }

        // Renderizar lista de transações
        const transactionsList = document.getElementById('transactionsList');
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3>Nenhuma transação ainda</h3>
                    <p>Suas transações aparecerão aqui.</p>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = transactions.map(transaction => {
            const date = new Date(transaction.createdAt);
            const formattedDate = date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
            
            // Determinar se é crédito ou débito
            const isCredit = transaction.direction === 'received' || transaction.toUserId === currentUser.id;
            const amount = isCredit ? transaction.netAmount || transaction.amount : transaction.amount;
            const sign = isCredit ? '+' : '-';
            const amountClass = isCredit ? 'credit' : 'debit';
            
            // Status badge
            const statusBadges = {
                'pending': '<span class="status-badge status-pending">Pendente</span>',
                'completed': '<span class="status-badge status-completed">Concluído</span>',
                'failed': '<span class="status-badge status-failed">Falhado</span>',
                'cancelled': '<span class="status-badge status-cancelled">Cancelado</span>'
            };

            // Tipo de transação
            const typeLabels = {
                'payment': '💳 Pagamento de Serviço',
                'refund': '↩️ Reembolso',
                'withdrawal': '💰 Saque',
                'commission': '📊 Comissão'
            };

            return `
                <div class="transaction-item">
                    <div class="transaction-details">
                        <h4>${typeLabels[transaction.type] || 'Transação'}</h4>
                        <p class="transaction-description">${transaction.serviceDetails?.description || ''}</p>
                        ${transaction.serviceDetails?.hours ? `
                            <small style="color: #64748b;">
                                ${transaction.serviceDetails.hours}h × €${transaction.serviceDetails.hourlyRate}/h
                            </small>
                        ` : ''}
                        <div style="margin-top: 5px;">
                            <span class="transaction-date">${formattedDate}</span>
                            ${statusBadges[transaction.status] || ''}
                        </div>
                    </div>
                    <div class="transaction-amount ${amountClass}">${sign}€${amount.toFixed(2)}</div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar página de pagamentos:', error);
        showNotification('Erro ao carregar dados de pagamentos', 'error');
    }
}

// Solicitar saque (para cuidadores)
async function requestWithdrawal() {
    const amount = prompt('Digite o valor que deseja sacar (EUR):');
    
    if (!amount) return;
    
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
        showNotification('Valor inválido', 'error');
        return;
    }
    
    if (numAmount < 20) {
        showNotification('Valor mínimo para saque é €20.00', 'error');
        return;
    }
    
    try {
        const result = await api.requestWithdrawal(numAmount);
        
        if (result.success) {
            showNotification('Solicitação de saque enviada com sucesso! Aguarde aprovação.', 'success');
            await loadPaymentsPage(); // Recarregar página
        } else {
            showNotification(result.message || 'Erro ao solicitar saque', 'error');
        }
    } catch (error) {
        console.error('Erro ao solicitar saque:', error);
        showNotification('Erro ao solicitar saque', 'error');
    }
}

// Carregar página de disponibilidade (Cuidador)
async function loadAvailabilityPage() {
    const page = document.getElementById('page-availability');

    if (currentUser.userType !== 'caregiver') {
        page.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <h3>Disponível apenas para cuidadores</h3>
                <p>Somente perfis de cuidadores podem definir disponibilidade.</p>
            </div>
        `;
        return;
    }

    page.innerHTML = `
        <div class="availability-container">
            <div class="section-header">
                <div>
                    <h2>Minha Disponibilidade</h2>
                    <p>Informe os dias e horários em que está disponível para atender.</p>
                </div>
                <button class="btn btn-primary" id="addAvailabilityBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Adicionar horário
                </button>
            </div>

            <div class="availability-list" id="availabilityList"></div>
        </div>

        <div class="modal" id="availabilityModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Adicionar disponibilidade</h2>
                    <button class="modal-close" data-modal="availabilityModal">&times;</button>
                </div>
                <form id="availabilityForm">
                    <div class="form-group">
                        <label style="margin-bottom: 12px; display: block; font-weight: 600;">Selecione os dias da semana</label>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            <label class="checkbox-label">
                                <input type="checkbox" name="days" value="Segunda-feira">
                                <span>Segunda-feira</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="days" value="Terça-feira">
                                <span>Terça-feira</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="days" value="Quarta-feira">
                                <span>Quarta-feira</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="days" value="Quinta-feira">
                                <span>Quinta-feira</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="days" value="Sexta-feira">
                                <span>Sexta-feira</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="days" value="Sábado">
                                <span>Sábado</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="days" value="Domingo">
                                <span>Domingo</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="selectAllDays">
                                <span style="font-weight: 600; color: #2563eb;">Todos os dias</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-group inline">
                        <div>
                            <label>Horário de início</label>
                            <input type="time" id="availabilityStart" required>
                        </div>
                        <div>
                            <label>Horário de término</label>
                            <input type="time" id="availabilityEnd" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Observações (opcional)</label>
                        <textarea id="availabilityNotes" rows="3" placeholder="Ex: Preferência por atendimentos domiciliares"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" data-modal="availabilityModal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar horários</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    renderAvailability();

    document.getElementById('addAvailabilityBtn').addEventListener('click', () => {
        document.getElementById('availabilityForm').reset();
        document.getElementById('availabilityModal').classList.add('active');
    });

    // Funcionalidade "Todos os dias"
    document.getElementById('selectAllDays').addEventListener('change', (e) => {
        const dayCheckboxes = document.querySelectorAll('input[name="days"]');
        dayCheckboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });

    document.getElementById('availabilityForm').addEventListener('submit', handleAvailabilitySubmit);
}

// Carregar página de skills (Cuidador)
async function loadSkillsPage() {
    const page = document.getElementById('page-skills');

    if (currentUser.userType !== 'caregiver') {
        page.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <h3>Disponível apenas para cuidadores</h3>
                <p>Somente perfis de cuidadores podem gerenciar skills e certificados.</p>
            </div>
        `;
        return;
    }

    page.innerHTML = `
        <div class="skills-container">
            <div class="skills-section">
                <div class="section-header">
                    <div>
                        <h2>Especialidades</h2>
                        <p>Separe múltiplas especialidades com vírgula. Ex: Alzheimer, Idosos, Cuidados paliativos</p>
                    </div>
                </div>
                <div class="form-group">
                    <input type="text" id="specialtyInput" class="specialty-input" placeholder="Digite as especialidades separadas por vírgula...">
                    <button class="btn btn-primary" id="addSpecialtyBtn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Adicionar
                    </button>
                </div>
                <div class="tag-list" id="specialtiesList"></div>
            </div>

            <div class="skills-section">
                <div class="section-header">
                    <div>
                        <h2>Certificados</h2>
                        <p>Registre certificados e formações que comprovam sua experiência.</p>
                    </div>
                    <button class="btn btn-primary" id="addCertificateBtn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Adicionar certificado
                    </button>
                </div>
                <div class="certificate-list" id="certificatesList"></div>
            </div>
        </div>


        <div class="modal" id="certificateModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Novo certificado</h2>
                    <button class="modal-close" data-modal="certificateModal">&times;</button>
                </div>
                <form id="certificateForm">
                    <div class="form-group">
                        <label>Nome do certificado</label>
                        <input type="text" id="certificateName" placeholder="Ex: Curso de Primeiros Socorros" required>
                    </div>
                    <div class="form-group">
                        <label>Instituição (opcional)</label>
                        <input type="text" id="certificateIssuer" placeholder="Ex: Cruz Vermelha Portuguesa">
                    </div>
                    <div class="form-group inline">
                        <div>
                            <label>Data de emissão</label>
                            <input type="date" id="certificateDate">
                        </div>
                        <div>
                            <label>Validade</label>
                            <input type="date" id="certificateExpiry">
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" data-modal="certificateModal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    renderSpecialties();
    renderCertificates();

    document.getElementById('addSpecialtyBtn').addEventListener('click', () => {
        const input = document.getElementById('specialtyInput');
        const value = input.value.trim();
        
        if (!value) {
            showNotification('Digite pelo menos uma especialidade', 'error');
            return;
        }

        // Separar por vírgula e adicionar cada especialidade
        const newSpecialties = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const currentSpecialties = currentUser.professional?.specialties || [];
        
        // Evitar duplicados
        const uniqueSpecialties = [...new Set([...currentSpecialties, ...newSpecialties])];
        
        saveSpecialties(uniqueSpecialties).then(() => {
            input.value = '';
        });
    });

    document.getElementById('addCertificateBtn').addEventListener('click', () => {
        document.getElementById('certificateForm').reset();
        document.getElementById('certificateModal').classList.add('active');
    });

    document.getElementById('certificateForm').addEventListener('submit', handleCertificateSubmit);

    // Configurar botões de fechar e cancelar do modal de certificado
    const certificateModal = document.getElementById('certificateModal');
    const closeButtons = certificateModal.querySelectorAll('.modal-close, [data-modal="certificateModal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('certificateModal');
        });
    });

    // Fechar modal ao clicar fora dele
    certificateModal.addEventListener('click', (e) => {
        if (e.target === certificateModal) {
            closeModal('certificateModal');
        }
    });
}

// Carregar página de clientes (Cuidador)
async function loadMyClientsPage() {
    const page = document.getElementById('page-my-clients');

    if (currentUser.userType !== 'caregiver') {
        page.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3>Disponível apenas para cuidadores</h3>
                <p>Somente perfis de cuidadores possuem esta seção.</p>
            </div>
        `;
        return;
    }

    page.innerHTML = `
        <div class="empty-state subtle">
            <h3>Nenhum cliente registrado</h3>
            <p>Futuramente você verá aqui os clientes com agendamentos confirmados.</p>
        </div>
    `;
}

// Carregar página de relatórios (Admin)
async function loadReportsPage() {
    const page = document.getElementById('page-reports');

    if (currentUser.userType !== 'admin') {
        page.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>Disponível apenas para administradores</h3>
                <p>Somente perfis de administradores podem acessar os relatórios.</p>
            </div>
        `;
        return;
    }

    page.innerHTML = `
        <div class="reports-container">
            <div class="page-header">
                <h1>Relatórios e Estatísticas</h1>
                <p>Acompanhe o desempenho financeiro da plataforma</p>
            </div>

            <!-- Cards de resumo -->
            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 id="totalRevenue">€0</h3>
                        <p>Receita Total</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(37, 99, 235, 0.1); color: #2563eb;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 id="monthlyRevenue">€0</h3>
                        <p>Receita este Mês</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 id="activeUsers">0</h3>
                        <p>Usuários Ativos</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(168, 85, 247, 0.1); color: #a855f7;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="2" x2="12" y2="6"></line>
                            <line x1="12" y1="18" x2="12" y2="22"></line>
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                            <line x1="2" y1="12" x2="6" y2="12"></line>
                            <line x1="18" y1="12" x2="22" y2="12"></line>
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 id="totalBookings">0</h3>
                        <p>Agendamentos</p>
                    </div>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Receita Mensal</h3>
                        <select id="revenueYear" class="chart-filter">
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                    </div>
                    <canvas id="revenueChart"></canvas>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Crescimento de Usuários</h3>
                        <select id="usersYear" class="chart-filter">
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                    </div>
                    <canvas id="usersChart"></canvas>
                </div>
            </div>

            <div class="charts-grid" style="margin-top: 30px;">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Distribuição por Tipo de Usuário</h3>
                    </div>
                    <canvas id="userTypesChart"></canvas>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Agendamentos por Mês</h3>
                    </div>
                    <canvas id="bookingsChart"></canvas>
                </div>
            </div>
        </div>
    `;

    // Inicializar os gráficos
    await initializeReportsCharts();
}

// Inicializar gráficos de relatórios
async function initializeReportsCharts() {
    // Dados de exemplo (em produção viriam de uma API)
    const revenueData = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [{
            label: 'Receita (€)',
            data: [1200, 1900, 3000, 5000, 4200, 5800, 6500, 7200, 6800, 8000, 8500, 9200],
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    };

    const usersData = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [{
            label: 'Novos Usuários',
            data: [12, 19, 25, 35, 42, 58, 65, 72, 85, 90, 102, 115],
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderColor: 'rgba(37, 99, 235, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    };

    const userTypesData = {
        labels: ['Clientes', 'Cuidadores', 'Enfermeiros', 'Administradores'],
        datasets: [{
            data: [45, 30, 20, 5],
            backgroundColor: [
                'rgba(37, 99, 235, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(168, 85, 247, 0.8)'
            ],
            borderWidth: 0
        }]
    };

    const bookingsData = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [{
            label: 'Agendamentos',
            data: [15, 22, 35, 48, 52, 68, 75, 82, 88, 95, 105, 118],
            backgroundColor: 'rgba(168, 85, 247, 0.6)',
            borderColor: 'rgba(168, 85, 247, 1)',
            borderWidth: 2
        }]
    };

    // Configuração comum
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
            legend: {
                display: true,
                position: 'bottom'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    // Gráfico de Receita
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    new Chart(revenueCtx, {
        type: 'line',
        data: revenueData,
        options: commonOptions
    });

    // Gráfico de Usuários
    const usersCtx = document.getElementById('usersChart').getContext('2d');
    new Chart(usersCtx, {
        type: 'line',
        data: usersData,
        options: commonOptions
    });

    // Gráfico de Tipos de Usuário (Pizza)
    const userTypesCtx = document.getElementById('userTypesChart').getContext('2d');
    new Chart(userTypesCtx, {
        type: 'doughnut',
        data: userTypesData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Gráfico de Agendamentos
    const bookingsCtx = document.getElementById('bookingsChart').getContext('2d');
    new Chart(bookingsCtx, {
        type: 'bar',
        data: bookingsData,
        options: commonOptions
    });

    // Atualizar cards de estatísticas
    document.getElementById('totalRevenue').textContent = '€62.300';
    document.getElementById('monthlyRevenue').textContent = '€9.200';
    document.getElementById('activeUsers').textContent = '115';
    document.getElementById('totalBookings').textContent = '803';
}

// Carregar página de documentos (Cuidador)
async function loadDocumentsPage() {
    const page = document.getElementById('page-documents');

    if (currentUser.userType !== 'caregiver') {
        page.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3>Disponível apenas para cuidadores</h3>
                <p>Somente perfis de cuidadores possuem esta seção.</p>
            </div>
        `;
        return;
    }

    page.innerHTML = `
        <div class="page-header">
            <h1>Meus Documentos</h1>
            <p>Faça upload dos seus documentos pessoais, antecedentes criminais e referências para aumentar sua credibilidade.</p>
        </div>

        <div class="documents-container">
            <div class="document-section">
                <div class="section-header">
                    <div>
                        <h2>Documentos Pessoais</h2>
                        <p>RG, CPF, CNH, ou outro documento de identificação válido.</p>
                    </div>
                </div>
                <div class="documents-list" id="personalDocsList">
                    <!-- Documentos carregados via JS -->
                </div>
                <button class="btn btn-primary" id="uploadPersonalDocBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Adicionar Documento
                </button>
            </div>

            <div class="document-section">
                <div class="section-header">
                    <div>
                        <h2>Certificado de Antecedentes Criminais</h2>
                        <p>Documento emitido por autoridades competentes atestando antecedentes.</p>
                    </div>
                </div>
                <div class="documents-list" id="criminalRecordList">
                    <!-- Documentos carregados via JS -->
                </div>
                <button class="btn btn-primary" id="uploadCriminalRecordBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Adicionar Certificado
                </button>
            </div>

            <div class="document-section">
                <div class="section-header">
                    <div>
                        <h2>Referências</h2>
                        <p>Cartas de recomendação ou referências de trabalhos anteriores.</p>
                    </div>
                </div>
                <div class="documents-list" id="referencesList">
                    <!-- Documentos carregados via JS -->
                </div>
                <button class="btn btn-primary" id="uploadReferenceBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Adicionar Referência
                </button>
            </div>
        </div>
    `;

    // Renderizar documentos existentes
    renderDocuments();

    // Configurar event listeners para upload
    document.getElementById('uploadPersonalDocBtn').addEventListener('click', () => uploadDocument('personal'));
    document.getElementById('uploadCriminalRecordBtn').addEventListener('click', () => uploadDocument('criminalRecord'));
    document.getElementById('uploadReferenceBtn').addEventListener('click', () => uploadDocument('reference'));
}

// Renderizar documentos
async function renderDocuments() {
    try {
        // Buscar documentos da API
        const response = await fetch(`${API_URL}/documents`, {
            headers: api.getHeaders()
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Erro ao carregar documentos:', result.message);
            return;
        }

        const allDocuments = result.data || [];
        
        // Ordenar por data de upload (mais recentes primeiro)
        allDocuments.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        
        // Agrupar documentos por tipo
        const documents = {
            personal: allDocuments.filter(doc => doc.type === 'personal'),
            criminalRecord: allDocuments.filter(doc => doc.type === 'criminalRecord'),
            reference: allDocuments.filter(doc => doc.type === 'reference')
        };

        renderDocumentList('personalDocsList', documents.personal, 'personal');
        renderDocumentList('criminalRecordList', documents.criminalRecord, 'criminalRecord');
        renderDocumentList('referencesList', documents.reference, 'reference');
    } catch (error) {
        console.error('Erro ao renderizar documentos:', error);
    }
}

// Renderizar lista de documentos
function renderDocumentList(elementId, documents, type) {
    const list = document.getElementById(elementId);
    
    if (!documents || documents.length === 0) {
        list.innerHTML = `
            <div class="empty-state subtle">
                <p>Nenhum documento adicionado.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = documents.map((doc) => `
        <div class="document-card">
            <div class="document-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
            </div>
            <div class="document-info">
                <h4>${doc.name || 'Documento sem nome'}</h4>
                <p>Adicionado em ${new Date(doc.uploadedAt).toLocaleDateString('pt-PT')}</p>
                ${doc.description ? `<p class="doc-description">${doc.description}</p>` : ''}
            </div>
            <div class="document-actions">
                <button class="btn btn-secondary btn-small" onclick="viewDocument('${doc.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Ver
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteDocument('${doc.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Função para redimensionar e comprimir imagem
async function compressImage(file, maxSizeKB = 700) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Configurações de compressão
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                // Calcular novas dimensões mantendo aspect ratio
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                // Criar canvas para redimensionar
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Tentar diferentes qualidades até ficar abaixo do limite
                let quality = 0.9;
                let base64Data = canvas.toDataURL('image/jpeg', quality);
                
                // Reduzir qualidade gradualmente até caber no limite
                while (base64Data.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
                    quality -= 0.1;
                    base64Data = canvas.toDataURL('image/jpeg', quality);
                }

                if (base64Data.length > maxSizeKB * 1024 * 1.37) {
                    reject(new Error('Não foi possível comprimir a imagem o suficiente'));
                } else {
                    resolve(base64Data);
                }
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

// Upload de documento
async function uploadDocument(type) {
    // Criar input file dinamicamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const MAX_FILE_SIZE = 700 * 1024; // 700KB
        const isImage = file.type.startsWith('image/');
        
        let base64Data;

        try {
            if (isImage) {
                // Para imagens, comprimir automaticamente sem avisar
                base64Data = await compressImage(file, 700);
            } else {
                // Para PDFs e outros documentos, validar tamanho
                if (file.size > MAX_FILE_SIZE) {
                    showNotification('Arquivo muito grande. PDFs devem ter no máximo 700KB', 'error');
                    return;
                }
                
                // Converter para Base64
                const reader = new FileReader();
                base64Data = await new Promise((resolve, reject) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
                    reader.readAsDataURL(file);
                });
            }

            // Pedir nome e descrição
            const name = prompt('Nome do documento:', file.name);
            if (!name) return;
            
            const description = prompt('Descrição (opcional):') || '';

            // Salvar documento
            await saveDocument(type, {
                name,
                description,
                data: base64Data,
                uploadedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            showNotification(error.message || 'Erro ao processar arquivo', 'error');
        }
    };
    
    input.click();
}

// Salvar documento
async function saveDocument(type, newDoc) {
    try {
        const response = await fetch(`${API_URL}/documents`, {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify({
                type,
                name: newDoc.name,
                description: newDoc.description,
                data: newDoc.data
            })
        });

        const result = await response.json();

        if (result.success) {
            await renderDocuments();
            showNotification('Documento adicionado com sucesso!', 'success');
        } else {
            showNotification(result.message || 'Erro ao salvar documento', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar documento:', error);
        showNotification('Erro ao salvar documento', 'error');
    }
}

// Ver documento
async function viewDocument(documentId) {
    try {
        const response = await fetch(`${API_URL}/documents/${documentId}`, {
            headers: api.getHeaders()
        });

        const result = await response.json();

        if (!result.success) {
            showNotification('Documento não encontrado', 'error');
            return;
        }

        const doc = result.data;
        
        // Abrir em nova aba
        const win = window.open();
        if (doc.data.startsWith('data:application/pdf')) {
            win.document.write(`<iframe src="${doc.data}" style="width:100%;height:100%;border:none;"></iframe>`);
        } else {
            win.document.write(`<img src="${doc.data}" style="max-width:100%;height:auto;" />`);
        }
    } catch (error) {
        console.error('Erro ao visualizar documento:', error);
        showNotification('Erro ao visualizar documento', 'error');
    }
}

// Excluir documento
async function deleteDocument(documentId) {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/documents/${documentId}`, {
            method: 'DELETE',
            headers: api.getHeaders()
        });

        const result = await response.json();

        if (result.success) {
            await renderDocuments();
            showNotification('Documento excluído com sucesso!', 'success');
        } else {
            showNotification(result.message || 'Erro ao excluir documento', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir documento:', error);
        showNotification('Erro ao excluir documento', 'error');
    }
}

// Renderizar disponibilidade
function renderAvailability() {
    const list = document.getElementById('availabilityList');
    const slots = currentUser.professional?.availability?.slots || [];

    if (!slots.length) {
        list.innerHTML = `
            <div class="empty-state subtle">
                <h3>Nenhum horário cadastrado</h3>
                <p>Adicione seus horários disponíveis para facilitar o agendamento.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = slots.map((slot, index) => `
        <div class="availability-card">
            <div class="card-left">
                <div class="availability-day">${slot.day}</div>
                <div class="availability-time">${slot.start} - ${slot.end}</div>
                ${slot.notes ? `<p class="availability-notes">${slot.notes}</p>` : ''}
            </div>
            <button class="btn btn-secondary btn-small" data-index="${index}" data-action="remove-slot">
                Remover
            </button>
        </div>
    `).join('');

    list.querySelectorAll('[data-action="remove-slot"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            const updatedSlots = slots.filter((_, i) => i !== idx);
            await saveAvailability(updatedSlots);
        });
    });
}

// Salvar disponibilidade
async function saveAvailability(slots) {
    try {
        const professional = {
            ...(currentUser.professional || {}),
            availability: { slots }
        };

        const result = await api.updateProfile({ professional });

        if (result.success) {
            currentUser = {
                ...currentUser,
                ...result.data,
                professional: {
                    ...(currentUser.professional || {}),
                    ...(result.data?.professional || {}),
                    availability: { slots }
                }
            };
            renderAvailability();
            showNotification('Disponibilidade atualizada!', 'success');
        } else {
            const errorMessage = formatValidationErrors(result) || 'Erro ao salvar disponibilidade';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar disponibilidade:', error);
        showNotification('Erro ao salvar disponibilidade', 'error');
    } finally {
        closeModal('availabilityModal');
    }
}

// Submeter disponibilidade
async function handleAvailabilitySubmit(e) {
    e.preventDefault();

    // Obter dias selecionados
    const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked'))
        .map(checkbox => checkbox.value);

    const start = document.getElementById('availabilityStart').value;
    const end = document.getElementById('availabilityEnd').value;
    const notes = document.getElementById('availabilityNotes').value.trim();

    if (selectedDays.length === 0) {
        showNotification('Selecione pelo menos um dia da semana', 'error');
        return;
    }

    if (!start || !end) {
        showNotification('Preencha os horários de início e término', 'error');
        return;
    }

    // Validar se horário de término é depois do horário de início
    if (start >= end) {
        showNotification('O horário de término deve ser depois do horário de início', 'error');
        return;
    }

    // Criar slots para cada dia selecionado
    const newSlots = selectedDays.map(day => ({
        day,
        start,
        end,
        notes
    }));

    const currentSlots = currentUser.professional?.availability?.slots || [];
    
    // Filtrar slots existentes para remover duplicatas dos mesmos dias
    const filteredSlots = currentSlots.filter(slot => !selectedDays.includes(slot.day));
    
    await saveAvailability([...filteredSlots, ...newSlots]);
}

// Renderizar especialidades
function renderSpecialties() {
    const container = document.getElementById('specialtiesList');
    const specialties = currentUser.professional?.specialties || [];

    if (!specialties.length) {
        container.innerHTML = `
            <div class="empty-state subtle">
                <h3>Nenhuma especialidade cadastrada</h3>
                <p>Adicione as áreas em que você possui experiência.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = specialties.map((specialty, index) => `
        <span class="tag">
            ${specialty}
            <button type="button" data-index="${index}" data-action="remove-specialty">&times;</button>
        </span>
    `).join('');

    container.querySelectorAll('[data-action="remove-specialty"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            const updated = specialties.filter((_, i) => i !== idx);
            await saveSpecialties(updated);
        });
    });
}

// Salvar especialidades
async function saveSpecialties(specialties) {
    try {
        const professional = {
            ...(currentUser.professional || {}),
            specialties
        };

        const result = await api.updateProfile({ professional });

        if (result.success) {
            currentUser = {
                ...currentUser,
                ...result.data,
                professional: {
                    ...(currentUser.professional || {}),
                    ...(result.data?.professional || {}),
                    specialties
                }
            };
            renderSpecialties();
            showNotification('Especialidades atualizadas!', 'success');
        } else {
            const errorMessage = formatValidationErrors(result) || 'Erro ao salvar especialidades';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar especialidades:', error);
        showNotification('Erro ao salvar especialidades', 'error');
    } finally {
        closeModal('specialtyModal');
    }
}


// Renderizar certificados
function renderCertificates() {
    const container = document.getElementById('certificatesList');
    const certificates = currentUser.professional?.certifications || [];

    if (!certificates.length) {
        container.innerHTML = `
            <div class="empty-state subtle">
                <h3>Nenhum certificado cadastrado</h3>
                <p>Adicione certificados e cursos que comprovem seu conhecimento.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = certificates.map((cert, index) => `
        <div class="certificate-card">
            <div class="certificate-info">
                <h3>${cert.name}</h3>
                ${cert.issuer ? `<p class="certificate-issuer">${cert.issuer}</p>` : ''}
                <div class="certificate-dates">
                    ${cert.issueDate ? `<span>Emitido em: ${formatDate(cert.issueDate)}</span>` : ''}
                    ${cert.expiryDate ? `<span>Válido até: ${formatDate(cert.expiryDate)}</span>` : '<span>Sem validade definida</span>'}
                </div>
            </div>
            <button class="btn btn-secondary btn-small" data-index="${index}" data-action="remove-certificate">Remover</button>
        </div>
    `).join('');

    container.querySelectorAll('[data-action="remove-certificate"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            const updated = certificates.filter((_, i) => i !== idx);
            await saveCertificates(updated);
        });
    });
}

// Salvar certificados
async function saveCertificates(certifications) {
    try {
        const professional = {
            ...(currentUser.professional || {}),
            certifications
        };

        const result = await api.updateProfile({ professional });

        if (result.success) {
            currentUser = {
                ...currentUser,
                ...result.data,
                professional: {
                    ...(currentUser.professional || {}),
                    ...(result.data?.professional || {}),
                    certifications
                }
            };
            renderCertificates();
            showNotification('Certificados atualizados!', 'success');
        } else {
            const errorMessage = formatValidationErrors(result) || 'Erro ao salvar certificados';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar certificados:', error);
        showNotification('Erro ao salvar certificados', 'error');
    } finally {
        closeModal('certificateModal');
    }
}

// Lidar com envio de certificado
async function handleCertificateSubmit(e) {
    e.preventDefault();

    const certificate = {
        name: document.getElementById('certificateName').value.trim(),
        issuer: document.getElementById('certificateIssuer').value.trim(),
        issueDate: document.getElementById('certificateDate').value || null,
        expiryDate: document.getElementById('certificateExpiry').value || null
    };

    if (!certificate.name) return;

    const currentCertificates = currentUser.professional?.certifications || [];
    await saveCertificates([...currentCertificates, certificate]);
}

let currentProfessionalData = null; // Armazenar dados do profissional atual

function populateProfessionalModal(professional) {
    currentProfessionalData = professional; // Salvar para uso posterior
    
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRTVFN0VCIi8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUM5Q0EzIi8+CjxwYXRoIGQ9Ik0yMCA3MFE1MCA1MCA4MCA3MCIgc3Ryb2tlPSIjOUM5Q0EzIiBzdHJva2Utd2lkdGg9IjgiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';

    document.getElementById('professionalModalAvatar').src = professional.avatar || defaultAvatar;
    document.getElementById('professionalModalName').textContent = professional.name;
    document.getElementById('professionalModalType').textContent = getUserTypeLabel(professional.userType || 'caregiver');
    document.getElementById('professionalModalEmail').textContent = professional.email || 'Email não informado';
    document.getElementById('professionalModalPhone').textContent = professional.phone || 'Telefone não informado';

    const hourlyRate = professional.professional?.hourlyRate;
    document.getElementById('professionalModalHourlyRate').textContent = hourlyRate ? `€${Number(hourlyRate).toFixed(2)}` : 'Não informada';

    document.getElementById('professionalModalExperience').textContent = professional.professional?.experience || 'Experiência não informada';

    renderProfessionalAvailability(professional);
    renderProfessionalSpecialties(professional.professional?.specialties || []);
    renderProfessionalCertificates(professional.professional?.certifications || []);
}

function renderProfessionalAvailability(professional) {
    const container = document.getElementById('professionalModalAvailability');
    
    // Verificar se temos dados profissionais
    if (!professional.professional) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Perfil profissional não configurado.</p>
            </div>
        `;
        return;
    }
    
    // Buscar slots de disponibilidade
    let slots = [];
    if (professional.professional.availability) {
        if (Array.isArray(professional.professional.availability)) {
            // Compatibilidade: se availability for um array direto
            slots = professional.professional.availability;
        } else if (professional.professional.availability.slots) {
            // Formato correto: availability.slots
            slots = professional.professional.availability.slots;
        }
    }
    
    const hourlyRate = parseFloat(professional.professional.hourlyRate) || 0;
    const phone = professional.phone || '';
    
    if (!slots.length) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma disponibilidade cadastrada.</p>
            </div>
        `;
        return;
    }
    
    if (!hourlyRate) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Preço por hora não definido.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = slots.map((slot, index) => {
        // Calcular duração em horas
        const [startHour, startMin] = slot.start.split(':').map(Number);
        const [endHour, endMin] = slot.end.split(':').map(Number);
        const startInMinutes = startHour * 60 + startMin;
        const endInMinutes = endHour * 60 + endMin;
        const durationMinutes = endInMinutes - startInMinutes;
        const durationHours = (durationMinutes / 60).toFixed(1);
        
        // Calcular valores para período completo
        const fullSubtotal = hourlyRate * parseFloat(durationHours);
        const fullCommission = fullSubtotal * 0.10;
        const fullTotal = fullSubtotal + fullCommission;
        
        // Calcular valores para 1 hora
        const oneHourSubtotal = hourlyRate;
        const oneHourCommission = hourlyRate * 0.10;
        const oneHourTotal = oneHourSubtotal + oneHourCommission;
        
        // Preparar links do WhatsApp
        const phoneDigits = phone.replace(/\D/g, '');
        const whatsappNumber = phoneDigits.startsWith('0') ? phoneDigits.slice(1) : phoneDigits;
        
        // Mensagem para período completo
        const fullPeriodMessage = encodeURIComponent(
            `Olá ${professional.name}! Gostaria de contratar seus serviços.\n\n` +
            `📅 Dia: ${slot.day}\n` +
            `🕐 Horário: ${slot.start} - ${slot.end}\n` +
            `⏱️ Duração: ${durationHours}h (período completo)\n` +
            `💰 Valor total: €${fullTotal.toFixed(2)}`
        );
        const fullPeriodLink = `https://wa.me/${whatsappNumber}?text=${fullPeriodMessage}`;
        
        // Mensagem para 1 hora avulsa
        const oneHourMessage = encodeURIComponent(
            `Olá ${professional.name}! Gostaria de contratar seus serviços.\n\n` +
            `📅 Dia: ${slot.day}\n` +
            `🕐 Disponível: ${slot.start} - ${slot.end}\n` +
            `⏱️ Duração: 1 hora (avulsa)\n` +
            `💰 Valor: €${oneHourTotal.toFixed(2)}`
        );
        const oneHourLink = `https://wa.me/${whatsappNumber}?text=${oneHourMessage}`;
        
        return `
            <div class="availability-slot-card">
                <div class="slot-info">
                    <div class="slot-day">${slot.day}</div>
                    <div class="slot-time">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${slot.start} - ${slot.end}
                    </div>
                    ${slot.notes ? `<div class="slot-notes">${slot.notes}</div>` : ''}
                    <div class="slot-duration">Disponível por ${durationHours} hora${parseFloat(durationHours) !== 1 ? 's' : ''}</div>
                </div>
                <div class="slot-pricing-options">
                    <!-- Opção 1: Período Completo -->
                    <div class="pricing-option">
                        <div class="pricing-option-header">
                            <span class="option-badge">Período Completo</span>
                        </div>
                        <div class="pricing-breakdown">
                            <div class="pricing-line">
                                <span>Serviço (${durationHours}h × €${hourlyRate.toFixed(2)})</span>
                                <span>€${fullSubtotal.toFixed(2)}</span>
                            </div>
                            <div class="pricing-line commission">
                                <span>Taxa da plataforma (10%)</span>
                                <span>€${fullCommission.toFixed(2)}</span>
                            </div>
                            <div class="pricing-total">
                                <span>Total</span>
                                <span>€${fullTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        ${phoneDigits.length >= 9 ? `
                            <a href="${fullPeriodLink}" target="_blank" rel="noopener" class="btn btn-whatsapp">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                Contratar Período
                            </a>
                        ` : ''}
                    </div>

                    <!-- Opção 2: Hora Avulsa -->
                    <div class="pricing-option">
                        <div class="pricing-option-header">
                            <span class="option-badge hour-badge">Hora Avulsa</span>
                        </div>
                        <div class="pricing-breakdown">
                            <div class="pricing-line">
                                <span>Serviço (1h × €${hourlyRate.toFixed(2)})</span>
                                <span>€${oneHourSubtotal.toFixed(2)}</span>
                            </div>
                            <div class="pricing-line commission">
                                <span>Taxa da plataforma (10%)</span>
                                <span>€${oneHourCommission.toFixed(2)}</span>
                            </div>
                            <div class="pricing-total">
                                <span>Total</span>
                                <span>€${oneHourTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        ${phoneDigits.length >= 9 ? `
                            <a href="${oneHourLink}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-whatsapp-secondary">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                Contratar 1 Hora
                            </a>
                        ` : ''}
                    </div>
                    
                    ${phoneDigits.length < 9 ? `
                        <div class="no-contact" style="grid-column: 1 / -1;">
                            <small>Telefone não disponível para contato</small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderProfessionalSpecialties(specialties) {
    const container = document.getElementById('professionalModalSpecialties');
    if (!specialties.length) {
        container.innerHTML = '<div class="empty-state subtle">Nenhuma especialidade informada</div>';
        return;
    }

    container.innerHTML = specialties.map(spec => `
        <span class="tag">${spec}</span>
    `).join('');
}

function renderProfessionalCertificates(certificates) {
    const container = document.getElementById('professionalModalCertificates');
    if (!certificates.length) {
        container.innerHTML = '<div class="empty-state subtle">Nenhum certificado informado</div>';
        return;
    }

    container.innerHTML = certificates.map(cert => `
        <div class="certificate-card">
            <div class="certificate-info">
                <h3>${cert.name}</h3>
                ${cert.issuer ? `<p class="certificate-issuer">${cert.issuer}</p>` : ''}
                <div class="certificate-dates">
                    ${cert.issueDate ? `<span>Emitido em: ${formatDate(cert.issueDate)}</span>` : ''}
                    ${cert.expiryDate ? `<span>Válido até: ${formatDate(cert.expiryDate)}</span>` : '<span>Sem validade definida</span>'}
                </div>
            </div>
        </div>
    `).join('');
}

// Configurar menu mobile
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Lidar com logout
function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        api.logout();
        window.location.href = 'index.html';
    }
}

// Fechar modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Configurar fechamento de modais
document.querySelectorAll('.modal-close, [data-modal]').forEach(element => {
    element.addEventListener('click', function() {
        const modalId = this.getAttribute('data-modal') || this.closest('.modal').id;
        closeModal(modalId);
    });
});

// Mostrar notificação
function showNotification(message, type = 'info') {
    // TODO: Implementar sistema de notificações mais elaborado
    alert(message);
}

function formatValidationErrors(result) {
    if (result?.errors && result.errors.length) {
        return 'Erros:\n' + result.errors.map(err => `${err.field}: ${err.message}`).join('\n');
    }
    return result?.message || null;
}

// Exportar funções globais
window.loadPage = loadPage;
window.viewProfessional = viewProfessional;
window.openAdminEditUser = openAdminEditUser;
window.deleteUser = deleteUser;
window.viewDocument = viewDocument;
window.deleteDocument = deleteDocument;
