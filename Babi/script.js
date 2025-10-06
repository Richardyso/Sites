// Translations
const translations = {
    'pt-pt': {
        'quickLinks.services': 'Meus<br>Serviços',
        'quickLinks.contact': 'Contato',
        'about.description': 'Oioi sou a Babi — criadora de conteúdo e designer gráfica. Falo sobre autocuidado, beleza e desenvolvimento pessoal, ajudando-te a viver o teu glow up com propósito, leveza e criatividade. 🌸',
        'about.signature': 'Me Segue',
        'social.title': 'Minhas Redes Sociais',
        'social.tiktokSelfcare': 'Tiktok de Autocuidado',
        'social.tiktokVlog': 'Tiktok de Vlog',
        'shopping.title': 'Compras e produtos que eu recomendo',
        'shopping.shein': 'Minha Lista SHEIN',
        'shopping.rituals': 'Pack Autocuidado Rituals',
        'contact.title': 'Contato Profissional'
    },
    'pt-br': {
        'quickLinks.services': 'Meus<br>Serviços',
        'quickLinks.contact': 'Contato',
        'about.description': 'Oi, sou a Babi — criadora de conteúdo e designer gráfica. Falo sobre autocuidado, beleza e desenvolvimento pessoal, ajudando você a viver seu glow up com propósito, leveza e criatividade. 🌸',
        'about.signature': 'Me Segue',
        'social.title': 'Minhas Redes Sociais',
        'social.tiktokSelfcare': 'Tiktok de Autocuidado',
        'social.tiktokVlog': 'Tiktok de Vlog',
        'shopping.title': 'Compras e produtos que eu recomendo',
        'shopping.shein': 'Minha Lista SHEIN',
        'shopping.rituals': 'Pack Autocuidado Rituals',
        'contact.title': 'Contato Profissional'
    },
    'en': {
        'quickLinks.services': 'My<br>Services',
        'quickLinks.contact': 'Contact',
        'about.description': 'Hi, I\'m Babi — content creator and graphic designer. I talk about self-care, beauty and personal development, helping you live your glow up with purpose, lightness and creativity. 🌸',
        'about.signature': 'Follow Me',
        'social.title': 'My Social Media',
        'social.tiktokSelfcare': 'Selfcare Tiktok',
        'social.tiktokVlog': 'Vlog Tiktok',
        'shopping.title': 'Shopping and products I recommend',
        'shopping.shein': 'My SHEIN List',
        'shopping.rituals': 'Selfcare Pack Rituals',
        'contact.title': 'Professional Contact'
    },
    'es': {
        'quickLinks.services': 'Mis<br>Servicios',
        'quickLinks.contact': 'Contacto',
        'about.description': 'Hola, soy Babi — creadora de contenido y diseñadora gráfica. Hablo sobre autocuidado, belleza y desarrollo personal, ayudándote a vivir tu glow up con propósito, ligereza y creatividad. 🌸',
        'about.signature': 'Sígueme',
        'social.title': 'Mis Redes Sociales',
        'social.tiktokSelfcare': 'Tiktok de Autocuidado',
        'social.tiktokVlog': 'Tiktok de Vlog',
        'shopping.title': 'Compras y productos que recomiendo',
        'shopping.shein': 'Mi Lista SHEIN',
        'shopping.rituals': 'Pack Autocuidado Rituals',
        'contact.title': 'Contacto Profesional'
    }
};

// Current language
let currentLanguage = localStorage.getItem('language') || 'pt-pt';

// Change language function
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.innerHTML = translations[lang][key];
        }
    });
    
    // Update active button
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
}

// Initialize language selector
function initLanguageSelector() {
    const langToggle = document.getElementById('lang-toggle');
    const langDropdown = document.getElementById('lang-dropdown');
    const langSelector = document.querySelector('.language-selector');
    const langOptions = document.querySelectorAll('.lang-option');
    
    // Toggle dropdown
    langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        langSelector.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!langSelector.contains(e.target)) {
            langSelector.classList.remove('open');
        }
    });
    
    // Language options
    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            changeLanguage(lang);
            updateLanguageDisplay(lang);
            langSelector.classList.remove('open');
            
            // Update active option
            langOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });
    
    // Set initial language
    changeLanguage(currentLanguage);
    updateLanguageDisplay(currentLanguage);
}

// Update language display
function updateLanguageDisplay(lang) {
    const currentFlag = document.getElementById('current-flag');
    const currentLang = document.getElementById('current-lang');
    
    const langMap = {
        'pt-pt': { flag: '🇵🇹', code: 'PT' },
        'pt-br': { flag: '🇧🇷', code: 'BR' },
        'en': { flag: '🇺🇸', code: 'EN' },
        'es': { flag: '🇪🇸', code: 'ES' }
    };
    
    if (langMap[lang]) {
        currentFlag.textContent = langMap[lang].flag;
        currentLang.textContent = langMap[lang].code;
    }
}

// Site initialization
function initializeSite() {
    console.log('🌸 Minha Vida, Teu Vlog - Site carregado com sucesso!');
}

// Floating Emojis Animation
function initFloatingEmojis() {
    const emojis = document.querySelectorAll('.floating-emoji');
    let lastScrollY = window.scrollY;
    
    // Set random initial positions
    emojis.forEach((emoji, index) => {
        const randomX = Math.random() * 90;
        const randomY = Math.random() * 80;
        emoji.style.left = `${randomX}%`;
        emoji.style.top = `${randomY}%`;
        
        // Random size variation (only width, height auto to maintain aspect ratio)
        const randomSize = 35 + Math.random() * 30;
        emoji.style.width = `${randomSize}px`;
    });
    
    // Scroll parallax effect
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const scrollDelta = scrollY - lastScrollY;
        
        emojis.forEach((emoji, index) => {
            const speed = parseFloat(emoji.getAttribute('data-speed')) || 1;
            const currentTop = parseFloat(emoji.style.top);
            const currentLeft = parseFloat(emoji.style.left);
            
            // Move emojis based on scroll
            let newTop = currentTop - (scrollDelta * speed * 0.05);
            let newLeft = currentLeft + (scrollDelta * speed * 0.03 * (index % 2 === 0 ? 1 : -1));
            
            // Keep emojis within viewport
            if (newTop < -10) newTop = 100;
            if (newTop > 110) newTop = -10;
            if (newLeft < -10) newLeft = 100;
            if (newLeft > 110) newLeft = -10;
            
            emoji.style.top = `${newTop}%`;
            emoji.style.left = `${newLeft}%`;
        });
        
        lastScrollY = scrollY;
    });
    
    // Random movement animation
    setInterval(() => {
        emojis.forEach((emoji) => {
            const randomX = (Math.random() - 0.5) * 100;
            const randomY = (Math.random() - 0.5) * 100;
            const randomRotation = Math.random() * 360;
            
            emoji.style.transition = 'transform 3s ease-in-out';
            emoji.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg)`;
        });
    }, 4000);
    
    // Mouse interaction (optional)
    document.addEventListener('mousemove', (e) => {
        emojis.forEach((emoji, index) => {
            const rect = emoji.getBoundingClientRect();
            const emojiX = rect.left + rect.width / 2;
            const emojiY = rect.top + rect.height / 2;
            
            const deltaX = e.clientX - emojiX;
            const deltaY = e.clientY - emojiY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Move away from cursor if too close
            if (distance < 150) {
                const angle = Math.atan2(deltaY, deltaX);
                const moveX = -Math.cos(angle) * 30;
                const moveY = -Math.sin(angle) * 30;
                
                emoji.style.transition = 'transform 0.3s ease-out';
                emoji.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${Math.random() * 360}deg)`;
            }
        });
    });
}

// Scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add click animation to links
function addClickAnimation() {
    const links = document.querySelectorAll('.link-button');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Add hover effect to quick links
function addQuickLinkEffects() {
    const quickLinks = document.querySelectorAll('.quick-link');
    quickLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.quick-link-icon');
            icon.style.transform = 'rotate(5deg) scale(1.1)';
        });
        
        link.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.quick-link-icon');
            icon.style.transform = 'rotate(0deg) scale(1)';
        });
    });
}

// Setup image error handlers
function setupImageHandlers() {
    const profileImg = document.getElementById('profile-img');
    const aboutImg = document.getElementById('about-img');
    
    // Add error handlers in case images are not found
    if (profileImg) {
        profileImg.onerror = function() {
            console.warn('Imagem babi1.png não encontrada');
        }
    }
    
    if (aboutImg) {
        aboutImg.onerror = function() {
            console.warn('Imagem babi2.jpeg não encontrada');
        }
    }
}

// Add parallax effect on scroll
function addParallaxEffect() {
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const profileSection = document.querySelector('.profile-section');
        
        if (profileSection) {
            const offset = scrollY * 0.5;
            profileSection.style.transform = `translateY(${offset}px)`;
        }
        
        lastScrollY = scrollY;
    });
}

// Track link clicks (optional analytics)
function trackLinkClicks() {
    const allLinks = document.querySelectorAll('a[href^="http"]');
    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const linkText = this.querySelector('span')?.textContent || this.getAttribute('href');
            console.log(`Link clicked: ${linkText}`);
            // Here you could add analytics tracking if needed
        });
    });
}

// Copy email to clipboard
function setupEmailCopy() {
    const emailLink = document.querySelector('.email');
    if (emailLink) {
        emailLink.addEventListener('click', function(e) {
            e.preventDefault();
            const email = 'profissionalbarbaracosta@gmail.com';
            
            // Try to copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(email).then(() => {
                    showNotification('Email copiado para a área de transferência!');
                    // Still open email client
                    setTimeout(() => {
                        window.location.href = `mailto:${email}`;
                    }, 500);
                }).catch(() => {
                    window.location.href = `mailto:${email}`;
                });
            } else {
                window.location.href = `mailto:${email}`;
            }
        });
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(155, 89, 182, 0.95);
        color: white;
        padding: 15px 30px;
        border-radius: 50px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        font-weight: 500;
        animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2500);
}

// Add CSS for notification animations
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize all functions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSite();
    initLanguageSelector();
    addClickAnimation();
    addQuickLinkEffects();
    setupImageHandlers();
    initFloatingEmojis();
    // addParallaxEffect(); // Commented out - can be enabled for parallax effect
    trackLinkClicks();
    setupEmailCopy();
    addNotificationStyles();
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});
