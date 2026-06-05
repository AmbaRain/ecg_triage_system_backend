const fs = require('fs');
const path = 'css/styles.css';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
  'â€”': '—',
  'â”€': '─',
  'â€¢': '•',
  'â—\x8F': '●',
  'â†’': '→',
  'â‚‚': '₂'
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed Mojibake in styles.css');
