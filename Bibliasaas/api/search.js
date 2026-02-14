import { querySearch } from './db-helper.js';
import { BOOKS } from './books.js';

const BOOK_MAP = Object.fromEntries(BOOKS.map((b) => [b.number, b.name]));

/**
 * GET ?q=palavra&translations=ACF,NVI&limit=50
 * Pesquisa a palavra em cada tradução e retorna { results: [{ book, bookName, chapter, verse, text, translationId }] }
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 80, 200);
  const translationsParam = req.query.translations || '';
  const translationIds = translationsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (!q) {
    return res.status(400).json({ error: 'Parâmetro q (palavra) é obrigatório' });
  }
  if (translationIds.length === 0) {
    return res.status(400).json({ error: 'Informe ao menos uma tradução em translations' });
  }

  try {
    const all = await Promise.all(
      translationIds.map((id) => querySearch(id, q, limit))
    );
    const combined = [];
    all.forEach(({ translationId, results }) => {
      results.forEach((r) => {
        combined.push({
          book: r.book,
          bookName: BOOK_MAP[r.book] || 'Livro ' + r.book,
          chapter: r.chapter,
          verse: r.verse,
          text: r.text,
          translationId,
        });
      });
    });
    combined.sort((a, b) => {
      if (a.book !== b.book) return a.book - b.book;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      if (a.verse !== b.verse) return a.verse - b.verse;
      return (a.translationId || '').localeCompare(b.translationId || '');
    });
    res.status(200).json({ results: combined });
  } catch (err) {
    console.error('[api/search]', err);
    const message = err && err.message ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao pesquisar', detail: message });
  }
}
