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

1. Instale as dependências e faça o deploy:
   ```bash
   npm install
   vercel
   ```
2. Ou conecte o repositório no dashboard da Vercel (build sem comando; output na raiz).
3. Coloque os 3 arquivos `.sqlite` em `assets/traducoes/` (ex.: `almeida.sqlite`, `nvi.sqlite`, `acf.sqlite`).

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
