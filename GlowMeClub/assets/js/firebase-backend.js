// ===== FIREBASE BACKEND - SUBSTITUI O BACKEND EXTERNO =====
// Este arquivo implementa todas as funcionalidades do backend usando Firebase

// Inicializar Firestore
let db = null;

// Configurar Firestore quando Firebase estiver pronto
function initFirestore() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        db = firebase.firestore();
        
        // Habilitar persistência offline
        db.enablePersistence()
            .catch((err) => {
                if (err.code === 'unimplemented') {
                    console.warn('Persistência offline não suportada neste navegador');
                }
            });
            
        console.log('🔥 Firestore inicializado');
    } else {
        setTimeout(initFirestore, 100);
    }
}

// API simulada que usa Firestore
class FirebaseBackendAPI {
    constructor() {
        this.baseURL = 'firebase://local';
        initFirestore();
    }
    
    // Simular headers
    getHeaders() {
        const user = firebase.auth().currentUser;
        return {
            'Content-Type': 'application/json',
            'Authorization': user ? `Bearer ${user.uid}` : ''
        };
    }
    
    // Token management
    getToken() {
        const user = firebase.auth().currentUser;
        return user ? user.uid : localStorage.getItem('authToken');
    }
    
    saveToken(token) {
        localStorage.setItem('authToken', token);
    }
    
    removeToken() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('cachedUserData');
    }
    
    // Verificar se é erro de rede
    isNetworkError(error) {
        return false; // Firebase lida com offline automaticamente
    }
    
    // Request principal - roteia para métodos Firebase
    async request(endpoint, options = {}) {
        console.log('🔥 Firebase Backend Request:', endpoint, options);
        
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Rotas de autenticação
        if (endpoint === '/auth/login') {
            return this.handleLogin(JSON.parse(options.body || '{}'));
        }
        
        if (endpoint === '/auth/register') {
            return this.handleRegister(JSON.parse(options.body || '{}'));
        }
        
        if (endpoint === '/auth/me') {
            return this.handleGetCurrentUser();
        }
        
        if (endpoint === '/auth/logout') {
            return this.handleLogout();
        }
        
        // Rotas de dados
        if (endpoint.includes('/goals')) {
            return this.handleGoals(options);
        }
        
        if (endpoint.includes('/missions')) {
            return this.handleMissions(options);
        }
        
        if (endpoint.includes('/rewards')) {
            return this.handleRewards(options);
        }
        
        if (endpoint.includes('/users/ranking')) {
            return this.handleRanking();
        }
        
        if (endpoint.includes('/user/checkin')) {
            return this.handleCheckin();
        }
        
        // Fallback
        return { success: true, data: [] };
    }
    
    // Handlers de autenticação
    async handleLogin({ email, password }) {
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Buscar dados adicionais do Firestore
            const userData = await this.getUserData(user.uid);
            
            return {
                success: true,
                token: user.uid,
                user: userData
            };
        } catch (error) {
            throw new Error(this.translateAuthError(error));
        }
    }
    
    async handleRegister({ email, password, name, preferredColor, focusArea, phone }) {
        try {
            // Criar usuário no Firebase Auth
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Atualizar nome no perfil
            await user.updateProfile({ displayName: name });
            
            // Criar documento no Firestore
            const userData = {
                uid: user.uid,
                email: user.email,
                name: name,
                preferredColor: preferredColor || '#8B5CF6',
                focusArea: focusArea || 'mindfulness',
                phone: phone || '',
                role: 'user',
                xp: 0,
                totalPoints: 0,
                level: 1,
                streak: 0,
                lastCheckin: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('users').doc(user.uid).set(userData);
            
            return {
                success: true,
                token: user.uid,
                user: { ...userData, createdAt: new Date().toISOString() }
            };
        } catch (error) {
            throw new Error(this.translateAuthError(error));
        }
    }
    
    async handleGetCurrentUser() {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Não autenticado');
        }
        
        const userData = await this.getUserData(user.uid);
        return { user: userData };
    }
    
    async handleLogout() {
        await firebase.auth().signOut();
        return { success: true };
    }
    
    // Buscar dados do usuário no Firestore
    async getUserData(uid) {
        try {
            const doc = await db.collection('users').doc(uid).get();
            
            if (doc.exists) {
                const data = doc.data();
                return {
                    ...data,
                    uid: uid,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
                };
            }
            
            // Se não existe, criar dados básicos
            const user = firebase.auth().currentUser;
            const newUserData = {
                uid: uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                role: 'user',
                preferredColor: '#8B5CF6',
                focusArea: 'mindfulness',
                xp: 0,
                totalPoints: 0,
                level: 1,
                streak: 0,
                lastCheckin: null,
                createdAt: new Date().toISOString()
            };
            
            // Salvar no Firestore
            await db.collection('users').doc(uid).set({
                ...newUserData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return newUserData;
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            // Retornar dados básicos
            const user = firebase.auth().currentUser;
            return {
                uid: uid,
                email: user?.email || '',
                name: user?.displayName || 'Usuário',
                role: 'user',
                preferredColor: '#8B5CF6',
                focusArea: 'mindfulness',
                xp: 0,
                totalPoints: 0,
                level: 1,
                streak: 0
            };
        }
    }
    
    // Handlers de dados
    async handleGoals(options) {
        const user = firebase.auth().currentUser;
        if (!user) return { goals: [] };
        
        try {
            const snapshot = await db.collection('users').doc(user.uid)
                .collection('goals').get();
            
            const goals = [];
            snapshot.forEach(doc => {
                goals.push({ id: doc.id, ...doc.data() });
            });
            
            return { goals };
        } catch (error) {
            console.error('Erro ao buscar metas:', error);
            return { goals: [] };
        }
    }
    
    async handleMissions(options) {
        // Retornar missões padrão
        return {
            missions: [
                { id: '1', title: 'Beber 2L de água', completed: false, points: 10, icon: '💧' },
                { id: '2', title: 'Meditar por 10 minutos', completed: false, points: 15, icon: '🧘‍♀️' },
                { id: '3', title: 'Fazer exercícios', completed: false, points: 20, icon: '💪' },
                { id: '4', title: 'Dormir 8 horas', completed: false, points: 15, icon: '😴' },
                { id: '5', title: 'Ler por 30 minutos', completed: false, points: 10, icon: '📚' }
            ]
        };
    }
    
    async handleRewards(options) {
        // Retornar recompensas padrão
        return {
            rewards: [
                { id: '1', title: 'E-book Mindfulness', points: 100, available: true },
                { id: '2', title: 'Aula de Yoga Online', points: 200, available: true },
                { id: '3', title: 'Consulta Nutricional', points: 500, available: true }
            ]
        };
    }
    
    async handleRanking() {
        try {
            // Buscar top 10 usuários por XP
            const snapshot = await db.collection('users')
                .orderBy('xp', 'desc')
                .limit(10)
                .get();
            
            const users = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                    uid: doc.id,
                    name: data.name || 'Usuária',
                    xp: data.xp || 0,
                    level: data.level || 1,
                    preferredColor: data.preferredColor || '#8B5CF6'
                });
            });
            
            return { users };
        } catch (error) {
            console.error('Erro ao buscar ranking:', error);
            // Retornar ranking fictício
            return {
                users: [
                    { uid: '1', name: 'Maria Silva', xp: 850, level: 2 },
                    { uid: '2', name: 'Ana Costa', xp: 720, level: 2 },
                    { uid: '3', name: 'Julia Santos', xp: 650, level: 2 },
                    { uid: '4', name: 'Carla Lima', xp: 450, level: 1 },
                    { uid: '5', name: 'Patricia Oliveira', xp: 380, level: 1 }
                ]
            };
        }
    }
    
    async handleCheckin() {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Não autenticado');
        
        try {
            const userRef = db.collection('users').doc(user.uid);
            const userData = await userRef.get();
            const data = userData.data();
            
            // Verificar último check-in
            const lastCheckin = data.lastCheckin?.toDate?.() || null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (lastCheckin && lastCheckin >= today) {
                return { success: false, message: 'Check-in já realizado hoje' };
            }
            
            // Calcular streak
            let newStreak = 1;
            if (lastCheckin) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastCheckin >= yesterday && lastCheckin < today) {
                    newStreak = (data.streak || 0) + 1;
                }
            }
            
            // Atualizar dados
            await userRef.update({
                lastCheckin: firebase.firestore.FieldValue.serverTimestamp(),
                streak: newStreak,
                xp: firebase.firestore.FieldValue.increment(10),
                totalPoints: firebase.firestore.FieldValue.increment(10)
            });
            
            return {
                success: true,
                streak: newStreak,
                pointsEarned: 10,
                newXp: (data.xp || 0) + 10
            };
        } catch (error) {
            console.error('Erro no check-in:', error);
            throw error;
        }
    }
    
    // Traduzir erros do Firebase
    translateAuthError(error) {
        const errorMessages = {
            'auth/user-not-found': 'Usuário não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/email-already-in-use': 'Este email já está cadastrado',
            'auth/weak-password': 'Senha muito fraca',
            'auth/invalid-email': 'Email inválido',
            'auth/operation-not-allowed': 'Operação não permitida',
            'auth/user-disabled': 'Usuário desativado'
        };
        
        return errorMessages[error.code] || error.message;
    }
    
    // Métodos HTTP
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Substituir a API padrão pela Firebase Backend API
window.addEventListener('load', () => {
    // Aguardar um momento para garantir que config.js foi carregado
    setTimeout(() => {
        console.log('🔥 Ativando Firebase Backend API');
        window.api = new FirebaseBackendAPI();
        
        // Mostrar notificação
        if (!document.querySelector('.firebase-backend-notice')) {
            const notice = document.createElement('div');
            notice.className = 'firebase-backend-notice';
            notice.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #10B981;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            `;
            notice.innerHTML = '✅ Usando Firebase como backend';
            document.body.appendChild(notice);
            
            setTimeout(() => notice.remove(), 5000);
        }
    }, 500);
});