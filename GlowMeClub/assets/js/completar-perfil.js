// ===== COMPLETAR PERFIL - Onboarding pós-cadastro Google =====
// Salva telefone, cor, área de foco, preferências de email e foto no backend (Firebase/Firestore)

if (!window.appConfig || !window.api) {
    console.error('Dependências não encontradas. Carregue config.js e api.js primeiro.');
}

let currentUser = null;
let selectedImageBase64 = null;

const _log = (type, ...args) => {
    if (window.logger && window.logger[type]) {
        window.logger[type](...args);
    } else {
        console[type === 'debug' ? 'log' : type](...args);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initOnboarding();
});

async function initOnboarding() {
    const token = window.api.getToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const data = await window.api.get('/auth/me');
        currentUser = data.user;

        if (currentUser.focusArea) {
            _log('info', 'Perfil já completo, redirecionando para dashboard');
            window.location.href = 'dashboard.html';
            return;
        }

        populateForm();
        setupEventListeners();
        updateHeaderName();
    } catch (error) {
        _log('error', 'Erro ao carregar usuário:', error);
        const cached = localStorage.getItem('cachedUserData');
        if (cached) {
            try {
                currentUser = JSON.parse(cached);
                populateForm();
                setupEventListeners();
                updateHeaderName();
                return;
            } catch (e) {}
        }
        if (error.status === 401) {
            window.api.removeToken();
            window.location.href = 'login.html';
        } else {
            showStatus('Erro ao carregar. Tente novamente.', 'error');
        }
    }
}

function updateHeaderName() {
    const el = document.getElementById('headerUserName');
    if (el && currentUser) {
        el.textContent = currentUser.name || currentUser.email?.split('@')[0] || 'Usuário';
    }
}

function populateForm() {
    if (!currentUser) return;

    const ddiInput = document.getElementById('phoneDdi');
    const phoneInput = document.getElementById('userPhone');
    if (currentUser.phone) {
        const match = currentUser.phone.match(/^(\+\d{1,4})\s*(.*)$/);
        if (match) {
            if (ddiInput) ddiInput.value = match[1];
            if (phoneInput) phoneInput.value = formatPhoneNumber(match[2]);
        } else {
            if (ddiInput) ddiInput.value = '+55';
            if (phoneInput) phoneInput.value = formatPhoneNumber(currentUser.phone);
        }
    } else {
        if (ddiInput) ddiInput.value = '+55';
    }

    const preferredColor = currentUser.preferredColor || '#8B5CF6';
    document.getElementById('preferredColor').value = preferredColor;
    const colorOption = document.querySelector(`#colorGrid .color-option[data-color="${preferredColor}"]`);
    selectColor(preferredColor, colorOption ? colorOption.dataset.name : 'Roxo');

    const focusArea = document.getElementById('focusArea');
    if (focusArea) focusArea.value = currentUser.focusArea || 'Mental';

    loadEmailPreferences();
    updateAvatarDisplay();
}

function formatPhoneNumber(value) {
    let phone = String(value || '').replace(/\D/g, '');
    phone = phone.substring(0, 11);
    if (phone.length > 0) {
        phone = phone.replace(/^(\d{2})/, '($1) ');
        phone = phone.replace(/(\(\d{2}\) )(\d{5})/, '$1$2-');
    }
    return phone;
}

function validateBrazilianPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (digits.charAt(2) !== '9') return false;
    return true;
}

function getPhoneForSave() {
    const phoneInput = document.getElementById('userPhone');
    const ddiInput = document.getElementById('phoneDdi');
    if (!phoneInput || !phoneInput.value.trim()) return null;
    const digits = phoneInput.value.replace(/\D/g, '');
    if (digits.length === 0) return null;
    let ddi = (ddiInput && ddiInput.value.trim()) || '+55';
    if (!ddi.startsWith('+')) ddi = '+' + ddi;
    return ddi + digits;
}

function getEmailPreferences() {
    return {
        weekly: document.getElementById('emailWeekly')?.checked ?? true,
        rewards: document.getElementById('emailRewards')?.checked ?? true,
        levelUp: document.getElementById('emailLevelUp')?.checked ?? true,
        reminders: document.getElementById('emailReminders')?.checked ?? false
    };
}

function loadEmailPreferences() {
    const prefs = currentUser?.emailPreferences || {
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

function updateAvatarDisplay() {
    const avatarContainer = document.getElementById('profileAvatar');
    const avatarInitial = document.getElementById('avatarInitial');
    const avatarImage = document.getElementById('avatarImage');
    const removeBtn = document.getElementById('removeAvatarBtn');

    const imageData = selectedImageBase64 || currentUser?.profileImage;
    if (imageData) {
        avatarImage.src = imageData;
        avatarImage.style.display = 'block';
        if (avatarInitial) avatarInitial.style.display = 'none';
        if (avatarContainer) avatarContainer.style.background = 'transparent';
        if (removeBtn) {
            removeBtn.classList.add('visible');
            removeBtn.style.display = 'inline-flex';
        }
    } else {
        avatarImage.src = '';
        avatarImage.style.display = 'none';
        if (avatarInitial) {
            avatarInitial.style.display = 'flex';
            avatarInitial.textContent = (currentUser?.name || 'U').charAt(0).toUpperCase();
        }
        if (avatarContainer) {
            avatarContainer.style.background = document.getElementById('preferredColor')?.value || '#8B5CF6';
        }
        if (removeBtn) {
            removeBtn.classList.remove('visible');
            removeBtn.style.display = 'none';
        }
    }
}

function selectColor(color, colorName) {
    document.querySelectorAll('#colorGrid .color-option').forEach(opt => opt.classList.remove('selected'));
    const opt = document.querySelector(`#colorGrid .color-option[data-color="${color}"]`);
    if (opt) opt.classList.add('selected');
    const preferredInput = document.getElementById('preferredColor');
    if (preferredInput) preferredInput.value = color;
    const preview = document.getElementById('selectedColorPreview');
    const nameEl = document.getElementById('selectedColorName');
    if (preview) preview.style.background = color;
    if (nameEl) nameEl.textContent = colorName || 'Cor';
    if (!selectedImageBase64 && !currentUser?.profileImage) {
        const avatar = document.getElementById('profileAvatar');
        if (avatar) avatar.style.background = color;
    }
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

function openCropModal(imageSrc) {
    document.getElementById('cropPreview').src = imageSrc;
    document.getElementById('cropModal').classList.add('active');
}

function closeCropModal() {
    document.getElementById('cropModal').classList.remove('active');
    const input = document.getElementById('avatarInput');
    if (input) input.value = '';
}

function getBase64SizeKB(base64String) {
    const base64 = (base64String || '').split(',')[1] || base64String;
    const bytes = (base64.length * 3) / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    return bytes / 1024;
}

function compressImage(imageSrc, options = {}) {
    const { maxWidth = 300, maxHeight = 300, quality = 0.7, maxSizeKB = 100 } = options;
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
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
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            let currentQuality = quality;
            let base64 = canvas.toDataURL('image/jpeg', currentQuality);
            while (getBase64SizeKB(base64) > maxSizeKB && currentQuality > 0.1) {
                currentQuality -= 0.1;
                base64 = canvas.toDataURL('image/jpeg', currentQuality);
            }
            if (getBase64SizeKB(base64) > maxSizeKB) {
                const scale = Math.sqrt(maxSizeKB / getBase64SizeKB(base64));
                canvas.width = Math.round(width * scale);
                canvas.height = Math.round(height * scale);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                base64 = canvas.toDataURL('image/jpeg', 0.6);
            }
            resolve(base64);
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = imageSrc;
    });
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        showStatus('Selecione uma imagem válida.', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showStatus('Imagem deve ter no máximo 5MB.', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => openCropModal(ev.target.result);
    reader.readAsDataURL(file);
}

async function confirmImageCrop() {
    const imgSrc = document.getElementById('cropPreview').src;
    try {
        showStatus('Processando imagem...', 'info');
        const compressed = await compressImage(imgSrc, { maxWidth: 300, maxHeight: 300, quality: 0.7, maxSizeKB: 100 });
        selectedImageBase64 = compressed;
        updateAvatarDisplay();
        closeCropModal();
        showStatus('Imagem carregada. Clique em Completar perfil para salvar.', 'success');
    } catch (err) {
        _log('error', err);
        showStatus('Erro ao processar imagem.', 'error');
    }
}

function handleRemoveAvatar() {
    selectedImageBase64 = null;
    if (currentUser) currentUser.profileImage = null;
    updateAvatarDisplay();
    showStatus('Foto removida.', 'info');
}

function showStatus(message, type) {
    const el = document.getElementById('statusMessage');
    if (!el) return;
    el.textContent = message;
    el.className = 'status-message ' + (type || 'info');
    el.style.display = message ? 'block' : 'none';
}

function setupEventListeners() {
    const form = document.getElementById('onboardingForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) avatarInput.addEventListener('change', handleImageSelect);

    const removeBtn = document.getElementById('removeAvatarBtn');
    if (removeBtn) removeBtn.addEventListener('click', handleRemoveAvatar);

    const colorBtn = document.getElementById('colorSelectorBtn');
    if (colorBtn) colorBtn.addEventListener('click', openColorPickerModal);

    document.querySelectorAll('#colorGrid .color-option').forEach(option => {
        option.addEventListener('click', () => {
            selectColor(option.dataset.color, option.dataset.name);
            closeColorPickerModal();
        });
    });

    const closeColorModal = document.getElementById('closeColorModal');
    const cancelColorPicker = document.getElementById('cancelColorPicker');
    if (closeColorModal) closeColorModal.addEventListener('click', closeColorPickerModal);
    if (cancelColorPicker) cancelColorPicker.addEventListener('click', closeColorPickerModal);
    const colorModal = document.getElementById('colorPickerModal');
    if (colorModal) {
        colorModal.addEventListener('click', (e) => {
            if (e.target.id === 'colorPickerModal') closeColorPickerModal();
        });
    }

    const phoneInput = document.getElementById('userPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }
    const ddiInput = document.getElementById('phoneDdi');
    if (ddiInput) {
        ddiInput.addEventListener('input', function (e) {
            let v = e.target.value.replace(/[^\d+]/g, '');
            if (!v.startsWith('+')) v = '+' + v.replace(/\+/g, '');
            e.target.value = v.substring(0, 5);
        });
    }

    const closeCropBtn = document.getElementById('closeCropModal');
    const cancelCrop = document.getElementById('cancelCrop');
    const confirmCrop = document.getElementById('confirmCrop');
    if (closeCropBtn) closeCropBtn.addEventListener('click', closeCropModal);
    if (cancelCrop) cancelCrop.addEventListener('click', closeCropModal);
    if (confirmCrop) confirmCrop.addEventListener('click', confirmImageCrop);
    const cropModal = document.getElementById('cropModal');
    if (cropModal) {
        cropModal.addEventListener('click', (e) => {
            if (e.target.id === 'cropModal') closeCropModal();
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.api.removeToken();
            localStorage.removeItem('cachedUserData');
            window.location.href = 'login.html';
        });
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const phoneVal = document.getElementById('userPhone')?.value?.trim();
    if (phoneVal && !validateBrazilianPhone(phoneVal)) {
        showStatus('Telefone inválido. Use o formato: (DDD) 9XXXX-XXXX', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    const formData = {
        name: currentUser?.name || document.getElementById('headerUserName')?.textContent || 'Usuário',
        preferredColor: document.getElementById('preferredColor').value,
        focusArea: document.getElementById('focusArea').value,
        emailPreferences: getEmailPreferences()
    };

    const phone = getPhoneForSave();
    formData.phone = phone || null;

    if (selectedImageBase64) {
        formData.profileImage = selectedImageBase64;
    }

    try {
        const response = await window.api.put('/user/profile', formData);
        if (response.success && response.user) {
            localStorage.setItem('cachedUserData', JSON.stringify(response.user));
            showStatus('Perfil salvo! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        } else {
            throw new Error(response.message || 'Erro ao salvar');
        }
    } catch (error) {
        _log('error', 'Erro ao salvar perfil:', error);
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-loading');
        submitBtn.innerHTML = originalHtml;
        showStatus(error.message || 'Erro ao salvar. Tente novamente.', 'error');
    }
}
