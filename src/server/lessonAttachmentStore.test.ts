import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  resolveMimeTypeForServedFile,
  sanitizeStorageFileName,
  storeUploadedLessonAttachment,
} from './lessonAttachmentStore';

test('sanitizeStorageFileName strips Vietnamese diacritics for URL safety while preserving display name', () => {
  const res = sanitizeStorageFileName('Phiếu Ôn Tập Tuần 10 (Lớp 3.17).docx');
  assert.equal(res.displayName, 'Phiếu Ôn Tập Tuần 10 (Lớp 3.17).docx');
  assert.ok(/^[a-zA-Z0-9_-]+\.docx$/.test(res.storageName));
  assert.equal(res.ext, '.docx');
});

test('storeUploadedLessonAttachment stores pdf, docx, doc, and image files and rejects invalid types', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'thomay-lesson-files-'));
  try {
    const pdfAtt = await storeUploadedLessonAttachment({
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'),
      fileName: 'Đề cương Toán.pdf',
      mimeType: 'application/pdf',
      storageRootDir: tmpRoot,
    });
    assert.equal(pdfAtt.kind, 'pdf');
    assert.equal(pdfAtt.name, 'Đề cương Toán.pdf');
    assert.ok(pdfAtt.url.startsWith('/lesson-files/att-'));
    assert.ok(pdfAtt.url.endsWith('.pdf'));

    const docxAtt = await storeUploadedLessonAttachment({
      buffer: Buffer.from('PK\x03\x04demo-docx'),
      fileName: 'BaiTap.docx',
      storageRootDir: tmpRoot,
    });
    assert.equal(docxAtt.kind, 'docx');
    assert.equal(
      resolveMimeTypeForServedFile('BaiTap.docx'),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    const docAtt = await storeUploadedLessonAttachment({
      buffer: Buffer.from('legacy-doc-bytes'),
      fileName: 'GiaoAn.doc',
      storageRootDir: tmpRoot,
    });
    assert.equal(docAtt.kind, 'doc');
    assert.equal(resolveMimeTypeForServedFile('GiaoAn.doc'), 'application/msword');

    await assert.rejects(
      () =>
        storeUploadedLessonAttachment({
          buffer: Buffer.from('bad'),
          fileName: 'script.js',
          storageRootDir: tmpRoot,
        }),
      /chưa được hỗ trợ/
    );
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
