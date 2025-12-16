# Backend Amigos Cuidadores

Backend em Node.js para a plataforma Amigos Cuidadores, com autenticação JWT e armazenamento de usuários no **Firebase Firestore** (avatars em Base64).

## 🚀 Instalação

1. Navegue até a pasta backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Renomeie `config.env` ou crie um arquivo com os valores abaixo.
   - Guarde o JSON da conta de serviço do Firebase em `backend/config/firebase-service-account.json` (ou defina o caminho com `FIREBASE_SERVICE_ACCOUNT_PATH`).

```env
# Configurações do servidor
PORT=5000

# JWT Secret - Em produção, use uma chave mais segura
JWT_SECRET=amigos_cuidadores_secret_key_2025

# Configurações de JWT
JWT_EXPIRE=7d

# Ambiente
NODE_ENV=development

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
# ou defina FIREBASE_SERVICE_ACCOUNT_JSON com o conteúdo do arquivo em formato string
# Opcional: sobrepõe o project_id do arquivo de serviço
# FIREBASE_PROJECT_ID=seu-project-id

# Email SMTP (para notificações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=amigoscuidadorespt@gmail.com
SMTP_PASS=sylunwdeulydjjiv
SMTP_SECURE=false
EMAIL_FROM="Amigos Cuidadores <amigoscuidadorespt@gmail.com>"
```

## 🏃‍♂️ Executar o servidor

### Modo desenvolvimento (com auto-reload):
```bash
npm run dev
```

### Modo produção:
```bash
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📚 API Endpoints

### Autenticação

#### Registro de novo usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "userType": "client", // ou "caregiver", "nurse"
  "phone": "912345678",
  "address": {
    "street": "Rua Principal",
    "city": "Lisboa",
    "state": "Lisboa",
    "zipCode": "1000-001"
  }
}
```

Para cuidadores/enfermeiros, adicione também:
```json
{
  "experience": "5 anos de experiência...",
  "specialties": ["idosos", "alzheimer"],
  "certifications": ["Certificado X", "Curso Y"],
  "hourlyRate": 15.50,
  "bio": "Profissional dedicado..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "senha123"
}
```

#### Verificar token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

### Usuários (Rotas protegidas - requerem token)

#### Obter perfil do usuário atual
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Atualizar perfil
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "João Silva Atualizado",
  "phone": "919876543",
  "address": {
    "street": "Rua Nova",
    "city": "Porto"
  }
}
```

#### Deletar conta
```http
DELETE /api/users/profile
Authorization: Bearer <token>
```

#### Listar profissionais
```http
GET /api/users/professionals
Authorization: Bearer <token>

Query params opcionais:
- userType: "caregiver" ou "nurse"
- specialties: "idosos,alzheimer" (separados por vírgula)
- minRating: 4.0
- maxRate: 20.00
```

#### Obter detalhes de um profissional
```http
GET /api/users/professionals/:id
Authorization: Bearer <token>
```

## 📁 Estrutura de dados

Os usuários são salvos na coleção `users` do Firestore com a seguinte estrutura:

```json
{
  "id": "uuid",
  "name": "Nome do Usuário",
  "email": "email@exemplo.com",
  "password": "senha_em_texto", // ❗️ Apenas ambiente de desenvolvimento (ajuste para usar hash)
  "userType": "client|caregiver|nurse",
  "phone": "912345678",
  "address": {
    "street": "Rua",
    "city": "Cidade",
    "state": "Estado",
    "zipCode": "0000-000"
  },
  "avatar": "data:image/png;base64,...", // opcional
  "profileComplete": false,
  "verified": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "professional": {
    "experience": "Descrição da experiência",
    "specialties": ["especialidade1", "especialidade2"],
    "certifications": ["cert1", "cert2"],
    "availability": {},
    "hourlyRate": 15.50,
    "bio": "Biografia",
    "rating": 0,
    "totalReviews": 0
  }
}
```

## 🔐 Segurança & Notas

- **Senhas:** ainda não estão criptografadas; ajuste `User.create` e `User.verifyPassword` para usar hash em produção.
- **Autenticação:** JWT (7 dias) + validações com `express-validator`.
- **Uploads:** avatares são enviados via Base64, limitados a ~1MB no frontend e validados (3MB máx.) no backend.
- **Email:** o envio usa SMTP (Gmail). Configure variável de ambiente com usuário/senha de app. Falhas ao enviar são apenas registradas em log.
- **Credenciais:** não versionar o `firebase-service-account.json` (já incluso no `.gitignore`).
- **Migrações futuras:** considere usar Firebase Storage para arquivos grandes ou mover senhas para `bcrypt`.
