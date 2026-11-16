import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import JSZip from 'jszip';
import {
  extractWordDocumentPreview,
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

test('extractWordDocumentPreview converts .docx files into readable HTML content', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'thomay-docx-preview-'));
  try {
    const zip = new JSZip();
    zip.file(
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>'
    );
    zip.file(
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>'
    );
    zip.file(
      'word/document.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        '<w:body><w:p><w:r><w:t>Bài tập Toán lớp 3.17: Tính 7 x 8 = 56</w:t></w:r></w:p></w:body>' +
        '</w:document>'
    );

    const docxPath = path.join(tmpRoot, 'phieu-toan.docx');
    await fs.writeFile(docxPath, await zip.generateAsync({ type: 'nodebuffer' }));

    const preview = await extractWordDocumentPreview(docxPath);
    assert.equal(preview.kind, 'docx');
    assert.ok(preview.html?.includes('Bài tập Toán lớp 3.17: Tính 7 x 8 = 56'));
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
