#!/usr/bin/env node

/**
 * generate_tree.js
 * -----------------
 * Recursively walks the given directory (defaults to the current working directory)
 * and creates a markdown file `PROJECT_TREE.md` that visualizes the folder
 * hierarchy using a simple tree representation.
 *
 * Usage (run from project root):
 *   node scripts/generate_tree.js   # creates PROJECT_TREE.md
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = process.argv[2] || process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, 'PROJECT_TREE.md');

function walk(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => {
      // directories first, then files, alphabetically
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  let lines = [];
  entries.forEach((entry, idx) => {
    const isLast = idx === entries.length - 1;
    const connector = isLast ? '└─ ' : '├─ ';
    const line = `${prefix}${connector}${entry.name}`;
    lines.push(line);
    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '   ' : '│  ');
      lines = lines.concat(walk(path.join(dir, entry.name), newPrefix));
    }
  });
  return lines;
}

function generate() {
  const treeLines = walk(ROOT_DIR);
  const content = `# Project Structure\n\n\
\`\`\
${treeLines.join('\n')}\n\
\`\`
`;
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(`✔️  PROJECT_TREE.md created at ${OUTPUT_FILE}`);
}

generate();
