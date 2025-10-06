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
