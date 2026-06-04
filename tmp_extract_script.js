const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'index.html');
const text = fs.readFileSync(filePath, 'utf8');
const match = text.match(/<script[^>]*>([\s\S]*?)<\/script>/);
if (!match) {
  console.error('NO_SCRIPT');
  process.exit(1);
}
fs.writeFileSync(path.join(__dirname, 'tmp_script_check.js'), match[1], 'utf8');
console.log('EXTRACTED');
