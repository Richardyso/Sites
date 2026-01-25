# 🌸 GlowMeClub - Clube de Evolução Pessoal Feminina

![GlowMeClub Logo](assets/images/logo.png)

> **Teu glow. Teu ritmo. Teu processo.** ✨

GlowMeClub é uma aplicação web gamificada para evolução pessoal feminina, onde as usuárias podem definir metas, completar missões diárias e ganhar pontos para subir de nível e resgatar recompensas exclusivas.

## 🎯 Funcionalidades Principais

- **Sistema de Autenticação Completo**: Cadastro, login e recuperação de senha via Firebase Auth
- **Perfil Personalizado**: Escolha sua cor preferida e área de foco principal
- **Metas Pessoais**: Crie e acompanhe suas metas com categorias e prazos
- **Missões Diárias**: Complete 5 missões por dia e ganhe pontos
- **Sistema de Níveis**: Evolua de Plebeia até Deusa Glow
- **Catálogo de Recompensas**: Troque pontos por e-books, aulas e conteúdos exclusivos
- **Histórico Detalhado**: Acompanhe todos os pontos ganhos e gastos
- **Design Responsivo**: Funciona perfeitamente em desktop e mobile

## 🚀 Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização com variáveis CSS e design responsivo
- **JavaScript ES6+** - Lógica e interações
- **Firebase SDK** - Autenticação e banco de dados em tempo real

### Backend
- **Node.js** - Ambiente de execução
- **Express.js** - Framework web
- **Firebase Admin SDK** - Gerenciamento server-side
- **Nodemailer** - Envio de emails

### Banco de Dados
- **Firebase Firestore** - Banco NoSQL com sincronização em tempo real
- **Firebase Authentication** - Autenticação segura

## 📦 Instalação

### Pré-requisitos
- Node.js 16+ instalado
- Conta no Firebase Console
- Gmail com senha de app configurada (para emails)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/glowmeclub.git
cd glowmeclub
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Firebase

#### 3.1. Crie um projeto no Firebase Console
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative Authentication (Email/Senha e Google)
4. Ative Firestore Database

#### 3.2. Obtenha as credenciais

**Para o Frontend:**
1. Vá em Configurações do Projeto > Geral
2. Adicione um app Web
3. Copie a configuração e cole em `assets/js/firebase-config.js`

**Para o Backend:**
1. Vá em Configurações do Projeto > Contas de serviço
2. Gere uma nova chave privada
3. Salve o arquivo como `firebase-service-account.json` na raiz (desenvolvimento)
4. Ou configure as variáveis de ambiente (produção)

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Ambiente
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=seu_jwt_secret_aleatorio_aqui
JWT_EXPIRE=7d

# Firebase Admin SDK (obtenha no Console do Firebase)
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"

# Usar Firebase (true) ou JSON local (false)
USE_FIREBASE=true

# Email SMTP (Gmail com senha de app)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua_senha_de_app_16_caracteres
EMAIL_FROM=GlowMeClub <seu-email@gmail.com>
```

> ⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env` no repositório! Ele já está no `.gitignore`.

### 5. Configure as regras de segurança do Firestore
```bash
firebase deploy --only firestore:rules
```

### 6. Inicie o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

A aplicação estará disponível em `http://localhost:3000` 🎉

## 🗂️ Estrutura do Projeto

```
glowmeclub/
├── index.html                 # Página inicial
├── assets/                    # Recursos estáticos
│   ├── css/                  # Estilos
│   │   ├── style.css        # Estilos principais
│   │   └── responsive.css   # Media queries
│   ├── js/                   # JavaScript frontend
│   │   ├── firebase-config.js
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── goals.js
│   │   ├── missions.js
│   │   ├── points.js
│   │   └── rewards.js
│   └── images/              # Imagens e ícones
├── pages/                    # Páginas HTML
│   ├── cadastro.html
│   ├── login.html
│   ├── perfil.html
│   ├── metas.html
│   ├── missoes.html
│   ├── pontos.html
│   └── recompensas.html
├── backend/                  # Servidor Node.js
│   ├── server.js            # Arquivo principal
│   ├── config/              # Configurações
│   ├── controllers/         # Lógica de negócios
│   ├── middleware/          # Middlewares
│   ├── routes/              # Rotas da API
│   └── utils/               # Utilitários
├── firebase.json            # Configuração Firebase
├── firestore.rules         # Regras de segurança
└── package.json            # Dependências
```

## 📊 Sistema de Níveis

| Nível | Nome | Emoji | Pontos Necessários | Mensagem |
|-------|------|-------|-------------------|----------|
| 1 | Plebeia | 🌱 | 0 | "Toda rainha começa aqui." |
| 2 | Princesa | 👑 | 500 | "Consistência é o teu novo luxo." |
| 3 | Rainha | ✨ | 1500 | "Tu assumes o teu lugar." |
| 4 | Imperatriz | 💎 | 3000 | "Tu não pedes permissão, tu lideras." |
| 5 | Deusa Glow | 🔥 | 5000 | "O glow agora é natural." |

## 🎮 Sistema de Pontos

- **Meta concluída**: +50 pontos
- **Missão diária**: +10 a +15 pontos
- **Resgate de recompensa**: -X pontos (custo da recompensa)

## 🔐 Segurança

- **Autenticação**: Todos os endpoints da API são protegidos com JWT e sessões
- **Firestore Rules**: Row-level security implementada
- **CORS**: Configurado para aceitar apenas origens autorizadas
- **Helmet**: Headers de segurança com CSP configurado
- **Senhas**: Hash SHA-256 para armazenamento seguro
- **Rate Limiting**: Pode ser implementado conforme necessidade

### Arquivos Sensíveis (NÃO commitar!)
- `.env` - Variáveis de ambiente com credenciais
- `firebase-service-account.json` - Chave do Firebase
- `data/` - Banco de dados local (se usar JSON)

## 📱 Capturas de Tela

### Desktop
![Desktop Home](screenshots/desktop-home.png)
![Desktop Perfil](screenshots/desktop-profile.png)

### Mobile
![Mobile Missões](screenshots/mobile-missions.png)
![Mobile Recompensas](screenshots/mobile-rewards.png)

## 🚀 Deploy

### Firebase Hosting
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init

# Deploy
firebase deploy
```

### Heroku
```bash
# Criar app
heroku create glowmeclub

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=...

# Deploy
git push heroku main
```

## 🛠️ Desenvolvimento

### Estrutura da API

#### Autenticação
- `POST /api/auth/welcome-email` - Enviar email de boas-vindas
- `POST /api/auth/verify-token` - Verificar token
- `DELETE /api/auth/delete-account` - Deletar conta

#### Usuário
- `GET /api/user/profile` - Obter perfil
- `PUT /api/user/profile` - Atualizar perfil
- `GET /api/user/points` - Obter pontos e nível
- `GET /api/user/stats` - Obter estatísticas

#### Metas
- `GET /api/goals` - Listar metas
- `POST /api/goals` - Criar meta
- `PUT /api/goals/:id` - Atualizar meta
- `DELETE /api/goals/:id` - Deletar meta
- `POST /api/goals/:id/complete` - Completar meta

#### Missões
- `GET /api/missions` - Listar missões
- `GET /api/missions/today` - Missões de hoje
- `POST /api/missions/:id/complete` - Completar missão

#### Recompensas
- `GET /api/rewards` - Catálogo de recompensas
- `POST /api/rewards/:id/redeem` - Resgatar recompensa
- `GET /api/rewards/user` - Recompensas do usuário

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 💜 Agradecimentos

- Todas as mulheres que buscam evoluir no seu próprio ritmo
- Comunidade open source
- Firebase pela infraestrutura incrível
- Font Awesome pelos ícones

---

Feito com 💜 pela equipe GlowMeClub

**Lembre-se:** *Teu glow. Teu ritmo. Teu processo.* ✨