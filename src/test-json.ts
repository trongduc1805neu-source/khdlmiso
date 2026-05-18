import fs from 'fs';
try {
  JSON.parse(fs.readFileSync('src/data/questions.json', 'utf8'));
  console.log('JSON Valid');
} catch(e) {
  console.error('JSON Error:', e.message);
}
