const fs = require('fs');
const path = require('path');

function searchInDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchInDir(filePath, query);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`FOUND "${query}" in: ${filePath}`);
        // Print lines containing query
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log("Searching for 'database'...");
searchInDir(path.join(__dirname, '..', 'src'), 'database');
console.log("Searching for 'caricamento'...");
searchInDir(path.join(__dirname, '..', 'src'), 'caricamento');
console.log("Searching for 'errore'...");
searchInDir(path.join(__dirname, '..', 'src'), 'errore');
