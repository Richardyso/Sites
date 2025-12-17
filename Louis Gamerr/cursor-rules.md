# 🎮 LOUIS GAMERR

## 📋 Contexto do Projeto
Criar um site estático, moderno e responsivo (mobile-first) para deploy no Netlify, com tema de anime em paleta preto e branco.

---

## 🗂️ Estrutura de Arquivos
```
/
├── index.html
├── assets/
│   ├── images/
│   │   ├── l1.jpg (personagem L - com fundo, usar no header)
│   │   ├── louis.png (logo/favicon)
│   │   ├── frieren.png
│   │   ├── gojo.png
│   │   ├── gon.png
│   │   ├── killua.png
│   │   └── (outras variações com fundo removido)
│   ├── js/
│   │   └── script.js
│   └── styles/
│       └── style.css
```

---

## 🎨 Design & Estética

### Paleta de Cores
- **Base**: Preto (#000000) e Branco (#FFFFFF)
- **Acentos**: Tons de cinza (#1a1a1a, #2a2a2a, #f5f5f5)
- **Efeitos**: Sombras sutis, gradientes preto/branco

### Personagens de Anime
- **Header**: Use `l1.jpg` (L do Death Note) como banner/hero - verificar dimensões e adaptar responsivamente
- **Decoração**: Integre Frieren, Gojo, Gon e Killua ao longo da página (cards, backgrounds, seções)
- **Estilo**: Minimalista com elementos inspirados nos personagens (padrões, símbolos, estética noir)

### Favicon & Meta Tags
```html
<link rel="icon" type="image/png" href="assets/images/louis.png">

<!-- Open Graph para compartilhamento -->
<meta property="og:title" content="Louis Gamer - Jogos, Músicas e Humor">
<meta property="og:description" content="Jogo, músicas e muito humor">
<meta property="og:image" content="https://p77-sign-va.tiktokcdn.com/tos-maliva-avt-0068/78a59e615960d824134141fd75bba195~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=1823ef1c&x-expires=1766145600&x-signature=OfCK5IkooBYTwiAYQegqQN60Mgs%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=maliva">
<meta property="og:url" content="[URL_DO_SITE]">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

---

## 🔗 Links de Plataformas (ORDEM PRIORITÁRIA)

### Seção Principal - Redes Sociais
1. **LivePix** - https://livepix.gg/louisgamer
2. **TikTok** - https://www.tiktok.com/@louisgameer
3. **Kick** - https://kick.com/louisgamerr
4. **Twitch** - https://www.twitch.tv/louisgamerr
5. **YouTube** - https://www.youtube.com/@LouisGamerr

### Seção Secundária - Comunidade
6. **Spotify** (Música) - https://open.spotify.com/user/12179418316
7. **WhatsApp** (Grupo) - https://chat.whatsapp.com/JaajsVLG5WfIisOP62dLma
8. **Discord** - https://discord.com/invite/FTtPDhGjAq

**Buscar ícones oficiais de cada plataforma** (SVG ou Font Awesome/Simple Icons)

---

## 📱 Requisitos de Responsividade

### Mobile-First (320px+)
- Hero compacto e legível
- Botões/cards empilhados verticalmente
- Imagens otimizadas
- Touch-friendly (botões grandes, espaçamento adequado)

### Tablet (768px+)
- Grid de 2 colunas para cards
- Hero mais destacado
- Personagens decorativos começam a aparecer

### Desktop (1024px+)
- Layout amplo e espaçado
- Grid de 3-4 colunas
- Animações suaves ao hover
- Personagens decorativos nas laterais
- Parallax sutil (opcional)

---

## ✨ Funcionalidades & Interatividade

### JavaScript (script.js)
- Animações de scroll reveal (IntersectionObserver)
- Hover effects nos cards de links
- Smooth scroll
- Parallax sutil para personagens (opcional)
- Loading animation inicial
- Click tracking para links externos (opcional)
- Easter eggs com personagens de anime (opcional)

### CSS (style.css)
- Variáveis CSS para tema (`:root`)
- Animações @keyframes
- Transitions suaves (0.3s ease)
- Grid/Flexbox moderno
- Glassmorphism ou neumorphism nos cards (opcional)
- Hover effects dramáticos (scale, shadow, glow)
- Gradientes animados (opcional)

---

## 📝 Estrutura de Conteúdo

### Seção Hero/Header
- **Background**: Imagem `l1.jpg` com overlay escuro para contraste
- **Logo/Avatar**: Imagem do perfil do TikTok centralizada
- **Título**: "Louis Gamer" (tipografia bold, moderna)
- **Tagline**: "Jogo, músicas e muito humor"
- **CTA Principal**: Botão destaque para LivePix (primeira prioridade)

### Seção Links Principais
- Cards elegantes para cada plataforma
- Estrutura de cada card:
  - Ícone da plataforma (SVG colorido ou monocromático)
  - Nome da plataforma
  - Hover effect marcante (elevação, brilho, animação)
- Abertura em nova aba (`target="_blank" rel="noopener noreferrer"`)
- Layout responsivo (1 coluna mobile, 2-3 colunas desktop)

### Seção Comunidade
- Cards secundários (menor destaque visual)
- Spotify, WhatsApp e Discord agrupados
- Mesmo padrão de interatividade

### Footer
- Copyright ou branding mínimo ("© 2024 Louis Gamer")
- Personagens decorativos (Frieren, Gojo, Gon, Killua) posicionados sutilmente
- Links de redes sociais repetidos (ícones pequenos)

---

## 🎯 Objetivos de UX/UI

### Performance
- **Carregamento rápido** (<2s no 3G)
- Imagens otimizadas (WebP com fallback)
- CSS/JS minificados (preparar versão de produção)
- Lazy loading para imagens (loading="lazy")

### Acessibilidade
- Contraste WCAG AA (preto/branco garante isso)
- Alt texts descritivos em todas as imagens
- HTML semântico (header, main, section, nav, footer)
- Aria labels onde necessário
- Navegação por teclado funcional

### SEO
- Meta tags completas (title, description, OG)
- Headings hierárquicos (h1 > h2 > h3)
- Structured data (Schema.org Person - opcional)
- Sitemap.xml (opcional para Netlify)

### Visual
- **Impacto dramático**: Contraste preto/branco forte
- **Identidade anime**: Personagens integrados organicamente
- **Minimalismo elegante**: Menos é mais, foco nos links
- **Micro-interações**: Feedbacks visuais sutis e satisfatórios

### Conversão
- **Hierarquia clara**: LivePix em destaque
- **Calls-to-action evidentes**: Botões impossíveis de ignorar
- **Friction zero**: Clique direto, sem popups ou distrações


## 💡 Diretrizes de Código

### HTML5
- Semântico e estruturado
- Comentários descritivos em português
- Indentação consistente (2 espaços)

### CSS
- Mobile-first (min-width media queries)
- Variáveis CSS em `:root`
- BEM ou nomenclatura consistente
- Organizado por seções
```css
:root {
  --color-bg: #000000;
  --color-text: #ffffff;
  --color-accent: #1a1a1a;
  --spacing-unit: 1rem;
  --transition: 0.3s ease;
}
```

### JavaScript
- Vanilla JS (ES6+)
- Sem dependências externas (a menos que necessário)
- Comentários explicativos
- Código limpo e modular
```javascript
// Exemplo de estrutura
const App = {
  init() {
    this.setupAnimations();
    this.handleLinks();
  },
  
  setupAnimations() {
    // Scroll reveal, parallax, etc
  },
  
  handleLinks() {
    // Track clicks, smooth scroll, etc
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
```

---

## 🎨 Inspirações de Design

### Referências de Estilo
- Linktree minimalista
- Portfolio de gamers/streamers
- Sites de anime noir (Cowboy Bebop, Death Note aesthetic)
- Brutalism moderno (preto/branco puro)

### Elementos Visuais Sugeridos
- Glitch effects sutis nos títulos
- Scan lines de anime (opcional)
- Gradient overlays nos personagens
- Neon glow effects nos hovers (branco brilhante)
- Grain texture sutil no background

---

## 🎮 Easter Eggs (Opcional)

- Konami Code para revelar personagens secretos
- Click nos personagens para animações
- Som de notificação ao hover (desabilitável)
- Modo escuro/claro (inverter cores)
- Cursor customizado (mira de jogo)


---

## 🚀 OBJETIVO FINAL

**CRIE UM SITE ÉPICO, MINIMALISTA E PROFISSIONAL QUE REFLITA A PERSONALIDADE GAMER/ANIME DO LOUIS!**

Um site que:
- ⚡ Carregue instantaneamente
- 🎨 Impressione visualmente
- 📱 Funcione perfeitamente em qualquer dispositivo
- 🎯 Converta visitantes em seguidores
- 🎮 Tenha a vibe de um verdadeiro gamer/streamer




SETUP

✦ CPU: AMD Ryzen 7 9800X3D 4.7/5.2GHz
✦ Caixa ATX: Mars Gaming MCV4 Torre XXL E-ATX Vidro
✦ Motherboard: Gigabyte B650 AORUS ELITE AX V2
✦ Fonte PSU: MSI MAG A850GL PCIE5 II ATX 3.1 750W 80 Plus Gold Modular
✦ Cooler : Thermalright Aqua Elite 360 V3
✦ RAM: Corsair Vengeance RGB DDR5 6000MHz 32 GB 2x16GB CL36
✦ GPU: ASUS TUF Gaming GeForce RTX 5080 OC 16GB GDDR7 DLSS4
✦ Disco M2 SSD: SAMSUNG 990 EVO Plus 2TB até 7,250 MB/s
Hub / Cabos:
✦ Ventoinhas Reverse: 6x Thermalright TL-C12RB-S
✦ Ventoinhas : 1x Thermalright TL-C12C-S
✦ Windows: 11 Pro