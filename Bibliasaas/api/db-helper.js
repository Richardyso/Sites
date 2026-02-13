import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

let SQL = null;

async function getSql() {
  if (SQL) return SQL;
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });
  return SQL;
}

/**
 * Abre um .sqlite em assets/traducoes e executa query de versículos.
 * Aceita esquemas: tabela "verse" ou "verses" com (book/book_id, chapter, verse, text/texto).
 */
export async function queryVerses(translationId, bookNumber, chapter) {
  const dbPath = path.join(process.cwd(), 'assets', 'traducoes', `${translationId}.sqlite`);
  if (!fs.existsSync(dbPath)) {
    return { translationId, verses: [], error: 'Arquivo não encontrado' };
  }
  const Sql = await getSql();
  const buffer = fs.readFileSync(dbPath);
  const db = new Sql.Database(buffer);
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND (name='verse' OR name='verses' OR name='versiculo')");
    const tableName = tables.length ? tables[0].values[0][0] : 'verse';
    const cols = db.exec(`PRAGMA table_info(${tableName})`);
    const colMap = {};
    cols[0].values.forEach(([cid, name]) => { colMap[name.toLowerCase()] = name; });
    const bookCol = colMap.book_id || colMap.book || colMap.livro || 'book';
    const chapterCol = colMap.chapter || colMap.capitulo || 'chapter';
    const verseCol = colMap.verse || colMap.versiculo || 'verse';
    const textCol = colMap.text || colMap.texto || colMap.content || 'text';
    const stmt = db.prepare(
      `SELECT ${verseCol}, ${textCol} FROM ${tableName} WHERE ${bookCol}=? AND ${chapterCol}=? ORDER BY ${verseCol}`
    );
    stmt.bind([bookNumber, chapter]);
    const verses = [];
    while (stmt.step()) {
      const row = stmt.get();
      verses.push({ verse: row[0], text: row[1] || '' });
    }
    stmt.free();
    return { translationId, verses };
  } finally {
    db.close();
  }
}
