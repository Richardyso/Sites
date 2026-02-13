import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRADUCOES_DIR = path.join(process.cwd(), 'assets', 'traducoes');

/**
 * Lista traduções disponíveis (arquivos .sqlite em assets/traducoes).
 * Esperado: nome do arquivo sem extensão = id da tradução.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    if (!fs.existsSync(TRADUCOES_DIR)) {
      return res.status(200).json([]);
    }
    const files = fs.readdirSync(TRADUCOES_DIR);
    const translations = files
      .filter((f) => f.endsWith('.sqlite'))
      .map((f) => {
        const id = path.basename(f, '.sqlite');
        const name = id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' ');
        return { id, name };
      })
      .slice(0, 3);
    res.status(200).json(translations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar traduções' });
  }
}
