# 💰 Sistema de Carteira & Transações
## Preparação para Integração com Stripe

---

## 📋 Visão Geral

Este sistema foi desenvolvido para facilitar a futura integração com o **Stripe** para processamento de pagamentos entre clientes e cuidadores. Atualmente, funciona como uma **simulação completa** que pode ser facilmente conectada à API do Stripe.

### **💶 Modelo de Negócio:**

- **Moeda**: EUR (Euro) 🇪🇺
- **Taxa da Plataforma**: 10% sobre o valor total de cada serviço contratado
- **Cálculo**: 
  ```
  Valor Total = Horas Contratadas × Preço por Hora
  Taxa Plataforma = Valor Total × 10%
  Cuidador Recebe = Valor Total - Taxa Plataforma
  ```

**Exemplo Prático:**
```
Cliente contrata: 4 horas a €12.50/hora
├─ Valor total a pagar: 4 × €12.50 = €50.00
├─ Taxa da plataforma (10%): €50.00 × 0.10 = €5.00
└─ Cuidador recebe (líquido): €50.00 - €5.00 = €45.00
```

---

## 🏗️ Estrutura

### 1. **Modelo de Carteira (Wallet)**

Cada usuário possui uma carteira com a seguinte estrutura:

```javascript
wallet: {
  balance: 0,              // Saldo disponível em EUR
  pendingBalance: 0,       // Saldo pendente (em processamento)
  totalEarnings: 0,        // Total ganho (apenas cuidadores)
  totalSpent: 0,           // Total gasto (apenas clientes)
  currency: 'EUR',         // Moeda (Euro)
  stripeCustomerId: null,  // ID do cliente no Stripe (para integração)
  stripeAccountId: null,   // ID da conta conectada Stripe (cuidadores)
  paymentMethods: [],      // Métodos de pagamento salvos
  lastUpdated: '...'       // Última atualização
}
```

### 2. **Modelo de Transação (Transaction)**

Cada transação possui:

```javascript
{
  id: '...',
  type: 'payment',         // 'payment', 'refund', 'withdrawal', 'commission'
  status: 'pending',       // 'pending', 'completed', 'failed', 'cancelled'
  
  // Valores
  amount: 50.00,           // Valor total em EUR
  currency: 'EUR',
  platformFee: 5.00,       // Taxa da plataforma (10% padrão)
  netAmount: 45.00,        // Valor líquido para o cuidador
  
  // Participantes
  fromUserId: 'cliente-id',
  toUserId: 'cuidador-id',
  
  // Detalhes do serviço
  serviceDetails: {
    serviceType: 'caregiving',
    hours: 4,
    hourlyRate: 12.50,
    date: '2025-11-11',
    description: 'Cuidados domiciliários'
  },
  
  // Stripe (para integração futura)
  stripe: {
    paymentIntentId: null,
    chargeId: null,
    transferId: null,
    refundId: null
  },
  
  // Timestamps
  createdAt: '...',
  updatedAt: '...',
  completedAt: null,
  cancelledAt: null
}
```

---

## 🔌 API Endpoints

### **Usuário Autenticado**

```
GET    /api/wallet/my-wallet            # Obter carteira
GET    /api/wallet/my-transactions      # Listar transações
GET    /api/wallet/my-statistics        # Estatísticas pessoais
POST   /api/wallet/transactions         # Criar transação (simulação)
POST   /api/wallet/transactions/:id/process  # Processar pagamento
POST   /api/wallet/withdrawal           # Solicitar saque (cuidadores)
```

### **Administrador**

```
GET    /api/wallet/admin/transactions         # Todas as transações
GET    /api/wallet/admin/monthly-history      # Histórico mensal
POST   /api/wallet/admin/withdrawals/:id/process  # Aprovar/Rejeitar saque
```

---

## 🎯 Fluxo de Pagamento (Atual - Simulação)

### **1. Cliente Paga pelo Serviço**

```javascript
// Cliente cria transação
const result = await api.createTransaction({
  type: 'payment',
  toUserId: 'cuidador-id',
  serviceType: 'caregiving',
  hours: 4,                    // 4 horas de serviço
  hourlyRate: 12.50,           // €12.50 por hora
  serviceDate: '2025-11-11',
  description: 'Cuidados domiciliários'
});

// O sistema calcula automaticamente:
// - Valor total: 4 horas × €12.50 = €50.00
// - Taxa plataforma (10%): €50.00 × 0.10 = €5.00
// - Valor líquido para cuidador: €50.00 - €5.00 = €45.00

// Cliente processa o pagamento (simulação)
await api.processPayment(transactionId);
```

**O que acontece:**
1. Transação criada com status `pending`
2. **Cálculo automático dos valores:**
   - Valor total: `hours × hourlyRate` = 4 × €12.50 = **€50.00**
   - Taxa plataforma: `10% do total` = 10% de €50 = **€5.00**
   - Valor líquido: `total - taxa` = €50 - €5 = **€45.00**
3. Ao processar:
   - Status muda para `completed`
   - Carteira do cliente: `totalSpent += €50.00` (valor total pago)
   - Carteira da plataforma: **+€5.00** (taxa)
   - Carteira do cuidador: `balance += €45.00` e `totalEarnings += €45.00` (valor líquido)

### **2. Cuidador Solicita Saque**

```javascript
// Cuidador solicita saque
const result = await api.requestWithdrawal(100.00);
```

**O que acontece:**
1. Verifica se saldo disponível >= valor solicitado
2. Cria transação de saque com status `pending`
3. Move valor de `balance` para `pendingBalance`
4. Admin precisa aprovar/rejeitar

### **3. Admin Processa Saque**

```javascript
// Aprovar
await api.adminProcessWithdrawal(transactionId, 'approve', 'Saque aprovado');

// Rejeitar
await api.adminProcessWithdrawal(transactionId, 'reject', 'Dados bancários inválidos');
```

---

## 🚀 Integração Futura com Stripe

### **Passos para Integrar:**

#### **1. Instalar Stripe SDK**

```bash
npm install stripe
```

#### **2. Configurar Credenciais**

Adicionar em `backend/config.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **3. Criar Cliente Stripe**

Modificar `backend/models/User.js` no método `create`:

```javascript
// Após criar usuário no Firestore
if (userData.userType === 'client') {
  const stripeCustomer = await stripe.customers.create({
    email: userData.email,
    name: userData.name,
    metadata: { userId: id }
  });
  
  newUser.wallet.stripeCustomerId = stripeCustomer.id;
}
```

#### **4. Criar Conta Conectada (Cuidadores)**

Para cuidadores receberem pagamentos:

```javascript
if (userData.userType === 'caregiver' || userData.userType === 'nurse') {
  const stripeAccount = await stripe.accounts.create({
    type: 'express',
    email: userData.email,
    capabilities: {
      transfers: { requested: true }
    }
  });
  
  newUser.wallet.stripeAccountId = stripeAccount.id;
}
```

#### **5. Processar Pagamento Real**

Modificar `wallet.controller.js` no método `processPayment`:

```javascript
// Criar Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(transaction.amount * 100), // Converter para centavos
  currency: 'eur',
  customer: clientStripeId,
  application_fee_amount: Math.round(transaction.platformFee * 100),
  transfer_data: {
    destination: caregiverStripeAccountId
  },
  metadata: {
    transactionId: transaction.id,
    fromUserId: transaction.fromUserId,
    toUserId: transaction.toUserId
  }
});

// Salvar IDs do Stripe
await Transaction.updateStatus(transactionId, 'completed', {
  stripe: {
    paymentIntentId: paymentIntent.id,
    chargeId: paymentIntent.latest_charge
  }
});
```

#### **6. Webhook para Eventos do Stripe**

Criar `backend/routes/stripe-webhook.routes.js`:

```javascript
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Processar evento
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Atualizar transação para completed
      break;
    case 'payment_intent.payment_failed':
      // Atualizar transação para failed
      break;
    case 'transfer.paid':
      // Confirmar transferência para cuidador
      break;
  }
  
  res.json({ received: true });
});
```

---

## 📊 Estatísticas e Relatórios

O sistema já inclui métodos para estatísticas:

```javascript
// Estatísticas pessoais
const stats = await api.getWalletStatistics();
// Retorna: total, completed, pending, totalAmount, etc.

// Histórico mensal (Admin)
const history = await api.adminGetMonthlyHistory(12);
// Retorna: array com dados mensais dos últimos 12 meses
```

---

## 🛠️ Scripts Utilitários

### **Adicionar Carteira aos Usuários Existentes**

```bash
# Windows
adicionar_carteira.bat

# Linux/Mac
cd backend
node scripts/add-wallet-to-users.js
```

Este script:
- Verifica todos os usuários existentes
- Adiciona estrutura de carteira se não existir
- Mantém dados existentes intactos

---

## 💡 Recomendações

### **Para Produção:**

1. **Use Stripe Connect Express** para simplificar onboarding de cuidadores
2. **Implemente 3D Secure** para pagamentos mais seguros
3. **Configure webhooks** para atualização automática de status
4. **Armazene logs** de todas as transações para auditoria
5. **Implemente retry logic** para pagamentos falhados
6. **Use Stripe Customer Portal** para clientes gerenciarem métodos de pagamento

### **Taxas da Plataforma:**

- **Taxa sobre serviços**: 10% sobre o valor total de cada hora contratada
  - Exemplo: Cliente contrata 4 horas a €12.50/hora = €50 total
  - Taxa da plataforma: 10% de €50 = €5
  - Cuidador recebe: €50 - €5 = €45
- **Moeda**: EUR (Euro)
- **Taxa de saque**: €0 (sem custo adicional)
- **Valor mínimo de saque**: €20 (recomendado)

---

## 🔒 Segurança

Já implementado:
- ✅ Autenticação JWT obrigatória
- ✅ Autorização por tipo de usuário
- ✅ Validação de saldos antes de saques
- ✅ Logs de todas as operações
- ✅ IDs únicos para transações

Para produção adicionar:
- [ ] Rate limiting
- [ ] Validação de IP suspeito
- [ ] 2FA para operações financeiras
- [ ] Notificações de transações por email

---

## 📞 Suporte

Para dúvidas sobre a integração com Stripe:
- [Documentação Stripe](https://stripe.com/docs)
- [Stripe Connect](https://stripe.com/docs/connect)
- [Webhooks](https://stripe.com/docs/webhooks)

---

**Status**: ✅ Sistema pronto para integração com Stripe!

