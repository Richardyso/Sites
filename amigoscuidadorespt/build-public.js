// Script para copiar arquivos estáticos para o diretório public (Vercel build)
const fs = require('fs');
const path = require('path');

// Criar diretório public se não existir
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

// Função para copiar diretório recursivamente
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Diretório ${src} não existe, pulando...`);
    return;
  }
  
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Função para copiar arquivo individual
function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Arquivo ${src} não existe, pulando...`);
    return;
  }
  fs.copyFileSync(src, dest);
}

console.log('🔨 Construindo diretório public...');

// Copiar arquivos HTML
const htmlFiles = ['index.html', 'login.html', 'cadastro.html', 'dashboard.html', 'forgot-password.html', 'reset-password.html'];
htmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    copyFile(file, path.join('public', file));
    console.log(`✅ Copiado: ${file}`);
  }
});

// Copiar diretórios
const dirs = ['css', 'js', 'assets'];
dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    copyDir(dir, path.join('public', dir));
    console.log(`✅ Copiado: ${dir}/`);
  }
});

console.log('✅ Build do diretório public concluído!');

