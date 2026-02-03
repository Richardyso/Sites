// ===== AUTENTICAÇÃO UNIFICADA =====

// Usar logger do config.js ou console como fallback
const _log = (type, ...args) => {
    if (window.logger && window.logger[type]) {
        window.logger[type](...args);
    } else {
        console[type === 'debug' ? 'log' : type](...args);
    }
};

// Verificar se as dependências estão carregadas
if (!window.appConfig || !window.api) {
    console.error('❌ Dependências não encontradas. Certifique-se de carregar config.js e api.js primeiro.');
}

// ===== TELEFONE: DDI (+ obrigatório, 1 a 3 dígitos: +1 a +351) + número (campo à parte, não altera o DDI) =====
function normalizeDDI(raw) {
    const s = (raw || '').trim();
    const withPlus = s.startsWith('+') ? s : '+' + s.replace(/\D/g, '');
    const digits = withPlus.slice(1).replace(/\D/g, '').slice(0, 3);
    return digits.length >= 1 ? '+' + digits : '+55';
}

function formatPhoneInput(value, ddi) {
    const digits = String(value || '').replace(/\D/g, '');
    const ddiNorm = (ddi || '+55').toString().trim().replace(/\D/g, '');
    const isBrazil = ddiNorm === '55';
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
    return digits.substring(0, 9);
}

function validatePhoneWithDDI(ddi, digitsOnly) {
    const d = String(digitsOnly || '').replace(/\D/g, '');
    const ddiNorm = (ddi || '+55').toString().trim().replace(/\D/g, '');
    const isBrazil = ddiNorm === '55';
    const maxLen = isBrazil ? 12 : 9;
    if (d.length > maxLen) return { valid: false, message: `Máximo ${maxLen} dígitos no número.` };
    return { valid: true };
}

// ===== FUNÇÕES DE AUTENTICAÇÃO =====

// Cadastro
async function handleSignup(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    
    // Obter dados do formulário
    const phoneValue = form.phone ? form.phone.value.trim() : '';
    const ddiValue = form.phoneDdi ? form.phoneDdi.value.trim() : '+55';
    
    const formData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
        confirmPassword: form.confirmPassword.value,
        preferredColor: form.preferredColor.value,
        focusArea: form.focusArea.value,
        phone: phoneValue,
        phoneDdi: ddiValue
    };
    
    // Validações
    if (formData.password !== formData.confirmPassword) {
        showError('As senhas não coincidem');
        return;
    }
    
    if (formData.password.length < 8) {
        showError('A senha deve ter pelo menos 8 caracteres');
        return;
    }
    
    // Validar telefone (obrigatório no cadastro)
    if (!formData.phone) {
        showError('O telefone é obrigatório');
        return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    const ddiForValidation = normalizeDDI(formData.phoneDdi);
    const validation = validatePhoneWithDDI(ddiForValidation, phoneDigits);
    if (!validation.valid) {
        showError(validation.message || 'Telefone inválido.');
        return;
    }
    
    // Montar telefone: DDI normalizado (1–3 dígitos; se só "+" usa +55)
    let ddi = normalizeDDI(formData.phoneDdi);
    let digitsToSave = phoneDigits;
    if (ddi === '+55' && phoneDigits.length === 12 && phoneDigits.startsWith('0')) digitsToSave = phoneDigits.slice(1);
    const phoneWithDDI = ddi + digitsToSave;
    
    // Mostrar loading
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    try {
        // Fazer requisição para API
        const data = await window.api.post('/auth/register', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            preferredColor: formData.preferredColor,
            focusArea: formData.focusArea,
            phone: phoneWithDDI
        });
        
        // Mostrar mensagem de sucesso e redirecionar para login
        showSuccess('Cadastro realizado com sucesso! Verifique seu email de boas-vindas. 💜');
        
        // Aguardar 2 segundos e redirecionar para login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2500);
        
    } catch (error) {
        _log('error', 'Erro no cadastro:', error);
        showError(error.message || 'Erro ao criar conta');
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    _log('info', '🔐 === INICIANDO PROCESSO DE LOGIN ===');
    
    const form = e.target;
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    
    const email = form.email.value.trim();
    const password = form.password.value;
    
    _log('debug', '📧 Email:', email);
    
    // Mostrar loading
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    try {
        // Fazer requisição para API
        const data = await window.api.post('/auth/login', { email, password });
        
        // Salvar token
        window.api.saveToken(data.token);
        
        // Salvar dados do usuário em cache para uso offline
        if (data.user) {
            localStorage.setItem('cachedUserData', JSON.stringify(data.user));
        }
        
        _log('info', '✅ Login bem-sucedido!');
        
        // Redirecionar: admin vai para admin.html, outros para dashboard.html
        if (data.user && data.user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        
    } catch (error) {
        _log('error', '❌ Erro no login:', error.message);
        
        if (window.api.isNetworkError(error)) {
            showError('Sem conexão com o servidor. Verifique sua internet.');
        } else {
            showError('Email ou senha incorretos');
        }
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Login com Google
async function handleGoogleLogin() {
    _log('info', '🔐 === INICIANDO LOGIN COM GOOGLE ===');
    
    const googleBtn = document.getElementById('googleLoginBtn');
    const originalText = googleBtn ? googleBtn.innerHTML : '';
    
    // Verificar se Firebase Auth está disponível
    if (!window.FirebaseAuth || !window.FirebaseAuth.isInitialized()) {
        if (window.FirebaseAuth && window.FirebaseAuth.initialize) {
            window.FirebaseAuth.initialize();
        } else {
            showError('Sistema de login com Google não está disponível no momento.');
            _log('error', '❌ FirebaseAuth não está disponível');
            return;
        }
    }
    
    // Mostrar loading
    if (googleBtn) {
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
    }
    
    try {
        // Fazer login com Google via Firebase
        const googleResult = await window.FirebaseAuth.signInWithGoogle();
        
        if (!googleResult.success) {
            throw new Error('Falha no login com Google');
        }
        
        _log('info', '✅ Login com Google no Firebase bem-sucedido:', googleResult.user.email);
        
        // Enviar token para o backend para criar/atualizar usuário no banco
        const data = await window.api.post('/auth/google', {
            idToken: googleResult.idToken
        });
        
        if (data.success) {
            // Salvar token de sessão
            window.api.saveToken(data.token);
            
            // Salvar dados do usuário em cache
            if (data.user) {
                localStorage.setItem('cachedUserData', JSON.stringify(data.user));
            }
            
            _log('info', '✅ Login via Google concluído!', data.isNewUser ? '(Novo usuário)' : '');
            
            // Redirecionar
            if (data.user && data.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                // Se for novo usuário, redirecionar para onboarding (completar perfil)
                if (data.isNewUser) {
                    window.location.href = 'completar-perfil.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }
        } else {
            throw new Error(data.message || 'Erro ao autenticar no servidor');
        }
        
    } catch (error) {
        _log('error', '❌ Erro no login com Google:', error.message);
        
        // Fazer logout do Firebase em caso de erro
        if (window.FirebaseAuth && window.FirebaseAuth.signOut) {
            await window.FirebaseAuth.signOut();
        }
        
        showError(error.message || 'Erro ao fazer login com o Google');
        
    } finally {
        // Restaurar botão
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = originalText || '<i class="fab fa-google"></i> Google';
        }
    }
}

// Reset de senha
async function handlePasswordReset(e) {
    e.preventDefault();
    
    if (window.appConfig.authMode === 'firebase') {
        // TODO: Implementar reset com Firebase
        showSuccess('Instruções de reset serão enviadas para seu email.');
    } else {
        showSuccess('Funcionalidade não disponível no modo local.');
    }
    
    setTimeout(() => {
        closeResetModal();
    }, 2000);
}

// Logout
window.logout = async function() {
    console.log('🚪 Iniciando logout...');
    
    try {
        if (window.api && window.api.post) {
            await window.api.post('/auth/logout');
            console.log('✅ Logout no servidor realizado');
        }
    } catch (error) {
        console.error('Erro ao fazer logout no servidor:', error);
        // Continua mesmo com erro - limpa dados locais
    }
    
    // Fazer logout do Firebase também (se estiver autenticado via Google)
    try {
        if (window.FirebaseAuth && window.FirebaseAuth.signOut) {
            await window.FirebaseAuth.signOut();
            console.log('✅ Logout do Firebase realizado');
        }
    } catch (error) {
        console.error('Erro ao fazer logout do Firebase:', error);
    }
    
    // Limpar dados locais
    if (window.api && window.api.removeToken) {
        window.api.removeToken();
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('cachedUserData');
    
    console.log('🔄 Redirecionando para login...');
    
    // Redirecionar para login (com caminho absoluto)
    window.location.href = '/pages/login.html';
}

// Verificar autenticação
async function checkAuthState() {
    _log('info', '🔍 === VERIFICANDO AUTENTICAÇÃO ===');
    
    // Páginas que não precisam de autenticação
    const publicPageNames = ['index.html', 'cadastro.html', 'login.html', 'redefinir-senha.html'];
    
    // Páginas que o admin NÃO pode acessar
    const userOnlyPages = ['dashboard.html', 'metas.html', 'missoes.html', 'pontos.html', 'recompensas.html', 'perfil.html'];
    
    // Pegar o nome do arquivo atual
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';
    
    // Verificar se é uma página pública
    const isPublicPage = publicPageNames.includes(currentFile) || currentPath === '/' || currentPath === '';
    
    // Verificar se é página admin
    const isAdminPage = currentFile === 'admin.html';
    
    // Verificar se é página exclusiva de usuários normais
    const isUserOnlyPage = userOnlyPages.includes(currentFile);
    
    _log('debug', '📍 Informações da página:', {
        currentPath,
        currentFile,
        isPublicPage,
        isAdminPage,
        isUserOnlyPage
    });
    
    const token = window.api.getToken();
    
    if (token) {
        try {
            // Verificar se token é válido
            const data = await window.api.get('/auth/me');
            
            // Token válido
            _log('info', '✅ Token válido!');
            
            // Salvar dados do usuário em cache
            if (data.user) {
                localStorage.setItem('cachedUserData', JSON.stringify(data.user));
            }
            
            const isAdmin = data.user && data.user.role === 'admin';
            
            // Se é admin e está tentando acessar página de usuário normal
            if (isAdmin && isUserOnlyPage) {
                _log('info', '🔒 Admin tentando acessar página de usuário, redirecionando para admin.html');
                window.location.href = 'admin.html';
                return;
            }
            
            // Se é usuário normal tentando acessar página admin
            if (!isAdmin && isAdminPage) {
                _log('info', '🔒 Usuário comum tentando acessar admin, redirecionando para dashboard.html');
                window.location.href = 'dashboard.html';
                return;
            }
            
            if (isPublicPage) {
                _log('info', '➡️ Usuário autenticado em página pública, redirecionando...');
                // Admin vai para admin.html, outros para dashboard.html
                if (isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }
        } catch (error) {
            _log('error', '❌ Erro ao verificar autenticação:', error);
            
            // Se for erro 401 explícito, token é inválido
            if (error.status === 401 || (error.message && error.message.includes('401'))) {
                _log('warn', '🔒 Token inválido');
                window.api.removeToken();
                if (!isPublicPage) {
                    window.location.href = 'login.html';
                }
            } else {
                // Para outros erros (rede, timeout, etc), manter sessão
                _log('warn', '⚠️ Erro de conexão - Mantendo sessão');
                
                // Verificar cache para ver se é admin
                const cachedData = localStorage.getItem('cachedUserData');
                if (cachedData) {
                    try {
                        const user = JSON.parse(cachedData);
                        if (user.role === 'admin' && isUserOnlyPage) {
                            window.location.href = 'admin.html';
                            return;
                        }
                    } catch (e) {}
                }
                
                if (isPublicPage) {
                    window.location.href = 'dashboard.html';
                }
            }
        }
    } else {
        // Sem token
        _log('info', '🔓 Usuário não autenticado');
        if (!isPublicPage) {
            _log('info', '➡️ Redirecionando para login...');
            window.location.href = 'login.html';
        }
    }
}

// Mostrar mensagem de erro
function showError(message) {
    const errorElements = document.querySelectorAll('#errorMessage, #goalErrorMessage, #editErrorMessage');
    errorElements.forEach(elem => {
        if (elem) {
            elem.textContent = message;
            elem.style.display = 'block';
            
            setTimeout(() => {
                elem.style.display = 'none';
            }, 5000);
        }
    });
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 3000);
    }
}

// Fechar modal de reset
function closeResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se está em modo anônimo
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
    } catch (e) {
        // Mostrar aviso sobre modo anônimo
        const warningDiv = document.createElement('div');
        warningDiv.className = 'anonymous-warning';
        warningDiv.innerHTML = `
            <div style="background: #FEF3C7; border: 2px solid #F59E0B; padding: 1rem; margin: 1rem; border-radius: 8px; text-align: center;">
                <h3 style="color: #92400E; margin: 0 0 0.5rem 0;">⚠️ Modo Anônimo Detectado</h3>
                <p style="color: #78350F; margin: 0;">
                    O GlowMeClub não funciona em modo anônimo/privado.<br>
                    Por favor, abra o site em uma janela normal do navegador para fazer login.
                </p>
            </div>
        `;
        document.body.insertBefore(warningDiv, document.body.firstChild);
    }
    
    // Formatação automática do telefone no cadastro
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            const ddiEl = document.getElementById('phoneDdi');
            const ddi = ddiEl ? ddiEl.value.trim() : '+55';
            const cursorPos = e.target.selectionStart;
            const oldLength = e.target.value.length;
            e.target.value = formatPhoneInput(e.target.value, ddi);
            const newLength = e.target.value.length;
            
            // Ajusta posição do cursor
            const newCursorPos = cursorPos + (newLength - oldLength);
            e.target.setSelectionRange(newCursorPos, newCursorPos);
        });
    }
    
    // DDI: + obrigatório; de 1 a 3 dígitos (+1 EUA a +351 Portugal). Campo do número não altera o DDI.
    const ddiInput = document.getElementById('phoneDdi');
    if (ddiInput) {
        ddiInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/[^\d+]/g, '');
            if (!v.startsWith('+')) v = '+' + v.replace(/\+/g, '');
            const digits = v.slice(1).substring(0, 3);
            e.target.value = '+' + digits;
        });
    }
    
    // Formulário de cadastro
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Botão do Google
    const googleBtn = document.getElementById('googleLoginBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // Formulário de reset de senha
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', handlePasswordReset);
    }
    
    // Botão de logout (pode ter vários na página)
    document.querySelectorAll('#logoutBtn, .logout-btn, .btn-logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.logout();
        });
    });
    
    // Verificar estado de autenticação
    checkAuthState();
    
    // Log de inicialização
    _log('info', '🚀 Sistema de autenticação inicializado');
    _log('info', `📍 Ambiente: ${window.appConfig?.isDevelopment ? 'Desenvolvimento' : 'Produção'}`);
    _log('info', `🔐 Modo: ${window.appConfig?.authMode || 'local'}`);
});