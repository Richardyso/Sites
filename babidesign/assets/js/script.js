// ========================================
// BARBARA COSTA - DESIGNER GRÁFICA
// Portfolio Website JavaScript
// ========================================

// ========== TRANSLATIONS ==========
const translations = {
    'pt-pt': {
        // Navigation
        'nav.home': 'Início',
        'nav.about': 'Sobre',
        'nav.services': 'Serviços',
        'nav.contact': 'Contato',
        
        // Hero Section
        'hero.greeting': 'Olá, sou',
        'hero.subtitle': 'Designer Gráfica & Criadora Visual',
        'hero.description': 'Transformo ideias em design memorável. Especializada em identidade visual, social media e materiais digitais.',
        'hero.viewWork': 'Ver Serviços',
        'hero.contact': 'Entre em Contato',
        'hero.scroll': 'Role para descobrir',
        
        // About Section
        'about.label': 'Conheça-me',
        'about.title': 'Sobre Mim',
        'about.heading': 'Designer com propósito e paixão',
        'about.description1': 'Cristã, 25 anos, amo inspirar, cuidar e ajudar pessoas. Tenho canal de vlogs em redes sociais e cada dia busco crescer espiritualmente.',
        'about.description2': 'Como designer gráfica, acredito que cada projeto é uma oportunidade de criar algo único e significativo. Meu trabalho combina estética moderna com funcionalidade, sempre focando nas necessidades e visão dos meus clientes.',
        'about.yearsExp': 'Anos de Experiência',
        'about.projectsCompleted': 'Projetos Concluídos',
        'about.happyClients': 'Clientes Felizes',
        'about.workTogether': 'Vamos Trabalhar Juntos',
        'about.downloadCV': 'Baixar CV',
        
        // Filtros de Serviços
        'services.viewDetails': 'Ver Detalhes',
        'portfolio.filterAll': 'Todos',
        'portfolio.filterIdentidade': 'Identidade Visual',
        'portfolio.filterMateriaisDigitais': 'Materiais Digitais',
        'portfolio.filterIlustracoes': 'Ilustrações',
        'portfolio.filterYoutube': 'YouTube',
        'portfolio.filterMeusTrabalhos': 'Meus trabalhos',
        'portfolio.filterLogotipos': 'Logotipos',
        'portfolio.viewProject': 'Ver Projeto',
        'portfolio.customLogo': 'Logotipo personalizado',
        'portfolio.logoAndUIX': 'Logotipo e UIX do site',
        'portfolio.visitSite': 'Visitar Site',
        'portfolio.customBrand': 'Logomarca personalizada',
        'portfolio.youtubeThumbnail': 'Thumbnail personalizada para YouTube',
        'portfolio.menuDesign': 'Design de menu para restaurante',
        'portfolio.socialPost': 'Design de post para redes sociais',
        'portfolio.reelsCover': 'Design de capa para Instagram Reels',
        'portfolio.viewBothSides': 'Ver Frente/Verso',
        
        // Services Section
        'services.label': 'O que faço',
        'services.title': 'Meus Serviços',
        'services.description': 'Explore meus serviços e trabalhos criativos para transformar sua marca.',
        'services.identidadeVisual.title': 'Identidade Visual e Materiais Profissionais',
        'services.identidadeVisual.description': 'Logotipos e identidades visuais para diversos segmentos. Design único e personalizado para cada cliente.',
        'services.identidadeVisual.feature1': 'Logotipos personalizados',
        'services.identidadeVisual.feature2': 'Identidades visuais completas',
        'services.identidadeVisual.feature3': 'Branding profissional',
        'services.ilustracoes.title': 'Ilustrações Personalizadas',
        'services.ilustracoes.description': 'Ilustrações digitais personalizadas para dar vida e personalidade ao seu projeto.',
        'services.ilustracoes.feature1': 'Ilustrações digitais',
        'services.ilustracoes.feature2': 'Arte conceitual',
        'services.ilustracoes.feature3': 'Design único',
        'services.materiaisDigitais.title': 'Materiais Digitais',
        'services.materiaisDigitais.description': 'Cartões de visita personalizados — design elegante e estratégico. Materiais gráficos corporativos que reforçam a identidade da sua marca.',
        'services.materiaisDigitais.feature1': 'Cartões de visita personalizados',
        'services.materiaisDigitais.feature2': 'Materiais gráficos corporativos',
        'services.materiaisDigitais.feature3': 'E-books e catálogos digitais',
        'services.youtube.title': 'Design para YouTube e Conteúdo Audiovisual',
        'services.youtube.description': 'Thumbnails personalizadas otimizadas e chamativas que aumentam cliques e engajamento.',
        'services.youtube.feature1': 'Thumbnails personalizadas',
        'services.youtube.feature2': 'Otimizado para cliques',
        'services.youtube.feature3': 'Aumenta engajamento',
        
        // Contact Section
        'contact.label': 'Fale Comigo',
        'contact.title': 'Vamos Conversar?',
        'contact.description': 'Está pronto para transformar sua visão em realidade? Entre em contato e vamos criar algo incrível juntos!',
        'contact.form.name': 'Nome',
        'contact.form.email': 'E-mail',
        'contact.form.subject': 'Assunto',
        'contact.form.message': 'Mensagem',
        'contact.form.send': 'Enviar Mensagem',
        'contact.info.email': 'E-mail',
        'contact.info.sendEmail': 'Enviar e-mail',
        'contact.info.whatsapp': 'WhatsApp',
        'contact.info.sendMessage': 'Enviar mensagem',
        'contact.info.social': 'Redes Sociais',
        'contact.vlogs': 'Quer conhecer mais sobre minha rotina e conteúdos de autocuidado?',
        'contact.visitVlog': 'Visite meu outro site de vlogs',
        
        // Footer
        'footer.tagline': 'Designer Gráfica | Criadora Visual',
        'footer.quickLinks': 'Links Rápidos',
        'footer.contact': 'Contato',
        'footer.vlogSite': 'Meu Outro Site de Vlogs',
        'footer.rights': 'Todos os direitos reservados.',
        'footer.madeWith': 'Feito com <i class="fas fa-heart"></i> e muita criatividade',
        
        // Modal
        'modal.client': 'Cliente',
        'modal.year': 'Ano',
        'modal.category': 'Categoria',
        'modal.tools': 'Ferramentas',
        'modal.description': 'Descrição do Projeto',
        'modal.process': 'Processo Criativo',
        'modal.results': 'Resultados',
        
        // Partnership Section
        'partnership.title': 'Em Parceria com <span class="highlight-text">Giro Digital</span>',
        'partnership.description': 'Também trabalhamos com pacotes completos de desenvolvimento web e marketing digital. Soluções integradas para transformar sua presença online.',
        'partnership.button': 'Conhecer Giro Digital'
    },
    'pt-br': {
        // Navigation
        'nav.home': 'Início',
        'nav.about': 'Sobre',
        'nav.services': 'Serviços',
        'nav.contact': 'Contato',
        
        // Hero Section
        'hero.greeting': 'Olá, sou',
        'hero.subtitle': 'Designer Gráfica & Criadora Visual',
        'hero.description': 'Transformo ideias em design memorável. Especializada em identidade visual, social media e materiais digitais.',
        'hero.viewWork': 'Ver Serviços',
        'hero.contact': 'Entre em Contato',
        'hero.scroll': 'Role para descobrir',
        
        // About Section
        'about.label': 'Conheça-me',
        'about.title': 'Sobre Mim',
        'about.heading': 'Designer com propósito e paixão',
        'about.description1': 'Cristã, 25 anos, amo inspirar, cuidar e ajudar pessoas. Tenho canal de vlogs em redes sociais e cada dia busco crescer espiritualmente.',
        'about.description2': 'Como designer gráfica, acredito que cada projeto é uma oportunidade de criar algo único e significativo. Meu trabalho combina estética moderna com funcionalidade, sempre focando nas necessidades e visão dos meus clientes.',
        'about.yearsExp': 'Anos de Experiência',
        'about.projectsCompleted': 'Projetos Concluídos',
        'about.happyClients': 'Clientes Felizes',
        'about.workTogether': 'Vamos Trabalhar Juntos',
        'about.downloadCV': 'Baixar CV',
        
        // Filtros de Serviços
        'services.viewDetails': 'Ver Detalhes',
        'portfolio.filterAll': 'Todos',
        'portfolio.filterIdentidade': 'Identidade Visual',
        'portfolio.filterMateriaisDigitais': 'Materiais Digitais',
        'portfolio.filterIlustracoes': 'Ilustrações',
        'portfolio.filterYoutube': 'YouTube',
        'portfolio.filterMeusTrabalhos': 'Meus trabalhos',
        'portfolio.filterLogotipos': 'Logotipos',
        'portfolio.viewProject': 'Ver Projeto',
        'portfolio.customLogo': 'Logotipo personalizado',
        'portfolio.logoAndUIX': 'Logotipo e UIX do site',
        'portfolio.visitSite': 'Visitar Site',
        'portfolio.customBrand': 'Logomarca personalizada',
        'portfolio.youtubeThumbnail': 'Thumbnail personalizada para YouTube',
        'portfolio.menuDesign': 'Design de menu para restaurante',
        'portfolio.socialPost': 'Design de post para redes sociais',
        'portfolio.reelsCover': 'Design de capa para Instagram Reels',
        'portfolio.viewBothSides': 'Ver Frente/Verso',
        
        // Services Section
        'services.label': 'O que faço',
        'services.title': 'Meus Serviços',
        'services.description': 'Explore meus serviços e trabalhos criativos para transformar sua marca.',
        'services.identidadeVisual.title': 'Identidade Visual e Materiais Profissionais',
        'services.identidadeVisual.description': 'Logotipos e identidades visuais para diversos segmentos. Design único e personalizado para cada cliente.',
        'services.identidadeVisual.feature1': 'Logotipos personalizados',
        'services.identidadeVisual.feature2': 'Identidades visuais completas',
        'services.identidadeVisual.feature3': 'Branding profissional',
        'services.ilustracoes.title': 'Ilustrações Personalizadas',
        'services.ilustracoes.description': 'Ilustrações digitais personalizadas para dar vida e personalidade ao seu projeto.',
        'services.ilustracoes.feature1': 'Ilustrações digitais',
        'services.ilustracoes.feature2': 'Arte conceitual',
        'services.ilustracoes.feature3': 'Design único',
        'services.materiaisDigitais.title': 'Materiais Digitais',
        'services.materiaisDigitais.description': 'Cartões de visita personalizados — design elegante e estratégico. Materiais gráficos corporativos que reforçam a identidade da sua marca.',
        'services.materiaisDigitais.feature1': 'Cartões de visita personalizados',
        'services.materiaisDigitais.feature2': 'Materiais gráficos corporativos',
        'services.materiaisDigitais.feature3': 'E-books e catálogos digitais',
        'services.youtube.title': 'Design para YouTube e Conteúdo Audiovisual',
        'services.youtube.description': 'Thumbnails personalizadas otimizadas e chamativas que aumentam cliques e engajamento.',
        'services.youtube.feature1': 'Thumbnails personalizadas',
        'services.youtube.feature2': 'Otimizado para cliques',
        'services.youtube.feature3': 'Aumenta engajamento',
        
        // Contact Section
        'contact.label': 'Fale Comigo',
        'contact.title': 'Vamos Conversar?',
        'contact.description': 'Está pronto para transformar sua visão em realidade? Entre em contato e vamos criar algo incrível juntos!',
        'contact.form.name': 'Nome',
        'contact.form.email': 'E-mail',
        'contact.form.subject': 'Assunto',
        'contact.form.message': 'Mensagem',
        'contact.form.send': 'Enviar Mensagem',
        'contact.info.email': 'E-mail',
        'contact.info.sendEmail': 'Enviar e-mail',
        'contact.info.whatsapp': 'WhatsApp',
        'contact.info.sendMessage': 'Enviar mensagem',
        'contact.info.social': 'Redes Sociais',
        'contact.vlogs': 'Quer conhecer mais sobre minha rotina e conteúdos de autocuidado?',
        'contact.visitVlog': 'Visite meu outro site de vlogs',
        
        // Footer
        'footer.tagline': 'Designer Gráfica | Criadora Visual',
        'footer.quickLinks': 'Links Rápidos',
        'footer.contact': 'Contato',
        'footer.vlogSite': 'Meu Outro Site de Vlogs',
        'footer.rights': 'Todos os direitos reservados.',
        'footer.madeWith': 'Feito com <i class="fas fa-heart"></i> e muita criatividade',
        
        // Partnership Section
        'partnership.title': 'Em Parceria com <span class="highlight-text">Giro Digital</span>',
        'partnership.description': 'Também trabalhamos com pacotes completos de desenvolvimento web e marketing digital. Soluções integradas para transformar sua presença online.',
        'partnership.button': 'Conhecer Giro Digital'
    },
    'en': {
        // Navigation
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.services': 'Services',
        'nav.contact': 'Contact',
        
        // Hero Section
        'hero.greeting': 'Hello, I\'m',
        'hero.subtitle': 'Graphic Designer & Visual Creator',
        'hero.description': 'I transform ideas into memorable design. Specialized in visual identity, social media and digital materials.',
        'hero.viewWork': 'View Services',
        'hero.contact': 'Get in Touch',
        'hero.scroll': 'Scroll to discover',
        
        // About Section
        'about.label': 'Get to know me',
        'about.title': 'About Me',
        'about.heading': 'Designer with purpose and passion',
        'about.description1': 'Christian, 25 years old, I love inspiring, caring for and helping people. I have a vlog channel on social media and every day I seek to grow spiritually.',
        'about.description2': 'As a graphic designer, I believe that each project is an opportunity to create something unique and meaningful. My work combines modern aesthetics with functionality, always focusing on my clients\' needs and vision.',
        'about.yearsExp': 'Years of Experience',
        'about.projectsCompleted': 'Projects Completed',
        'about.happyClients': 'Happy Clients',
        'about.workTogether': 'Let\'s Work Together',
        'about.downloadCV': 'Download CV',
        
        // Service Filters
        'services.viewDetails': 'View Details',
        'portfolio.filterAll': 'All',
        'portfolio.filterIdentidade': 'Visual Identity',
        'portfolio.filterMateriaisDigitais': 'Digital Materials',
        'portfolio.filterIlustracoes': 'Illustrations',
        'portfolio.filterYoutube': 'YouTube',
        'portfolio.filterMeusTrabalhos': 'My Work',
        'portfolio.filterLogotipos': 'Logotypes',
        'portfolio.viewProject': 'View Project',
        'portfolio.customLogo': 'Custom logo',
        'portfolio.logoAndUIX': 'Logo and site UI/UX',
        'portfolio.visitSite': 'Visit Site',
        'portfolio.customBrand': 'Custom brand',
        'portfolio.youtubeThumbnail': 'Custom YouTube thumbnail',
        'portfolio.menuDesign': 'Restaurant menu design',
        'portfolio.socialPost': 'Social media post design',
        'portfolio.reelsCover': 'Instagram Reels cover design',
        'portfolio.viewBothSides': 'View Front/Back',
        
        // Services Section
        'services.label': 'What I do',
        'services.title': 'My Services',
        'services.description': 'Explore my services and creative work to transform your brand.',
        'services.identidadeVisual.title': 'Visual Identity & Professional Materials',
        'services.identidadeVisual.description': 'Personalized business cards — elegant and strategic design. Corporate graphic materials that reinforce your brand identity.',
        'services.identidadeVisual.feature1': 'Personalized business cards',
        'services.identidadeVisual.feature2': 'Corporate graphic materials',
        'services.identidadeVisual.feature3': 'Elegant and strategic design',
        'services.socialMedia.title': 'Social Media Design',
        'services.socialMedia.description': 'Creative posts consistent with brand identity. Personalized post packs and editable Canva templates.',
        'services.socialMedia.feature1': 'Social media posts',
        'services.socialMedia.feature2': 'Personalized post packs',
        'services.socialMedia.feature3': 'Editable Canva templates',
        'services.materiaisDigitais.title': 'Digital Materials',
        'services.materiaisDigitais.description': 'Professional e-books with visually appealing design. Guides, checklists and digital catalogs perfect for marketing.',
        'services.materiaisDigitais.feature1': 'Professional e-books',
        'services.materiaisDigitais.feature2': 'Guides and checklists',
        'services.materiaisDigitais.feature3': 'Digital catalogs',
        'services.youtube.title': 'YouTube & Audiovisual Content Design',
        'services.youtube.description': 'Personalized optimized thumbnails that increase clicks and engagement.',
        'services.youtube.feature1': 'Personalized thumbnails',
        'services.youtube.feature2': 'Optimized for clicks',
        'services.youtube.feature3': 'Increases engagement',
        
        // Contact Section
        'contact.label': 'Talk to Me',
        'contact.title': 'Let\'s Talk?',
        'contact.description': 'Are you ready to turn your vision into reality? Get in touch and let\'s create something amazing together!',
        'contact.form.name': 'Name',
        'contact.form.email': 'Email',
        'contact.form.subject': 'Subject',
        'contact.form.message': 'Message',
        'contact.form.send': 'Send Message',
        'contact.info.email': 'Email',
        'contact.info.sendEmail': 'Send email',
        'contact.info.whatsapp': 'WhatsApp',
        'contact.info.sendMessage': 'Send message',
        'contact.info.social': 'Social Media',
        'contact.vlogs': 'Want to know more about my routine and self-care content?',
        'contact.visitVlog': 'Visit my other vlog website',
        
        // Footer
        'footer.tagline': 'Graphic Designer | Visual Creator',
        'footer.quickLinks': 'Quick Links',
        'footer.contact': 'Contact',
        'footer.vlogSite': 'My Other Vlog Website',
        'footer.rights': 'All rights reserved.',
        'footer.madeWith': 'Made with <i class="fas fa-heart"></i> and lots of creativity',
        
        // Modal
        'modal.client': 'Client',
        'modal.tools': 'Tools',
        
        // Partnership Section
        'partnership.title': 'In Partnership with <span class="highlight-text">Giro Digital</span>',
        'partnership.description': 'We also work with complete web development and digital marketing packages. Integrated solutions to transform your online presence.',
        'partnership.button': 'Discover Giro Digital'
    },
    'es': {
        // Navigation
        'nav.home': 'Inicio',
        'nav.about': 'Sobre',
        'nav.services': 'Servicios',
        'nav.contact': 'Contacto',
        
        // Hero Section
        'hero.greeting': 'Hola, soy',
        'hero.subtitle': 'Diseñadora Gráfica & Creadora Visual',
        'hero.description': 'Transformo ideas en diseño memorable. Especializada en identidad visual, redes sociales y materiales digitales.',
        'hero.viewWork': 'Ver Servicios',
        'hero.contact': 'Ponerse en Contacto',
        'hero.scroll': 'Desplácese para descubrir',
        
        // About Section
        'about.label': 'Conóceme',
        'about.title': 'Sobre Mí',
        'about.heading': 'Diseñadora con propósito y pasión',
        'about.description1': 'Cristiana, 25 años, amo inspirar, cuidar y ayudar a las personas. Tengo un canal de vlogs en redes sociales y cada día busco crecer espiritualmente.',
        'about.description2': 'Como diseñadora gráfica, creo que cada proyecto es una oportunidad para crear algo único y significativo. Mi trabajo combina estética moderna con funcionalidad, siempre enfocándome en las necesidades y visión de mis clientes.',
        'about.yearsExp': 'Años de Experiencia',
        'about.projectsCompleted': 'Proyectos Completados',
        'about.happyClients': 'Clientes Felices',
        'about.workTogether': 'Trabajemos Juntos',
        'about.downloadCV': 'Descargar CV',
        
        // Filtros de Servicios
        'services.viewDetails': 'Ver Detalles',
        'portfolio.filterAll': 'Todos',
        'portfolio.filterIdentidade': 'Identidad Visual',
        'portfolio.filterMateriaisDigitais': 'Materiales Digitales',
        'portfolio.filterIlustracoes': 'Ilustraciones',
        'portfolio.filterYoutube': 'YouTube',
        'portfolio.filterMeusTrabalhos': 'Mis trabajos',
        'portfolio.filterLogotipos': 'Logotipos',
        'portfolio.viewProject': 'Ver Proyecto',
        'portfolio.customLogo': 'Logotipo personalizado',
        'portfolio.logoAndUIX': 'Logotipo y UI/UX del sitio',
        'portfolio.visitSite': 'Visitar Sitio',
        'portfolio.customBrand': 'Logomarca personalizada',
        'portfolio.youtubeThumbnail': 'Miniatura personalizada para YouTube',
        'portfolio.menuDesign': 'Diseño de menú para restaurante',
        'portfolio.socialPost': 'Diseño de publicación para redes sociales',
        'portfolio.reelsCover': 'Diseño de portada para Instagram Reels',
        'portfolio.viewBothSides': 'Ver Frente/Reverso',
        
        // Services Section
        'services.label': 'Lo que hago',
        'services.title': 'Mis Servicios',
        'services.description': 'Explora mis servicios y trabajos creativos para transformar tu marca.',
        'services.identidadeVisual.title': 'Identidad Visual y Materiales Profesionales',
        'services.identidadeVisual.description': 'Tarjetas de visita personalizadas — diseño elegante y estratégico. Materiales gráficos corporativos que refuerzan la identidad de tu marca.',
        'services.identidadeVisual.feature1': 'Tarjetas de visita personalizadas',
        'services.identidadeVisual.feature2': 'Materiales gráficos corporativos',
        'services.identidadeVisual.feature3': 'Diseño elegante y estratégico',
        'services.socialMedia.title': 'Diseño para Redes Sociales',
        'services.socialMedia.description': 'Publicaciones creativas coherentes con la identidad de marca. Packs de publicaciones personalizados y plantillas editables en Canva.',
        'services.socialMedia.feature1': 'Publicaciones para redes sociales',
        'services.socialMedia.feature2': 'Packs de publicaciones personalizados',
        'services.socialMedia.feature3': 'Plantillas editables en Canva',
        'services.materiaisDigitais.title': 'Materiales Digitales',
        'services.materiaisDigitais.description': 'E-books profesionales con diseño visualmente atractivo. Guías, checklists y catálogos digitales perfectos para marketing.',
        'services.materiaisDigitais.feature1': 'E-books profesionales',
        'services.materiaisDigitais.feature2': 'Guías y checklists',
        'services.materiaisDigitais.feature3': 'Catálogos digitales',
        'services.youtube.title': 'Diseño para YouTube y Contenido Audiovisual',
        'services.youtube.description': 'Miniaturas personalizadas optimizadas que aumentan clics y engagement.',
        'services.youtube.feature1': 'Miniaturas personalizadas',
        'services.youtube.feature2': 'Optimizado para clics',
        'services.youtube.feature3': 'Aumenta engagement',
        
        // Contact Section
        'contact.label': 'Habla Conmigo',
        'contact.title': '¿Hablamos?',
        'contact.description': '¿Estás listo para convertir tu visión en realidad? Ponte en contacto y creemos algo increíble juntos!',
        'contact.form.name': 'Nombre',
        'contact.form.email': 'Correo electrónico',
        'contact.form.subject': 'Asunto',
        'contact.form.message': 'Mensaje',
        'contact.form.send': 'Enviar Mensaje',
        'contact.info.email': 'Correo electrónico',
        'contact.info.sendEmail': 'Enviar correo',
        'contact.info.whatsapp': 'WhatsApp',
        'contact.info.sendMessage': 'Enviar mensaje',
        'contact.info.social': 'Redes Sociales',
        'contact.vlogs': '¿Quieres saber más sobre mi rutina y contenido de autocuidado?',
        'contact.visitVlog': 'Visita mi otro sitio de vlogs',
        
        // Footer
        'footer.tagline': 'Diseñadora Gráfica | Creadora Visual',
        'footer.quickLinks': 'Enlaces Rápidos',
        'footer.contact': 'Contacto',
        'footer.vlogSite': 'Mi Otro Sitio de Vlogs',
        'footer.rights': 'Todos los derechos reservados.',
        'footer.madeWith': 'Hecho con <i class="fas fa-heart"></i> y mucha creatividad',
        
        // Modal
        'modal.client': 'Cliente',
        'modal.tools': 'Herramientas',
        
        // Partnership Section
        'partnership.title': 'En Asociación con <span class="highlight-text">Giro Digital</span>',
        'partnership.description': 'También trabajamos con paquetes completos de desarrollo web y marketing digital. Soluciones integradas para transformar tu presencia online.',
        'partnership.button': 'Conocer Giro Digital'
    }
};

// ========== GLOBAL VARIABLES ==========
// Detectar idioma inicial baseado na localização do usuário
function detectInitialLanguage() {
    // Verificar se já tem preferência salva
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        return savedLanguage;
    }
    
    // Detectar pela localização do navegador
    const userLanguage = navigator.language || navigator.userLanguage;
    
    if (userLanguage.toLowerCase().includes('pt-br') || userLanguage.toLowerCase() === 'pt-br') {
        return 'pt-br';
    } else if (userLanguage.toLowerCase().includes('pt-pt') || userLanguage.toLowerCase() === 'pt') {
        return 'pt-pt';
    } else if (userLanguage.toLowerCase().includes('es')) {
        return 'es';
    } else if (userLanguage.toLowerCase().includes('en')) {
        return 'en';
    }
    
    // Padrão: Português PT
    return 'pt-pt';
}

let currentLanguage = detectInitialLanguage();
let isFromBrazil = false; // Variável global para armazenar se o acesso é do Brasil

// ========== DETECÇÃO RÁPIDA DE LOCALIZAÇÃO (BRASIL) - COMENTADO ==========
// Desativado: todos veem +351. Para reativar detecção de brasileiros (+55 21 997499808), descomente o bloco abaixo.
/*
(function quickBrazilDetection() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const brazilTimezones = ['America/Sao_Paulo', 'America/Rio_de_Janeiro', 'America/Brasilia', 
                                'America/Fortaleza', 'America/Bahia', 'America/Recife'];
        
        if (brazilTimezones.some(tz => timezone.includes(tz))) {
            isFromBrazil = true;
            console.log('⚡ Brasil detectado instantaneamente por timezone:', timezone);
            return;
        }
    } catch (e) {}
    
    const lang = navigator.language || navigator.userLanguage || '';
    if (lang.toLowerCase() === 'pt-br') {
        isFromBrazil = true;
        console.log('⚡ Brasil detectado instantaneamente por idioma');
    }
})();
*/

// ========== GEOLOCATION DETECTION ==========
// Desativado: todos veem +351. Para reativar detecção de brasileiros (+55 21 997499808), descomente o bloco abaixo.
async function detectBrazilLocation() {
    // Sempre usar Portugal (+351) - detecção de Brasil desativada
    isFromBrazil = false;
    updateWhatsAppByLocation();
    
    /* --- DETECÇÃO BRASIL COMENTADA - Para reativar, descomente este bloco ---
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const brazilTimezones = ['America/Sao_Paulo', 'America/Rio_de_Janeiro', 'America/Brasilia', 
                                'America/Fortaleza', 'America/Bahia', 'America/Recife', 
                                'America/Belem', 'America/Manaus', 'America/Porto_Velho'];
        
        if (brazilTimezones.some(tz => timezone.includes(tz))) {
            isFromBrazil = true;
            console.log('🇧🇷 Acesso do Brasil detectado por timezone:', timezone);
            updateWhatsAppByLocation();
            return;
        }
    } catch (e) {
        console.log('Erro ao detectar timezone');
    }
    
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.toLowerCase() === 'pt-br') {
        isFromBrazil = true;
        console.log('🇧🇷 Acesso do Brasil detectado por idioma');
        updateWhatsAppByLocation();
        return;
    }
    
    isFromBrazil = false;
    updateWhatsAppByLocation();
    
    try {
        const response = await fetch('https://ipapi.co/json/', { 
            signal: AbortSignal.timeout(3000)
        });
        const data = await response.json();
        
        if (data && data.country_code === 'BR' && !isFromBrazil) {
            isFromBrazil = true;
            console.log('🇧🇷 Confirmado: Acesso do Brasil via IP');
            updateWhatsAppByLocation();
        } else if (data && data.country_code === 'BR' && isFromBrazil) {
            console.log('✅ Detecção confirmada: Brasil');
        }
    } catch (error) {
        console.log('API de geolocalização não disponível, usando detecção local');
    }
    --- FIM DETECÇÃO BRASIL --- */
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Barbara - Portfolio Website Loaded');
    
    // Detectar localização do Brasil IMEDIATAMENTE
    detectBrazilLocation();
    
    // Initialize all functions
    initLanguageSelector();
    initNavigation();
    initPortfolioFilters();
    initScrollAnimations();
    initBackToTop();
    initContactForm();
    setupSmoothScroll();
    
    // Set initial language
    changeLanguage(currentLanguage);
    
    // Add fade-in animation to sections
    observeSections();
});

// ========== LANGUAGE FUNCTIONS ==========
function initLanguageSelector() {
    const langToggle = document.getElementById('lang-toggle');
    const langDropdown = document.getElementById('lang-dropdown');
    const langSelector = document.querySelector('.language-selector');
    const langOptions = document.querySelectorAll('.lang-option');
    
    if (!langToggle || !langDropdown) return;
    
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
    
    // Set initial language display
    updateLanguageDisplay(currentLanguage);
}

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
    
    // Número do WhatsApp agora é baseado em localização, não idioma
}

function updateLanguageDisplay(lang) {
    const currentFlag = document.getElementById('current-flag');
    const currentLang = document.getElementById('current-lang');
    
    const langMap = {
        'pt-pt': { flag: '🇵🇹', code: 'PT' },
        'pt-br': { flag: '🇧🇷', code: 'BR' },
        'en': { flag: '🇺🇸', code: 'EN' },
        'es': { flag: '🇪🇸', code: 'ES' }
    };
    
    if (langMap[lang] && currentFlag && currentLang) {
        currentFlag.textContent = langMap[lang].flag;
        currentLang.textContent = langMap[lang].code;
    }
}

// Função para atualizar o número do WhatsApp baseado na localização
function updateWhatsAppByLocation() {
    // Sempre usar Portugal (+351) - Brasil desativado. Para reativar: use as linhas comentadas abaixo
    const portugalNumber = '+351915437587';
    const number = portugalNumber;
    const formattedNumber = '+351 915 437 587';
    
    /* --- NÚMERO BRASIL (+55 21 997499808) COMENTADO - Para reativar, descomente e use no lugar das linhas acima ---
    const brazilNumber = '+5521997499808';
    const number = isFromBrazil ? brazilNumber : portugalNumber;
    const formattedNumber = isFromBrazil ? '+55 21 99749-9808' : '+351 915 437 587';
    --- */
    const cleanNumber = number.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    
    // Atualizar número na seção de contato
    const whatsappNumberElement = document.getElementById('whatsapp-number');
    if (whatsappNumberElement) {
        whatsappNumberElement.textContent = formattedNumber;
    }
    
    // Atualizar número no footer
    const footerWhatsappNumber = document.getElementById('footer-whatsapp-number');
    if (footerWhatsappNumber) {
        footerWhatsappNumber.textContent = formattedNumber;
    }
    
    // Atualizar link do WhatsApp na seção de contato
    const whatsappLink = document.getElementById('whatsapp-link');
    if (whatsappLink) {
        const message = encodeURIComponent('Amei seu Portifólio');
        whatsappLink.href = `https://wa.me/${cleanNumber}?text=${message}`;
    }
    
    // Atualizar botão flutuante do WhatsApp
    const whatsappFloat = document.getElementById('whatsapp-float');
    if (whatsappFloat) {
        const message = encodeURIComponent('Amei seu Portifólio');
        whatsappFloat.href = `https://wa.me/${cleanNumber}?text=${message}`;
    }
    
    // Armazenar o número atual para uso na geração do CV
    window.currentWhatsAppNumber = formattedNumber;
}

// Função mantida para compatibilidade mas agora não altera o WhatsApp
function updateWhatsAppNumber(lang) {
    // Esta função agora não faz nada pois o WhatsApp é baseado em localização
    // Mantida para não quebrar chamadas existentes
}

// ========== NAVIGATION FUNCTIONS ==========
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    // Scroll effect on navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuToggle) {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });
    
    // Active link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ========== SMOOTH SCROLL ==========
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80; // navbar height
                const targetPosition = target.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========== PORTFOLIO FILTERS ==========
function initPortfolioFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    // Função para aplicar filtro
    function applyFilter(filter) {
        portfolioItems.forEach(item => {
            const category = item.getAttribute('data-category');
            
            // Filtra por categoria
            if (category === filter) {
                item.classList.remove('hide');
                item.style.display = 'block';
            } else {
                item.classList.add('hide');
                item.style.display = 'none';
            }
        });
    }
    
    // Adiciona evento de clique aos botões
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            applyFilter(filter);
        });
    });
    
    // Aplica o primeiro filtro ao carregar
    if (filterBtns.length > 0) {
        const firstFilter = filterBtns[0].getAttribute('data-filter');
        applyFilter(firstFilter);
    }
}

// ========== PROJECT MODAL ==========
function openProjectModal(projectId) {
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    
    // Project data (you can expand this with real data)
    const projects = {
        201: {
            title: 'Identidade Visual e Materiais Profissionais',
            category: 'Identidade Visual',
            image: 'assets/brew-coffee.png',
            description: 'Logotipos e identidades visuais para diversos segmentos como cafeterias, restaurantes, boutiques e mais. Design único e personalizado para cada cliente com foco em criar marcas memoráveis.',
            client: 'Empresas Diversas',
            year: '2024',
            tools: 'Adobe Illustrator, Photoshop'
        },
        202: {
            title: 'Materiais Digitais',
            category: 'Materiais Digitais',
            image: 'assets/Design_Grafico.jpg',
            description: 'Cartões de visita personalizados com design elegante e estratégico para causar a melhor primeira impressão. Materiais gráficos corporativos, e-books profissionais, guias, checklists e catálogos digitais perfeitos para infoprodutos e estratégias de marketing.',
            client: 'Empresas e Profissionais',
            year: '2024',
            tools: 'Adobe Illustrator, InDesign, Photoshop'
        },
        203: {
            title: 'Ilustrações Personalizadas',
            category: 'Ilustrações',
            image: 'assets/Ilustracoes.png',
            description: 'Ilustrações digitais personalizadas para dar vida e personalidade ao seu projeto. Arte conceitual única e design exclusivo para cada cliente.',
            client: 'Diversos Clientes',
            year: '2024',
            tools: 'Adobe Illustrator, Procreate, Photoshop'
        },
        204: {
            title: 'Design para YouTube e Conteúdo Audiovisual',
            category: 'YouTube',
            image: 'assets/Thumbnails.jpg',
            description: 'Thumbnails personalizadas — capas otimizadas e chamativas que aumentam cliques e engajamento. Design impactante que aumenta significativamente a taxa de cliques e visualizações dos vídeos.',
            client: 'Criadores de Conteúdo',
            year: '2024',
            tools: 'Photoshop, Canva Pro, After Effects'
        },
        1: {
            title: 'Brew & Co.',
            category: 'Logotipo Vintage',
            image: 'assets/brew-coffee.png',
            description: 'Logotipo vintage para cafeteria artesanal com estilo retrô anos 50/60. Design nostálgico que remete à tradição do café de qualidade.',
            client: 'Cafeteria Artesanal',
            year: '2023',
            tools: 'Adobe Illustrator, Photoshop'
        },
        2: {
            title: 'Luna Boutique',
            category: 'Identidade Visual',
            image: 'assets/luna-boutique.png',
            description: 'Identidade visual sofisticada para boutique de moda feminina. Ilustração elegante com paleta vibrante e moderna.',
            client: 'Boutique de Moda',
            year: '2023',
            tools: 'Adobe Illustrator'
        },
        3: {
            title: 'The Greenhouse',
            category: 'Branding',
            image: 'assets/greenhouse.png',
            description: 'Branding completo para loja de plantas e jardinagem. Design vintage que transmite natureza e sustentabilidade.',
            client: 'Loja de Plantas',
            year: '2023',
            tools: 'Adobe Illustrator, Photoshop'
        },
        4: {
            title: 'Neon Pulse',
            category: 'Logo Moderno',
            image: 'assets/neon-pulse.PNG',
            description: 'Logo moderno com efeito neon para academia fitness. Design energético e tecnológico que transmite dinamismo.',
            client: 'Academia Fitness',
            year: '2024',
            tools: 'Adobe Illustrator, After Effects'
        },
        5: {
            title: 'Veludo Noir',
            category: 'Identidade Premium',
            image: 'assets/veludo-noir.PNG',
            description: 'Identidade visual sofisticada e elegante para cocktail lounge premium. Design minimalista com toques dourados.',
            client: 'Cocktail Lounge',
            year: '2024',
            tools: 'Adobe Illustrator'
        },
        6: {
            title: 'Ferro & Fogo',
            category: 'Branding Premium',
            image: 'assets/ferro-e-fogo.PNG',
            description: 'Branding premium para churrascaria de alto padrão. Design robusto com elementos que remetem ao fogo e tradição.',
            client: 'Churrascaria Premium',
            year: '2024',
            tools: 'Adobe Illustrator, Photoshop'
        },
        7: {
            title: 'Pastelaria Santa Rita',
            category: 'Identidade Vintage',
            image: 'assets/pastelaria-santa-rita.png',
            description: 'Identidade visual vintage para pastelaria tradicional portuguesa. Design nostálgico que celebra a tradição desde 1957.',
            client: 'Pastelaria Tradicional',
            year: '2023',
            tools: 'Adobe Illustrator'
        },
        8: {
            title: 'Raiz Urbana',
            category: 'Logo Contemporâneo',
            image: 'assets/raiz-urbana.PNG',
            description: 'Logo clean e contemporâneo para restaurante de cozinha moderna. Design minimalista que une tradição e inovação.',
            client: 'Restaurante Contemporâneo',
            year: '2024',
            tools: 'Adobe Illustrator'
        },
        9: {
            title: 'Cafetaria São João',
            category: 'Identidade Visual',
            image: 'assets/cafetaria-sao-joao.png',
            description: 'Identidade visual para café tradicional português. Design que celebra a cultura e tradição do café.',
            client: 'Café Tradicional',
            year: '2023',
            tools: 'Adobe Illustrator, Photoshop'
        },
        10: {
            title: 'Cantinho do Pão',
            category: 'Branding',
            image: 'assets/cantinho-do-pao.png',
            description: 'Branding acolhedor para padaria artesanal. Design que transmite calor, tradição e produtos frescos.',
            client: 'Padaria Artesanal',
            year: '2023',
            tools: 'Adobe Illustrator'
        },
        11: {
            title: 'Cervejaria Artesanal',
            category: 'Identidade Visual',
            image: 'assets/cervejaria.png',
            description: 'Identidade visual autêntica para cervejaria craft. Design que celebra a arte de produzir cervejas especiais.',
            client: 'Cervejaria Craft',
            year: '2024',
            tools: 'Adobe Illustrator, Photoshop'
        },
        12: {
            title: 'Floir Coffee',
            category: 'Logo Moderno',
            image: 'assets/floir-coffee.png',
            description: 'Logo contemporâneo para coffee shop especializado. Design minimalista e sofisticado para amantes de café especial.',
            client: 'Coffee Shop',
            year: '2024',
            tools: 'Adobe Illustrator'
        },
        13: {
            title: 'Lua Crescente',
            category: 'Identidade Visual',
            image: 'assets/lua-crescente.PNG',
            description: 'Identidade visual serena para marca de wellness e bem-estar. Design que transmite paz, equilíbrio e conexão.',
            client: 'Marca Wellness',
            year: '2024',
            tools: 'Adobe Illustrator'
        }
    };
    
    const project = projects[projectId];
    
    if (project) {
        modalBody.innerHTML = `
            <div class="modal-header">
                <span class="modal-category">${project.category}</span>
                <h2>${project.title}</h2>
            </div>
            <div class="modal-image">
                <img src="${project.image}" alt="${project.title}">
            </div>
            <div class="modal-description">
                <p>${project.description}</p>
            </div>
        `;
        
        // Aplicar traduções no modal
        setTimeout(() => {
            document.querySelectorAll('#modal-body [data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (translations[currentLanguage] && translations[currentLanguage][key]) {
                    element.innerHTML = translations[currentLanguage][key];
                }
            });
        }, 10);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Gallery modal to show multiple images (frente/verso)
function openImageGallery(images = [], title = 'Projeto') {
    const modal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody || !Array.isArray(images) || images.length === 0) return;

    let currentIndex = 0;

    function renderGallery() {
        const currentImage = images[currentIndex];
        modalBody.innerHTML = `
            <div class="modal-header">
                <span class="modal-category">Cartão de Visita</span>
                <h2>${title}</h2>
            </div>
            <div class="modal-image" style="position:relative;">
                <img id="gallery-image" src="${currentImage}" alt="${title}" style="max-height:70vh; object-fit:contain;">
                ${images.length > 1 ? `
                <button id="prev-image" aria-label="Anterior" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);" class="btn btn-secondary">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button id="next-image" aria-label="Próxima" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);" class="btn btn-secondary">
                    <i class="fas fa-chevron-right"></i>
                </button>` : ''}
            </div>
            ${images.length > 1 ? `
            <div class="modal-description" style="text-align:center;">
                <p>${currentIndex === 0 ? 'Frente' : 'Verso'}</p>
            </div>` : ''}
        `;

        if (images.length > 1) {
            document.getElementById('prev-image').onclick = () => {
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                renderGallery();
            };
            document.getElementById('next-image').onclick = () => {
                currentIndex = (currentIndex + 1) % images.length;
                renderGallery();
            };
        }
    }

    renderGallery();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProjectModal();
    }
});

// ========== BACK TO TOP BUTTON ==========
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
    // Animate elements on scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.service-card, .portfolio-item, .stat-item');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('fade-in');
            }
        });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Initial check
}

// ========== INTERSECTION OBSERVER FOR SECTIONS ==========
function observeSections() {
    const sections = document.querySelectorAll('section');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// ========== CONTACT FORM ==========
function initContactForm() {
    const form = document.getElementById('contact-form');
    
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span> Enviando...';
        submitBtn.disabled = true;
        
        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            // Success message
            showNotification('Mensagem enviada com sucesso! Entrarei em contato em breve.', 'success');
            
            // Reset form
            form.reset();
            
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // In a real scenario, you would send this data to a backend API
            console.log('Form data:', formData);
        }, 2000);
    });
}

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #7b4397, #9b59b6)' : '#e74c3c'};
        color: white;
        padding: 20px 25px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 15px;
        font-weight: 500;
        animation: slideInRight 0.4s ease-out;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 400);
    }, 4000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// ========== CV DOWNLOAD ==========
function generateCV() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações
    const primaryColor = [123, 67, 151]; // #7b4397
    const darkColor = [74, 31, 94]; // #4a1f5e
    const grayColor = [100, 100, 100];
    
    // Textos traduzidos baseados no idioma atual
    const lang = currentLanguage;
    const texts = {
        'pt-pt': {
            subtitle: 'Designer Gráfica & Criadora Visual',
            about: 'SOBRE MIM',
            aboutText: 'Cristã, 25 anos, amo inspirar, cuidar e ajudar pessoas. Designer gráfica apaixonada por criar experiências visuais únicas. Cada projeto é uma oportunidade de criar algo significativo que conecta marcas e pessoas.',
            services: 'SERVIÇOS',
            skills: 'HABILIDADES',
            experience: 'EXPERIÊNCIA',
            expTitle: 'Designer Gráfica Freelancer',
            expText: 'Projetos de identidade visual, social media e design editorial para clientes nacionais e internacionais.',
            differentials: 'DIFERENCIAIS',
            social: 'REDES SOCIAIS',
            footer: '© 2025 Barbara - Designer Gráfica'
        },
        'pt-br': {
            subtitle: 'Designer Gráfica & Criadora Visual',
            about: 'SOBRE MIM',
            aboutText: 'Cristã, 25 anos, amo inspirar, cuidar e ajudar pessoas. Designer gráfica apaixonada por criar experiências visuais únicas. Cada projeto é uma oportunidade de criar algo significativo que conecta marcas e pessoas.',
            services: 'SERVIÇOS',
            skills: 'HABILIDADES',
            experience: 'EXPERIÊNCIA',
            expTitle: 'Designer Gráfica Freelancer',
            expText: 'Projetos de identidade visual, social media e design editorial para clientes nacionais e internacionais.',
            differentials: 'DIFERENCIAIS',
            social: 'REDES SOCIAIS',
            footer: '© 2025 Barbara - Designer Gráfica'
        },
        'en': {
            subtitle: 'Graphic Designer & Visual Creator',
            about: 'ABOUT ME',
            aboutText: 'Christian, 25 years old, I love inspiring, caring for and helping people. Graphic designer passionate about creating unique visual experiences. Each project is an opportunity to create something meaningful.',
            services: 'SERVICES',
            skills: 'SKILLS',
            experience: 'EXPERIENCE',
            expTitle: 'Freelance Graphic Designer',
            expText: 'Visual identity, social media and editorial design projects for national and international clients.',
            differentials: 'STRENGTHS',
            social: 'SOCIAL MEDIA',
            footer: '© 2025 Barbara - Graphic Designer'
        },
        'es': {
            subtitle: 'Diseñadora Gráfica & Creadora Visual',
            about: 'SOBRE MÍ',
            aboutText: 'Cristiana, 25 años, amo inspirar, cuidar y ayudar a las personas. Diseñadora gráfica apasionada por crear experiencias visuales únicas. Cada proyecto es una oportunidad de crear algo significativo.',
            services: 'SERVICIOS',
            skills: 'HABILIDADES',
            experience: 'EXPERIENCIA',
            expTitle: 'Diseñadora Gráfica Freelancer',
            expText: 'Proyectos de identidad visual, redes sociales y diseño editorial para clientes nacionales e internacionales.',
            differentials: 'DIFERENCIALES',
            social: 'REDES SOCIALES',
            footer: '© 2025 Barbara - Diseñadora Gráfica'
        }
    };
    
    const t = texts[lang] || texts['pt-pt'];
    
    // Função auxiliar para adicionar texto com quebra de linha automática
    function addTextWithWrap(text, x, y, maxWidth, fontSize = 11) {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * (fontSize * 0.35)) + 2;
    }
    
    // Header com fundo roxo
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Tentar adicionar foto
    const img = document.querySelector('.about-img');
    if (img && img.complete && img.naturalWidth > 0) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            doc.addImage(imgData, 'JPEG', 15, 10, 35, 35);
        } catch (e) {
            console.log('Foto não adicionada:', e);
            // Adicionar placeholder se a foto falhar
            doc.setFillColor(200, 200, 200);
            doc.rect(15, 10, 35, 35, 'F');
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(8);
            doc.text('FOTO', 30, 27, { align: 'center' });
        }
    } else {
        // Adicionar placeholder se não houver foto
        doc.setFillColor(200, 200, 200);
        doc.rect(15, 10, 35, 35, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text('FOTO', 30, 27, { align: 'center' });
    }
    
    // Nome (ao lado da foto)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BARBARA', 55, 25);
    
    // Subtítulo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(t.subtitle, 55, 32);
    
    // Informações de Contato
    doc.setFontSize(9);
    doc.text('profissionalbarbaracosta@gmail.com', 55, 38);
    
    // Usar o número do WhatsApp baseado no idioma atual
    const whatsappNumber = window.currentWhatsAppNumber || '+351 915 437 587';
    doc.text(whatsappNumber + '  |  WhatsApp', 55, 43);
    
    // Linha decorativa
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);
    
    let currentY = 65;
    
    // Sobre Mim
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t.about, 20, currentY);
    currentY += 10;
    
    doc.setTextColor(...grayColor);
    currentY = addTextWithWrap(t.aboutText, 20, currentY, 170, 10) + 5;
    
    // Serviços
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t.services, 20, currentY);
    currentY += 10;
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const services = [
        'IDENTIDADE VISUAL E MATERIAIS PROFISSIONAIS',
        '   • Logotipos Personalizados • Identidades Visuais Completas • Branding Profissional',
        '',
        'MATERIAIS DIGITAIS',
        '   • Cartões de Visita • Materiais Gráficos Corporativos • E-books e Catálogos',
        '',
        'ILUSTRAÇÕES PERSONALIZADAS',
        '   • Ilustrações Digitais • Arte Conceitual • Design Único',
        '',
        'DESIGN PARA YOUTUBE E CONTEÚDO AUDIOVISUAL',
        '   • Thumbnails Personalizadas • Otimização para Cliques • Aumento de Engajamento'
    ];
    
    services.forEach(service => {
        if (service === '') {
            currentY += 3;
        } else if (service.startsWith('   •')) {
            // Itens da lista
            currentY = addTextWithWrap(service, 20, currentY, 170, 10) + 2;
        } else {
            // Títulos das seções
            doc.setTextColor(...darkColor);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(service, 20, currentY);
            currentY += 6;
            doc.setTextColor(...grayColor);
            doc.setFont('helvetica', 'normal');
        }
    });
    
    currentY += 5;
    
    // Habilidades
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t.skills, 20, currentY);
    currentY += 10;
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const skills = [
        'Adobe Illustrator • Adobe Photoshop • Adobe InDesign • Figma',
        'Canva Pro • Procreate • Adobe XD • After Effects',
        'Branding • Typography • Color Theory • UI/UX Design'
    ];
    
    skills.forEach(skill => {
        currentY = addTextWithWrap(skill, 20, currentY, 170, 10) + 2;
    });
    
    currentY += 5;
    
    // Experiência
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t.experience, 20, currentY);
    currentY += 10;
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(t.expTitle, 20, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'normal');
    currentY = addTextWithWrap(t.expText, 20, currentY, 170, 10) + 5;
    
    // Diferenciais
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t.differentials, 20, currentY);
    currentY += 10;
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const differentials = [
        '• Design estratégico focado em resultados',
        '• Atenção aos detalhes e qualidade em cada pixel',
        '• Comunicação clara e processo colaborativo',
        '• Prazos respeitados e profissionalismo',
        '• Criatividade aliada à funcionalidade'
    ];
    
    differentials.forEach(diff => {
        currentY = addTextWithWrap(diff, 20, currentY, 170, 10) + 2;
    });
    
    currentY += 5;
    
    // Redes Sociais
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t.social, 20, currentY);
    currentY += 10;
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Redes sociais em duas colunas
    doc.text('Instagram: @minhavidateuvlog', 20, currentY);
    doc.text('YouTube: @minhavidateuvlog', 110, currentY);
    currentY += 5;
    
    doc.text('Pinterest: Barbara', 20, currentY);
    currentY += 5;
    
    doc.text('Site: minhavidateuvlog.netlify.app', 20, currentY);
    
    // Footer
    doc.setFillColor(...primaryColor);
    doc.rect(0, 285, 210, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(t.footer + '  |  profissionalbarbaracosta@gmail.com', 105, 290, { align: 'center' });
    
    // Salvar PDF
    doc.save('CV-Barbara-Costa-Designer-Grafica.pdf');
}

document.getElementById('download-cv')?.addEventListener('click', (e) => {
    e.preventDefault();
    generateCV();
    showNotification('CV baixado com sucesso! 📄', 'success');
});

// ========== PAGE LOAD ANIMATION ==========
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});

// ========== CONSOLE MESSAGE ==========
console.log('%c🎨 Barbara - Portfolio', 'color: #7b4397; font-size: 20px; font-weight: bold;');
console.log('%cDesigner Gráfica | Criadora Visual', 'color: #9b59b6; font-size: 14px;');
console.log('%cContato: profissionalbarbaracosta@gmail.com', 'color: #666; font-size: 12px;');

