// ===== API UNIFICADA =====

class API {
    constructor() {
        this.baseURL = window.appConfig.API_BASE_URL;
        this.timeout = window.appConfig.timeout.default;
        this.cache = new Map();
        this.offlineQueue = [];
    }
    
    // Headers padrão
    getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }
    
    // Token management
    getToken() {
        return localStorage.getItem('authToken');
    }
    
    saveToken(token) {
        logger.debug('💾 Salvando token');
        localStorage.setItem('authToken', token);
    }
    
    removeToken() {
        logger.debug('🗑️ Removendo token');
        localStorage.removeItem('authToken');
    }
    
    // Requisição principal com suporte offline
    async request(endpoint, options = {}) {
        const cacheKey = `${options.method || 'GET'}_${endpoint}`;
        
        // Verificar cache primeiro
        if (options.method === 'GET' && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < window.appConfig.cache.duration) {
                logger.debug('📦 Retornando dados do cache:', endpoint);
                return cached.data;
            }
        }
        
        try {
            // Configurar timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 
                options.timeout || this.timeout
            );
            
            // Fazer requisição
            const response = await fetch(this.baseURL + endpoint, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Verificar resposta
            if (!response.ok) {
                // Apenas lançar erro com o status, deixar cada página decidir o que fazer
                const error = new Error(`API Error: ${response.status}`);
                error.status = response.status;
                throw error;
            }
            
            const data = await response.json();
            
            // Cachear resposta se for GET
            if (options.method === 'GET' || !options.method) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }
            
            return data;
            
        } catch (error) {
            logger.error('❌ Erro na requisição:', error);
            
            // Se for erro de rede, tentar modo offline
            if (this.isNetworkError(error)) {
                return this.handleOfflineRequest(endpoint, options);
            }
            
            throw error;
        }
    }
    
    // Verificar se é erro de rede
    isNetworkError(error) {
        return error.name === 'AbortError' || 
               error.message.includes('fetch') || 
               error.message.includes('Failed to fetch') ||
               error.message.includes('Network');
    }
    
    // Lidar com requisições offline
    async handleOfflineRequest(endpoint, options = {}) {
        logger.warn('⚠️ Modo offline ativo');
        
        // Para requisições GET, tentar retornar dados do cache/localStorage
        if (options.method === 'GET' || !options.method) {
            return this.getOfflineData(endpoint);
        }
        
        // Para outras requisições, adicionar à fila offline
        if (window.appConfig.cache.offlineMode) {
            this.addToOfflineQueue(endpoint, options);
        }
        
        // Retornar resposta simulada
        return { 
            success: true, 
            offline: true,
            message: 'Operação será sincronizada quando voltar online' 
        };
    }
    
    // Obter dados offline
    getOfflineData(endpoint) {
        logger.info('📱 Buscando dados offline para:', endpoint);
        
        // Mapear endpoints para dados locais
        if (endpoint.includes('/auth/me')) {
            const cachedUser = localStorage.getItem('cachedUserData');
            if (cachedUser) {
                return { user: JSON.parse(cachedUser) };
            }
        }
        
        if (endpoint.includes('/goals')) {
            const savedGoals = localStorage.getItem('userGoals');
            if (savedGoals) {
                return { goals: JSON.parse(savedGoals) };
            }
            return { goals: [] };
        }
        
        if (endpoint.includes('/missions')) {
            const savedMissions = localStorage.getItem('userMissions');
            if (savedMissions) {
                return { missions: JSON.parse(savedMissions) };
            }
            return { missions: [] };
        }
        
        // Retornar dados vazios por padrão
        return { data: [], offline: true };
    }
    
    // Adicionar à fila offline
    addToOfflineQueue(endpoint, options) {
        const queueItem = {
            id: Date.now().toString(),
            endpoint,
            options,
            timestamp: new Date().toISOString()
        };
        
        this.offlineQueue.push(queueItem);
        localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
        
        logger.info('📋 Adicionado à fila offline:', queueItem);
    }
    
    // Sincronizar fila offline quando voltar online
    async syncOfflineQueue() {
        const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        if (queue.length === 0) return;
        
        logger.info('🔄 Sincronizando fila offline...', queue.length, 'itens');
        
        for (const item of queue) {
            try {
                await this.request(item.endpoint, item.options);
                // Remover da fila se sucesso
                this.offlineQueue = this.offlineQueue.filter(q => q.id !== item.id);
            } catch (error) {
                logger.error('Erro ao sincronizar item:', item, error);
            }
        }
        
        localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    }
    
    // Métodos convenientes
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }
    
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// Criar instância global
window.api = new API();

// Detectar quando voltar online
window.addEventListener('online', () => {
    logger.info('✅ Voltou online!');
    window.api.syncOfflineQueue();
});

window.addEventListener('offline', () => {
    logger.warn('❌ Está offline!');
});

// Carregar dados do usuário do cache ao inicializar a página
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados do cache imediatamente para exibir nome correto
    const cachedData = localStorage.getItem('cachedUserData');
    if (cachedData) {
        try {
            const user = JSON.parse(cachedData);
            window.updateHeaderAvatar(user);
        } catch (e) {
            // Ignorar erros de parse
        }
    }
});

// ===== FUNÇÕES UTILITÁRIAS COMPARTILHADAS =====

/**
 * Atualiza o avatar do header em todas as páginas
 * Verifica se existe imagem de perfil e exibe, senão mostra a inicial
 */
window.updateHeaderAvatar = function(user) {
    if (!user) return;
    
    const headerAvatar = document.getElementById('headerAvatar');
    const headerUserName = document.getElementById('headerUserName');
    
    // Atualizar nome
    if (headerUserName) {
        headerUserName.textContent = user.name || 'Usuária';
    }
    
    // Atualizar avatar
    if (headerAvatar) {
        if (user.profileImage) {
            // Tem imagem de perfil
            headerAvatar.innerHTML = `<img src="${user.profileImage}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            headerAvatar.style.background = 'transparent';
        } else {
            // Sem imagem - mostrar inicial
            const initial = (user.name || 'U').charAt(0).toUpperCase();
            headerAvatar.innerHTML = `<span>${initial}</span>`;
            headerAvatar.style.background = user.preferredColor || '#8B5CF6';
        }
    }
};

/**
 * Carrega e atualiza o avatar do usuário atual
 * Útil para ser chamada no carregamento de qualquer página
 */
window.loadAndUpdateAvatar = async function() {
    try {
        // Primeiro tentar do cache
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            const user = JSON.parse(cachedData);
            window.updateHeaderAvatar(user);
        }
    } catch (e) {
        // Ignorar erros de cache
    }
};

/**
 * Função global de logout
 * Disponível em todas as páginas que incluem api.js
 */
window.logout = async function() {
    try {
        await window.api.post('/auth/logout');
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
    
    window.api.removeToken();
    localStorage.removeItem('cachedUserData');
    window.location.href = 'login.html';
};