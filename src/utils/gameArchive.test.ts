import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { extractHtmlFromZipBuffer, formatFileSize } from './gameArchive';

test('formatFileSize formats bytes, KB, and MB cleanly', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(1024 * 1024 * 2.5), '2.50 MB');
});

test('extractHtmlFromZipBuffer extracts index.html and inlines local js/css assets', async () => {
  const zip = new JSZip();
  zip.file(
    'my-game/index.html',
    '<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1>Game</h1><script src="app.js"></script></body></html>'
  );
  zip.file('my-game/style.css', 'body { color: purple; }');
  zip.file('my-game/app.js', 'console.log("ok");');

  const buffer = await zip.generateAsync({ type: 'uint8array' });
  const extracted = await extractHtmlFromZipBuffer(buffer);

  assert.ok(extracted);
  assert.ok(extracted.includes('<h1>Game</h1>'));
  assert.ok(extracted.includes('data:text/css;base64,'));
  assert.ok(extracted.includes('data:application/javascript;base64,'));
});

test('extractHtmlFromZipBuffer returns null when zip has no HTML entry point', async () => {
  const zip = new JSZip();
  zip.file('readme.txt', 'hello');
  const buffer = await zip.generateAsync({ type: 'uint8array' });
  const extracted = await extractHtmlFromZipBuffer(buffer);
  assert.equal(extracted, null);
});
