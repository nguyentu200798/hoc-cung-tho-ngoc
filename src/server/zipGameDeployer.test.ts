import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import JSZip from 'jszip';
import {
  deployUploadedZipGame,
  inspectExtractedProject,
  normalizeZipEntryPath,
  sanitizeGameId,
} from './zipGameDeployer';

test('normalizeZipEntryPath blocks traversal and strips macOS artifacts', () => {
  assert.equal(normalizeZipEntryPath('../secret.txt'), null);
  assert.equal(normalizeZipEntryPath('__MACOSX/._index.html'), null);
  assert.equal(normalizeZipEntryPath('my-game/index.html'), 'my-game/index.html');
});

test('sanitizeGameId enforces safe alphanumeric and hyphen characters', () => {
  assert.equal(sanitizeGameId('cloud-game-123_abc'), 'cloud-game-123_abc');
  assert.throws(() => sanitizeGameId('..'));
});

test('deployUploadedZipGame extracts nested static HTML5 game and rewrites root-absolute asset URLs', async () => {
  const zip = new JSZip();
  zip.file(
    'wrapped-folder/index.html',
    '<!doctype html><html><head><link rel="stylesheet" href="/css/game.css"></head><body><h1>Static OK</h1><script src="app.js"></script></body></html>'
  );
  zip.file('wrapped-folder/css/game.css', 'body { background: #e0f2fe; }');
  zip.file('wrapped-folder/app.js', 'window.__GAME_READY__ = true;');

  const runtimeRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'thomay-runtime-static-'));
  try {
    const result = await deployUploadedZipGame({
      zipBuffer: await zip.generateAsync({ type: 'nodebuffer' }),
      gameId: 'test-static-1',
      fileName: 'static-game.zip',
      runtimeRootDir: runtimeRoot,
    });

    assert.equal(result.playUrl, '/games-runtime/test-static-1/index.html');
    assert.equal(result.runtimeStatus, 'ready');
    const deployedHtml = await fs.readFile(
      path.join(runtimeRoot, 'test-static-1', 'index.html'),
      'utf8'
    );
    assert.ok(deployedHtml.includes('href="./css/game.css"'));
    assert.ok(result.htmlContent && result.htmlContent.includes('data:text/css;base64,'));
  } finally {
    await fs.rm(runtimeRoot, { recursive: true, force: true });
  }
});

test('inspectExtractedProject identifies unbuilt React/Vite projects vs prebuilt dist vs invalid ZIPs', async () => {
  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'thomay-inspect-'));
  try {
    // 1. Unbuilt Vite source
    const viteDir = path.join(tmpBase, 'vite-app');
    await fs.mkdir(viteDir, { recursive: true });
    await fs.writeFile(
      path.join(viteDir, 'package.json'),
      JSON.stringify({ name: 'demo', dependencies: { react: '^19.0.0' }, devDependencies: { vite: '^6.0.0' } })
    );
    await fs.writeFile(
      path.join(viteDir, 'index.html'),
      '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>'
    );
    const viteRes = await inspectExtractedProject(viteDir);
    assert.equal(viteRes.kind, 'vite-source');
    assert.equal(viteRes.needsViteBuild, true);

    // 2. Prebuilt dist/ folder inside ZIP
    const distWrapper = path.join(tmpBase, 'built-app');
    await fs.mkdir(path.join(distWrapper, 'dist', 'assets'), { recursive: true });
    await fs.writeFile(
      path.join(distWrapper, 'index.html'),
      '<!doctype html><html><body><script type="module" src="/src/main.tsx"></script></body></html>'
    );
    await fs.writeFile(
      path.join(distWrapper, 'dist', 'index.html'),
      '<!doctype html><html><body><script type="module" src="./assets/index.js"></script></body></html>'
    );
    const builtRes = await inspectExtractedProject(distWrapper);
    assert.equal(builtRes.kind, 'prebuilt-dist');
    assert.equal(builtRes.needsViteBuild, false);

    // 3. Invalid ZIP without HTML or Vite package
    const invalidDir = path.join(tmpBase, 'empty-docs');
    await fs.mkdir(invalidDir, { recursive: true });
    await fs.writeFile(path.join(invalidDir, 'readme.txt'), 'not a game');
    const invalidRes = await inspectExtractedProject(invalidDir);
    assert.equal(invalidRes.kind, 'invalid');
  } finally {
    await fs.rm(tmpBase, { recursive: true, force: true });
  }
});

test('deployUploadedZipGame rejects invalid ZIPs and incomplete Vite ZIPs cleanly with Vietnamese errors', async () => {
  const zip = new JSZip();
  zip.file('notes.txt', 'just text');
  const invalidBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  const brokenViteZip = new JSZip();
  brokenViteZip.file(
    'index.html',
    '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>'
  );
  const brokenViteBuffer = await brokenViteZip.generateAsync({ type: 'nodebuffer' });

  const runtimeRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'thomay-runtime-invalid-'));
  try {
    await assert.rejects(
      () =>
        deployUploadedZipGame({
          zipBuffer: invalidBuffer,
          gameId: 'bad-zip-1',
          fileName: 'bad.zip',
          runtimeRootDir: runtimeRoot,
        }),
      /Không tìm thấy tệp khởi chạy/
    );

    await assert.rejects(
      () =>
        deployUploadedZipGame({
          zipBuffer: brokenViteBuffer,
          gameId: 'broken-vite-1',
          fileName: 'broken-vite.zip',
          runtimeRootDir: runtimeRoot,
        }),
      /thiếu package\.json/
    );
  } finally {
    await fs.rm(runtimeRoot, { recursive: true, force: true });
  }
});
