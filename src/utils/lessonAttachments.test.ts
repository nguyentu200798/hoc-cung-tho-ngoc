import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLessonDocPreviewUrl,
  buildLessonDownloadUrl,
  detectLessonAttachmentKind,
  formatAttachmentSize,
} from './lessonAttachments';

test('detectLessonAttachmentKind accepts images, pdf, docx, and doc and blocks executables', () => {
  assert.equal(detectLessonAttachmentKind('bai-tap.png', 'image/png'), 'image');
  assert.equal(detectLessonAttachmentKind('anh-lop.JPG', ''), 'image');
  assert.equal(detectLessonAttachmentKind('de-cuong.pdf', 'application/pdf'), 'pdf');
  assert.equal(
    detectLessonAttachmentKind(
      'phieu-bai-tap.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ),
    'docx'
  );
  assert.equal(detectLessonAttachmentKind('giao-an-cu.doc', 'application/msword'), 'doc');

  assert.equal(detectLessonAttachmentKind('virus.exe', 'application/octet-stream'), null);
  assert.equal(detectLessonAttachmentKind('vector.svg', 'image/svg+xml'), null);
});

test('buildLessonDownloadUrl and buildLessonDocPreviewUrl build expected routes', () => {
  assert.equal(
    buildLessonDownloadUrl('/lesson-files/att-1/phieu.docx'),
    '/lesson-files/att-1/phieu.docx?download=1'
  );
  assert.equal(
    buildLessonDownloadUrl('data:image/png;base64,AAA'),
    'data:image/png;base64,AAA'
  );
  assert.equal(
    buildLessonDocPreviewUrl('/lesson-files/att-1/phieu.docx'),
    '/api/lessons/doc-preview/att-1/phieu.docx'
  );
  assert.equal(
    buildLessonDocPreviewUrl('/lesson-files/att-1/giaoan.doc?download=1'),
    '/api/lessons/doc-preview/att-1/giaoan.doc'
  );
  assert.equal(buildLessonDocPreviewUrl('https://example.com/a.docx'), null);
});

test('formatAttachmentSize formats human readable sizes', () => {
  assert.equal(formatAttachmentSize(512), '512 B');
  assert.equal(formatAttachmentSize(2048), '2.0 KB');
  assert.equal(formatAttachmentSize(2 * 1024 * 1024), '2.00 MB');
});
