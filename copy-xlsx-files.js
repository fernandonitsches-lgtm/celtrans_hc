import fs from 'fs';
import path from 'path';

// Copiar arquivos necessários do xlsx para dist
const srcDir = path.join(process.cwd(), 'node_modules', 'xlsx', 'dist');
const distDir = path.join(process.cwd(), 'dist');

// Criar diretório dist se não existir
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copiar xlsx.min.js e outros arquivos necessários
const filesToCopy = [
  'xlsx.core.min.js',
  'xlsx.full.min.js',
  'xlsx.mini.min.js',
  'cpexcel.js'
];

filesToCopy.forEach(file => {
  const src = path.join(srcDir, file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copiado: ${file}`);
  }
});

console.log('✓ Arquivos do XLSX copiados com sucesso!');
