// JavaScript para a página de cadastro

document.addEventListener('DOMContentLoaded', async function() {
    // Elementos do formulário
    const form = document.querySelector('.cadastro-form');
    const userTypeButtons = document.querySelectorAll('.user-type-btn');
    const userTypeInput = document.getElementById('userType');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const telefoneInput = document.getElementById('telefone');
    const distritoSelect = document.getElementById('distrito');
    let cidadeInput = document.getElementById('cidade');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    const termosCheckbox = document.querySelector('input[name="termos"]');
    
    // Dados de distritos e municípios
    let distritosData = null;
    
    // Carregar dados dos distritos e municípios
    try {
        const response = await fetch('assets/json/portugal_distritos_municipios.json');
        distritosData = await response.json();
        
        // Preencher select de distritos
        distritoSelect.innerHTML = '<option value="">Selecione o distrito</option>';
        distritosData.distritos.forEach(distrito => {
            const option = document.createElement('option');
            option.value = distrito.nome;
            option.textContent = distrito.nome;
            distritoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar distritos:', error);
    }
    
    // Atualizar cidades quando distrito for selecionado
    distritoSelect.addEventListener('change', function() {
        const distritoSelecionado = this.value;
        
        // Limpar campo de cidade
        cidadeInput.value = '';
        
        if (distritoSelecionado && distritosData) {
            // Encontrar distrito selecionado
            const distrito = distritosData.distritos.find(d => d.nome === distritoSelecionado);
            
            if (distrito) {
                // Converter input de cidade em select
                const cidadeSelect = document.createElement('select');
                cidadeSelect.id = 'cidade';
                cidadeSelect.name = 'cidade';
                cidadeSelect.required = true;
                cidadeSelect.className = cidadeInput.className;
                
                // Adicionar opção padrão
                cidadeSelect.innerHTML = '<option value="">Selecione a cidade</option>';
                
                // Adicionar municípios do distrito
                distrito.municipios.forEach(municipio => {
                    const option = document.createElement('option');
                    option.value = municipio;
                    option.textContent = municipio;
                    cidadeSelect.appendChild(option);
                });
                
                // Substituir input por select
                cidadeInput.parentNode.replaceChild(cidadeSelect, cidadeInput);
                cidadeInput = cidadeSelect;
            }
        } else {
            // Se nenhum distrito selecionado, voltar para input
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.id = 'cidade';
            newInput.name = 'cidade';
            newInput.required = true;
            newInput.placeholder = 'Sua cidade';
            newInput.className = cidadeInput.className;
            
            cidadeInput.parentNode.replaceChild(newInput, cidadeInput);
            cidadeInput = newInput;
        }
    });

    // Seleção do tipo de usuário
    userTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe active de todos os botões
            userTypeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Atualizar o valor do input hidden
            const userType = this.getAttribute('data-type');
            if (userType === 'cliente') {
                userTypeInput.value = 'client';
            } else if (userType === 'cuidador') {
                userTypeInput.value = 'caregiver';
            } else {
                userTypeInput.value = userType;
            }
        });
    });

    // Validação do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validar senhas
        if (senhaInput.value !== confirmarSenhaInput.value) {
            showError('As senhas não coincidem');
            return;
        }

        if (senhaInput.value.length < 6) {
            showError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (!termosCheckbox.checked) {
            showError('Você deve aceitar os termos de uso');
            return;
        }

        // Preparar dados para envio
        // Pegar o elemento cidade atual (pode ser input ou select)
        const cidadeElement = document.getElementById('cidade');
        const userData = {
            name: nomeInput.value.trim(),
            email: emailInput.value.trim().toLowerCase(),
            password: senhaInput.value,
            userType: userTypeInput.value,
            phone: telefoneInput.value.trim(),
            address: {
                state: distritoSelect.value,
                city: cidadeElement.value.trim()
            }
        };

        // Se for cuidador, adicionar campos extras (podem ser preenchidos depois)
        if (userTypeInput.value === 'caregiver') {
            userData.experience = '';
            userData.specialties = [];
            userData.certifications = [];
            // Não enviar hourlyRate se não for preenchido
            userData.bio = '';
        }

        // Desabilitar o formulário durante o envio
        setFormLoading(true);

        try {
            // Fazer a requisição para o backend
            const result = await api.register(userData);

            if (result.success) {
                showSuccess('Conta criada com sucesso! Redirecionando...');
                
                // Aguardar 2 segundos e redirecionar
                setTimeout(() => {
                    // Redirecionar para o dashboard
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                console.error('Erro detalhado:', result);
                if (result.errors) {
                    console.error('Erros de validação específicos:', result.errors);
                    const errorMessages = result.errors.map(err => `${err.field}: ${err.message}`).join('\n');
                    showError('Erros de validação:\n' + errorMessages);
                } else {
                    showError(result.message || 'Erro ao criar conta');
                }
                setFormLoading(false);
            }
        } catch (error) {
            console.error('Erro ao registrar:', error);
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            ${message}
        `;

        // Inserir antes do formulário
        form.parentNode.insertBefore(messageDiv, form);

        // Remover após 5 segundos
        setTimeout(() => {
            messageDiv.remove();
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            ${message}
        `;

        // Inserir antes do formulário
        form.parentNode.insertBefore(messageDiv, form);
    }

    // Função para habilitar/desabilitar formulário
    function setFormLoading(isLoading) {
        const submitButton = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input, select');

        if (isLoading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Criando conta...';
            inputs.forEach(input => input.disabled = true);
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Minha Conta';
            inputs.forEach(input => input.disabled = false);
        }
    }

    // Formatação do telefone
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        // Se não começar com 351, adicionar
        if (!value.startsWith('351')) {
            value = '351' + value;
        }

        // Limitar a 12 dígitos (351 + 9 dígitos)
        value = value.substring(0, 12);

        // Formatar
        if (value.length > 3) {
            value = '+' + value;
        }

        e.target.value = value;
    });
    
    // Adicionar listener para o blur do telefone para garantir formato correto
    telefoneInput.addEventListener('blur', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 12) {
            // Se tem mais de 12 dígitos, pegar apenas os últimos 9 após o 351
            value = '351' + value.slice(-9);
            e.target.value = '+' + value;
        }
    });
});
