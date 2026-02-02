# Flow English - Site Oficial

Site educacional para o curso Flow English de conversação em inglês.

## Conteúdo do Site

- **Book 1 – The Incredible Book 1**: Verbo To Be (Present, Past, Future) + Dialogue 1
- **Book 2 – The Magnificent Book 2**: Verbos de Ação (Do/Does, Did, Will) + Dialogue 2
- **Book 3 – The Lovable Book 3**: Present Perfect, Modal Verbs (CAN / SHOULD / MUST) + Dialogue 3

Cada apostila tem link para download e conteúdo online com abas (gramática e diálogo). Teste de nivelamento (10 perguntas) para indicar Book 1 ou Book 2.

## Melhorias Implementadas

### Funcionalidades
- **Três apostilas**: Book 1, Book 2 e Book 3 com conteúdo online e links de download
- **Navegação por books**: Menu para alternar entre Book 1, Book 2 e Book 3
- **Teste de nivelamento**: 10 perguntas (Book 1 e Book 2), envio do resultado via WhatsApp
- **Progresso salvo**: O progresso do teste é salvo automaticamente no navegador
- **Barra de progresso**: Visual do progresso do teste em tempo real
- **Responsividade total**: Funciona em desktop, tablet e mobile
- **Menu mobile**: Menu hambúrguer em dispositivos móveis
- **Animações suaves**: Transições e animações CSS

### Segurança e performance
- Meta tags de SEO otimizadas
- Headers de segurança configurados (`_headers`)
- PWA ready com `manifest.json`
- Cache headers otimizados

### Acessibilidade
- Labels ARIA nos elementos interativos
- Skip link para o conteúdo principal
- Contraste adequado e formulários acessíveis

### Responsividade
- Desktop (1024px+)
- Tablet (768px – 1024px)
- Mobile (480px – 768px)
- Mobile pequeno (320px – 480px)

## Estrutura de arquivos

```
Flow English/
├── index.html          # Página principal
├── manifest.json       # PWA manifest
├── _headers            # Headers Netlify
├── README.md
└── assets/
    ├── styles.css      # Estilos
    ├── script.js       # Lógica (menu, abas, books, teste)
    └── imagens/
        └── og.PNG      # Imagem Open Graph
```

## Notas

1. **Imagens**: Adicionar manualmente se necessário: `favicon.png`, `apple-touch-icon.png`, ícones PWA.
2. **Teste de nivelamento**: As respostas são enviadas para o WhatsApp; a correção é feita pelo professor.
3. **Deploy**: Projeto pronto para Netlify (ou similar) com `_headers` configurado.

## URL do site

https://flowenglish.netlify.app/

## Contato

WhatsApp: (21) 98667-3864
