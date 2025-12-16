// JavaScript principal para o site Amigos Cuidadores

document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar navegação móvel
    initMobileMenu();
    
    // Verificar autenticação e atualizar UI
    await updateAuthUI();
    
    // Inicializar smooth scroll para links âncora
    initSmoothScroll();
    
    // Inicializar animações de scroll
    initScrollAnimations();
});

// Função para inicializar menu móvel
function initMobileMenu() {
    const mobileToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (mobileToggle && navbarMenu) {
        mobileToggle.addEventListener('click', function() {
            navbarMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });

        // Fechar menu ao clicar em um link
        const navLinks = navbarMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navbarMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });
    }
}

// Função para atualizar UI baseado na autenticação
async function updateAuthUI() {
    try {
        const authResult = await api.verifyAuth();
        
        if (authResult.authenticated && authResult.user) {
            updateUIForAuthenticatedUser(authResult.user);
        }
    } catch (error) {
        console.log('Usuário não autenticado');
    }
}

// Atualizar UI para usuário autenticado
function updateUIForAuthenticatedUser(user) {
    // Encontrar links de login/cadastro
    const loginLink = document.querySelector('a[href="login.html"]');
    const cadastroLink = document.querySelector('a[href="cadastro.html"]');
    
    if (loginLink) {
        // Criar dropdown de usuário
        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown';
        userDropdown.innerHTML = `
            <button class="user-dropdown-toggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>${user.name.split(' ')[0]}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="user-dropdown-menu">
                <a href="${user.userType === 'client' ? 'buscar-cuidador.html' : 'perfil-cuidador.html'}" class="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Meu Perfil
                </a>
                ${user.userType === 'client' ? `
                    <a href="meus-cuidadores.html" class="dropdown-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Meus Cuidadores
                    </a>
                ` : `
                    <a href="meus-clientes.html" class="dropdown-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        Meus Clientes
                    </a>
                `}
                <a href="configuracoes.html" class="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m11-6h-6m-6 0H1"></path>
                    </svg>
                    Configurações
                </a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item" onclick="logout(); return false;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sair
                </a>
            </div>
        `;
        
        // Substituir link de login pelo dropdown
        loginLink.parentNode.replaceChild(userDropdown, loginLink);
        
        // Adicionar funcionalidade ao dropdown
        const dropdownToggle = userDropdown.querySelector('.user-dropdown-toggle');
        const dropdownMenu = userDropdown.querySelector('.user-dropdown-menu');
        
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownMenu.classList.toggle('active');
        });
        
        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!userDropdown.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }
    
    if (cadastroLink) {
        // Mudar botão de cadastro para dashboard
        cadastroLink.textContent = user.userType === 'client' ? 'Buscar Cuidador' : 'Meu Painel';
        cadastroLink.href = user.userType === 'client' ? 'buscar-cuidador.html' : 'perfil-cuidador.html';
    }
    
    // Atualizar CTAs na página principal
    updateHomeCTAs(user);
}

// Atualizar CTAs da página principal para usuário autenticado
function updateHomeCTAs(user) {
    // Atualizar botões do hero
    const heroBtns = document.querySelectorAll('.hero-buttons .btn');
    if (heroBtns.length >= 2) {
        if (user.userType === 'client') {
            heroBtns[0].textContent = 'Buscar Cuidadores';
            heroBtns[0].href = 'buscar-cuidador.html';
            heroBtns[1].style.display = 'none';
        } else {
            heroBtns[0].textContent = 'Meu Painel';
            heroBtns[0].href = 'perfil-cuidador.html';
            heroBtns[1].textContent = 'Ver Oportunidades';
            heroBtns[1].href = 'oportunidades.html';
        }
    }
    
    // Atualizar CTAs finais
    const ctaBtns = document.querySelectorAll('.cta-buttons .btn');
    if (ctaBtns.length > 0) {
        if (user.userType === 'client') {
            ctaBtns[0].textContent = 'Buscar Cuidadores Agora';
            ctaBtns[0].href = 'buscar-cuidador.html';
        } else {
            ctaBtns[0].textContent = 'Ver Meu Painel';
            ctaBtns[0].href = 'perfil-cuidador.html';
        }
    }
}

// Função de logout
function logout() {
    api.logout();
    window.location.href = 'index.html';
}

// Inicializar smooth scroll
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // Altura do header fixo
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Inicializar animações de scroll
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.feature-item, .step-card, .service-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        observer.observe(el);
    });
}

// Adicionar estilos necessários
const style = document.createElement('style');
style.textContent = `
    /* User Dropdown Styles */
    .user-dropdown {
        position: relative;
        display: inline-block;
    }
    
    .user-dropdown-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        background: none;
        border: 1px solid #e5e7eb;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        color: #374151;
        transition: all 0.2s;
    }
    
    .user-dropdown-toggle:hover {
        background-color: #f9fafb;
        border-color: #d1d5db;
    }
    
    .user-dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        min-width: 200px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s;
        z-index: 1000;
    }
    
    .user-dropdown-menu.active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    
    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        color: #374151;
        text-decoration: none;
        transition: all 0.2s;
    }
    
    .dropdown-item:hover {
        background-color: #f3f4f6;
        color: #2563eb;
    }
    
    .dropdown-divider {
        height: 1px;
        background-color: #e5e7eb;
        margin: 8px 0;
    }
    
    /* Fade in animation */
    .fade-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Mobile menu styles */
    @media (max-width: 768px) {
        .navbar-menu {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e5e7eb;
            padding: 20px;
            transform: translateY(-100%);
            transition: transform 0.3s;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .navbar-menu.active {
            transform: translateY(0);
        }
        
        .navbar-menu li {
            display: block;
            margin: 10px 0;
        }
        
        .navbar-toggle {
            display: flex;
            flex-direction: column;
            gap: 4px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
        }
        
        .navbar-toggle-icon {
            width: 24px;
            height: 2px;
            background-color: #374151;
            transition: all 0.3s;
        }
        
        .navbar-toggle.active .navbar-toggle-icon:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .navbar-toggle.active .navbar-toggle-icon:nth-child(2) {
            opacity: 0;
        }
        
        .navbar-toggle.active .navbar-toggle-icon:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
    }
`;
document.head.appendChild(style);
