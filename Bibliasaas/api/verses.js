import { queryVerses } from './db-helper.js';

/**
 * GET ?book=1&chapter=1&translations=almeida,nvi,acf
 * Retorna { data: [ { translationId, verses: [{ verse, text }] }, ... ] }
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  const book = parseInt(req.query.book, 10);
  const chapterParam = req.query.chapter;
  const chapter = chapterParam !== undefined && chapterParam !== '' ? parseInt(chapterParam, 10) : null;
  const translationsParam = req.query.translations || '';
  const translationIds = translationsParam.split(',').map((s) => s.trim()).filter(Boolean);
  const verseFrom = req.query.verse ? parseInt(req.query.verse, 10) : null;
  const verseToRaw = req.query.verseTo ? parseInt(req.query.verseTo, 10) : null;
  let verseOnly = verseFrom;
  let verseTo = verseToRaw;
  if (verseFrom !== null && verseToRaw !== null) {
    verseOnly = Math.min(verseFrom, verseToRaw);
    verseTo = Math.max(verseFrom, verseToRaw);
  } else if (verseFrom === null && verseToRaw !== null) {
    verseOnly = 1;
    verseTo = verseToRaw;
  }

  if (!Number.isInteger(book) || book < 1 || book > 66) {
    return res.status(400).json({ error: 'Parâmetro book inválido (1-66)' });
  }
  if (chapter !== null && (!Number.isInteger(chapter) || chapter < 1)) {
    return res.status(400).json({ error: 'Parâmetro chapter inválido' });
  }
  if (translationIds.length === 0) {
    return res.status(400).json({ error: 'Informe ao menos uma tradução em translations' });
  }
  if (verseOnly !== null && (!Number.isInteger(verseOnly) || verseOnly < 1)) {
    return res.status(400).json({ error: 'Parâmetro verse inválido' });
  }
  if (verseTo !== null && (!Number.isInteger(verseTo) || verseTo < 1)) {
    return res.status(400).json({ error: 'Parâmetro verseTo inválido' });
  }
  if (chapter === null && verseOnly !== null) {
    return res.status(400).json({ error: 'Versículo específico exige capítulo' });
  }

  try {
    const results = await Promise.all(
      translationIds.map((id) => queryVerses(id, book, chapter, verseOnly, verseTo))
    );
    res.status(200).json({ data: results });
  } catch (err) {
    console.error('[api/verses]', err);
    const message = err && err.message ? err.message : String(err);
    res.status(500).json({ error: 'Erro ao buscar versículos', detail: message });
  }
}
