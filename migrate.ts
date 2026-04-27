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
  content = content.replace(/bg-\[#060a14\]/g, 'bg-slate-50');
  content = content.replace(/bg-\[#0f1729\]/g, 'bg-white');
  content = content.replace(/bg-\[#0b1120\]/g, 'bg-slate-50');
  content = content.replace(/border-\[#1a2640\]/g, 'border-slate-200');
  content = content.replace(/border-\[#223054\]/g, 'border-blue-200');
  content = content.replace(/text-\[#f5a623\]/g, 'text-blue-600');
  content = content.replace(/text-slate-100/g, 'text-slate-800');
  content = content.replace(/text-slate-200/g, 'text-slate-700');
  content = content.replace(/bg-\[#131d30\]/g, 'bg-white');
  content = content.replace(/shadow-\[0_0_20px_#f5a62344\]/g, 'shadow-sm');
  content = content.replace(/shadow-\[0_0_30px_#f5a62344\]/g, 'shadow-sm');
  content = content.replace(/border-\[#f5a623\]/g, 'border-blue-500');
  content = content.replace(/bg-\[#f5a623\]/g, 'bg-blue-600');
  fs.writeFileSync(file, content);
});
