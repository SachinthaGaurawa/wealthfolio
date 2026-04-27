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
  content = content.replace(/border-white\/5/g, 'border-slate-200');
  content = content.replace(/border-white\/10/g, 'border-slate-200');
  content = content.replace(/bg-black\/20/g, 'bg-slate-100');
  content = content.replace(/bg-white\/5/g, 'bg-slate-100');
  content = content.replace(/bg-white\/10/g, 'bg-slate-200');
  fs.writeFileSync(file, content);
});
