const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

const files = walk('components');
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('Loader2')) {
    // Replace import
    let newContent = content.replace(/import\s+\{[^}]*Loader2[^}]*\}\s+from\s+['"]lucide-react['"];?/g, (match) => {
      if (match.includes(',') || match.match(/\{.*,.*\}/)) {
        // Has other imports
        let cleaned = match.replace(/,\s*Loader2/, '').replace(/Loader2\s*,?\s*/, '');
        return cleaned + '\nimport { Loader } from "@/components/ui/loader";';
      } else {
        return 'import { Loader } from "@/components/ui/loader";';
      }
    });

    // Replace component usage
    newContent = newContent.replace(/<Loader2/g, '<Loader');
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      changed++;
    }
  }
}
console.log('Replaced Loader2 in ' + changed + ' files');
