// Função para toggle do menu mobile
function toggleMenu() {
    const nav = document.getElementById('mainNav');
    const menuToggle = document.querySelector('.menu-toggle');
    
    nav.classList.toggle('active');
    
    // Atualizar aria-label
    if (nav.classList.contains('active')) {
        menuToggle.setAttribute('aria-label', 'Fechar menu');
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        menuToggle.setAttribute('aria-label', 'Abrir menu');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
}

// Fechar menu ao clicar em um link
function closeMenu() {
    const nav = document.getElementById('mainNav');
    const menuToggle = document.querySelector('.menu-toggle');
    
    nav.classList.remove('active');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
}

// Função para alternar a exibição do conteúdo do Book 1 ou Book 2
function changeBook(bookNumber) {
    closeMenu(); // Fechar menu mobile ao trocar de book
    const book1Section = document.getElementById('content-book1');
    const book2Section = document.getElementById('content-book2');

    if (bookNumber === 1) {
        book1Section.style.display = 'block';
        book2Section.style.display = 'none';
        // Ativa a primeira aba do Book 1
        openTab('book1-present', document.querySelector('.tabs button:not(.book2)'));
    } else if (bookNumber === 2) {
        book1Section.style.display = 'none';
        book2Section.style.display = 'block';
        // Ativa a primeira aba do Book 2
        openTab('book2-present', document.querySelector('.tabs button.book2'));
    }
}

// Função para alternar entre as abas de conteúdo
function openTab(tabName, element) {
    // 1. Oculta todas as abas de conteúdo
    var allContentTabs = document.querySelectorAll('.content-tab');
    allContentTabs.forEach(tab => tab.classList.remove('active'));

    // 2. Desativa todos os botões de aba
    var allTabBtns = document.querySelectorAll('.tab-btn');
    allTabBtns.forEach(btn => btn.classList.remove('active'));

    // 3. Mostra o conteúdo da aba selecionada
    var selectedContent = document.getElementById(tabName);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // 4. Ativa o botão que foi clicado (passado como 'this' no HTML)
    if (element) {
        element.classList.add('active');
    }
}

function sendToWhatsapp(e) {
    e.preventDefault();
    var name = document.getElementById("name").value;
    
    // Coletar todas as respostas
    var answers = [];
    for(let i = 1; i <= 10; i++) {
        var answer = document.getElementById(`q${i}`).value;
        answers.push(`Pergunta ${i}: ${answer}`);
    }
    
    // Montar mensagem para WhatsApp com as respostas
    var text = "*Novo Aluno - Flow English*%0A" + 
               "Nome: " + name + "%0A%0A" + 
               "*Respostas do Teste:*%0A" + 
               answers.join("%0A") + "%0A%0A" +
               "Por favor, corrija o teste e informe o nível adequado.";
    
    window.open("https://wa.me/5521986673864?text=" + text, "_blank");
    
    // Mostrar mensagem de sucesso
    showSuccessMessage();
}

// Função para mostrar mensagem de sucesso
function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = '<i class="fas fa-check-circle"></i> Teste enviado com sucesso! Redirecionando para o WhatsApp...';
    document.body.appendChild(message);
    
    // Remover mensagem após 5 segundos
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Função para salvar progresso no localStorage
function saveProgress() {
    const formData = {
        name: document.getElementById('name').value,
        answers: {}
    };
    
    for (let i = 1; i <= 10; i++) {
        const select = document.getElementById(`q${i}`);
        if (select && select.value) {
            formData.answers[`q${i}`] = select.value;
        }
    }
    
    localStorage.setItem('flowEnglishTest', JSON.stringify(formData));
}

// Função para carregar progresso salvo
function loadProgress() {
    const saved = localStorage.getItem('flowEnglishTest');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            // Restaurar nome
            if (data.name) {
                document.getElementById('name').value = data.name;
            }
            
            // Restaurar respostas
            Object.keys(data.answers).forEach(key => {
                const select = document.getElementById(key);
                if (select) {
                    select.value = data.answers[key];
                }
            });
            
            updateProgress();
        } catch (e) {
            console.error('Erro ao carregar progresso:', e);
        }
    }
}

// Função para atualizar barra de progresso
function updateProgress() {
    const total = 10;
    let answered = 0;
    
    for (let i = 1; i <= total; i++) {
        const select = document.getElementById(`q${i}`);
        if (select && select.value) {
            answered++;
        }
    }
    
    const percentage = (answered / total) * 100;
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `${answered} de ${total} perguntas respondidas`;
    }
}

// Configuração inicial ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // Inicialmente, mostra Book 1 e oculta Book 2
    document.getElementById('content-book1').style.display = 'block';
    document.getElementById('content-book2').style.display = 'none';
    
    // Ativa a primeira aba do Book 1 no carregamento
    const initialTabButton = document.querySelector('.tabs button[onclick*="book1-present"]');
    if(initialTabButton) {
         openTab('book1-present', initialTabButton);
    }
    
    // Carregar progresso salvo
    loadProgress();
    
    // Adicionar listeners para salvar progresso
    document.getElementById('name').addEventListener('input', saveProgress);
    
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', function() {
            saveProgress();
            updateProgress();
            this.classList.add('answered');
        });
    });
    
    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    closeMenu(); // Fechar menu mobile
                }
            }
        });
    });
    
    // Fechar menu ao clicar fora dele
    document.addEventListener('click', function(e) {
        const nav = document.getElementById('mainNav');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (nav.classList.contains('active') && 
            !nav.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            closeMenu();
        }
    });
});