const fs = require('fs');
const path = require('path');

function getAllMdFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMdFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Find corresponding Chinese version images
function findChineseImages(enMdPath) {
  // en/dishes/soup/昂刺鱼豆腐汤/昂刺鱼豆腐汤.md → dishes/soup/昂刺鱼豆腐汤/
  const relative = path.relative('/home/anduin/Desktop/HowToCook/en', enMdPath);
  const chinesePath = path.join('/home/anduin/Desktop/HowToCook', relative);
  const chineseDir = path.dirname(chinesePath);
  
  if (!fs.existsSync(chineseDir)) return [];
  
  return fs.readdirSync(chineseDir)
    .filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f))
    .sort();
}

const mdFiles = getAllMdFiles('/home/anduin/Desktop/HowToCook/en');
let fixed = 0;

for (const mdFile of mdFiles) {
  let content = fs.readFileSync(mdFile, 'utf8');
  const originalContent = content;
  const chineseImages = findChineseImages(mdFile);
  
  if (chineseImages.length === 0) continue;
  
  // Replace all image references with relative paths to Chinese images
  const imageRegex = /!\[([^\]]*)\]\(\.\/([^)]*)\)/g;
  let match;
  let imageIndex = 0;
  
  content = content.replace(imageRegex, (fullMatch, alt, imageName) => {
    if (imageIndex < chineseImages.length) {
      const correctImage = chineseImages[imageIndex];
      // Use relative path going up to dishes/ then down to Chinese image
      const relPath = `../../dishes${mdFile.substring('/home/anduin/Desktop/HowToCook/en/dishes'.length).replace(/\/[^\/]+\.md$/, '')}/${correctImage}`;
      console.log(`Fixed: ${path.relative('/home/anduin/Desktop/HowToCook', mdFile)}`);
      console.log(`  ${imageName} -> ${relPath}`);
      imageIndex++;
      fixed++;
      return `![${alt}](${relPath})`;
    }
    return fullMatch;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(mdFile, content);
  }
}

console.log(`\nTotal images fixed: ${fixed}`);
