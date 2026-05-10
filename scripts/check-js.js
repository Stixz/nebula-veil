const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const roots = ['main.js', 'preload.js', 'renderer.js', 'modules', 'scripts'];
const files = [];

function collect(target) {
  const stat = fs.statSync(target);

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      collect(path.join(target, entry));
    }
    return;
  }

  if (target.endsWith('.js') && path.basename(target) !== 'check-js.js') {
    files.push(target);
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) collect(root);
}

let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log(`Checked ${files.length} JavaScript files.`);
