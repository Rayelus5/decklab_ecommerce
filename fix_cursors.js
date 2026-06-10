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

  // We look for elements like <button ... className="..." ...>
  // Or <div ... onClick={...} ... className="..." ...>
  // Since JSX parsing with regex is hard, we can do a simpler replace:
  // Look for className="..." and if the line or previous lines contain <button or onClick
  // Actually, a simple regex: className="([^"]*)"
  // If we just add cursor-pointer to any className inside a tag that has onClick or is a button or a Link, it's safer.
  
  const regex = /(<(?:button|a|Link)[^>]*?className=(?:\"([^"]*)\"|`([^`]*)`|\{([^}]*)\})[^>]*>|<[^>]+?onClick=[^>]+?className=(?:\"([^"]*)\"|`([^`]*)`|\{([^}]*)\})[^>]*>)/gs;
  
  content = content.replace(regex, (match) => {
    if (match.includes('cursor-pointer') || match.includes('cursor-default') || match.includes('cursor-not-allowed')) {
      return match;
    }
    
    // Inject cursor-pointer into the className
    if (match.includes('className="')) {
      return match.replace(/className="/, 'className="cursor-pointer ');
    } else if (match.includes('className={`')) {
      return match.replace(/className={`/, 'className={`cursor-pointer ');
    } else if (match.includes("className={'")) {
      return match.replace(/className=\{'/, "className={'cursor-pointer ");
    } else if (match.includes('className={clsx(')) {
      return match.replace(/className=\{clsx\(/, 'className={clsx("cursor-pointer", ');
    } else if (match.includes('className={cn(')) {
      return match.replace(/className=\{cn\(/, 'className={cn("cursor-pointer", ');
    }
    return match;
  });

  // What if the element doesn't have className at all?
  // e.g. <button onClick={foo}>
  const noClassRegex = /(<(?:button|a|Link)(?![^>]*className=)[^>]*?)>/g;
  content = content.replace(noClassRegex, (match, p1) => {
    // If it's a self-closing tag it ends with />, we should handle that
    if (match.endsWith('/>')) {
      return match.replace(/\/>$/, ' className="cursor-pointer" />');
    }
    return match.replace(/>$/, ' className="cursor-pointer">');
  });

  const noClassOnClickRegex = /(<[A-Za-z0-9]+(?![^>]*className=)[^>]+onClick=[^>]*?)>/g;
  content = content.replace(noClassOnClickRegex, (match, p1) => {
    if (match.endsWith('/>')) {
      return match.replace(/\/>$/, ' className="cursor-pointer" />');
    }
    return match.replace(/>$/, ' className="cursor-pointer">');
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed:', filePath);
  }
}

['./app', './components'].forEach(dir => {
  if (fs.existsSync(dir)) walk(dir, processFile);
});
