import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let SQL = null;

async function getSql() {
  if (SQL) return SQL;
  const wasmInAssets = path.join(ROOT, 'assets', 'wasm', 'sql-wasm.wasm');
  if (fs.existsSync(wasmInAssets)) {
    SQL = await initSqlJs({
      locateFile: (file) => path.join(ROOT, 'assets', 'wasm', file),
    });
    return SQL;
  }
  const bases = [process.cwd(), ROOT];
  for (const base of bases) {
    const wasmPath = path.join(base, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    if (fs.existsSync(wasmPath)) {
      SQL = await initSqlJs({
        locateFile: (file) => path.join(base, 'node_modules', 'sql.js', 'dist', file),
      });
      return SQL;
    }
  }
  throw new Error('sql.js: WASM não encontrado. Procure em assets/wasm/ e node_modules/sql.js/dist. Bases: ' + [ROOT, ...bases].join(', '));
}

/**
 * Abre um .sqlite em assets/traducoes e executa query de versículos.
 * chapter: obrigatório para um capítulo; se null, retorna o livro inteiro (verses com chapter, verse, text).
 * verseNumber: opcional; se informado, retorna apenas esse versículo (ou faixa se verseTo também informado).
 * verseTo: opcional; se informado junto com verseNumber, retorna versículos de verseNumber até verseTo (inclusive).
 */
export async function queryVerses(translationId, bookNumber, chapter, verseNumber = null, verseTo = null) {
  const dbPath = path.join(ROOT, 'assets', 'traducoes', `${translationId}.sqlite`);
  if (!fs.existsSync(dbPath)) {
    return { translationId, verses: [], error: 'Arquivo não encontrado: ' + path.basename(dbPath) };
  }
  let Sql;
  try {
    Sql = await getSql();
  } catch (e) {
    throw new Error('sql.js init: ' + (e && e.message ? e.message : String(e)));
  }
  const buffer = fs.readFileSync(dbPath);
  const db = new Sql.Database(buffer);
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND (name='verse' OR name='verses' OR name='versiculo')");
    const tableName = tables.length ? tables[0].values[0][0] : 'verse';
    const colsResult = db.exec(`PRAGMA table_info(${tableName})`);
    if (!colsResult.length || !colsResult[0].values.length) {
      db.close();
      return { translationId, verses: [], error: 'Tabela sem colunas ou não encontrada' };
    }
    const colMap = {};
    colsResult[0].values.forEach(([cid, name]) => { colMap[name.toLowerCase()] = name; });
    const bookCol = colMap.book_id || colMap.book || colMap.livro || 'book';
    const chapterCol = colMap.chapter || colMap.capitulo || 'chapter';
    const verseCol = colMap.verse || colMap.versiculo || 'verse';
    const textCol = colMap.text || colMap.texto || colMap.content || 'text';

    if (chapter == null) {
      const stmt = db.prepare(
        `SELECT ${chapterCol}, ${verseCol}, ${textCol} FROM ${tableName} WHERE ${bookCol}=? ORDER BY ${chapterCol}, ${verseCol}`
      );
      stmt.bind([bookNumber]);
      const verses = [];
      while (stmt.step()) {
        const row = stmt.get();
        verses.push({ chapter: row[0], verse: row[1], text: row[2] || '' });
      }
      stmt.free();
      return { translationId, verses };
    }

    let whereVerse = '';
    const bindParams = [bookNumber, chapter];
    if (verseNumber != null && verseTo != null) {
      whereVerse = ` AND ${verseCol}>=? AND ${verseCol}<=?`;
      bindParams.push(verseNumber, verseTo);
    } else if (verseNumber != null) {
      whereVerse = ` AND ${verseCol}=?`;
      bindParams.push(verseNumber);
    }
    const stmt = db.prepare(
      `SELECT ${verseCol}, ${textCol} FROM ${tableName} WHERE ${bookCol}=? AND ${chapterCol}=?${whereVerse} ORDER BY ${verseCol}`
    );
    stmt.bind(bindParams);
    const verses = [];
    while (stmt.step()) {
      const row = stmt.get();
      verses.push({ verse: row[0], text: row[1] || '' });
    }
    stmt.free();
    return { translationId, verses };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    throw new Error('queryVerses(' + translationId + '): ' + msg);
  } finally {
    db.close();
  }
}

/**
 * Retorna a lista de números de versículos de um capítulo (para popular um select).
 */
export async function getVerseNumbersForChapter(translationId, bookNumber, chapter) {
  const dbPath = path.join(ROOT, 'assets', 'traducoes', `${translationId}.sqlite`);
  if (!fs.existsSync(dbPath)) {
    return [];
  }
  let Sql;
  try {
    Sql = await getSql();
  } catch (e) {
    return [];
  }
  const buffer = fs.readFileSync(dbPath);
  const db = new Sql.Database(buffer);
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND (name='verse' OR name='verses' OR name='versiculo')");
    const tableName = tables.length ? tables[0].values[0][0] : 'verse';
    const colsResult = db.exec(`PRAGMA table_info(${tableName})`);
    if (!colsResult.length || !colsResult[0].values.length) {
      db.close();
      return [];
    }
    const colMap = {};
    colsResult[0].values.forEach(([cid, name]) => { colMap[name.toLowerCase()] = name; });
    const bookCol = colMap.book_id || colMap.book || colMap.livro || 'book';
    const chapterCol = colMap.chapter || colMap.capitulo || 'chapter';
    const verseCol = colMap.verse || colMap.versiculo || 'verse';
    const stmt = db.prepare(
      `SELECT DISTINCT ${verseCol} FROM ${tableName} WHERE ${bookCol}=? AND ${chapterCol}=? ORDER BY ${verseCol}`
    );
    stmt.bind([bookNumber, chapter]);
    const verses = [];
    while (stmt.step()) {
      verses.push(stmt.get()[0]);
    }
    stmt.free();
    return verses;
  } catch (e) {
    return [];
  } finally {
    db.close();
  }
}

/**
 * Pesquisa uma palavra em uma tradução. Retorna { translationId, results: [{ book, chapter, verse, text }] }.
 * limit: máximo de resultados por tradução (default 100).
 */
export async function querySearch(translationId, word, limit = 100) {
  if (!word || String(word).trim().length === 0) {
    return { translationId, results: [] };
  }
  const dbPath = path.join(ROOT, 'assets', 'traducoes', `${translationId}.sqlite`);
  if (!fs.existsSync(dbPath)) {
    return { translationId, results: [], error: 'Arquivo não encontrado' };
  }
  let Sql;
  try {
    Sql = await getSql();
  } catch (e) {
    throw new Error('sql.js init: ' + (e && e.message ? e.message : String(e)));
  }
  const buffer = fs.readFileSync(dbPath);
  const db = new Sql.Database(buffer);
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND (name='verse' OR name='verses' OR name='versiculo')");
    const tableName = tables.length ? tables[0].values[0][0] : 'verse';
    const colsResult = db.exec(`PRAGMA table_info(${tableName})`);
    if (!colsResult.length || !colsResult[0].values.length) {
      db.close();
      return { translationId, results: [] };
    }
    const colMap = {};
    colsResult[0].values.forEach(([cid, name]) => { colMap[name.toLowerCase()] = name; });
    const bookCol = colMap.book_id || colMap.book || colMap.livro || 'book';
    const chapterCol = colMap.chapter || colMap.capitulo || 'chapter';
    const verseCol = colMap.verse || colMap.versiculo || 'verse';
    const textCol = colMap.text || colMap.texto || colMap.content || 'text';
    const likeParam = '%' + String(word).trim().replace(/%/g, '\\%') + '%';
    const stmt = db.prepare(
      `SELECT ${bookCol}, ${chapterCol}, ${verseCol}, ${textCol} FROM ${tableName} WHERE ${textCol} LIKE ? LIMIT ?`
    );
    stmt.bind([likeParam, limit]);
    const results = [];
    while (stmt.step()) {
      const row = stmt.get();
      results.push({ book: row[0], chapter: row[1], verse: row[2], text: row[3] || '' });
    }
    stmt.free();
    return { translationId, results };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    throw new Error('querySearch(' + translationId + '): ' + msg);
  } finally {
    db.close();
  }
}
