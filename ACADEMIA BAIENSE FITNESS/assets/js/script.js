// Aguardar o carregamento do DOM
document.addEventListener('DOMContentLoaded', function() {
    
    // Menu Mobile
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    // Toggle do menu mobile
    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Fechar menu ao clicar em um link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Fechar menu ao clicar fora dele
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.nav-wrapper')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
    
    // Header scroll effect
    const header = document.getElementById('header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            header.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Animação de entrada dos elementos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Elementos para animar
    const animateElements = document.querySelectorAll('.modalidade-card, .plano-card, .sobre-features .feature, .galeria-item');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Galeria - Lightbox simples
    const galeriaItems = document.querySelectorAll('.galeria-item img');
    
    galeriaItems.forEach(item => {
        item.addEventListener('click', function() {
            const src = this.src;
            const alt = this.alt;
            
            // Criar lightbox
            const lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.innerHTML = `
                <div class="lightbox-content">
                    <span class="lightbox-close">&times;</span>
                    <img src="${src}" alt="${alt}">
                </div>
            `;
            
            document.body.appendChild(lightbox);
            
            // Adicionar estilos do lightbox
            const style = document.createElement('style');
            style.innerHTML = `
                .lightbox {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }
                
                .lightbox-content {
                    position: relative;
                    max-width: 90%;
                    max-height: 90%;
                }
                
                .lightbox-content img {
                    width: 100%;
                    height: auto;
                    border-radius: 5px;
                }
                
                .lightbox-close {
                    position: absolute;
                    top: -40px;
                    right: 0;
                    color: white;
                    font-size: 40px;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                }
                
                .lightbox-close:hover {
                    transform: scale(1.2);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            // Fechar lightbox
            lightbox.addEventListener('click', function() {
                this.remove();
                style.remove();
            });
        });
    });
    
    // Contador animado para números
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        
        const updateCounter = () => {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };
        
        updateCounter();
    }
    
    // Lazy loading para imagens
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback para navegadores que não suportam Intersection Observer
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.classList.add('loaded');
        });
    }
    
    // Adicionar efeito parallax suave no hero
    const heroSection = document.querySelector('.hero-bg');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.5;
        
        if (heroSection) {
            heroSection.style.transform = `translateY(${parallax}px)`;
        }
    });
    
    // Formulário de contato (se houver)
    const contactForm = document.querySelector('#contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Aqui você pode adicionar a lógica para enviar o formulário
            // Por exemplo, usando fetch() para enviar para um endpoint
            
            alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
            contactForm.reset();
        });
    }
    
    // Adicionar ano atual no footer automaticamente
    const yearElement = document.querySelector('.footer-bottom p');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.innerHTML = yearElement.innerHTML.replace('2025', currentYear);
    }
    
    // Botão WhatsApp - adicionar efeito de pulso
    const whatsappButton = document.querySelector('.whatsapp-float');
    
    setInterval(() => {
        whatsappButton.style.animation = 'pulse 1s ease-in-out';
        setTimeout(() => {
            whatsappButton.style.animation = '';
        }, 1000);
    }, 5000);
    
    // Adicionar animação de pulso no CSS
    const pulseStyle = document.createElement('style');
    pulseStyle.innerHTML = `
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7);
            }
            70% {
                box-shadow: 0 0 0 20px rgba(37, 211, 102, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
            }
        }
    `;
    document.head.appendChild(pulseStyle);
    
    // Verificar horário de funcionamento e mostrar status
    function checkOpenStatus() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hour + minutes / 60;
        
        let isOpen = false;
        let statusText = '';
        
        if (day >= 1 && day <= 5) { // Segunda a Sexta
            if ((currentTime >= 6.5 && currentTime < 12) || (currentTime >= 15 && currentTime < 22)) {
                isOpen = true;
                statusText = 'Aberto agora';
            } else if (currentTime >= 12 && currentTime < 15) {
                statusText = 'Intervalo - Reabrimos às 15:00';
            } else {
                statusText = 'Fechado - Abrimos às 06:30';
            }
        } else if (day === 6) { // Sábado
            if (currentTime >= 8 && currentTime < 12) {
                isOpen = true;
                statusText = 'Aberto agora';
            } else {
                statusText = 'Fechado - Abrimos segunda às 06:30';
            }
        } else { // Domingo
            statusText = 'Fechado - Abrimos segunda às 06:30';
        }
        
        // Adicionar indicador de status se existir elemento
        const statusElement = document.querySelector('.status-indicator');
        if (statusElement) {
            statusElement.textContent = statusText;
            statusElement.className = `status-indicator ${isOpen ? 'open' : 'closed'}`;
        }
    }
    
    // Verificar status ao carregar a página
    checkOpenStatus();
    
    // Atualizar status a cada minuto
    setInterval(checkOpenStatus, 60000);
    
    console.log('Academia Baiense Fitness - Site carregado com sucesso!');
});