import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TRADUCOES_DIR = path.join(ROOT, 'assets', 'traducoes');

function findSqliteFiles() {
  if (fs.existsSync(TRADUCOES_DIR)) {
    const files = fs.readdirSync(TRADUCOES_DIR).filter((f) => f.endsWith('.sqlite'));
    if (files.length > 0) return files.map((f) => path.join(TRADUCOES_DIR, f));
  }
  const cwdDir = path.join(process.cwd(), 'assets', 'traducoes');
  if (cwdDir !== TRADUCOES_DIR && fs.existsSync(cwdDir)) {
    const files = fs.readdirSync(cwdDir).filter((f) => f.endsWith('.sqlite'));
    if (files.length > 0) return files.map((f) => path.join(cwdDir, f));
  }
  return [];
}

/**
 * Lista traduções disponíveis (arquivos .sqlite em assets/traducoes).
 * ?debug=1 retorna informações para diagnóstico no F12 (aba Rede / Console).
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  const debug = req.url && req.url.includes('debug=1');

  try {
    const fullPaths = findSqliteFiles();
    const translations = fullPaths.slice(0, 3).map((filePath) => {
      const f = path.basename(filePath, '.sqlite');
      const name = f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' ');
      return { id: f, name };
    });

    if (debug) {
      const dirExists = fs.existsSync(TRADUCOES_DIR);
      let dirContents = [];
      try {
        dirContents = dirExists ? fs.readdirSync(TRADUCOES_DIR) : [];
      } catch (_) {
        dirContents = ['(erro ao listar)'];
      }
      return res.status(200).json({
        translations,
        debug: {
          processCwd: process.cwd(),
          root: ROOT,
          traducoesDir: TRADUCOES_DIR,
          dirExists,
          dirContents,
          filesFound: fullPaths.map((p) => path.basename(p)),
        },
      });
    }

    res.status(200).json(translations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar traduções' });
  }
}
