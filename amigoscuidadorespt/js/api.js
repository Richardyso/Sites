// Configuração da API
// Detecta automaticamente o ambiente (local ou produção)
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api';

if (typeof window !== 'undefined') {
    window.API_URL = API_URL;
}

// Classe para gerenciar chamadas à API
class AmigosAPI {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    // Headers padrão para requisições
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Salvar token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Remover token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Registro de novo usuário
    async register(userData) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(false),
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                this.setToken(data.data.token);
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message, errors: data.errors };
        } catch (error) {
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    }

    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(false),
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.setToken(data.data.token);
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    }

    // Logout
    logout() {
        this.clearToken();
        return { success: true };
    }

    // Verificar se está autenticado
    async verifyAuth() {
        if (!this.token) {
            return { success: false, authenticated: false };
        }

        try {
            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, authenticated: true, user: data.data.user };
            }

            this.clearToken();
            return { success: false, authenticated: false };
        } catch (error) {
            return { success: false, authenticated: false };
        }
    }

    // Obter perfil do usuário
    async getProfile() {
        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao obter perfil' };
        }
    }

    // Listar todos os usuários (Admin)
    async findAll() {
        try {
            const response = await fetch(`${API_URL}/users`, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return data.data || [];
            }

            const error = new Error(data.message || 'Erro ao listar usuários');
            error.details = data.errors;
            throw error;
        } catch (error) {
            console.error('API findAll error:', error);
            throw error;
        }
    }

    // Atualizar perfil
    async updateProfile(updateData) {
        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message, errors: data.errors };
        } catch (error) {
            return { success: false, message: 'Erro ao atualizar perfil' };
        }
    }

    // Listar profissionais
    async listProfessionals(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `${API_URL}/users/professionals${queryParams ? '?' + queryParams : ''}`;

            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data, total: data.total };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao listar profissionais' };
        }
    }

    // Obter detalhes de um profissional
    async getProfessionalDetails(id) {
        try {
            const response = await fetch(`${API_URL}/users/professionals/${id}`, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao obter detalhes do profissional' };
        }
    }

    // Atualizar usuário como admin
    async adminUpdateUser(userId, updateData) {
        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message, errors: data.errors };
        } catch (error) {
            return { success: false, message: 'Erro ao atualizar usuário' };
        }
    }

    // Excluir usuário como admin
    async adminDeleteUser(userId) {
        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true };
            }

            return { success: false, message: data.message || 'Erro ao excluir usuário' };
        } catch (error) {
            return { success: false, message: 'Erro ao excluir usuário' };
        }
    }

    // ========== WALLET & TRANSACTIONS ==========

    // Obter carteira do usuário
    async getWallet() {
        try {
            const response = await fetch(`${API_URL}/wallet/my-wallet`, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao obter carteira' };
        }
    }

    // Obter transações do usuário
    async getTransactions(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `${API_URL}/wallet/my-transactions${queryParams ? '?' + queryParams : ''}`;

            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao obter transações' };
        }
    }

    // Obter estatísticas da carteira
    async getWalletStatistics() {
        try {
            const response = await fetch(`${API_URL}/wallet/my-statistics`, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao obter estatísticas' };
        }
    }

    // Criar transação (simulação)
    async createTransaction(transactionData) {
        try {
            const response = await fetch(`${API_URL}/wallet/transactions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(transactionData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao criar transação' };
        }
    }

    // Processar pagamento
    async processPayment(transactionId) {
        try {
            const response = await fetch(`${API_URL}/wallet/transactions/${transactionId}/process`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao processar pagamento' };
        }
    }

    // Solicitar saque
    async requestWithdrawal(amount) {
        try {
            const response = await fetch(`${API_URL}/wallet/withdrawal`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ amount })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao solicitar saque' };
        }
    }

    // Admin: Obter todas as transações
    async adminGetAllTransactions(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `${API_URL}/wallet/admin/transactions${queryParams ? '?' + queryParams : ''}`;

            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao obter transações' };
        }
    }

    // Admin: Obter histórico mensal
    async adminGetMonthlyHistory(months = 12) {
        try {
            const response = await fetch(`${API_URL}/wallet/admin/monthly-history?months=${months}`, {
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao obter histórico' };
        }
    }

    // Admin: Processar saque
    async adminProcessWithdrawal(transactionId, action, notes = '') {
        try {
            const response = await fetch(`${API_URL}/wallet/admin/withdrawals/${transactionId}/process`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ action, notes })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data: data.data };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao processar saque' };
        }
    }

    // Recuperação de senha
    async forgotPassword(email) {
        try {
            const response = await fetch(`${API_URL}/password/forgot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao solicitar recuperação de senha' };
        }
    }

    async resetPassword(email, code, newPassword) {
        try {
            const response = await fetch(`${API_URL}/password/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, code, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao redefinir senha' };
        }
    }

    async verifyResetCode(email, code) {
        try {
            const response = await fetch(`${API_URL}/password/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, code })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro ao verificar código' };
        }
    }
}

// Instância global da API
const api = new AmigosAPI();

// Exportar para uso em outros scripts
window.AmigosAPI = AmigosAPI;
window.api = api;
