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

// ===== FUNÇÕES DE AUTENTICAÇÃO =====

// Cadastro
async function handleSignup(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    
    // Obter dados do formulário
    const formData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
        confirmPassword: form.confirmPassword.value,
        preferredColor: form.preferredColor.value,
        focusArea: form.focusArea.value
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
            focusArea: formData.focusArea
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
        
        // Se estiver offline e for teste@glowmeclub.com, fazer login simulado
        if (window.api.isNetworkError(error) && email === 'teste@glowmeclub.com' && password === 'senha123') {
            _log('warn', '🔌 Modo offline - Login simulado');
            
            // Criar token simulado
            const mockToken = 'offline_token_' + Date.now();
            window.api.saveToken(mockToken);
            
            // Criar usuário simulado
            const mockUser = {
                uid: '6ca1f9a3a8feaedbbc4a5b8bdd180525',
                name: 'Usuária Teste',
                email: 'teste@glowmeclub.com',
                preferredColor: '#DDD6FE',
                focusArea: 'Mental',
                totalPoints: 250,
                currentLevel: 1
            };
            
            localStorage.setItem('cachedUserData', JSON.stringify(mockUser));
            
            // Redirecionar para dashboard
            window.location.href = 'dashboard.html';
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
    if (window.appConfig.authMode === 'firebase') {
        // TODO: Implementar login com Google/Firebase
        showError('Login com Google será implementado em breve');
    } else {
        showError('Login com Google não disponível no modo local. Use email e senha.');
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
    
    // Pegar o nome do arquivo atual
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';
    
    // Verificar se é uma página pública
    const isPublicPage = publicPageNames.includes(currentFile) || currentPath === '/' || currentPath === '';
    
    _log('debug', '📍 Informações da página:', {
        currentPath,
        currentFile,
        isPublicPage
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
            
            if (isPublicPage) {
                _log('info', '➡️ Usuário autenticado em página pública, redirecionando...');
                // Admin vai para admin.html, outros para dashboard.html
                if (data.user && data.user.role === 'admin') {
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