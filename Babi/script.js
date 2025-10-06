// Animação de entrada para elementos quando aparecem na tela
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar todos os cards e links
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar animação suave aos elementos
    const animatedElements = document.querySelectorAll('.about-card, .social-link, .shopping-link');
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });

    // Adicionar efeito de hover nos links sociais e de compras
    const links = document.querySelectorAll('.social-link, .shopping-link');
    
    links.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Efeito de clique suave
    links.forEach(link => {
        link.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-3px) scale(0.98)';
        });
        
        link.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
    });

    // Adicionar animação ao avatar
    const avatar = document.querySelector('.avatar-circle');
    if (avatar) {
        avatar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(5deg)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        avatar.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    // Smooth scroll (caso adicione links internos no futuro)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Adicionar efeito de brilho ao passar o mouse nos ícones
    const socialIcons = document.querySelectorAll('.social-icon, .shopping-icon');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(10deg)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // Efeito parallax suave no header
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('.header');
        if (header) {
            header.style.transform = `translateY(${scrolled * 0.5}px)`;
            header.style.opacity = 1 - (scrolled / 500);
        }
    });

    // Adicionar efeito de pulso aos emojis
    const emojis = document.querySelectorAll('.topic-icon, .goal-icon');
    emojis.forEach((emoji, index) => {
        setInterval(() => {
            emoji.style.transform = 'scale(1.2)';
            setTimeout(() => {
                emoji.style.transform = 'scale(1)';
            }, 200);
        }, 3000 + (index * 500));
        emoji.style.transition = 'transform 0.2s ease';
    });

    // Console message
    console.log('💜 Site da Babi carregado com sucesso! Minha Vida Teu Vlog 💜');
});

// Detectar dark mode do sistema (caso queira adicionar suporte no futuro)
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Usuário prefere dark mode
    console.log('Dark mode detectado');
}

// Adicionar eventos de teclado para acessibilidade
document.addEventListener('keydown', (e) => {
    const focusedElement = document.activeElement;
    
    if (e.key === 'Enter' && focusedElement.classList.contains('social-link', 'shopping-link')) {
        focusedElement.click();
    }
});

