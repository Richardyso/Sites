// Sistema de Gestão de Estoque para Planejagro
let products = JSON.parse(localStorage.getItem('planejagro_products')) || [];
let editingProductId = null;

// Inicializar a página
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateStats();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('productForm').addEventListener('submit', handleFormSubmit);
}

// Carregar produtos do localStorage
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';

    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <h3>📦 Nenhum produto cadastrado</h3>
                <p>Clique em "Adicionar Produto" para começar a gerenciar seu estoque</p>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Criar card do produto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Verificar status do produto
    const isLowStock = product.quantity <= product.minStock;
    const isExpired = product.expiry && new Date(product.expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (isLowStock) card.classList.add('low-stock');
    if (isExpired) card.classList.add('expired');

    const categoryNames = {
        'fertilizantes': 'Fertilizantes',
        'agrotoxicos': 'Agrotóxicos',
        'corretivos': 'Corretivos'
    };

    card.innerHTML = `
        <div class="product-header">
            <h3 class="product-name">${product.name}</h3>
            <span class="product-category category-${product.category}">
                ${categoryNames[product.category]}
            </span>
        </div>
        
        ${isLowStock ? '<div class="stock-warning">⚠️ Estoque baixo!</div>' : ''}
        ${isExpired ? '<div class="stock-warning">⚠️ Próximo ao vencimento!</div>' : ''}
        
        <div class="product-info">
            <div class="info-row">
                <span class="info-label">Quantidade:</span>
                <span class="info-value">${product.quantity} ${product.unit}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Estoque mínimo:</span>
                <span class="info-value">${product.minStock} ${product.unit}</span>
            </div>
            ${product.expiry ? `
            <div class="info-row">
                <span class="info-label">Vencimento:</span>
                <span class="info-value">${new Date(product.expiry).toLocaleDateString('pt-BR')}</span>
            </div>
            ` : ''}
            ${product.supplier ? `
            <div class="info-row">
                <span class="info-label">Fornecedor:</span>
                <span class="info-value">${product.supplier}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="product-actions">
            <button class="btn-edit" onclick="editProduct('${product.id}')">✏️ Editar</button>
            <button class="btn-delete" onclick="deleteProduct('${product.id}')">🗑️ Excluir</button>
        </div>
    `;

    return card;
}

// Mostrar modal para adicionar produto
function showAddProductModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Adicionar Produto';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').style.display = 'block';
}

// Editar produto
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;
    document.getElementById('modalTitle').textContent = 'Editar Produto';
    
    // Preencher formulário com dados do produto
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('productMinStock').value = product.minStock;
    document.getElementById('productExpiry').value = product.expiry || '';
    document.getElementById('productSupplier').value = product.supplier || '';
    document.getElementById('productNotes').value = product.notes || '';

    document.getElementById('productModal').style.display = 'block';
}

// Excluir produto
function deleteProduct(productId) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        products = products.filter(p => p.id !== productId);
        saveProducts();
        loadProducts();
        updateStats();
    }
}

// Fechar modal
function closeModal() {
    document.getElementById('productModal').style.display = 'none';
    editingProductId = null;
}

// Lidar com envio do formulário
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value,
        quantity: parseFloat(document.getElementById('productQuantity').value),
        unit: document.getElementById('productUnit').value,
        minStock: parseFloat(document.getElementById('productMinStock').value),
        expiry: document.getElementById('productExpiry').value || null,
        supplier: document.getElementById('productSupplier').value.trim() || null,
        notes: document.getElementById('productNotes').value.trim() || null
    };

    if (editingProductId) {
        // Editar produto existente
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            products[index] = { ...products[index], ...formData };
        }
    } else {
        // Adicionar novo produto
        const newProduct = {
            id: generateId(),
            ...formData,
            createdAt: new Date().toISOString()
        };
        products.push(newProduct);
    }

    saveProducts();
    loadProducts();
    updateStats();
    closeModal();
}

// Gerar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Salvar produtos no localStorage
function saveProducts() {
    localStorage.setItem('planejagro_products', JSON.stringify(products));
}

// Atualizar estatísticas
function updateStats() {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= p.minStock).length;
    const expiredProducts = products.filter(p => 
        p.expiry && new Date(p.expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;
    const expiringSoon = products.filter(p => 
        p.expiry && new Date(p.expiry) <= new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    ).length;

    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('lowStockProducts').textContent = lowStockProducts;
    document.getElementById('expiredProducts').textContent = expiredProducts;
    document.getElementById('expiringSoon').textContent = expiringSoon;
}

// Filtrar produtos por categoria
function filterProducts() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent;
        const product = products.find(p => p.name === productName);
        
        if (!selectedCategory || product.category === selectedCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Adicionar alguns produtos de exemplo se não houver nenhum
if (products.length === 0) {
    const exampleProducts = [
        {
            id: generateId(),
            name: 'NPK 20-20-20',
            category: 'fertilizantes',
            quantity: 50,
            unit: 'sc',
            minStock: 10,
            expiry: '2025-12-31',
            supplier: 'Agrofert Ltda',
            notes: 'Fertilizante balanceado para aplicação geral',
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Glifosato 480',
            category: 'agrotoxicos',
            quantity: 12,
            unit: 'L',
            minStock: 5,
            expiry: '2024-06-15',
            supplier: 'Defensivos São Paulo',
            notes: 'Herbicida sistêmico',
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Calcário Dolomítico',
            category: 'corretivos',
            quantity: 2000,
            unit: 'kg',
            minStock: 500,
            expiry: null,
            supplier: 'Mineração Rural',
            notes: 'PRNT 85%',
            createdAt: new Date().toISOString()
        }
    ];
    
    products = exampleProducts;
    saveProducts();
}
