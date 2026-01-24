// Script para atualizar todas as páginas com o novo layout mobile-first

const updatePageTemplate = (pageName, activeNav) => {
    return {
        // Atualizar CSS imports
        cssImports: `    <!-- CSS -->
    <link rel="stylesheet" href="../assets/css/style.css">
    <link rel="stylesheet" href="../assets/css/layout.css">
    <link rel="stylesheet" href="../assets/css/${pageName}.css">`,
        
        // Header padrão
        header: `        <!-- Header -->
        <header class="app-header">
            <nav class="app-nav">
                <a href="/" class="logo-link">
                    <img src="../assets/images/glowmeclub.png" alt="GlowMeClub" class="logo-img">
                </a>
                
                <!-- Desktop Navigation -->
                <div class="desktop-nav">
                    <a href="dashboard.html" class="nav-link${activeNav === 'dashboard' ? ' active' : ''}">Dashboard</a>
                    <a href="perfil.html" class="nav-link${activeNav === 'perfil' ? ' active' : ''}">Perfil</a>
                    <a href="metas.html" class="nav-link${activeNav === 'metas' ? ' active' : ''}">Metas</a>
                    <a href="missoes.html" class="nav-link${activeNav === 'missoes' ? ' active' : ''}">Missões</a>
                    <a href="pontos.html" class="nav-link${activeNav === 'pontos' ? ' active' : ''}">Pontos</a>
                    <a href="recompensas.html" class="nav-link${activeNav === 'recompensas' ? ' active' : ''}">Recompensas</a>
                </div>
                
                <!-- User Profile Link -->
                <a href="perfil.html" class="user-profile-link">
                    <div class="user-avatar" id="headerAvatar">
                        <span>U</span>
                    </div>
                    <span class="user-name" id="headerUserName">Usuário</span>
                </a>
            </nav>
        </header>`,
        
        // Bottom nav padrão
        bottomNav: `        <!-- Bottom Navigation (Mobile) -->
        <nav class="bottom-nav">
            <div class="bottom-nav-items">
                <a href="dashboard.html" class="nav-item${activeNav === 'dashboard' ? ' active' : ''}">
                    <i class="fas fa-th-large"></i>
                    <span>Dashboard</span>
                </a>
                <a href="metas.html" class="nav-item${activeNav === 'metas' ? ' active' : ''}">
                    <i class="fas fa-bullseye"></i>
                    <span>Metas</span>
                </a>
                <a href="missoes.html" class="nav-item${activeNav === 'missoes' ? ' active' : ''}">
                    <i class="fas fa-star"></i>
                    <span>Missões</span>
                </a>
                <a href="pontos.html" class="nav-item${activeNav === 'pontos' ? ' active' : ''}">
                    <i class="fas fa-coins"></i>
                    <span>Pontos</span>
                </a>
                <a href="perfil.html" class="nav-item${activeNav === 'perfil' ? ' active' : ''}">
                    <i class="fas fa-user"></i>
                    <span>Perfil</span>
                </a>
            </div>
        </nav>`,
        
        // Script padrão (sem dropdown)
        scriptUpdate: `        // Removido dropdown - ao clicar no nome vai para o perfil`,
        
        // Main container class
        mainClass: 'main-container'
    };
};

// Exemplo de uso:
// const metasTemplate = updatePageTemplate('metas', 'metas');
// console.log(metasTemplate.header);