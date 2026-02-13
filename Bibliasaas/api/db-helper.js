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
 * verseNumber: opcional; se informado, retorna apenas esse versículo.
 */
export async function queryVerses(translationId, bookNumber, chapter, verseNumber = null) {
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
    const whereVerse = verseNumber != null ? ` AND ${verseCol}=?` : '';
    const stmt = db.prepare(
      `SELECT ${verseCol}, ${textCol} FROM ${tableName} WHERE ${bookCol}=? AND ${chapterCol}=?${whereVerse} ORDER BY ${verseCol}`
    );
    if (verseNumber != null) {
      stmt.bind([bookNumber, chapter, verseNumber]);
    } else {
      stmt.bind([bookNumber, chapter]);
    }
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
