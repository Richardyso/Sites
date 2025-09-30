// Sistema de Controle Financeiro para Planejagro
let transactions = JSON.parse(localStorage.getItem('planejagro_transactions')) || [];
let editingTransactionId = null;

// Categorias por tipo
const categories = {
    receita: [
        { value: 'venda', label: 'Venda de Produtos' },
        { value: 'subsidio', label: 'Subsídios' },
        { value: 'outros_renda', label: 'Outras Receitas' }
    ],
    despesa: [
        { value: 'insumos', label: 'Insumos Agrícolas' },
        { value: 'mao_obra', label: 'Mão de Obra' },
        { value: 'equipamentos', label: 'Equipamentos' },
        { value: 'manutencao', label: 'Manutenção' },
        { value: 'combustivel', label: 'Combustível' },
        { value: 'outros_gasto', label: 'Outras Despesas' }
    ]
};

// Inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    // Definir data padrão como hoje
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    loadTransactions();
    updateFinancialSummary();
    setupEventListeners();
    addSampleTransactions();
});

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);
}

// Carregar transações
function loadTransactions() {
    const transactionsList = document.getElementById('transactionsList');
    transactionsList.innerHTML = '';

    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <h3>💰 Nenhuma transação registrada</h3>
                <p>Adicione receitas e despesas para começar o controle financeiro</p>
            </div>
        `;
        return;
    }

    // Ordenar transações por data (mais recentes primeiro)
    const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTransactions.forEach(transaction => {
        const transactionElement = createTransactionElement(transaction);
        transactionsList.appendChild(transactionElement);
    });
}

// Criar elemento de transação
function createTransactionElement(transaction) {
    const element = document.createElement('div');
    element.className = `transaction-item ${transaction.type}`;
    
    const categoryLabel = categories[transaction.type].find(cat => cat.value === transaction.category)?.label || transaction.category;
    const formattedAmount = transaction.amount.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    const formattedDate = new Date(transaction.date).toLocaleDateString('pt-BR');

    element.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-description">${transaction.description}</div>
            <div class="transaction-details">
                <span class="transaction-category ${transaction.type}">${categoryLabel}</span>
                <span>${formattedDate}</span>
                ${transaction.notes ? `<span>${transaction.notes}</span>` : ''}
            </div>
        </div>
        <div class="transaction-amount ${transaction.type}">${formattedAmount}</div>
        <div class="transaction-actions">
            <button class="btn-edit" onclick="editTransaction('${transaction.id}')">✏️</button>
            <button class="btn-delete" onclick="deleteTransaction('${transaction.id}')">🗑️</button>
        </div>
    `;

    return element;
}

// Mostrar modal para adicionar transação
function showAddTransactionModal(type) {
    editingTransactionId = null;
    
    // Definir o tipo selecionado
    document.getElementById('transactionType').value = type;
    updateCategories();
    
    document.getElementById('modalTitle').textContent = `Adicionar ${type === 'receita' ? 'Receita' : 'Despesa'}`;
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionType').value = type;
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    updateCategories();
    document.getElementById('transactionModal').style.display = 'block';
}

// Editar transação
function editTransaction(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    editingTransactionId = transactionId;
    document.getElementById('modalTitle').textContent = 'Editar Transação';
    
    // Preencher formulário
    document.getElementById('transactionType').value = transaction.type;
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionDescription').value = transaction.description;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionDate').value = transaction.date;
    document.getElementById('transactionNotes').value = transaction.notes || '';

    updateCategories();
    document.getElementById('transactionModal').style.display = 'block';
}

// Excluir transação
function deleteTransaction(transactionId) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        transactions = transactions.filter(t => t.id !== transactionId);
        saveTransactions();
        loadTransactions();
        updateFinancialSummary();
    }
}

// Fechar modal
function closeModal() {
    document.getElementById('transactionModal').style.display = 'none';
    editingTransactionId = null;
}

// Atualizar categorias baseado no tipo selecionado
function updateCategories() {
    const type = document.getElementById('transactionType').value;
    const categorySelect = document.getElementById('transactionCategory');
    
    categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
    
    if (type && categories[type]) {
        categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.label;
            categorySelect.appendChild(option);
        });
    }
}

// Lidar com envio do formulário
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        type: document.getElementById('transactionType').value,
        category: document.getElementById('transactionCategory').value,
        description: document.getElementById('transactionDescription').value.trim(),
        amount: parseFloat(document.getElementById('transactionAmount').value),
        date: document.getElementById('transactionDate').value,
        notes: document.getElementById('transactionNotes').value.trim() || null
    };

    if (editingTransactionId) {
        // Editar transação existente
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...formData };
        }
    } else {
        // Adicionar nova transação
        const newTransaction = {
            id: generateId(),
            ...formData,
            createdAt: new Date().toISOString()
        };
        transactions.push(newTransaction);
    }

    saveTransactions();
    loadTransactions();
    updateFinancialSummary();
    closeModal();
}

// Gerar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Salvar transações no localStorage
function saveTransactions() {
    localStorage.setItem('planejagro_transactions', JSON.stringify(transactions));
}

// Atualizar resumo financeiro
function updateFinancialSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;

    document.getElementById('totalIncome').textContent = totalIncome.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    document.getElementById('totalExpense').textContent = totalExpense.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    document.getElementById('currentBalance').textContent = balance.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    // Mudar cor do saldo baseado no valor
    const balanceElement = document.getElementById('currentBalance');
    if (balance > 0) {
        balanceElement.style.color = '#00b894';
    } else if (balance < 0) {
        balanceElement.style.color = '#e17055';
    } else {
        balanceElement.style.color = '#74b9ff';
    }
}

// Filtrar transações
function filterTransactions() {
    const typeFilter = document.getElementById('typeFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    const filteredTransactions = transactions.filter(transaction => {
        const typeMatch = !typeFilter || transaction.type === typeFilter;
        const categoryMatch = !categoryFilter || transaction.category === categoryFilter;
        return typeMatch && categoryMatch;
    });

    // Atualizar a lista com transações filtradas
    const transactionsList = document.getElementById('transactionsList');
    transactionsList.innerHTML = '';

    if (filteredTransactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <h3>🔍 Nenhuma transação encontrada</h3>
                <p>Tente ajustar os filtros ou adicionar novas transações</p>
            </div>
        `;
        return;
    }

    // Ordenar por data
    const sortedTransactions = filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTransactions.forEach(transaction => {
        const transactionElement = createTransactionElement(transaction);
        transactionsList.appendChild(transactionElement);
    });
}

// Adicionar transações de exemplo se não houver nenhuma
function addSampleTransactions() {
    if (transactions.length === 0) {
        const sampleTransactions = [
            {
                id: generateId(),
                type: 'receita',
                category: 'venda',
                description: 'Venda de Milho - Safra 2024',
                amount: 45000.00,
                date: '2024-03-15',
                notes: 'Venda para cooperativa local',
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                type: 'despesa',
                category: 'insumos',
                description: 'Compra de Fertilizantes NPK',
                amount: 8500.00,
                date: '2024-01-20',
                notes: 'Fertilizante para plantio',
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                type: 'despesa',
                category: 'mao_obra',
                description: 'Mão de Obra - Plantio',
                amount: 3200.00,
                date: '2024-02-10',
                notes: 'Contratação de trabalhadores rurais',
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                type: 'receita',
                category: 'subsidio',
                description: 'Subsídio Rural - PRONAF',
                amount: 15000.00,
                date: '2024-01-05',
                notes: 'Financiamento para safra 2024',
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                type: 'despesa',
                category: 'combustivel',
                description: 'Combustível - Tratores',
                amount: 2800.00,
                date: '2024-02-25',
                notes: 'Diesel para equipamentos',
                createdAt: new Date().toISOString()
            }
        ];
        
        transactions = sampleTransactions;
        saveTransactions();
        loadTransactions();
        updateFinancialSummary();
    }
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('transactionModal');
    if (event.target === modal) {
        closeModal();
    }
}
