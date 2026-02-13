import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
const dir = path.join(__dirname, 'assets', 'wasm');
const dest = path.join(dir, 'sql-wasm.wasm');

if (fs.existsSync(src)) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('sql-wasm.wasm copiado para assets/wasm/');
} else {
  console.warn('copy-wasm: sql.js não encontrado em node_modules, execute npm install');
}
