const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../frontend/src/styles');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.css')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    let openBraces = 0;
    let closeBraces = 0;
    for (let char of content) {
      if (char === '{') openBraces++;
      if (char === '}') closeBraces++;
    }
    if (openBraces !== closeBraces) {
      console.log(`Mismatch in ${file}: { is ${openBraces}, } is ${closeBraces}`);
    }
  }
});
