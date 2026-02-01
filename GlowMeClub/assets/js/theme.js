// ===== SISTEMA DE TEMA DINÂMICO - GLOWMECLUB =====
// Aplica a cor favorita do usuário como tema em toda a experiência

(function() {
    'use strict';

    // Cores disponíveis no cadastro
    const colorOptions = {
        '#8B5CF6': { name: 'Roxo', light: '#C4B5FD', dark: '#6D28D9', rgb: '139, 92, 246' },
        '#EC4899': { name: 'Rosa', light: '#F9A8D4', dark: '#BE185D', rgb: '236, 72, 153' },
        '#F59E0B': { name: 'Laranja', light: '#FCD34D', dark: '#D97706', rgb: '245, 158, 11' },
        '#10B981': { name: 'Verde', light: '#6EE7B7', dark: '#047857', rgb: '16, 185, 129' },
        '#3B82F6': { name: 'Azul', light: '#93C5FD', dark: '#1D4ED8', rgb: '59, 130, 246' },
        '#EF4444': { name: 'Vermelho', light: '#FCA5A5', dark: '#B91C1C', rgb: '239, 68, 68' },
        '#6366F1': { name: 'Índigo', light: '#A5B4FC', dark: '#4338CA', rgb: '99, 102, 241' },
        '#14B8A6': { name: 'Turquesa', light: '#5EEAD4', dark: '#0F766E', rgb: '20, 184, 166' },
        '#F97316': { name: 'Laranja Forte', light: '#FDBA74', dark: '#C2410C', rgb: '249, 115, 22' },
        '#A855F7': { name: 'Violeta', light: '#D8B4FE', dark: '#7C3AED', rgb: '168, 85, 247' },
        '#06B6D4': { name: 'Ciano', light: '#67E8F9', dark: '#0891B2', rgb: '6, 182, 212' },
        '#84CC16': { name: 'Lima', light: '#BEF264', dark: '#4D7C0F', rgb: '132, 204, 22' }
    };

    // Cor padrão
    const defaultColor = '#8B5CF6';

    // Converter hex para RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Clarear cor
    function lightenColor(hex, percent) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        
        const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * percent));
        const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * percent));
        const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * percent));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // Escurecer cor
    function darkenColor(hex, percent) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        
        const r = Math.floor(rgb.r * (1 - percent));
        const g = Math.floor(rgb.g * (1 - percent));
        const b = Math.floor(rgb.b * (1 - percent));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // Aplicar tema
    function applyTheme(color) {
        if (!color) color = defaultColor;
        
        const colorInfo = colorOptions[color.toUpperCase()];
        const rgb = hexToRgb(color);
        
        if (!rgb) {
            console.warn('Cor inválida:', color);
            return;
        }

        // Criar variações da cor
        const lightColor = colorInfo?.light || lightenColor(color, 0.6);
        const darkColor = colorInfo?.dark || darkenColor(color, 0.2);
        const rgbString = colorInfo?.rgb || `${rgb.r}, ${rgb.g}, ${rgb.b}`;

        // Criar ou atualizar style element
        let styleEl = document.getElementById('user-theme-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'user-theme-styles';
            document.head.appendChild(styleEl);
        }

        // Aplicar variáveis CSS personalizadas
        styleEl.textContent = `
            :root {
                --user-color: ${color};
                --user-color-light: ${lightColor};
                --user-color-dark: ${darkColor};
                --user-color-rgb: ${rgbString};
                --user-color-10: rgba(${rgbString}, 0.1);
                --user-color-20: rgba(${rgbString}, 0.2);
                --user-color-30: rgba(${rgbString}, 0.3);
            }

            /* Aplicar cor nos elementos principais */
            .btn-primary,
            .btn-checkin,
            .hub-action,
            .add-goal-btn,
            .quick-action:hover {
                background: linear-gradient(135deg, ${color}, ${darkColor}) !important;
            }

            .btn-primary:hover,
            .btn-checkin:hover {
                background: linear-gradient(135deg, ${darkColor}, ${color}) !important;
            }

            /* Links e textos destacados */
            a:hover,
            .nav-link.active,
            .nav-item.active i,
            .nav-item.active span,
            .page-title,
            .points-number,
            .card-value {
                color: ${color} !important;
            }

            /* Cards e elementos destacados */
            .card-icon.card-points {
                background: linear-gradient(135deg, ${lightColor}, ${color}) !important;
            }

            .level-glow {
                box-shadow: 0 0 40px rgba(${rgbString}, 0.3) !important;
            }

            /* Progress bars */
            .progress-fill {
                background: linear-gradient(90deg, ${color}, ${lightColor}) !important;
            }

            /* Badges e tags */
            .goal-category-badge {
                background: rgba(${rgbString}, 0.1) !important;
                color: ${color} !important;
            }

            /* Hub cards */
            .mission-cta-card,
            .hub-card {
                border-color: rgba(${rgbString}, 0.2) !important;
            }

            .streak-emoji {
                text-shadow: 0 0 20px rgba(${rgbString}, 0.5);
            }

            /* Bottom nav active */
            .bottom-nav .nav-item.active {
                color: ${color} !important;
            }

            .bottom-nav .nav-item.active::before {
                background: ${color} !important;
            }

            /* Ranking highlight */
            .ranking-item.current-user {
                background: linear-gradient(135deg, rgba(${rgbString}, 0.2), rgba(${rgbString}, 0.1)) !important;
                border-color: rgba(${rgbString}, 0.3) !important;
            }

            /* Ranking Card */
            .ranking-card {
                box-shadow: 0 10px 30px rgba(${rgbString}, 0.1) !important;
                border: 2px solid rgba(${rgbString}, 0.1) !important;
            }

            .ranking-header h3 {
                color: ${color} !important;
            }

            .user-ranking strong {
                color: ${color} !important;
            }

            /* Ranking Card Full (Dark theme) */
            .ranking-card-full {
                box-shadow: 0 8px 32px rgba(${rgbString}, 0.15) !important;
                border: 1px solid rgba(${rgbString}, 0.2) !important;
            }

            .ranking-card-full .ranking-item.current-user {
                background: linear-gradient(135deg, rgba(${rgbString}, 0.2), rgba(${rgbString}, 0.15)) !important;
                border: 1px solid rgba(${rgbString}, 0.3) !important;
            }

            .ranking-card-full .user-ranking strong {
                color: ${lightColor} !important;
            }

            .ranking-item:hover {
                background: rgba(${rgbString}, 0.08) !important;
            }

            /* Header avatar border */
            .user-avatar {
                border: 2px solid ${color} !important;
            }

            /* Modal accents */
            .modal-header {
                border-bottom-color: rgba(${rgbString}, 0.2) !important;
            }

            /* Form focus */
            .form-input:focus,
            .form-textarea:focus,
            .form-select:focus {
                border-color: ${color} !important;
                box-shadow: 0 0 0 3px rgba(${rgbString}, 0.1) !important;
            }

            /* Confetti colors override */
            .confetti {
                background: ${color} !important;
            }

            /* Welcome card gradient */
            .welcome-card {
                background: linear-gradient(135deg, ${color} 0%, ${darkColor} 100%) !important;
            }

            /* Redesigned Welcome Section */
            .welcome-container {
                background: transparent !important;
            }

            .motivational-bubble {
                border-color: ${lightColor} !important;
            }

            .btn-checkin-new {
                background: linear-gradient(135deg, ${color} 0%, ${darkColor} 100%) !important;
                box-shadow: 0 6px 20px rgba(${rgbString}, 0.3) !important;
            }

            .streak-mini {
                background: rgba(${rgbString}, 0.1) !important;
                color: ${color} !important;
            }

            /* Level Hero Section */
            .level-card-main {
                border-color: rgba(${rgbString}, 0.1) !important;
                box-shadow: 0 10px 25px rgba(${rgbString}, 0.1) !important;
            }

            .level-name-hero {
                background: linear-gradient(135deg, ${color}, ${darkColor}) !important;
                -webkit-background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
            }

            .progress-fill-hero {
                background: linear-gradient(90deg, ${color}, ${lightColor}) !important;
            }

            .level-glow-effect {
                background: radial-gradient(circle, rgba(${rgbString}, 0.2) 0%, transparent 70%) !important;
            }

            /* Ranking New */
            .ranking-card-cute {
                box-shadow: 0 12px 30px rgba(${rgbString}, 0.15) !important;
            }

            .ranking-item-cute.current-user {
                background: linear-gradient(135deg, rgba(${rgbString}, 0.25), rgba(${rgbString}, 0.15)) !important;
                border-color: rgba(${rgbString}, 0.4) !important;
            }

            .my-position-cute strong {
                color: ${color} !important;
            }

            /* Stats Grid Cute */
            .stat-card-cute:hover {
                border-color: ${color} !important;
                box-shadow: 0 10px 25px rgba(${rgbString}, 0.1) !important;
            }

            /* Welcome Section (Dashboard h1) */
            .welcome-section {
                background: linear-gradient(135deg, ${color} 0%, ${lightColor} 100%) !important;
                box-shadow: 0 10px 30px rgba(${rgbString}, 0.2) !important;
            }

            /* Hamburger Menu */
            .hamburger-btn span {
                background: ${color} !important;
            }

            .hamburger-btn:hover {
                background: rgba(${rgbString}, 0.1) !important;
            }

            /* Mobile Menu Header */
            .mobile-menu-header {
                background: linear-gradient(135deg, ${color}, ${darkColor}) !important;
            }

            /* Stats card icons */
            .card-icon.card-goals {
                background: linear-gradient(135deg, ${lightenColor(color, 0.3)}, ${color}) !important;
            }

            .card-icon.card-missions {
                background: linear-gradient(135deg, ${lightenColor(color, 0.4)}, ${lightenColor(color, 0.1)}) !important;
            }

            .card-icon.card-rewards {
                background: linear-gradient(135deg, ${lightenColor(color, 0.5)}, ${lightenColor(color, 0.2)}) !important;
            }

            /* Level showcase */
            .level-showcase-card {
                border: 1px solid rgba(${rgbString}, 0.2) !important;
            }

            /* Checkin button */
            .checkin-status {
                color: ${color} !important;
            }

            /* Mission/Goal complete */
            .goal-completed-badge,
            .mission-completed-badge {
                background: linear-gradient(135deg, ${lightColor}, ${color}) !important;
            }

            /* Reward cards */
            .reward-card:hover {
                border-color: ${color} !important;
            }

            .btn-redeem {
                background: linear-gradient(135deg, ${color}, ${darkColor}) !important;
            }

            /* Points page */
            .points-hero {
                background: linear-gradient(135deg, ${color} 0%, ${darkColor} 100%) !important;
            }

            /* Points Summary Card (página pontos - BabiPoints) */
            .points-summary-card {
                background: linear-gradient(135deg, ${color}, ${lightColor}) !important;
                box-shadow: 0 4px 16px rgba(${rgbString}, 0.3) !important;
            }

            /* Daily Progress Card (página missões) */
            .daily-progress {
                background: linear-gradient(135deg, ${color} 0%, ${lightColor} 100%) !important;
                box-shadow: 0 10px 30px rgba(${rgbString}, 0.3) !important;
            }

            /* Points Balance (página recompensas) */
            .points-balance {
                background: linear-gradient(135deg, ${color}, ${lightColor}) !important;
            }

            /* About Hero (página sobre) */
            .about-hero {
                background: linear-gradient(135deg, ${color}, ${lightColor}) !important;
            }

            /* Profile page */
            .profile-color-selector .color-option.selected {
                box-shadow: 0 0 0 3px ${color} !important;
            }

            /* Section titles and icons */
            .section-title i,
            .form-section .section-title i,
            .email-prefs-section .section-title i,
            h3.section-title i {
                color: ${color} !important;
            }

            /* Form sections borders */
            .form-section,
            .email-prefs-section {
                border-color: rgba(${rgbString}, 0.2) !important;
            }

            /* Focus Area Badge */
            .focus-area-badge {
                background: rgba(${rgbString}, 0.1) !important;
                border-color: rgba(${rgbString}, 0.2) !important;
            }

            .focus-area-badge .focus-change-btn {
                background: ${color} !important;
            }

            /* Mission cards */
            .mission-card {
                border-color: rgba(${rgbString}, 0.15) !important;
            }

            .mission-category {
                background: rgba(${rgbString}, 0.1) !important;
                color: ${color} !important;
            }

            .btn-complete {
                background: linear-gradient(135deg, ${color}, ${darkColor}) !important;
            }

            .btn-complete:hover {
                box-shadow: 0 4px 12px rgba(${rgbString}, 0.4) !important;
            }

            /* Mission History */
            .mission-history-section {
                border-top-color: rgba(${rgbString}, 0.2) !important;
            }

            .history-stat {
                background: rgba(${rgbString}, 0.1) !important;
            }

            .history-stat .stat-value {
                color: ${color} !important;
            }

            /* Goals page */
            .goal-category-badge {
                background: rgba(${rgbString}, 0.15) !important;
                color: ${color} !important;
            }

            .goal-card {
                border-color: rgba(${rgbString}, 0.15) !important;
            }

            .goal-card.completed .goal-completed-badge {
                background: linear-gradient(135deg, ${color}, ${lightColor}) !important;
                color: white !important;
            }

            .goal-card.completed .goal-completed-badge span {
                color: white !important;
            }

            .add-goal-btn {
                background: linear-gradient(135deg, ${color}, ${darkColor}) !important;
            }

            /* Points History */
            .history-item .item-action {
                color: ${color} !important;
            }

            .history-item .item-icon {
                background: rgba(${rgbString}, 0.15) !important;
                color: ${color} !important;
            }

            /* Profile form icons */
            .form-group .input-icon,
            .form-input-with-icon i {
                color: ${color} !important;
            }

            /* Select dropdowns */
            .form-select:focus,
            .form-input:focus {
                border-color: ${color} !important;
            }

            /* Tab buttons active */
            .tab-btn.active {
                background: ${color} !important;
            }

            /* Dropdown selected items */
            .color-dropdown-header .selected-color-info,
            .dropdown-header .selected-info {
                color: #1F2937 !important;
            }

            /* Level Roadmap */
            .roadmap-item.current .connector-dot {
                background: ${color} !important;
                box-shadow: 0 0 10px rgba(${rgbString}, 0.5) !important;
            }

            .roadmap-item.current .status-badge {
                background: ${color} !important;
            }

            /* Level progress in dashboard */
            .level-progress-bar {
                background: rgba(${rgbString}, 0.2) !important;
            }

            .level-progress-fill {
                background: linear-gradient(90deg, ${color}, ${lightColor}) !important;
            }

            /* Rewards page */
            .reward-card {
                border-color: rgba(${rgbString}, 0.15) !important;
            }

            .reward-cost {
                color: ${color} !important;
            }

            .btn-redeem:not(:disabled) {
                background: linear-gradient(135deg, ${color}, ${darkColor}) !important;
            }

            /* Bottom nav icons */
            .bottom-nav .nav-item.active i,
            .bottom-nav .nav-item.active span {
                color: ${color} !important;
            }

            /* Sidebar menu active */
            .mobile-menu .nav-item.active,
            .mobile-menu a.active {
                background: rgba(${rgbString}, 0.1) !important;
                color: ${color} !important;
            }

            .mobile-menu .nav-item.active i {
                color: ${color} !important;
            }
        `;

        console.log('🎨 Tema aplicado:', color);
    }

    // Obter cor do usuário
    function getUserColor() {
        // Tentar obter do cache primeiro
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            try {
                const userData = JSON.parse(cachedData);
                if (userData.preferredColor) {
                    return userData.preferredColor;
                }
            } catch (e) {
                console.warn('Erro ao parsear dados do cache');
            }
        }
        return defaultColor;
    }

    // Aplicar tema inicial
    function initTheme() {
        const color = getUserColor();
        applyTheme(color);
    }

    // Atualizar tema quando dados do usuário mudarem
    function updateTheme(newColor) {
        if (newColor) {
            applyTheme(newColor);
        }
    }

    // Escutar mudanças no localStorage
    window.addEventListener('storage', (e) => {
        if (e.key === 'cachedUserData') {
            initTheme();
        }
    });

    // Expor funções globalmente
    window.GlowTheme = {
        apply: applyTheme,
        update: updateTheme,
        init: initTheme,
        getColor: getUserColor
    };

    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

    // Re-aplicar quando a página carregar completamente (para garantir)
    window.addEventListener('load', initTheme);

})();
