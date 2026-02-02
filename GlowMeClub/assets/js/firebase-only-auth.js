// ===== AUTENTICAÇÃO APENAS COM FIREBASE =====
// Solução temporária enquanto o backend não está disponível

// Dados padrão do usuário
const defaultUserData = {
    preferredColor: '#8B5CF6',
    focusArea: 'mindfulness',
    xp: 0,
    totalPoints: 0,
    level: 1,
    streak: 0,
    goals: [],
    missions: []
};

// Override do sistema de autenticação para usar apenas Firebase
window.FirebaseOnlyAuth = {
    // Login com email/senha usando Firebase
    async loginWithEmail(email, password) {
        try {
            if (!firebase.auth) {
                throw new Error('Firebase não está inicializado');
            }
            
            // Fazer login no Firebase
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Obter token do Firebase
            const idToken = await user.getIdToken();
            
            // Criar dados do usuário
            const userData = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || email.split('@')[0],
                role: 'user',
                ...defaultUserData,
                createdAt: user.metadata.creationTime
            };
            
            // Salvar no localStorage
            localStorage.setItem('authToken', idToken);
            localStorage.setItem('cachedUserData', JSON.stringify(userData));
            
            return {
                success: true,
                token: idToken,
                user: userData
            };
            
        } catch (error) {
            console.error('Erro no login Firebase:', error);
            
            // Traduzir mensagens de erro
            let message = 'Erro ao fazer login';
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'Usuário não encontrado';
                    break;
                case 'auth/wrong-password':
                    message = 'Senha incorreta';
                    break;
                case 'auth/invalid-email':
                    message = 'Email inválido';
                    break;
                case 'auth/user-disabled':
                    message = 'Usuário desativado';
                    break;
                default:
                    message = error.message;
            }
            
            throw new Error(message);
        }
    },
    
    // Criar conta com Firebase
    async createAccount(email, password, additionalData = {}) {
        try {
            if (!firebase.auth) {
                throw new Error('Firebase não está inicializado');
            }
            
            // Criar conta no Firebase
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Atualizar perfil se tiver nome
            if (additionalData.name) {
                await user.updateProfile({
                    displayName: additionalData.name
                });
            }
            
            // Obter token
            const idToken = await user.getIdToken();
            
            // Criar dados do usuário
            const userData = {
                uid: user.uid,
                email: user.email,
                name: additionalData.name || email.split('@')[0],
                role: 'user',
                ...defaultUserData,
                ...additionalData,
                createdAt: new Date().toISOString()
            };
            
            // Salvar no localStorage
            localStorage.setItem('authToken', idToken);
            localStorage.setItem('cachedUserData', JSON.stringify(userData));
            
            return {
                success: true,
                token: idToken,
                user: userData,
                isNewUser: true
            };
            
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            
            // Traduzir mensagens de erro
            let message = 'Erro ao criar conta';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'Este email já está cadastrado';
                    break;
                case 'auth/invalid-email':
                    message = 'Email inválido';
                    break;
                case 'auth/operation-not-allowed':
                    message = 'Operação não permitida';
                    break;
                case 'auth/weak-password':
                    message = 'Senha muito fraca. Use pelo menos 6 caracteres';
                    break;
                default:
                    message = error.message;
            }
            
            throw new Error(message);
        }
    },
    
    // Verificar usuário atual
    async getCurrentUser() {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Não autenticado');
        }
        
        // Buscar dados salvos ou usar padrão
        const cachedData = localStorage.getItem('cachedUserData');
        if (cachedData) {
            return { user: JSON.parse(cachedData) };
        }
        
        // Criar dados básicos
        const userData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            role: 'user',
            ...defaultUserData
        };
        
        localStorage.setItem('cachedUserData', JSON.stringify(userData));
        return { user: userData };
    },
    
    // Logout
    async logout() {
        await firebase.auth().signOut();
        localStorage.removeItem('authToken');
        localStorage.removeItem('cachedUserData');
    }
};

// Ativar modo Firebase-only se houver erro de CORS
window.addEventListener('load', () => {
    // Detectar se deve usar Firebase-only
    const checkFirebaseOnly = () => {
        const lastCorsError = sessionStorage.getItem('corsError');
        if (lastCorsError) {
            const errorTime = parseInt(lastCorsError);
            // Se teve erro CORS nos últimos 5 minutos, usar Firebase-only
            if (Date.now() - errorTime < 5 * 60 * 1000) {
                console.log('🔥 Modo Firebase-only ativado devido a erro CORS');
                window.useFirebaseOnly = true;
            }
        }
    };
    
    checkFirebaseOnly();
});

// Marcar erro CORS quando detectado
window.markCorsError = () => {
    sessionStorage.setItem('corsError', Date.now().toString());
    window.useFirebaseOnly = true;
};