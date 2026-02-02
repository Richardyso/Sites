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
    
    // Token management com suporte para modo anônimo
    getToken() {
        try {
            return localStorage.getItem('authToken');
        } catch (error) {
            logger.warn('⚠️ localStorage bloqueado (modo anônimo?)');
            return sessionStorage.getItem('authToken');
        }
    }
    
    saveToken(token) {
        logger.debug('💾 Salvando token');
        try {
            localStorage.setItem('authToken', token);
        } catch (error) {
            logger.warn('⚠️ Usando sessionStorage (modo anônimo)');
            sessionStorage.setItem('authToken', token);
        }
    }
    
    removeToken() {
        logger.debug('🗑️ Removendo token');
        try {
            localStorage.removeItem('authToken');
        } catch (error) {
            sessionStorage.removeItem('authToken');
        }
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
                // Tentar obter mensagem de erro do corpo da resposta
                let errorMessage = `API Error: ${response.status}`;
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } else {
                        // Se não for JSON (provavelmente HTML), usar status text
                        errorMessage = `Server Error: ${response.status} ${response.statusText}`;
                    }
                } catch (e) {
                    // Manter mensagem padrão se não conseguir processar o erro
                }
                
                const error = new Error(errorMessage);
                error.status = response.status;
                throw error;
            }
            
            // Verificar se a resposta é JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format: expected JSON');
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
            
            // Se for erro do servidor (500, 502, 503)
            if (error.status >= 500 && error.status < 600) {
                this.showServerErrorNotification();
            }
            
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
    
    // Mostrar notificação de erro do servidor
    showServerErrorNotification() {
        // Evitar múltiplas notificações
        if (document.querySelector('.server-error-notification')) return;
        
        const notification = document.createElement('div');
        notification.className = 'server-error-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #EF4444;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            font-size: 14px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Erro no Servidor</strong>
                    <p style="margin: 4px 0 0 0; opacity: 0.9;">
                        O servidor está temporariamente indisponível. Tente novamente em alguns instantes.
                    </p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px;
                    margin-left: auto;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Adicionar animação
        if (!document.getElementById('server-error-animation')) {
            const style = document.createElement('style');
            style.id = 'server-error-animation';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remover após 10 segundos
        setTimeout(() => notification.remove(), 10000);
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