// ===============================================
// LOUIS GAMER - JavaScript Principal
// Animações, interatividade e funcionalidades
// ===============================================

// App principal
const App = {
  // Elementos DOM
  elements: {
    loading: null,
    heroBackground: null,
    characters: null,
    linkCards: null,
    sections: null,
    profileImage: null
  },

  // Configurações
  config: {
    parallaxSpeed: 0.5,
    scrollRevealOffset: 100,
    loadingMinTime: 1000
  },

  // Inicialização
  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.initLoading();
    this.setupScrollAnimations();
    this.setupParallax();
    this.setupGlitchEffect();
    this.setupEasterEggs();
    this.trackLinks();
  },

  // Cache de elementos DOM
  cacheElements() {
    this.elements.loading = document.getElementById('loading');
    this.elements.heroBackground = document.querySelector('.hero-background img');
    this.elements.characters = document.querySelectorAll('.character');
    this.elements.linkCards = document.querySelectorAll('.link-card, .community-card');
    this.elements.sections = document.querySelectorAll('section');
    this.elements.profileImage = document.querySelector('.profile-image');
    this.elements.collageItems = document.querySelectorAll('.collage-item');
  },

  // Setup de event listeners
  setupEventListeners() {
    // Scroll events
    window.addEventListener('scroll', this.throttle(() => {
      this.handleScroll();
    }, 16));

    // Resize events
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));

    // Mouse move para efeitos sutis
    document.addEventListener('mousemove', this.throttle((e) => {
      this.handleMouseMove(e);
    }, 50));
  },

  // Loading screen
  initLoading() {
    const startTime = Date.now();
    
    window.addEventListener('load', () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(this.config.loadingMinTime - elapsedTime, 0);
      
      setTimeout(() => {
        this.elements.loading.classList.add('hidden');
        this.animateHeroEntrance();
      }, remainingTime);
    });
  },

  // Animação de entrada do hero
  animateHeroEntrance() {
    const timeline = [
      { element: '.profile-container', class: 'fade-in', delay: 100 },
      { element: '.hero-title', class: 'fade-in', delay: 200 },
      { element: '.hero-subtitle', class: 'fade-in', delay: 300 },
      { element: '.cta-button', class: 'fade-in', delay: 400 },
      { element: '.character-left', class: 'slide-in-left', delay: 600 },
      { element: '.character-right', class: 'slide-in-right', delay: 700 }
    ];

    timeline.forEach(({ element, class: className, delay }) => {
      setTimeout(() => {
        const el = document.querySelector(element);
        if (el) el.classList.add(className);
      }, delay);
    });
  },

  // Scroll animations com Intersection Observer
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          
          // Animar cards com delay
          if (entry.target.classList.contains('links-grid') || 
              entry.target.classList.contains('community-grid')) {
            const cards = entry.target.querySelectorAll('.link-card, .community-card');
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add('fade-in');
              }, index * 100);
            });
          }
        }
      });
    }, observerOptions);

    // Observar seções
    this.elements.sections.forEach(section => {
      observer.observe(section);
    });

    // Observar cards
    document.querySelectorAll('.setup-item').forEach(item => {
      observer.observe(item);
    });
  },

  // Parallax effect
  setupParallax() {
    if (window.innerWidth < 1024) return; // Apenas desktop
    
    this.handleScroll();
  },

  // Handle scroll para parallax
  handleScroll() {
    if (window.innerWidth < 1024) return;
    
    const scrollY = window.pageYOffset;
    
    // Parallax do background do hero
    if (this.elements.heroBackground) {
      const speed = this.config.parallaxSpeed;
      this.elements.heroBackground.style.transform = `translateY(${scrollY * speed}px)`;
    }
    
    // Parallax dos personagens
    this.elements.characters.forEach((character, index) => {
      const speed = 0.3 + (index * 0.1);
      character.style.transform = `translateY(${scrollY * speed}px) rotate(${character.classList.contains('character-left') ? -10 : 10}deg)`;
    });
    
    // Parallax da colagem
    this.elements.collageItems.forEach((item, index) => {
      const speed = 0.1 + (index * 0.02);
      const rotation = parseInt(getComputedStyle(item).getPropertyValue('--rotation') || '0');
      item.style.transform = `translateY(${scrollY * speed}px) rotate(${rotation}deg)`;
    });
  },

  // Mouse move effects
  handleMouseMove(e) {
    if (window.innerWidth < 1024) return;
    
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const moveX = (clientX - centerX) / centerX;
    const moveY = (clientY - centerY) / centerY;
    
    // Sutil movimento dos personagens com o mouse
    this.elements.characters.forEach((character, index) => {
      const intensity = 20 + (index * 10);
      character.style.transform = `
        translateX(${moveX * intensity}px) 
        translateY(${moveY * intensity}px) 
        rotate(${character.classList.contains('character-left') ? -10 : 10}deg)
      `;
    });
    
    // Parallax sutil na colagem
    this.elements.collageItems.forEach((item, index) => {
      const speed = 0.02 + (index * 0.005);
      const x = moveX * speed * 50;
      const y = moveY * speed * 50;
      item.style.transform = `translate(${x}px, ${y}px) ${item.style.transform || ''}`;
    });
  },

  // Glitch effect enhancement
  setupGlitchEffect() {
    const glitchElements = document.querySelectorAll('.glitch');
    
    glitchElements.forEach(element => {
      // Random glitch trigger
      setInterval(() => {
        if (Math.random() > 0.95) {
          element.style.animation = 'none';
          setTimeout(() => {
            element.style.animation = '';
          }, 100);
        }
      }, 3000);
    });
  },

  // Easter eggs
  setupEasterEggs() {
    // Konami Code
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', (e) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          this.activateEasterEgg();
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    });
    
    // Click no profile para rotação
    if (this.elements.profileImage) {
      this.elements.profileImage.addEventListener('click', () => {
        this.elements.profileImage.style.animation = 'spin 0.5s ease-in-out';
        setTimeout(() => {
          this.elements.profileImage.style.animation = '';
        }, 500);
      });
    }
    
    // Double click nos personagens
    this.elements.characters.forEach(character => {
      character.style.cursor = 'pointer';
      character.addEventListener('dblclick', () => {
        character.style.transition = 'all 0.5s ease';
        character.style.opacity = '0.5';
        character.style.filter = 'grayscale(0%)';
        
        setTimeout(() => {
          character.style.opacity = '';
          character.style.filter = '';
        }, 2000);
      });
    });
  },

  // Ativar Easter Egg
  activateEasterEgg() {
    document.body.style.animation = 'rainbow 2s ease-in-out';
    
    // Mostrar mensagem
    const message = document.createElement('div');
    message.textContent = '🎮 KONAMI CODE ACTIVATED! 🎮';
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      color: black;
      padding: 2rem;
      font-size: 2rem;
      font-weight: bold;
      border-radius: 10px;
      z-index: 9999;
      animation: fadeIn 0.5s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
      document.body.style.animation = '';
    }, 3000);
  },

  // Track link clicks
  trackLinks() {
    this.elements.linkCards.forEach(link => {
      link.addEventListener('click', (e) => {
        const platform = link.querySelector('h3')?.textContent || 
                        link.querySelector('span')?.textContent || 
                        'Unknown';
        
        // Adicionar efeito visual de clique
        link.style.transform = 'scale(0.95)';
        setTimeout(() => {
          link.style.transform = '';
        }, 200);
        
        // Log para analytics (se implementado)
        console.log(`Link clicked: ${platform}`);
        
        // Opcional: Google Analytics ou similar
        if (typeof gtag !== 'undefined') {
          gtag('event', 'click', {
            'event_category': 'outbound',
            'event_label': platform
          });
        }
      });
    });
  },

  // Utility: Throttle
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  },

  // Utility: Debounce
  debounce(func, delay) {
    let debounceTimer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
  },

  // Handle resize
  handleResize() {
    // Reconfigurar parallax se necessário
    if (window.innerWidth >= 1024) {
      this.setupParallax();
    }
  }
};

// Smooth scroll para links internos
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

// Adicionar classe para detectar touch devices
if ('ontouchstart' in window) {
  document.body.classList.add('touch-device');
}

// Prevenir zoom em double tap no iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Adicionar animação rainbow para easter egg
const style = document.createElement('style');
style.textContent = `
  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Console message
console.log('%c🎮 LOUIS GAMER 🎮', 'font-size: 24px; font-weight: bold; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);');
console.log('%cJogo, músicas e muito humor!', 'font-size: 14px; color: #ccc;');
console.log('%cTente o Konami Code! ⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️🅱️🅰️', 'font-size: 12px; color: #888;');
