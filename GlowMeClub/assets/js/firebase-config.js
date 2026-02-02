// ===== CONFIGURAÇÃO DO FIREBASE (Frontend) =====
// Este arquivo configura o Firebase SDK para autenticação no cliente

// Configuração do Firebase - Projeto GlowMeClub
const firebaseConfig = {
    apiKey: "AIzaSyBEbSZruudsjkhHcSAJFQCkv08QcWbOIlQ",
    authDomain: "minhavidateuvlog-5f49d.firebaseapp.com",
    projectId: "minhavidateuvlog-5f49d",
    storageBucket: "minhavidateuvlog-5f49d.firebasestorage.app",
    messagingSenderId: "398114872836",
    appId: "1:398114872836:web:cb073cb04c8a4854495f51",
    measurementId: "G-TFWF1SL0ML"
};

// Variável para armazenar instâncias do Firebase
let firebaseApp = null;
let firebaseAuth = null;
let googleProvider = null;

// Inicializar Firebase
function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK não carregado. Certifique-se de incluir os scripts do Firebase.');
        return false;
    }
    
    // Verificar se já foi inicializado
    if (!firebase.apps.length) {
        try {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            console.log('🔥 Firebase inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase:', error);
            return false;
        }
    } else {
        firebaseApp = firebase.apps[0];
    }
    
    // Configurar Auth
    firebaseAuth = firebase.auth();
    
    // Configurar Google Provider
    googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    // Configurar idioma para português
    firebaseAuth.languageCode = 'pt-BR';
    
    return true;
}

// Login com Google
async function signInWithGoogle() {
    if (!firebaseAuth || !googleProvider) {
        if (!initializeFirebase()) {
            throw new Error('Firebase não está configurado corretamente');
        }
    }
    
    try {
        // Usar popup para login (melhor UX em desktop)
        const result = await firebaseAuth.signInWithPopup(googleProvider);
        
        // Obter dados do usuário
        const user = result.user;
        const idToken = await user.getIdToken();
        
        console.log('✅ Login com Google bem-sucedido:', user.email);
        
        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified
            },
            idToken: idToken,
            isNewUser: result.additionalUserInfo?.isNewUser || false
        };
        
    } catch (error) {
        console.error('❌ Erro no login com Google:', error);
        
        // Tratar erros específicos
        let errorMessage = 'Erro ao fazer login com Google';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Login cancelado. Tente novamente.';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Popup bloqueado. Permita popups para este site.';
                break;
            case 'auth/cancelled-popup-request':
                errorMessage = 'Apenas uma janela de login pode ser aberta por vez.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Erro de conexão. Verifique sua internet.';
                break;
            case 'auth/account-exists-with-different-credential':
                errorMessage = 'Este email já está cadastrado com outro método de login.';
                break;
            default:
                errorMessage = error.message || 'Erro desconhecido';
        }
        
        throw new Error(errorMessage);
    }
}

// Logout do Firebase
async function signOutFirebase() {
    if (firebaseAuth) {
        try {
            await firebaseAuth.signOut();
            console.log('✅ Logout do Firebase realizado');
        } catch (error) {
            console.error('❌ Erro no logout do Firebase:', error);
        }
    }
}

// Verificar estado de autenticação
function onAuthStateChange(callback) {
    if (!firebaseAuth) {
        initializeFirebase();
    }
    
    if (firebaseAuth) {
        return firebaseAuth.onAuthStateChanged(callback);
    }
    
    return () => {}; // Função vazia se não houver auth
}

// Obter usuário atual
function getCurrentUser() {
    return firebaseAuth?.currentUser || null;
}

// Obter token de ID atual
async function getIdToken(forceRefresh = false) {
    const user = getCurrentUser();
    if (user) {
        return await user.getIdToken(forceRefresh);
    }
    return null;
}

// Exportar funções globalmente
window.FirebaseAuth = {
    initialize: initializeFirebase,
    signInWithGoogle: signInWithGoogle,
    signOut: signOutFirebase,
    onAuthStateChange: onAuthStateChange,
    getCurrentUser: getCurrentUser,
    getIdToken: getIdToken,
    isInitialized: () => !!firebaseApp
};

// Auto-inicializar quando o script carregar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se Firebase SDK está disponível antes de inicializar
    if (typeof firebase !== 'undefined') {
        initializeFirebase();
        
        // Adicionar listener para mudanças de estado de autenticação
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('🔥 Firebase: Usuário autenticado:', user.email);
                // Não fazer nada automático aqui para evitar loops
            } else {
                console.log('🔥 Firebase: Usuário não autenticado');
                // Não fazer logout automático aqui para evitar loops
            }
        });
    }
});

console.log('🔐 Firebase Auth Config carregado');
