'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'telegram-package-'));
try {
  const packages = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--offline', '--json', '--pack-destination', dir], { encoding: 'utf8' }));
  const files = new Set(packages[0].files.map(file => file.path));
  for (const file of ['index.js', 'src/telegram.js', 'lib/telegram.js']) assert.ok(files.has(file), `${file} missing from package`);
  assert.ok(![...files].some(file => file.startsWith('test/')), 'tests should not be published');
  execFileSync('tar', ['-xzf', path.join(dir, packages[0].filename), '-C', dir]);
  execFileSync(process.execPath, ['--require', path.resolve('test/offline/deny-network.cjs'), '-e',
    'const Bot=require(process.argv[1]); const bot=new Bot("synthetic-package-token"); if(bot.isPolling()) throw Error("Unexpected polling");',
    path.join(dir, 'package')], { env: { ...process.env, NODE_PATH: path.resolve('node_modules') }, stdio: 'inherit' });
  console.log('Packed package imports offline and contains source/built entrypoints');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
