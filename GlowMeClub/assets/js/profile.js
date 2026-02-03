// ===== PERFIL - Edição Completa com Imagem =====

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// Dados do usuário atual
let currentUser = null;
let originalData = null;
let selectedImageBase64 = null; // Nova imagem escolhida (base64) ou null se não alterou
let userWantsToRemoveAvatar = false; // true apenas quando usuário clicou em "Remover foto"
let hasUnsavedChanges = false;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    logger.info('Carregando página de perfil...');
    
    initializeProfile();
    setupEventListeners();
});

// Ocultar elementos desnecessários para administradores
function hideAdminUnnecessaryElements() {
    // Ocultar navegação inferior
    const bottomNav = document.querySelector('.app-bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = 'none';
    }
    
    // Ocultar seção de preferências
    const prefsSection = document.querySelector('.form-section:has(.fa-palette)');
    if (prefsSection) {
        prefsSection.style.display = 'none';
    }
    
    // Ocultar seção de preferências de email
    const emailPrefsSection = document.querySelector('.email-prefs-section');
    if (emailPrefsSection) {
        emailPrefsSection.style.display = 'none';
    }
}

// Inicializar perfil
async function initializeProfile() {
    const token = window.api.getToken();
    
    if (!token) {
        logger.error('Sem token, redirecionando para login...');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        showLoading(true);
        
        // Buscar dados do usuário
        const data = await window.api.get('/auth/me');
        currentUser = data.user;
        originalData = { ...currentUser };
        
        logger.info('Dados do perfil carregados');
        
        // Se for admin, ocultar elementos desnecessários
        if (currentUser.role === 'admin') {
            hideAdminUnnecessaryElements();
        }
        
        // Preencher formulário
        populateForm();
        updateHeaderAvatarLocal();
        
    } catch (error) {
        logger.error('Erro ao carregar perfil:', error);
        
        // Tentar usar dados do cache
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                currentUser = JSON.parse(cachedData);
                originalData = { ...currentUser };
                
                // Se for admin, ocultar elementos
                if (currentUser.role === 'admin') {
                    hideAdminUnnecessaryElements();
                }
                
                populateForm();
                updateHeaderAvatarLocal();
                showStatus('Usando dados offline', 'warning');
                return;
            } catch (e) {
                logger.error('Erro ao parsear cache');
            }
        }
        
        // Se não conseguir usar cache e for erro de autenticação
        if (error.status === 401) {
            window.api.removeToken();
            window.location.href = 'login.html';
        } else {
            showStatus('Erro ao carregar perfil. Tente novamente.', 'error');
        }
    } finally {
        showLoading(false);
    }
}

// ===== POPULAR FORMULÁRIO =====
function populateForm() {
    if (!currentUser) return;
    
    // Campos de texto
    document.getElementById('userName').value = currentUser.name || '';
    document.getElementById('userEmail').value = currentUser.email || '';
    
    // Telefone com DDI editável
    const phoneInput = document.getElementById('userPhone');
    const ddiInput = document.getElementById('phoneDdi');
    if (currentUser.phone) {
        const phoneMatch = currentUser.phone.match(/^(\+\d{1,4})\s*(.*)$/);
        if (phoneMatch) {
            if (ddiInput) ddiInput.value = phoneMatch[1];
            if (phoneInput) phoneInput.value = formatPhoneNumber(phoneMatch[2], phoneMatch[1]);
        } else {
            if (ddiInput) ddiInput.value = '+55';
            if (phoneInput) phoneInput.value = formatPhoneNumber(currentUser.phone, '+55');
        }
    } else {
        if (ddiInput) ddiInput.value = '+55';
    }
    
    // Cor preferida
    const preferredColor = currentUser.preferredColor || '#8B5CF6';
    document.getElementById('preferredColor').value = preferredColor;
    
    // Buscar nome da cor no grid de cores
    const colorOption = document.querySelector(`#colorGrid .color-option[data-color="${preferredColor}"]`);
    const colorName = colorOption ? colorOption.dataset.name : 'Cor personalizada';
    selectColor(preferredColor, colorName);
    
    // Área de foco
    document.getElementById('focusArea').value = currentUser.focusArea || 'Mental';
    
    // Avatar
    updateAvatarDisplay();
    
    // Estatísticas
    updateStats();
    
    // Badges
    updateBadges();
    
    // Jornada / Mapa
    updateJourneyMap();
    
    // Preferências de email
    loadEmailPreferences();
    
    // Resetar flag de mudanças
    hasUnsavedChanges = false;
    updateSaveButton();
}

// ===== FORMATAÇÃO E VALIDAÇÃO DE TELEFONE (regras simplificadas) =====
// Brasil +55: até 12 dígitos (considerando 0); Portugal +351: 9 dígitos
function formatPhoneNumber(value, ddi) {
    const digits = String(value || '').replace(/\D/g, '');
    const ddiNorm = (ddi || '+55').toString().trim().replace(/\D/g, '');
    const isBrazil = ddiNorm === '55';
    const isPortugal = ddiNorm === '351';
    if (isBrazil) {
        const limited = digits.substring(0, 12);
        if (limited.length === 0) return '';
        const normalized = limited.replace(/^0/, '').substring(0, 11);
        if (normalized.length === 0) return limited;
        const ddd = normalized.slice(0, 2);
        const rest = normalized.slice(2);
        const part1 = rest.slice(0, 5);
        const part2 = rest.slice(5, 9);
        return part2 ? `(${ddd}) ${part1}-${part2}` : rest.length > 0 ? `(${ddd}) ${part1}` : `(${ddd})`;
    }
    if (isPortugal) return digits.substring(0, 9);
    return digits.substring(0, 15);
}

function validatePhoneWithDDI(ddi, digitsOnly) {
    const d = String(digitsOnly || '').replace(/\D/g, '');
    const ddiNorm = (ddi || '+55').toString().trim();
    const isBrazil = ddiNorm === '+55' || ddiNorm === '55';
    const isPortugal = ddiNorm === '+351' || ddiNorm === '351';
    if (isBrazil) {
        if (d.length < 10 || d.length > 12) return { valid: false, message: 'Brasil: informe até 12 dígitos (DDD + número).' };
        return { valid: true };
    }
    if (isPortugal) return d.length === 9 ? { valid: true } : { valid: false, message: 'Portugal: informe 9 dígitos.' };
    if (d.length < 8 || d.length > 15) return { valid: false, message: 'Informe entre 8 e 15 dígitos além do DDI.' };
    return { valid: true };
}

function getPhoneForSave() {
    const phoneInput = document.getElementById('userPhone');
    const ddiInput = document.getElementById('phoneDdi');
    if (!phoneInput || !phoneInput.value.trim()) return null;
    let digits = phoneInput.value.replace(/\D/g, '');
    if (digits.length === 0) return null;
    let ddi = ddiInput ? ddiInput.value.trim() : '+55';
    if (!ddi.startsWith('+')) ddi = '+' + ddi;
    const isBrazil = (ddi === '+55');
    if (isBrazil && digits.length === 12 && digits.startsWith('0')) digits = digits.slice(1);
    return ddi + digits;
}

// ===== AVATAR =====
function updateAvatarDisplay() {
    const avatarContainer = document.getElementById('profileAvatar');
    const avatarInitial = document.getElementById('avatarInitial');
    const avatarImage = document.getElementById('avatarImage');
    const removeBtn = document.getElementById('removeAvatarBtn');
    
    // Mostrar nova imagem escolhida ou a atual do perfil (não sumir se só editou outro campo)
    const imageData = selectedImageBase64 || (userWantsToRemoveAvatar ? null : currentUser?.profileImage);
    
    if (imageData) {
        avatarImage.src = imageData;
        avatarImage.style.display = 'block';
        avatarInitial.style.display = 'none';
        avatarContainer.style.background = 'transparent';
        removeBtn.style.display = 'block';
    } else {
        avatarImage.style.display = 'none';
        avatarInitial.style.display = 'flex';
        avatarInitial.textContent = (currentUser?.name || 'U').charAt(0).toUpperCase();
        avatarContainer.style.background = currentUser?.preferredColor || '#8B5CF6';
        removeBtn.style.display = 'none';
    }
}

function updateHeaderAvatarLocal() {
    // Usa a função compartilhada do api.js
    if (window.updateHeaderAvatar && currentUser) {
        window.updateHeaderAvatar(currentUser);
    }
}

// ===== SELEÇÃO DE COR =====
function selectColor(color, colorName) {
    // Remover seleção anterior
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Selecionar nova cor
    const colorOption = document.querySelector(`.color-option[data-color="${color}"]`);
    if (colorOption) {
        colorOption.classList.add('selected');
    }
    
    // Atualizar input hidden
    document.getElementById('preferredColor').value = color;
    
    // Atualizar botão seletor
    document.getElementById('selectedColorPreview').style.background = color;
    document.getElementById('selectedColorName').textContent = colorName || 'Cor selecionada';
    
    // Atualizar avatar se não tiver imagem
    if (!selectedImageBase64 && !currentUser?.profileImage) {
        document.getElementById('profileAvatar').style.background = color;
    }
    
    // Atualizar tema em tempo real
    if (window.GlowTheme && window.GlowTheme.apply) {
        window.GlowTheme.apply(color);
    }
}

function openColorPickerModal() {
    document.getElementById('colorPickerModal').classList.add('active');
    document.getElementById('colorSelectorBtn').classList.add('active');
}

function closeColorPickerModal() {
    document.getElementById('colorPickerModal').classList.remove('active');
    document.getElementById('colorSelectorBtn').classList.remove('active');
}

// ===== ESTATÍSTICAS =====
function updateStats() {
    // Seção de estatísticas foi removida - função mantida por compatibilidade
    if (!currentUser) return;
    
    // Verifica se os elementos existem antes de tentar atualizar
    const totalPointsEl = document.getElementById('totalPoints');
    const currentLevelEl = document.getElementById('currentLevel');
    const levelNumberEl = document.getElementById('levelNumber');
    const memberSinceEl = document.getElementById('memberSince');
    const progressBarEl = document.getElementById('progressBar');
    const currentPointsLabelEl = document.getElementById('currentPointsLabel');
    const nextLevelLabelEl = document.getElementById('nextLevelLabel');
    const levelNameEl = document.getElementById('levelName');
    const levelEmojiEl = document.getElementById('levelEmoji');
    
    // Se nenhum elemento existe, a seção foi removida
    if (!totalPointsEl && !currentLevelEl) return;
    
    const totalPoints = currentUser.totalPoints || 0;
    const level = calculateLevel(totalPoints);
    
    // Pontos
    if (totalPointsEl) totalPointsEl.textContent = totalPoints.toLocaleString('pt-BR');
    
    // Nível
    if (currentLevelEl) currentLevelEl.textContent = level.current;
    if (levelNumberEl) levelNumberEl.textContent = level.current;
    
    // Data de entrada
    if (memberSinceEl) {
        const joinDate = new Date(currentUser.createdAt || Date.now());
        memberSinceEl.textContent = joinDate.toLocaleDateString('pt-BR', {
            month: 'short',
            year: 'numeric'
        });
    }
    
    // Progresso do nível
    if (progressBarEl) {
        const progressPercent = ((totalPoints - level.minPoints) / (level.maxPoints - level.minPoints)) * 100;
        progressBarEl.style.width = `${Math.min(progressPercent, 100)}%`;
    }
    if (currentPointsLabelEl) currentPointsLabelEl.textContent = `${totalPoints} pts`;
    if (nextLevelLabelEl) nextLevelLabelEl.textContent = `${level.maxPoints} pts para próximo nível`;
    
    // Nome e emoji do nível
    if (levelNameEl) levelNameEl.textContent = level.name;
    if (levelEmojiEl) levelEmojiEl.textContent = level.emoji;
}

function calculateLevel(points) {
    const levels = [
        { level: 1, name: 'Plebeia', emoji: '🌱', min: 0, max: 500 },
        { level: 2, name: 'Princesa', emoji: '👑', min: 500, max: 1500 },
        { level: 3, name: 'Rainha', emoji: '💎', min: 1500, max: 3000 },
        { level: 4, name: 'Imperatriz', emoji: '⭐', min: 3000, max: 5000 },
        { level: 5, name: 'Deusa', emoji: '✨', min: 5000, max: Infinity }
    ];
    
    for (const lvl of levels) {
        if (points < lvl.max) {
            return {
                current: lvl.level,
                name: lvl.name,
                emoji: lvl.emoji,
                minPoints: lvl.min,
                maxPoints: lvl.max
            };
        }
    }
    
    return levels[levels.length - 1];
}

// ===== BADGES =====
function updateBadges() {
    // Seção de badges foi removida - função mantida por compatibilidade
    const badgeItems = document.querySelectorAll('.badge-item');
    if (!badgeItems || badgeItems.length === 0) return;
    
    const badges = currentUser?.badges || [];
    
    badgeItems.forEach(item => {
        const badgeId = item.dataset.badge;
        const iconEl = item.querySelector('.badge-icon');
        
        if (badges.includes(badgeId)) {
            item.classList.add('unlocked');
            if (iconEl) iconEl.classList.remove('locked');
        } else {
            item.classList.remove('unlocked');
            if (iconEl) iconEl.classList.add('locked');
        }
    });
}

// ===== JORNADA / MAPA =====
function updateJourneyMap() {
    // Seção de jornada foi removida - função mantida por compatibilidade
    const steps = document.querySelectorAll('.journey-step');
    const lines = document.querySelectorAll('.journey-line');
    
    if (!steps || steps.length === 0) return;
    
    const totalPoints = currentUser?.totalPoints || 0;
    const currentLevel = Math.min(Math.floor(totalPoints / 500) + 1, 5);
    
    steps.forEach((step, index) => {
        const stepLevel = index + 1;
        const marker = step.querySelector('.journey-marker');
        
        if (!marker) return;
        
        if (stepLevel < currentLevel) {
            marker.classList.add('completed');
            marker.classList.remove('current');
        } else if (stepLevel === currentLevel) {
            marker.classList.add('current');
            marker.classList.remove('completed');
        } else {
            marker.classList.remove('completed', 'current');
        }
    });
    
    lines.forEach((line, index) => {
        if (index < currentLevel - 1) {
            line.classList.add('completed');
        } else {
            line.classList.remove('completed');
        }
    });
}

// ===== PREFERÊNCIAS DE EMAIL =====
function loadEmailPreferences() {
    const prefs = currentUser.emailPreferences || {
        weekly: true,
        rewards: true,
        levelUp: true,
        reminders: false
    };
    
    const weeklyEl = document.getElementById('emailWeekly');
    const rewardsEl = document.getElementById('emailRewards');
    const levelUpEl = document.getElementById('emailLevelUp');
    const remindersEl = document.getElementById('emailReminders');
    
    if (weeklyEl) weeklyEl.checked = prefs.weekly !== false;
    if (rewardsEl) rewardsEl.checked = prefs.rewards !== false;
    if (levelUpEl) levelUpEl.checked = prefs.levelUp !== false;
    if (remindersEl) remindersEl.checked = prefs.reminders === true;
}

function getEmailPreferences() {
    return {
        weekly: document.getElementById('emailWeekly')?.checked ?? true,
        rewards: document.getElementById('emailRewards')?.checked ?? true,
        levelUp: document.getElementById('emailLevelUp')?.checked ?? true,
        reminders: document.getElementById('emailReminders')?.checked ?? false
    };
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Formulário
    document.getElementById('profileForm').addEventListener('submit', handleSaveProfile);
    
    // Avatar input
    document.getElementById('avatarInput').addEventListener('change', handleImageSelect);
    
    // Remover avatar
    document.getElementById('removeAvatarBtn').addEventListener('click', handleRemoveAvatar);
    
    // Botão seletor de cor - abre modal
    document.getElementById('colorSelectorBtn').addEventListener('click', openColorPickerModal);
    
    // Seleção de cor no modal
    document.querySelectorAll('#colorGrid .color-option').forEach(option => {
        option.addEventListener('click', () => {
            selectColor(option.dataset.color, option.dataset.name);
            closeColorPickerModal();
            markAsChanged();
        });
    });
    
    // Fechar modal de cores
    document.getElementById('closeColorModal').addEventListener('click', closeColorPickerModal);
    document.getElementById('cancelColorPicker').addEventListener('click', closeColorPickerModal);
    document.getElementById('colorPickerModal').addEventListener('click', (e) => {
        if (e.target.id === 'colorPickerModal') {
            closeColorPickerModal();
        }
    });
    
    // Campos do formulário
    ['userName', 'focusArea'].forEach(id => {
        document.getElementById(id).addEventListener('input', markAsChanged);
        document.getElementById(id).addEventListener('change', markAsChanged);
    });
    
    // Campo de telefone - formatação automática
    const phoneInput = document.getElementById('userPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            const ddiEl = document.getElementById('phoneDdi');
            const ddi = ddiEl ? ddiEl.value.trim() : '+55';
            const cursorPos = e.target.selectionStart;
            const oldLength = e.target.value.length;
            e.target.value = formatPhoneNumber(e.target.value, ddi);
            const newLength = e.target.value.length;
            const newCursorPos = cursorPos + (newLength - oldLength);
            e.target.setSelectionRange(newCursorPos, newCursorPos);
            markAsChanged();
        });
    }
    
    // Campo DDI - formatação
    const ddiInput = document.getElementById('phoneDdi');
    if (ddiInput) {
        ddiInput.addEventListener('input', function(e) {
            // Garantir que começa com +
            let value = e.target.value.replace(/[^\d+]/g, '');
            if (!value.startsWith('+')) {
                value = '+' + value.replace(/\+/g, '');
            }
            e.target.value = value.substring(0, 5); // Máximo +XXXX
            markAsChanged();
        });
    }
    
    // Preferências de email
    ['emailWeekly', 'emailRewards', 'emailLevelUp', 'emailReminders'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', markAsChanged);
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Modal de crop
    document.getElementById('closeCropModal').addEventListener('click', closeCropModal);
    document.getElementById('cancelCrop').addEventListener('click', closeCropModal);
    document.getElementById('confirmCrop').addEventListener('click', confirmImageCrop);
    
    // Fechar modal ao clicar fora
    document.getElementById('cropModal').addEventListener('click', (e) => {
        if (e.target.id === 'cropModal') {
            closeCropModal();
        }
    });
    
    // Aviso ao sair com mudanças não salvas
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

function markAsChanged() {
    hasUnsavedChanges = true;
    updateSaveButton();
}

function updateSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (hasUnsavedChanges) {
        saveBtn.classList.add('has-changes');
    } else {
        saveBtn.classList.remove('has-changes');
    }
}

// ===== MANIPULAÇÃO DE IMAGEM =====
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        showStatus('Por favor, selecione uma imagem válida.', 'error');
        return;
    }
    
    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showStatus('A imagem deve ter no máximo 5MB.', 'error');
        return;
    }
    
    // Ler arquivo
    const reader = new FileReader();
    reader.onload = (event) => {
        openCropModal(event.target.result);
    };
    reader.readAsDataURL(file);
}

function openCropModal(imageSrc) {
    document.getElementById('cropPreview').src = imageSrc;
    document.getElementById('cropModal').classList.add('active');
}

function closeCropModal() {
    document.getElementById('cropModal').classList.remove('active');
    document.getElementById('avatarInput').value = '';
}

async function confirmImageCrop() {
    const imgSrc = document.getElementById('cropPreview').src;
    
    try {
        showStatus('Processando imagem...', 'info');
        
        // Comprimir e redimensionar imagem
        const compressedImage = await compressImage(imgSrc, {
            maxWidth: 300,
            maxHeight: 300,
            quality: 0.7,
            maxSizeKB: 100 // Máximo 100KB para ficar bem leve
        });
        
        selectedImageBase64 = compressedImage;
        userWantsToRemoveAvatar = false;
        updateAvatarDisplay();
        markAsChanged();
        
        closeCropModal();
        showStatus('Imagem carregada! Clique em Salvar para confirmar.', 'success');
        
    } catch (error) {
        logger.error('Erro ao processar imagem:', error);
        showStatus('Erro ao processar imagem. Tente outra.', 'error');
    }
}

// Função de compressão de imagem
async function compressImage(imageSrc, options = {}) {
    const {
        maxWidth = 300,
        maxHeight = 300,
        quality = 0.7,
        maxSizeKB = 100
    } = options;
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Calcular dimensões mantendo proporção
            let width = img.width;
            let height = img.height;
            
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
            
            // Desenhar imagem circular (opcional)
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
            
            logger.info(`Imagem comprimida: ${getBase64SizeKB(base64).toFixed(2)}KB`);
            resolve(base64);
        };
        
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = imageSrc;
    });
}

function getBase64SizeKB(base64String) {
    // Remover header do base64
    const base64 = base64String.split(',')[1] || base64String;
    // Calcular tamanho em bytes
    const bytes = (base64.length * 3) / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    return bytes / 1024;
}

function handleRemoveAvatar() {
    selectedImageBase64 = null;
    userWantsToRemoveAvatar = true;
    if (currentUser) currentUser.profileImage = null;
    updateAvatarDisplay();
    markAsChanged();
    showStatus('Foto removida. Clique em Salvar para confirmar.', 'info');
}

// ===== SALVAR PERFIL =====
async function handleSaveProfile(e) {
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-hourglass"></i> Salvando...';
    
    try {
        // Coletar dados do formulário
        const formData = {
            name: document.getElementById('userName').value.trim(),
            preferredColor: document.getElementById('preferredColor').value,
            focusArea: document.getElementById('focusArea').value,
            emailPreferences: getEmailPreferences()
        };
        
        // Adicionar telefone (opcional no perfil)
        const phone = getPhoneForSave();
        if (phone) {
            const phoneInput = document.getElementById('userPhone');
            const ddiInput = document.getElementById('phoneDdi');
            if (phoneInput && phoneInput.value.trim()) {
                const ddi = ddiInput ? (ddiInput.value.trim().startsWith('+') ? ddiInput.value.trim() : '+' + ddiInput.value.trim()) : '+55';
                const digits = phoneInput.value.replace(/\D/g, '');
                const v = validatePhoneWithDDI(ddi, digits);
                if (!v.valid) {
                    showStatus(v.message || 'Telefone inválido.', 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar alterações';
                    return;
                }
            }
            formData.phone = phone;
        } else {
            formData.phone = null; // Permite remover o telefone
        }
        
        // Imagem: enviar só se escolheu nova, ou se pediu para remover; caso contrário manter a atual
        if (selectedImageBase64) {
            formData.profileImage = selectedImageBase64;
        } else if (userWantsToRemoveAvatar) {
            formData.profileImage = null;
        }
        
        // Validar nome
        if (!formData.name || formData.name.length < 2) {
            showStatus('O nome deve ter pelo menos 2 caracteres.', 'error');
            return;
        }
        
        // Enviar para o servidor
        const response = await window.api.put('/user/profile', formData);
        
        if (response.success) {
            // Atualizar dados locais
            currentUser = response.user;
            originalData = { ...currentUser };
            selectedImageBase64 = null;
            userWantsToRemoveAvatar = false;
            
            // Atualizar cache
            localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
            
            // Atualizar UI
            updateAvatarDisplay();
            updateHeaderAvatarLocal();
            updateStats();
            
            hasUnsavedChanges = false;
            updateSaveButton();
            
            showStatus('Perfil atualizado com sucesso!', 'success');
        } else {
            throw new Error(response.error || 'Erro ao salvar');
        }
        
    } catch (error) {
        logger.error('Erro ao salvar perfil:', error);
        
        // Tentar salvar offline
        if (window.api.isNetworkError(error)) {
            // Salvar localmente
            const formData = {
                name: document.getElementById('userName').value.trim(),
                preferredColor: document.getElementById('preferredColor').value,
                focusArea: document.getElementById('focusArea').value
            };
            
            if (selectedImageBase64) {
                formData.profileImage = selectedImageBase64;
            } else if (userWantsToRemoveAvatar) {
                formData.profileImage = null;
            }
            
            currentUser = { ...currentUser, ...formData };
            localStorage.setItem('cachedUserData', JSON.stringify(currentUser));
            
            updateAvatarDisplay();
            updateHeaderAvatarLocal();
            
            hasUnsavedChanges = false;
            updateSaveButton();
            
            showStatus('Salvo localmente. Sincronizará quando voltar online.', 'warning');
        } else {
            showStatus('Erro ao salvar perfil. Tente novamente.', 'error');
        }
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar alterações';
    }
}

// ===== LOGOUT =====
function handleLogout() {
    if (hasUnsavedChanges) {
        if (!confirm('Você tem alterações não salvas. Deseja realmente sair?')) {
            return;
        }
    }
    
    window.api.removeToken();
    localStorage.removeItem('cachedUserData');
    window.location.href = 'login.html';
}

// ===== UTILIDADES =====
function showLoading(show) {
    const form = document.getElementById('profileForm');
    const saveBtn = document.getElementById('saveBtn');
    
    if (show) {
        form.classList.add('loading');
        // Mostrar texto simples sem animação giratória
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-hourglass"></i> Carregando...';
            saveBtn.disabled = true;
        }
    } else {
        form.classList.remove('loading');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar alterações';
            saveBtn.disabled = false;
        }
    }
}

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    // Scroll para a mensagem
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Esconder após alguns segundos (exceto erro)
    if (type !== 'error') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}
