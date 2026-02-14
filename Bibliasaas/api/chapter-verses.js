import { getVerseNumbersForChapter } from './db-helper.js';

/**
 * GET ?book=1&chapter=1&translation=acf
 * Retorna { verses: [1, 2, 3, ...] } para popular o select de versículo.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  const book = parseInt(req.query.book, 10);
  const chapter = parseInt(req.query.chapter, 10);
  const translation = (req.query.translation || '').trim();

  if (!Number.isInteger(book) || book < 1 || book > 66) {
    return res.status(400).json({ error: 'Parâmetro book inválido (1-66)' });
  }
  if (!Number.isInteger(chapter) || chapter < 1) {
    return res.status(400).json({ error: 'Parâmetro chapter inválido' });
  }
  if (!translation) {
    return res.status(400).json({ error: 'Parâmetro translation obrigatório' });
  }

  try {
    const verses = await getVerseNumbersForChapter(translation, book, chapter);
    res.status(200).json({ verses });
  } catch (err) {
    console.error('[api/chapter-verses]', err);
    res.status(500).json({ error: 'Erro ao buscar versículos', verses: [] });
  }
}
