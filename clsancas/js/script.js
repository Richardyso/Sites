// ==========================================
// NAVIGATION & MOBILE MENU
// ==========================================

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile menu
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Active nav link on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });

    // Header shadow on scroll
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    }
});

// ==========================================
// SMOOTH SCROLL
// ==========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// ==========================================
// PRODUCT FILTERING
// ==========================================

const categoryBtns = document.querySelectorAll('.category-btn');
const productCards = document.querySelectorAll('.product-card');

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        categoryBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');

        const category = btn.getAttribute('data-category');

        productCards.forEach(card => {
            // Hide all cards first
            card.style.animation = 'none';
            card.style.display = 'none';

            // Show cards that match the category or show all
            if (category === 'all' || card.getAttribute('data-category') === category) {
                setTimeout(() => {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.6s ease-out';
                }, 10);
            }
        });
    });
});

// ==========================================
// CALCULATOR
// ==========================================

function calculateBudget() {
    const productType = document.getElementById('product-type');
    const area = document.getElementById('area');
    const resultValue = document.getElementById('result-value');
    const calculatorResult = document.getElementById('calculator-result');

    // Validation
    if (!productType.value || !area.value || area.value <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    const pricePerUnit = parseFloat(productType.value);
    const totalArea = parseFloat(area.value);
    const total = pricePerUnit * totalArea;

    // Animate result
    animateValue(resultValue, 0, total, 1000);

    // Add highlight animation
    calculatorResult.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
        calculatorResult.style.animation = 'pulse 2s infinite';
    }, 500);
}

// Animate number counter
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = progress * (end - start) + start;
        element.textContent = formatCurrency(value);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// ==========================================
// PRODUCT MODAL WITH CALCULATOR
// ==========================================

let currentProductName = '';
let currentProductPrice = 0;

function openProductDetail(button) {
    const modal = document.getElementById('product-modal');
    const productCard = button.closest('.product-card');
    const productName = productCard.getAttribute('data-product');
    const productPrice = parseFloat(productCard.getAttribute('data-price'));
    const productDescription = productCard.querySelector('.product-description').textContent;
    const productImage = productCard.querySelector('.product-image img').src;
    
    // Store in global variables
    currentProductName = productName;
    currentProductPrice = productPrice;
    
    const priceDisplay = productPrice > 0 ? `R$ ${productPrice.toFixed(2)}` : 'Sob consulta';
    const unit = productPrice > 0 ? (productPrice <= 20 ? 'metro linear' : 'm²') : '';

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <img src="${productImage}" alt="${productName}" style="width: 100%; border-radius: 10px; margin-bottom: 20px; max-height: 300px; object-fit: cover;">
        <h2 style="color: var(--text-dark); margin-bottom: 15px; font-size: 1.8rem;">${productName}</h2>
        <p style="color: var(--text-light); font-size: 1.1rem; margin-bottom: 15px;">${productDescription}</p>
        <p style="color: var(--primary-color); font-weight: 700; font-size: 1.3rem; margin-bottom: 20px;">
            <i class="fas fa-tag"></i> ${priceDisplay}${unit ? ' por ' + unit : ''}
        </p>
        
        ${productPrice > 0 ? `
        <div style="background: var(--bg-light); padding: 25px; border-radius: 15px; margin: 25px 0;">
            <h3 style="color: var(--text-dark); margin-bottom: 20px; font-size: 1.3rem;">
                <i class="fas fa-calculator"></i> Calcular Orçamento
            </h3>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-dark);">
                    Quantidade (${unit}):
                </label>
                <input type="number" id="modal-quantity" class="form-control" placeholder="Ex: 25" min="1" step="0.1" 
                       style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 10px; font-size: 1rem;">
            </div>
            <button class="btn btn-primary" onclick="calculateProductPriceFromModal()" 
                    style="width: 100%; margin-bottom: 15px; padding: 14px;">
                <i class="fas fa-calculator"></i> Calcular Valor
            </button>
            <div id="modal-result" style="display: none; text-align: center; padding: 20px; background: white; border-radius: 10px; margin-top: 15px;">
                <p style="color: var(--text-light); margin-bottom: 8px; font-size: 0.95rem;">Valor estimado:</p>
                <p id="modal-result-value" style="color: var(--primary-color); font-size: 2rem; font-weight: 700; margin-bottom: 15px;">R$ 0,00</p>
                <button class="btn btn-primary" onclick="buyProductFromModal()" 
                        style="width: 100%; padding: 14px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class="fab fa-whatsapp" style="font-size: 1.3rem;"></i> Comprar via WhatsApp
                </button>
            </div>
        </div>
        ` : `
        <div style="text-align: center; margin: 25px 0;">
            <button class="btn btn-primary" onclick="contactProductFromModal()" 
                    style="padding: 14px 30px; display: inline-flex; align-items: center; gap: 10px;">
                <i class="fab fa-whatsapp" style="font-size: 1.3rem;"></i> Consultar via WhatsApp
            </button>
        </div>
        `}
        
        <div style="margin-top: 30px; border-top: 2px solid var(--bg-light); padding-top: 25px;">
            <h3 style="color: var(--text-dark); margin-bottom: 15px; font-size: 1.2rem;">
                <i class="fas fa-star"></i> Diferenciais
            </h3>
            <ul style="color: var(--text-light); line-height: 2; list-style: none; padding: 0;">
                <li style="margin-bottom: 10px;"><i class="fas fa-check-circle" style="color: var(--primary-color); margin-right: 10px;"></i> Material de alta qualidade</li>
                <li style="margin-bottom: 10px;"><i class="fas fa-check-circle" style="color: var(--primary-color); margin-right: 10px;"></i> Instalação profissional</li>
                <li style="margin-bottom: 10px;"><i class="fas fa-check-circle" style="color: var(--primary-color); margin-right: 10px;"></i> Garantia de qualidade</li>
                <li style="margin-bottom: 10px;"><i class="fas fa-check-circle" style="color: var(--primary-color); margin-right: 10px;"></i> Acabamento impecável</li>
                <li style="margin-bottom: 10px;"><i class="fas fa-check-circle" style="color: var(--primary-color); margin-right: 10px;"></i> 15 anos de experiência</li>
            </ul>
        </div>
    `;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function calculateProductPriceFromModal() {
    calculateProductPrice(currentProductName, currentProductPrice);
}

function buyProductFromModal() {
    buyProduct(currentProductName, currentProductPrice);
}

function contactProductFromModal() {
    contactProduct(currentProductName);
}

function calculateProductPrice(productName, pricePerUnit) {
    const quantity = parseFloat(document.getElementById('modal-quantity').value);
    
    if (!quantity || quantity <= 0) {
        alert('Por favor, insira uma quantidade válida.');
        return;
    }
    
    const total = pricePerUnit * quantity;
    const resultDiv = document.getElementById('modal-result');
    const resultValue = document.getElementById('modal-result-value');
    
    resultDiv.style.display = 'block';
    animateValue(resultValue, 0, total, 800);
    
    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function buyProduct(productName, pricePerUnit) {
    const quantity = parseFloat(document.getElementById('modal-quantity').value);
    
    if (!quantity || quantity <= 0) {
        alert('Por favor, calcule o orçamento primeiro.');
        return;
    }
    
    const total = pricePerUnit * quantity;
    const unit = pricePerUnit <= 20 ? 'metros lineares' : 'm²';
    
    const message = `Olá! Vim do site da Claudinha Sancas.%0A%0A` +
                   `Gostaria de fazer um orçamento:%0A%0A` +
                   `📦 *Produto:* ${productName}%0A` +
                   `📏 *Quantidade:* ${quantity} ${unit}%0A` +
                   `💰 *Valor estimado:* R$ ${total.toFixed(2)}%0A%0A` +
                   `Aguardo retorno!`;
    
    const whatsappURL = `https://wa.me/5521976176072?text=${message}`;
    window.open(whatsappURL, '_blank');
}

function contactProduct(productName) {
    const message = `Olá! Vim do site da Claudinha Sancas.%0A%0A` +
                   `Gostaria de saber mais sobre:%0A` +
                   `📦 *${productName}*%0A%0A` +
                   `Podem me enviar mais informações e fazer um orçamento?`;
    
    const whatsappURL = `https://wa.me/5521976176072?text=${message}`;
    window.open(whatsappURL, '_blank');
}

// Backward compatibility - keep old function name
function openModal(button) {
    openProductDetail(button);
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('product-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ==========================================
// CONTACT FORM
// ==========================================

const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    // Create WhatsApp message
    const whatsappMessage = `Olá! Meu nome é ${name}.%0A%0AE-mail: ${email}%0ATelefone: ${phone}%0A%0AMensagem: ${message}`;
    
    // WhatsApp number
    const whatsappNumber = '5521976176072';
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    // Open WhatsApp
    window.open(whatsappURL, '_blank');

    // Show success message
    alert('Redirecionando para WhatsApp...');

    // Reset form
    contactForm.reset();
});

// ==========================================
// BACK TO TOP BUTTON
// ==========================================

const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ==========================================
// SCROLL ANIMATIONS
// ==========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.product-card, .gallery-item, .contact-item, .feature-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});

// ==========================================
// GALLERY LIGHTBOX
// ==========================================

const galleryItems = document.querySelectorAll('.gallery-item');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const modal = document.getElementById('product-modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <img src="${img.src}" alt="${img.alt}" style="width: 100%; border-radius: 10px;">
        `;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
});

// ==========================================
// FORM INPUT ANIMATIONS
// ==========================================

const formInputs = document.querySelectorAll('.form-control');

formInputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'translateX(5px)';
        this.style.borderColor = 'var(--accent-color)';
    });

    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'translateX(0)';
        if (!this.value) {
            this.style.borderColor = '#ddd';
        }
    });
});

// ==========================================
// PAGE LOAD ANIMATION
// ==========================================

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// ==========================================
// PARALLAX EFFECT FOR HERO
// ==========================================

window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    const scrolled = window.scrollY;
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// ==========================================
// UTILITIES
// ==========================================

// Phone mask
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = value;
        }
    });
}

// Prevent scroll when modal is open
function preventScroll(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

// Add hover effects to buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s ease';
    });
});

// Log page analytics (placeholder)
console.log('%cClaudinha Sancas Website', 'color: #e74c3c; font-size: 20px; font-weight: bold;');
console.log('%c15 anos realizando sonhos através da decoração em gesso', 'color: #2c3e50; font-size: 14px;');
console.log('%cCampo Grande - Rio de Janeiro', 'color: #3498db; font-size: 12px;');

// ==========================================
// LAZY LOADING FOR IMAGES
// ==========================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img').forEach(img => {
        imageObserver.observe(img);
    });
}

// ==========================================
// PRINT CONSOLE WELCOME MESSAGE
// ==========================================

setTimeout(() => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║                                           ║
    ║         CLAUDINHA SANCAS                  ║
    ║    Decoração em Gesso - Campo Grande     ║
    ║                                           ║
    ║    📍 Campo Grande, Rio de Janeiro       ║
    ║    📞 (21) XXXXX-XXXX                    ║
    ║    ✉️  contato@claudinhasancas.com.br   ║
    ║                                           ║
    ╚═══════════════════════════════════════════╝
    `);
}, 1000);

