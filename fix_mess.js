const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Revert the specific broken string
  content = content.replace(/= className="cursor-pointer"> /g, '=> ');
  content = content.replace(/= className="cursor-pointer">/g, '=>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed syntax error:', filePath);
  }
}

['./app', './components'].forEach(dir => {
  if (fs.existsSync(dir)) walk(dir, processFile);
});
