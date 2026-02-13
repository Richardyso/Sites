# Bibliasaas

Leitor da Bíblia com múltiplas traduções em domínio público. Projeto fullstack em **JavaScript puro**, preparado para deploy na **Vercel**.

## Estrutura do projeto

- **`/index.html`** — Página única (SPA): seletor de livro, capítulo e traduções + leitura comparativa.
- **`/assets/traducoes/`** — Arquivos `.sqlite` das traduções (até 3 no momento).
- **`/assets/styles/`** — CSS separados (variáveis, layout, componentes, tema).
- **`/assets/scripts/app.js`** — Lógica da aplicação (sem frameworks).
- **`/api/`** — Funções serverless Vercel:
  - `GET /api/books` — Lista os 66 livros.
  - `GET /api/translations` — Lista traduções (arquivos `.sqlite` em `assets/traducoes`).
  - `GET /api/verses?book=1&chapter=1&translations=id1,id2` — Versículos do capítulo.

## Esquema esperado do SQLite

Cada arquivo em `assets/traducoes` deve ser um banco SQLite com uma tabela de versículos. O código aceita:

- **Tabelas:** `verse`, `verses` ou `versiculo`
- **Colunas:**  
  - Livro: `book`, `book_id` ou `livro` (número 1–66)  
  - Capítulo: `chapter` ou `capitulo`  
  - Versículo: `verse` ou `versiculo`  
  - Texto: `text`, `texto` ou `content`

Exemplo: `SELECT verse, text FROM verse WHERE book=? AND chapter=? ORDER BY verse`.

## Deploy na Vercel

1. Coloque os 3 arquivos `.sqlite` em `assets/traducoes/` (ex.: `almeida.sqlite`, `nvi.sqlite`, `acf.sqlite`).
2. **Importante:** os arquivos precisam estar **commitados e enviados ao repositório**. Se não estiverem no Git, a Vercel não os inclui no deploy e a lista de traduções fica vazia.
3. O `vercel.json` já está configurado com **`includeFiles`** para as funções serverless (`api/translations.js` e `api/verses.js`). A Vercel usa “Node File Trace” e só empacota arquivos detectados estaticamente; como os `.sqlite` são acessados por caminhos dinâmicos (`path.join(..., 'assets/traducoes', ...)`), eles precisam ser incluídos explicitamente. Sem essa configuração, as funções rodam na Vercel mas não “enxergam” os bancos.
   ```bash
   git add assets/traducoes/*.sqlite
   git commit -m "Adiciona bases de traduções"
   git push
   ```
4. Instale as dependências e faça o deploy, ou conecte o repositório no dashboard da Vercel (build sem comando; output na raiz).
   ```bash
   npm install
   vercel
   ```

## Desenvolvimento local

- **Frontend:** abra `index.html` por um servidor HTTP (ex.: `npx serve .`) para evitar problemas de CORS com `/api`.
- **API:** use o [CLI da Vercel](https://vercel.com/cli) para rodar as serverless em ambiente próximo ao da Vercel:
  ```bash
  npm install
  vercel dev
  ```

## Interface

- Página inicial com seletor de **livro**, **capítulo** e **traduções** (checkboxes, até 3).
- Botão **Ler** carrega o capítulo.
- Leitura comparativa:
  - **Desktop:** tabela com versículos em colunas (uma por tradução).
  - **Mobile:** versículos empilhados (cada versículo com as traduções uma abaixo da outra).
- Botão de **modo escuro** no topo; preferência salva em `localStorage`.

## Próximos passos (futuro)

- Conectar API externa e adicionar mais traduções além das 3 atuais.
