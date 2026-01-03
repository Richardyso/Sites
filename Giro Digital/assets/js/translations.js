// ===========================
// Giro Digital - Sistema de Tradução
// ===========================

const translations = {
    'pt-PT': {
        // Navegação
        'nav.home': 'Início',
        'nav.prices': 'Preços',
        'nav.services': 'Serviços', 
        'nav.about': 'Sobre',
        'nav.faq': 'FAQ',
        'nav.terms': 'Termos',
        'nav.quote': 'Orçamento Gratuito',
        
        // Hero Section
        'hero.title': 'Sites e Design',
        'hero.highlight': 'Simples e Acessível',
        'hero.subtitle': 'Ajudamos pequenos negócios a crescer online com criação de websites profissionais e identidade visual completa.',
        'hero.btn1': 'Ver Pacotes e Preços',
        'hero.btn2': 'Falar Connosco',
        
        // Seção de Preços
        'pricing.title': 'Pacotes e Preços',
        'pricing.subtitle': 'Escolha o pacote ideal para o seu negócio e poupe até 30%',
        
        // Pacote Starter
        'starter.title': '✨ Starter',
        'starter.period': '/projeto/mês',
        'starter.description': 'Ideal para começar a sua presença digital',
        'starter.feature1': 'Logótipo profissional',
        'starter.feature2': 'Cartão de visita digital',
        'starter.feature3': 'Manual de identidade básico',
        'starter.feature4': '3 artes para divulgação',
        'starter.feature5': 'Website Simples com alojamento Netlify',
        'starter.savings': 'Poupe €28 vs. serviços avulsos',
        'starter.button': 'Começar Agora',
        
        // Pacote Crescimento
        'growth.title': '🚀 Crescimento',
        'growth.badge': 'Mais Popular',
        'growth.period': '/projeto/mês',
        'growth.description': 'Para negócios que querem crescer online',
        'growth.feature1': 'Tudo do pacote Starter',
        'growth.feature2': 'Website responsivo (até 5 páginas)',
        'growth.feature3': 'Optimização SEO básica',
        'growth.feature4': '8 artes para divulgação',
        'growth.feature5': 'Material gráfico completo',
        'growth.savings': 'Poupe €100 vs. serviços avulsos',
        'growth.button': 'Escolher Este',
        
        // Pacote Premium
        'premium.title': '👑 Premium',
        'premium.period': '/projeto/mês',
        'premium.description': 'Solução completa para dominar o digital',
        'premium.feature1': 'Tudo do pacote Crescimento',
        'premium.feature2': 'Website avançado com backend e domínio próprio',
        'premium.feature3': 'Sistema de compra e pagamento online',
        'premium.savings': 'Poupe €200 vs. serviços avulsos',
        'premium.button': 'Saber Mais',
        
        // Giro Plus
        'plus.title': '🎯 Giro Plus',
        'plus.badge': 'Fidelização',
        'plus.contract': 'Contrato',
        'plus.period': '3 meses',
        'plus.description': 'Programa de fidelização com benefícios exclusivos',
        'plus.feature1': '5% desconto após 3 meses',
        'plus.feature2': '10% desconto por indicações',
        'plus.feature3': 'Pacote VIP após 6 meses',
        'plus.feature4': 'Serviços extras gratuitos',
        'plus.feature5': 'Atendimento prioritário',
        'plus.savings': 'Valores acordados individualmente',
        'plus.button': 'Saber Mais',
        
        // Serviços Avulsos
        'individual.title': 'Prefere Serviços Avulsos?',
        'individual.design': 'Design',
        'individual.design.logo': 'Logótipo: €20',
        'individual.design.card': 'Cartão visita: €7',
        'individual.design.manual': 'Manual marca: €50',
        'individual.websites': 'Websites',
        'individual.websites.landing': 'Página simples de 1 página (Landing page): €50',
        'individual.websites.pages': 'Site 5 páginas: €100',
        'individual.marketing': 'Marketing',
        'individual.marketing.social': 'Gestão redes (mês): €100',
        'individual.marketing.ads': 'Campanha Ads',
        'individual.marketing.seo': 'SEO básico',
        'individual.note': '*IVA não incluído. Valores podem variar conforme complexidade do projeto.',
        
        // Serviços Detalhados
        'services.title': 'Os Nossos Serviços em Detalhe',
        'services.subtitle': 'Conheça tudo o que podemos fazer pelo seu negócio',
        
        'service.branding.title': 'Branding',
        'service.branding.description': 'Identidade visual completa que transmite os valores do seu negócio',
        'service.branding.feature1': 'Logótipo profissional',
        'service.branding.feature2': 'Paleta de cores',
        'service.branding.feature3': 'Manual de marca',
        'service.branding.price': 'A partir de €77',
        
        'service.social.title': 'Gestão de Redes Sociais',
        'service.social.description': 'Conteúdo estratégico para atrair e converter seguidores em clientes',
        'service.social.feature1': 'Plano de conteúdo',
        'service.social.feature2': 'Publicações profissionais',
        'service.social.price': 'A partir de €100/mês',
        
        'service.websites.title': 'Websites',
        'service.websites.description': 'Páginas optimizadas para converter visitantes em clientes',
        'service.websites.feature1': 'Design responsivo',
        'service.websites.feature2': 'Optimização SEO',
        'service.websites.feature3': 'Carregamento rápido',
        'service.websites.price': 'A partir de €50',
        
        'service.packages.title': 'Pacotes Completos',
        'service.packages.description': 'Combine serviços e poupe até 30% com as nossas soluções integradas',
        'service.packages.feature1': 'Preços especiais',
        'service.packages.feature2': 'Atendimento prioritário',
        'service.packages.feature3': 'Resultados garantidos',
        'service.packages.price': 'Desde €99',
        
        // Sobre
        'about.title': 'Unindo Talento e Experiência',
        'about.text1': 'A Giro Digital nasceu da união de dois profissionais apaixonados por ajudar pequenos negócios a crescer no mundo digital.',
        'about.text2': 'Combinamos a expertise em design da Babi Design com o desenvolvimento web de Richardyson para oferecer soluções completas e acessíveis.',
        
        // CTA
        'cta.title': 'Pronto para Dar o Giro Digital no Seu Negócio?',
        'cta.subtitle': 'Solicite um orçamento gratuito e descubra como podemos ajudar',
        'cta.button': 'Solicitar Orçamento Gratuito',
        
        // Contato
        'contact.title': 'Vamos Conversar?',
        'contact.subtitle': 'Entre em contacto e receba uma proposta personalizada',
        'contact.email.title': '📧 Email',
        'contact.whatsapp.title': '📱 WhatsApp',
        'contact.payment.title': '💳 Formas de Pagamento',
        
        // Footer
        'footer.tagline': 'Marketing digital simples e acessível',
        'footer.payment.terms': 'Condições de Pagamento:',
        'footer.payment.text': 'Ao adquirir um dos nossos pacotes, é necessário efectuar uma entrada de 50% do valor total. O restante será pago no momento da entrega do serviço.',
        'footer.rights': '© 2025 Giro Digital. Todos os direitos reservados.'
    },
    
    'pt-BR': {
        // Navegação
        'nav.home': 'Início',
        'nav.prices': 'Preços',
        'nav.services': 'Serviços',
        'nav.about': 'Sobre',
        'nav.faq': 'FAQ',
        'nav.terms': 'Termos',
        'nav.quote': 'Orçamento Gratuito',
        
        // Hero Section
        'hero.title': 'Sites e Design',
        'hero.highlight': 'Simples e Acessível',
        'hero.subtitle': 'Ajudamos pequenos negócios a crescer online com criação de websites profissionais e identidade visual completa.',
        'hero.btn1': 'Ver Pacotes e Preços',
        'hero.btn2': 'Falar Conosco',
        
        // Seção de Preços
        'pricing.title': 'Pacotes e Preços',
        'pricing.subtitle': 'Escolha o pacote ideal para o seu negócio e economize até 30%',
        
        // Pacote Starter
        'starter.title': '✨ Starter',
        'starter.period': '/projeto/mês',
        'starter.description': 'Ideal para começar sua presença digital',
        'starter.feature1': 'Logotipo profissional',
        'starter.feature2': 'Cartão de visita digital',
        'starter.feature3': 'Manual de identidade básico',
        'starter.feature4': '3 artes para divulgação',
        'starter.feature5': 'Website Simples com hospedagem Netlify',
        'starter.savings': 'Economize R$28 vs. serviços avulsos',
        'starter.button': 'Começar Agora',
        
        // Pacote Crescimento
        'growth.title': '🚀 Crescimento',
        'growth.badge': 'Mais Popular',
        'growth.period': '/projeto/mês',
        'growth.description': 'Para negócios que querem crescer online',
        'growth.feature1': 'Tudo do pacote Starter',
        'growth.feature2': 'Website responsivo (até 5 páginas)',
        'growth.feature3': 'Otimização SEO básica',
        'growth.feature4': '8 artes para divulgação',
        'growth.feature5': 'Material gráfico completo',
        'growth.savings': 'Economize R$100 vs. serviços avulsos',
        'growth.button': 'Escolher Este',
        
        // Continue com todas as traduções adaptadas para BR
        'footer.payment.text': 'Ao adquirir um dos nossos pacotes, é necessário efetuar uma entrada de 50% do valor total. O restante será pago no momento da entrega do serviço.'
    },
    
    'es-ES': {
        // Navegación
        'nav.home': 'Inicio',
        'nav.prices': 'Precios',
        'nav.services': 'Servicios',
        'nav.about': 'Sobre Nosotros',
        'nav.faq': 'FAQ',
        'nav.terms': 'Términos',
        'nav.quote': 'Presupuesto Gratis',
        
        // Hero Section
        'hero.title': 'Sites e Design',
        'hero.highlight': 'Simple y Accesible',
        'hero.subtitle': 'Ayudamos a pequeños negocios a crecer online con soluciones completas de branding, redes sociales y sitios web.',
        'hero.btn1': 'Ver Paquetes y Precios',
        'hero.btn2': 'Hablar con Nosotros',
        
        // Sección de Precios
        'pricing.title': 'Paquetes y Precios',
        'pricing.subtitle': 'Elija el paquete ideal para su negocio y ahorre hasta un 30%',
        
        // Paquete Starter
        'starter.title': '✨ Starter',
        'starter.period': '/proyecto/mes',
        'starter.description': 'Ideal para comenzar su presencia digital',
        'starter.feature1': 'Logotipo profesional',
        'starter.feature2': 'Tarjeta de visita digital',
        'starter.feature3': 'Manual de identidad básico',
        'starter.feature4': '3 publicaciones para redes sociales',
        'starter.feature5': 'Sitio Web Simple con alojamiento Netlify',
        'starter.savings': 'Ahorre €28 vs. servicios individuales',
        'starter.button': 'Comenzar Ahora',
        
        // Pacote Crescimento
        'growth.title': '🚀 Crecimiento',
        'growth.badge': 'Más Popular',
        'growth.period': '/proyecto/mes',
        'growth.description': 'Para negocios que quieren crecer online',
        'growth.feature1': 'Todo del paquete Starter',
        'growth.feature2': 'Sitio web responsivo (hasta 5 páginas)',
        'growth.feature3': 'Optimización SEO básica',
        'growth.feature4': 'Gestión redes sociales',
        'growth.feature5': '8 publicaciones',
        'growth.savings': 'Ahorre €100 vs. servicios individuales',
        'growth.button': 'Elegir Este',
        
        // Pacote Premium
        'premium.title': '👑 Premium',
        'premium.period': '/proyecto/mes',
        'premium.description': 'Solución completa para dominar lo digital',
        'premium.feature1': 'Todo del paquete Crecimiento',
        'premium.feature2': 'Sitio web avanzado con backend y dominio propio',
        'premium.feature3': 'Sistema de compra y pago online',
        'premium.savings': 'Ahorre €200 vs. servicios individuales',
        'premium.button': 'Saber Más',
        
        // Sobre
        'about.title': 'Uniendo Talento y Experiencia',
        'about.text1': 'Giro Digital nació de la unión de dos profesionales apasionados por ayudar a pequeños negocios a crecer en el mundo digital.',
        'about.text2': 'Combinamos la experiencia en diseño de Babi Design con el desarrollo web de Richardyson para ofrecer soluciones completas y accesibles.',
        
        // CTA
        'cta.title': '¿Listo para Dar el Giro Digital a Su Negocio?',
        'cta.subtitle': 'Solicite un presupuesto gratuito y descubra cómo podemos ayudar',
        'cta.button': 'Solicitar Presupuesto Gratuito',
        
        // Contacto
        'contact.title': '¿Hablamos?',
        'contact.subtitle': 'Contáctenos y reciba una propuesta personalizada',
        
        'footer.rights': '© 2025 Giro Digital. Todos los derechos reservados.'
    },
    
    'en-US': {
        // Navigation
        'nav.home': 'Home',
        'nav.prices': 'Pricing',
        'nav.services': 'Services',
        'nav.about': 'About',
        'nav.faq': 'FAQ',
        'nav.terms': 'Terms',
        'nav.quote': 'Free Quote',
        
        // Hero Section
        'hero.title': 'Digital Marketing',
        'hero.highlight': 'Simple and Affordable',
        'hero.subtitle': 'We help small businesses grow online with complete branding, social media and website solutions.',
        'hero.btn1': 'View Packages & Pricing',
        'hero.btn2': 'Contact Us',
        
        // Pricing Section
        'pricing.title': 'Packages & Pricing',
        'pricing.subtitle': 'Choose the ideal package for your business and save up to 30%',
        
        // Starter Package
        'starter.title': '✨ Starter',
        'starter.period': '/project/month',
        'starter.description': 'Perfect to start your digital presence',
        'starter.feature1': 'Professional logo',
        'starter.feature2': 'Digital business card',
        'starter.feature3': 'Basic identity manual',
        'starter.feature4': '3 social media posts',
        'starter.feature5': 'Simple Website with Netlify hosting',
        'starter.savings': 'Save €28 vs. individual services',
        'starter.button': 'Start Now',
        
        // Growth Package
        'growth.title': '🚀 Growth',
        'growth.badge': 'Most Popular',
        'growth.period': '/project/month',
        'growth.description': 'For businesses that want to grow online',
        'growth.feature1': 'Everything from Starter package',
        'growth.feature2': 'Responsive website (up to 5 pages)',
        'growth.feature3': 'Basic SEO optimization',
        'growth.feature4': 'Social media management',
        'growth.feature5': '8 posts',
        'growth.savings': 'Save €100 vs. individual services',
        'growth.button': 'Choose This',
        
        // Premium Package
        'premium.title': '👑 Premium',
        'premium.period': '/project/month',
        'premium.description': 'Complete solution to dominate digital',
        'premium.feature1': 'Everything from Growth package',
        'premium.feature2': 'Advanced website with backend and own domain',
        'premium.feature3': 'Online purchase and payment system',
        'premium.savings': 'Save €200 vs. individual services',
        'premium.button': 'Learn More',
        
        // About
        'about.title': 'Uniting Talent and Experience',
        'about.text1': 'Giro Digital was born from the union of two professionals passionate about helping small businesses grow in the digital world.',
        'about.text2': 'We combine Babi Design\'s design expertise with Richardyson\'s web development to offer complete and affordable solutions.',
        
        // CTA
        'cta.title': 'Ready to Give Your Business the Digital Turn?',
        'cta.subtitle': 'Request a free quote and discover how we can help',
        'cta.button': 'Request Free Quote',
        
        // Contact
        'contact.title': 'Let\'s Talk?',
        'contact.subtitle': 'Contact us and receive a personalized proposal',
        
        'footer.rights': '© 2025 Giro Digital. All rights reserved.'
    }
};

// Função para obter tradução
function t(key) {
    const currentLang = localStorage.getItem('giro-language') || 'pt-PT';
    const translation = translations[currentLang] && translations[currentLang][key];
    
    // Se não encontrar a tradução no idioma atual, tentar pt-PT como fallback
    if (!translation) {
        return translations['pt-PT'][key] || key;
    }
    
    return translation;
}

// Função para aplicar traduções ao DOM
function applyTranslations() {
    // Elementos com data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
    
    // Elementos com data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
    
    // Elementos com data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });
    
    // Elementos com data-i18n-aria-label
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria-label');
        element.setAttribute('aria-label', t(key));
    });
}

// Exportar para uso global
window.GiroTranslations = {
    t,
    applyTranslations
};

// Aplicar traduções ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});