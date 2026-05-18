import fs from 'fs';
import path from 'path';

function search(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) search(full);
    else if (full.endsWith('.js') || full.endsWith('.mjs') || full.endsWith('.cjs')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.match(/(window|globalThis|global|self)\.fetch\s*=/)) {
        console.log(full);
      }
    }
  }
}
search('node_modules');
