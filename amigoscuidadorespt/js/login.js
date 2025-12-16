// JavaScript para a página de login

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário
    const form = document.querySelector('.cadastro-form');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const lembrarCheckbox = document.querySelector('input[name="lembrar"]');

    // Verificar se há email salvo
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        lembrarCheckbox.checked = true;
    }

    // Validação e envio do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validar campos
        if (!emailInput.value.trim()) {
            showError('Por favor, insira seu email');
            return;
        }

        if (!senhaInput.value) {
            showError('Por favor, insira sua senha');
            return;
        }

        // Desabilitar o formulário durante o envio
        setFormLoading(true);

        try {
            // Debug
            console.log('Tentando login com:', emailInput.value.trim().toLowerCase(), senhaInput.value);
            
            // Fazer a requisição para o backend
            const result = await api.login(
                emailInput.value.trim().toLowerCase(),
                senhaInput.value
            );

            if (result.success) {
                // Salvar ou remover email baseado no checkbox
                if (lembrarCheckbox.checked) {
                    localStorage.setItem('rememberedEmail', emailInput.value.trim().toLowerCase());
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                showSuccess('Login realizado com sucesso! Redirecionando...');
                
                // Aguardar 1 segundo e redirecionar
                setTimeout(() => {
                    // Redirecionar para o dashboard
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showError(result.message || 'Email ou senha incorretos');
                setFormLoading(false);
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            showError('Erro de conexão. Tente novamente.');
            setFormLoading(false);
        }
    });

    // Função para mostrar erro
    function showError(message) {
        // Remover mensagem anterior
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Criar nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message error-message';
        messageDiv.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            ${message}
        `;

        // Adicionar estilos inline para a mensagem
        messageDiv.style.cssText = `
            background-color: #fee;
            color: #c33;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease-out;
        `;

        // Inserir antes do formulário
        form.parentNode.insertBefore(messageDiv, form);

        // Remover após 5 segundos
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(-10px)';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }

    // Função para mostrar sucesso
    function showSuccess(message) {
        // Remover mensagem anterior
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Criar nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message success-message';
        messageDiv.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            ${message}
        `;

        // Adicionar estilos inline para a mensagem
        messageDiv.style.cssText = `
            background-color: #efe;
            color: #3a3;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease-out;
        `;

        // Inserir antes do formulário
        form.parentNode.insertBefore(messageDiv, form);
    }

    // Função para habilitar/desabilitar formulário
    function setFormLoading(isLoading) {
        const submitButton = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input');

        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <span style="display: inline-flex; align-items: center; gap: 8px;">
                    <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Entrando...
                </span>
            `;
            inputs.forEach(input => input.disabled = true);
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
            inputs.forEach(input => input.disabled = false);
        }
    }

    // Adicionar animação de rotação para o loading
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .spin {
            animation: spin 1s linear infinite;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Adicionar listener para tecla Enter
    [emailInput, senhaInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                form.dispatchEvent(new Event('submit'));
            }
        });
    });

    // Focar no primeiro campo vazio
    if (!emailInput.value) {
        emailInput.focus();
    } else {
        senhaInput.focus();
    }
});
