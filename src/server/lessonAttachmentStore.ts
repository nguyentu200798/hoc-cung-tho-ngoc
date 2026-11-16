import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import type { LessonAttachment, LessonAttachmentKind } from '../types/classroom';

const MAX_BYTES = 25 * 1024 * 1024;

const EXT_TO_KIND_MIME: Record<string, { kind: LessonAttachmentKind; mime: string }> = {
  '.png': { kind: 'image', mime: 'image/png' },
  '.jpg': { kind: 'image', mime: 'image/jpeg' },
  '.jpeg': { kind: 'image', mime: 'image/jpeg' },
  '.webp': { kind: 'image', mime: 'image/webp' },
  '.gif': { kind: 'image', mime: 'image/gif' },
  '.bmp': { kind: 'image', mime: 'image/bmp' },
  '.pdf': { kind: 'pdf', mime: 'application/pdf' },
  '.docx': {
    kind: 'docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  '.doc': { kind: 'doc', mime: 'application/msword' },
};

export function sanitizeAttachmentId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (cleaned.length < 3) {
    throw new Error('Mã tệp đính kèm không hợp lệ.');
  }
  return cleaned;
}

export function sanitizeStorageFileName(rawName: string): {
  displayName: string;
  storageName: string;
  ext: string;
} {
  const baseName = path.basename(rawName.trim() || 'tailieu').replace(/[\0/\\]/g, '');
  const ext = path.extname(baseName).toLowerCase();
  const stem = baseName.slice(0, baseName.length - ext.length) || 'tai-lieu';

  const asciiStem = stem
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'tai-lieu';

  const displayName = baseName.slice(0, 180) || `${asciiStem}${ext}`;
  const storageName = `${asciiStem}${ext}`.slice(0, 100);
  return { displayName, storageName, ext };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function resolveAllowedAttachmentMeta(
  fileName: string,
  requestedMime = ''
): { kind: LessonAttachmentKind; mimeType: string; displayName: string; storageName: string } {
  const { displayName, storageName, ext } = sanitizeStorageFileName(fileName);
  const byExt = EXT_TO_KIND_MIME[ext];
  if (byExt) {
    return {
      kind: byExt.kind,
      mimeType: requestedMime.startsWith('image/') && byExt.kind === 'image' ? requestedMime : byExt.mime,
      displayName,
      storageName,
    };
  }

  throw new Error(
    `Định dạng tệp "${displayName}" chưa được hỗ trợ. Vui lòng chọn ảnh (.png, .jpg, .webp, .gif), .pdf, .docx hoặc .doc.`
  );
}

export function resolveMimeTypeForServedFile(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return EXT_TO_KIND_MIME[ext]?.mime ?? 'application/octet-stream';
}

export async function storeUploadedLessonAttachment(params: {
  buffer: Buffer | Uint8Array;
  fileName: string;
  mimeType?: string;
  storageRootDir: string;
}): Promise<LessonAttachment> {
  if (!params.buffer || params.buffer.byteLength === 0) {
    throw new Error('Không nhận được nội dung tệp tải lên.');
  }
  if (params.buffer.byteLength > MAX_BYTES) {
    throw new Error('Tệp vượt quá dung lượng tối đa 25 MB.');
  }

  const meta = resolveAllowedAttachmentMeta(params.fileName, params.mimeType);
  const attachmentId = sanitizeAttachmentId(
    `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  );

  const targetDir = path.join(params.storageRootDir, attachmentId);
  await fs.mkdir(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, meta.storageName);
  await fs.writeFile(targetFile, params.buffer);

  return {
    id: attachmentId,
    name: meta.displayName,
    kind: meta.kind,
    mimeType: meta.mimeType,
    sizeLabel: formatBytes(params.buffer.byteLength),
    url: `/lesson-files/${attachmentId}/${encodeURIComponent(meta.storageName)}`,
  };
}

export interface WordDocumentPreviewResult {
  kind: 'docx' | 'doc';
  html?: string;
  paragraphs?: string[];
}

export async function extractWordDocumentPreview(
  targetFile: string
): Promise<WordDocumentPreviewResult> {
  const ext = path.extname(targetFile).toLowerCase();
  if (ext === '.docx') {
    const result = await mammoth.convertToHtml({ path: targetFile });
    return {
      kind: 'docx',
      html: result.value,
    };
  }

  if (ext === '.doc') {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(targetFile);
    const body = doc.getBody() || '';
    const paragraphs = body
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      kind: 'doc',
      paragraphs,
    };
  }

  throw new Error('Chỉ hỗ trợ xem trước trực tiếp tệp Word (.docx, .doc).');
}
