// Gerenciamento de autenticação

// Verificar se o usuário está autenticado ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const authResult = await api.verifyAuth();
    
    if (authResult.authenticated) {
        // Usuário autenticado - redirecionar para dashboard ou mostrar conteúdo
        updateUIForAuthenticatedUser(authResult.user);
    } else {
        // Usuário não autenticado
        updateUIForGuestUser();
    }
});

// Atualizar UI para usuário autenticado
function updateUIForAuthenticatedUser(user) {
    // Atualizar links do menu
    const loginLink = document.querySelector('a[href="login.html"]');
    const cadastroLink = document.querySelector('a[href="cadastro.html"]');
    
    if (loginLink) {
        loginLink.textContent = user.name;
        loginLink.href = '#';
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Mostrar menu dropdown ou redirecionar para perfil
            window.location.href = 'perfil.html';
        });
    }
    
    if (cadastroLink) {
        cadastroLink.textContent = 'Sair';
        cadastroLink.href = '#';
        cadastroLink.classList.remove('btn-nav-primary');
        cadastroLink.classList.add('btn-nav-secondary');
        cadastroLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Atualizar UI para usuário não autenticado
function updateUIForGuestUser() {
    // UI padrão já está configurada no HTML
}

// Função de logout
function logout() {
    api.logout();
    window.location.href = 'index.html';
}

// Funções auxiliares para formulários
function showError(formId, message) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Remover erro anterior
    const existingError = form.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Criar novo elemento de erro
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-top: 10px;';
    errorDiv.textContent = message;
    
    form.appendChild(errorDiv);
}

function showSuccess(formId, message) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Remover mensagem anterior
    const existingMessage = form.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Criar novo elemento de sucesso
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = 'background-color: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin-top: 10px;';
    successDiv.textContent = message;
    
    form.appendChild(successDiv);
}

// Desabilitar/habilitar formulário
function setFormLoading(formId, isLoading) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const submitButton = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    if (isLoading) {
        submitButton.disabled = true;
        submitButton.textContent = 'Processando...';
        inputs.forEach(input => input.disabled = true);
    } else {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.getAttribute('data-original-text') || 'Enviar';
        inputs.forEach(input => input.disabled = false);
    }
}
