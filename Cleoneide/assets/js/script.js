function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '_')      // Substitui caracteres especiais por underscore
    .replace(/_+/g, '_')             // Remove underscores duplos
    .replace(/^_|_$/g, '');          // Remove underscores no início/fim
}

async function carregarProdutos() {
  try {
    // Obter o nome do arquivo HTML atual, ex: "relogios.html"
    const nomeArquivo = window.location.pathname.split('/').pop();

    // Extrair a parte antes do .html, ex: "relogios"
    const nomeBase = nomeArquivo.replace('.html', '');

    // Normalizar o nome da página para comparação
    const nomeBaseNormalizado = normalizarTexto(nomeBase);

    // Buscar dados do JSON único no Firebase
    const urlFirebase = "https://cleoneide-d1b5d-default-rtdb.firebaseio.com/.json";
    const resposta = await fetch(urlFirebase);
    if (!resposta.ok) throw new Error(`Falha ao carregar dados do Firebase: ${resposta.status}`);
    const dados = await resposta.json();

    // Buscar a categoria correspondente (case-insensitive)
    let categoria = null;
    let produtos = null;

    for (const [chave, valor] of Object.entries(dados)) {
      const chaveNormalizada = normalizarTexto(chave);
      if (chaveNormalizada === nomeBaseNormalizado) {
        categoria = chave;
        produtos = valor;
        break;
      }
    }

    if (!categoria || !produtos || !Array.isArray(produtos)) {
      throw new Error(`Categoria não encontrada para página: ${nomeBase}`);
    }

    // Encontrar o container no HTML
    const container = document.getElementById('lista-produtos');
    if (!container) throw new Error('Elemento com id="lista-produtos" não encontrado no HTML');

    // Limpar o container (importante caso haja recarregamento)
    container.innerHTML = "";

    // Filtrar apenas produtos disponíveis e renderizar
    const produtosDisponiveis = produtos.filter(item => item.disponivel === true);

    if (produtosDisponiveis.length === 0) {
      container.innerHTML = '<p>Nenhum produto disponível no momento.</p>';
      return;
    }

    produtosDisponiveis.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('produto-item');
      div.innerHTML = `
        ${item.imagem ? `<img src="${item.imagem}" alt="${item.nome}" class="produto-imagem">` : ''}
        <h2>${item.nome}</h2>
        <p>${item.descricao}</p>
        <p class="preco">${item.preco}</p>
        <p class="quantidade">Quantidade: ${item.quantidade}</p>
      `;
      container.appendChild(div);
    });

  } catch (erro) {
    console.error(erro);
    const container = document.getElementById('lista-produtos');
    if (container) container.innerHTML = '<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>';
  }
}

// Só executa carregarProdutos se existir o container na página
if (document.getElementById('lista-produtos')) {
  carregarProdutos();
}