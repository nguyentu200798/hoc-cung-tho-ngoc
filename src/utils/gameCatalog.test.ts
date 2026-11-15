import assert from 'node:assert/strict';
import test from 'node:test';
import type { CustomGame } from '../types/classroom';
import {
  filterGames,
  getGameLaunchMode,
  isUnbuiltViteHtml,
  resolveGameTopic,
} from './gameCatalog';

const sampleGames: CustomGame[] = [
  {
    id: 'g1',
    title: 'Bé vui học Toán',
    titleEn: 'Fun Math Quiz',
    topic: 'toan',
    sourceType: 'url',
    url: 'https://example.com/math',
    createdAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'g2',
    title: 'Đuổi hình bắt chữ',
    sourceType: 'html',
    htmlContent: '<html><body>Game</body></html>',
    createdAt: '2026-11-14T00:01:00.000Z',
  },
  {
    id: 'g3',
    title: 'Giải cứu đại dương',
    sourceType: 'url',
    url: 'https://example.com/ocean',
    createdAt: '2026-11-14T00:02:00.000Z',
  },
  {
    id: 'g4',
    title: 'English Phonics Safari',
    sourceType: 'archive',
    fileName: 'phonics.zip',
    fileSizeLabel: '1.2 MB',
    createdAt: '2026-11-14T00:03:00.000Z',
  },
];

test('resolveGameTopic preserves explicit topic and infers missing topic from title', () => {
  assert.equal(resolveGameTopic(sampleGames[0]), 'toan');
  assert.equal(resolveGameTopic(sampleGames[1]), 'tieng-viet');
  assert.equal(resolveGameTopic(sampleGames[2]), 'kham-pha');
  assert.equal(resolveGameTopic(sampleGames[3]), 'tieng-anh');
  assert.equal(
    resolveGameTopic({ title: 'Vua bảng nhân 7', titleEn: undefined }),
    'toan'
  );
});

test('filterGames supports topic filtering and accent-insensitive Vietnamese search', () => {
  assert.equal(filterGames(sampleGames, 'all', '').length, 4);
  assert.deepEqual(
    filterGames(sampleGames, 'toan', '').map((g) => g.id),
    ['g1']
  );
  assert.deepEqual(
    filterGames(sampleGames, 'all', 'dai duong').map((g) => g.id),
    ['g3']
  );
  assert.deepEqual(
    filterGames(sampleGames, 'tieng-viet', 'bat chu').map((g) => g.id),
    ['g2']
  );
});

test('isUnbuiltViteHtml detects raw Vite source entry scripts and rejects launching them', () => {
  const rawViteHtml =
    '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>';
  assert.equal(isUnbuiltViteHtml(rawViteHtml), true);
  assert.equal(
    isUnbuiltViteHtml('<!doctype html><html><body><script src="./assets/index-abc.js"></script></body></html>'),
    false
  );

  const unbuiltGame: CustomGame = {
    id: 'unbuilt-1',
    title: 'Vua Nhân Chia',
    sourceType: 'zip',
    htmlContent: rawViteHtml,
    createdAt: '2026-11-14T00:05:00.000Z',
  };
  const mode = getGameLaunchMode(unbuiltGame);
  assert.equal(mode.kind, 'error');
  if (mode.kind === 'error') {
    assert.equal(mode.reason, 'unbuilt-source');
  }
});

test('newly added games appear automatically in filterGames and resolve exact launch mode', () => {
  const runtimeGame: CustomGame = {
    id: 'g6',
    title: 'Bảng Cửu Chương',
    topic: 'toan',
    sourceType: 'zip',
    playUrl: '/games-runtime/g6/index.html',
    htmlContent: '<html><body>Built bundle</body></html>',
    createdAt: '2026-11-14T00:04:00.000Z',
  };

  assert.deepEqual(getGameLaunchMode(runtimeGame), {
    kind: 'runtime',
    playUrl: '/games-runtime/g6/index.html',
    fallbackHtml: '<html><body>Built bundle</body></html>',
  });
  assert.deepEqual(getGameLaunchMode(sampleGames[0]), {
    kind: 'url',
    url: 'https://example.com/math',
  });
  assert.deepEqual(getGameLaunchMode(sampleGames[1]), {
    kind: 'html',
    htmlContent: '<html><body>Game</body></html>',
  });
  assert.equal(getGameLaunchMode(sampleGames[3]).kind, 'error');
});
