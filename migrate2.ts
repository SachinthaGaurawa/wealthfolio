import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src/components');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-slate-900\/50/g, 'bg-slate-50');
  content = content.replace(/bg-slate-900/g, 'bg-slate-100/50');
  content = content.replace(/hover:bg-slate-800/g, 'hover:bg-slate-200');
  content = content.replace(/border-slate-800\/50/g, 'border-slate-200');
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  fs.writeFileSync(file, content);
});
