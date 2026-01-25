// ===== CONFIGURAÇÃO DO AMBIENTE =====

const config = {
    // Detecta se está em desenvolvimento ou produção
    isDevelopment: window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname === '',
    
    // URL da API baseada no ambiente
    get API_BASE_URL() {
        if (this.isDevelopment) {
            return 'http://localhost:3000/api';
        }
        // Em produção, a API está na mesma URL que o frontend
        return window.location.origin + '/api';
    },
    
    // Modo de autenticação
    get authMode() {
        // Por enquanto sempre local, mas preparado para Firebase
        return 'local';
        // return this.isDevelopment ? 'local' : 'firebase';
    },
    
    // Configurações de cache
    cache: {
        enabled: true,
        duration: 1000 * 60 * 5, // 5 minutos
        offlineMode: true
    },
    
    // Configurações de timeout
    timeout: {
        default: 5000, // 5 segundos
        auth: 3000,    // 3 segundos para auth
        api: 10000     // 10 segundos para APIs pesadas
    },
    
    // Configurações de debug
    debug: {
        enabled: true,
        logLevel: 'info' // 'error', 'warn', 'info', 'debug'
    }
};

// Logger configurável
const logger = {
    error: (...args) => {
        if (config.debug.enabled && ['error', 'warn', 'info', 'debug'].includes(config.debug.logLevel)) {
            console.error(...args);
        }
    },
    warn: (...args) => {
        if (config.debug.enabled && ['warn', 'info', 'debug'].includes(config.debug.logLevel)) {
            console.warn(...args);
        }
    },
    info: (...args) => {
        if (config.debug.enabled && ['info', 'debug'].includes(config.debug.logLevel)) {
            console.log(...args);
        }
    },
    debug: (...args) => {
        if (config.debug.enabled && config.debug.logLevel === 'debug') {
            console.log(...args);
        }
    }
};

// Export global para uso em outros scripts
window.appConfig = config;
window.logger = logger;