#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '__tests__') {
      findTsFiles(fullPath, files);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx')) && !fullPath.includes('node_modules')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if logger is already imported
  const hasLoggerImport = content.includes("import { logger }") || content.includes("import { logger } from");

  // Add logger import if not present and we find console statements
  if (!hasLoggerImport && content.includes('console.')) {
    // Find the last import statement
    const importMatches = content.match(/^import.*from.*$/gm);
    if (importMatches && importMatches.length > 0) {
      const lastImport = importMatches[importMatches.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
      content = content.slice(0, lastImportIndex) + '\nimport { logger } from \'@/lib/logger\';' + content.slice(lastImportIndex);
      modified = true;
    }
  }

  // Replace console.error calls - handle both single quotes and template literals
  const errorRegex1 = /console\.error\(['"]([^'"]*)['"]\s*,\s*([^;]+)\);/g;
  content = content.replace(errorRegex1, (match, message, errorVar) => {
    const errorName = errorVar.trim();
    return `logger.error('${message}', { error: ${errorName} instanceof Error ? ${errorName}.message : 'Unknown error' }, ${errorName} as Error);`;
  });

  // Handle template literal console.error calls
  const errorRegex2 = /console\.error\(`([^`]*)`\s*(?:,\s*([^;]+))?\);/g;
  content = content.replace(errorRegex2, (match, template, errorVar) => {
    if (errorVar) {
      const errorName = errorVar.trim();
      return `logger.error(\`${template}\`, { error: ${errorName} instanceof Error ? ${errorName}.message : 'Unknown error' }, ${errorName} as Error);`;
    } else {
      return `logger.error(\`${template}\`);`;
    }
  });

  // Handle console.error with just a variable
  const errorRegex3 = /console\.error\(([^;]+)\);/g;
  content = content.replace(errorRegex3, (match, errorVar) => {
    const errorName = errorVar.trim();
    return `logger.error('Error', { error: ${errorName} instanceof Error ? ${errorName}.message : 'Unknown error' }, ${errorName} as Error);`;
  });

  // Replace console.warn calls
  const warnRegex1 = /console\.warn\(['"]([^'"]*)['"]\s*(?:,\s*([^;]+))?\);/g;
  content = content.replace(warnRegex1, (match, message, context) => {
    if (context) {
      return `logger.warn('${message}', ${context});`;
    } else {
      return `logger.warn('${message}');`;
    }
  });

  const warnRegex2 = /console\.warn\(`([^`]*)`\s*(?:,\s*([^;]+))?\);/g;
  content = content.replace(warnRegex2, (match, template, context) => {
    if (context) {
      return `logger.warn(\`${template}\`, ${context});`;
    } else {
      return `logger.warn(\`${template}\`);`;
    }
  });

  // Replace console.info calls
  const infoRegex1 = /console\.info\(['"]([^'"]*)['"]\s*(?:,\s*([^;]+))?\);/g;
  content = content.replace(infoRegex1, (match, message, context) => {
    if (context) {
      return `logger.info('${message}', ${context});`;
    } else {
      return `logger.info('${message}');`;
    }
  });

  const infoRegex2 = /console\.info\(`([^`]*)`\s*(?:,\s*([^;]+))?\);/g;
  content = content.replace(infoRegex2, (match, template, context) => {
    if (context) {
      return `logger.info(\`${template}\`, ${context});`;
    } else {
      return `logger.info(\`${template}\`);`;
    }
  });

  // Replace console.debug calls
  const debugRegex1 = /console\.debug\(['"]([^'"]*)['"]\s*(?:,\s*([^;]+))?\);/g;
  content = content.replace(debugRegex1, (match, message, context) => {
    if (context) {
      return `logger.debug('${message}', ${context});`;
    } else {
      return `logger.debug('${message}');`;
    }
  });

  const debugRegex2 = /console\.debug\(`([^`]*)`\s*(?:,\s*([^;]+))?\);/g;
  content = content.replace(debugRegex2, (match, template, context) => {
    if (context) {
      return `logger.debug(\`${template}\`, ${context});`;
    } else {
      return `logger.debug(\`${template}\`);`;
    }
  });

  // Replace console.log calls (treat as info)
  const logRegex1 = /console\.log\(['"]([^'"]*)['"]\s*(?:,\s*([^;]+))?\);/g;
  content = content.replace(logRegex1, (match, message, context) => {
    if (context) {
      return `logger.info('${message}', ${context});`;
    } else {
      return `logger.info('${message}');`;
    }
  });

  const logRegex2 = /console\.log\(`([^`]*)`\s*(?:,\s*([^;]+))?\);/g;
  content = content.replace(logRegex2, (match, template, context) => {
    if (context) {
      return `logger.info(\`${template}\`, ${context});`;
    } else {
      return `logger.info(\`${template}\`);`;
    }
  });

  if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    console.log(`Processed: ${filePath}`);
    return true;
  }

  return false;
}

// Main execution
function main() {
  const rootDir = process.cwd();
  console.log('Finding TypeScript files...');

  const tsFiles = findTsFiles(rootDir);
  console.log(`Found ${tsFiles.length} TypeScript files`);

  let processedCount = 0;
  for (const file of tsFiles) {
    if (processFile(file)) {
      processedCount++;
    }
  }

  console.log(`Processed ${processedCount} files`);
}

if (require.main === module) {
  main();
}
