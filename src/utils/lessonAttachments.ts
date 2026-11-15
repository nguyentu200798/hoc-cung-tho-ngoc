import type { LessonAttachment, LessonAttachmentKind } from '../types/classroom';

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

const EXTENSION_KIND_MAP: Record<string, LessonAttachmentKind> = {
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.webp': 'image',
  '.gif': 'image',
  '.bmp': 'image',
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.doc': 'doc',
};

const DEFAULT_MIME_BY_KIND: Record<LessonAttachmentKind, string> = {
  image: 'image/png',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
};

export function detectLessonAttachmentKind(
  fileName: string,
  mimeType = ''
): LessonAttachmentKind | null {
  const cleanName = fileName.trim().toLowerCase();
  const dotIdx = cleanName.lastIndexOf('.');
  if (dotIdx >= 0) {
    const ext = cleanName.slice(dotIdx);
    if (ext in EXTENSION_KIND_MAP) {
      return EXTENSION_KIND_MAP[ext];
    }
  }

  const lowerMime = mimeType.trim().toLowerCase();
  if (!lowerMime) return null;
  if (lowerMime.startsWith('image/') && !lowerMime.includes('svg')) {
    return 'image';
  }
  if (lowerMime === 'application/pdf') return 'pdf';
  if (
    lowerMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }
  if (lowerMime === 'application/msword') return 'doc';
  return null;
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function buildLessonDownloadUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/lesson-files/')) {
    return url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
  }
  return url;
}

export function getAttachmentKindLabel(kind: LessonAttachmentKind): {
  short: string;
  label: string;
} {
  switch (kind) {
    case 'image':
      return { short: 'ẢNH', label: 'Hình ảnh' };
    case 'pdf':
      return { short: 'PDF', label: 'Tài liệu PDF' };
    case 'docx':
      return { short: 'DOCX', label: 'Tài liệu Word (.docx)' };
    case 'doc':
      return { short: 'DOC', label: 'Tài liệu Word (.doc)' };
  }
}

export async function uploadLessonAttachmentFile(
  file: File
): Promise<LessonAttachment> {
  const kind = detectLessonAttachmentKind(file.name, file.type);
  if (!kind) {
    throw new Error(
      `Tệp "${file.name}" chưa được hỗ trợ. Vui lòng chọn ảnh (.png, .jpg, .webp), .pdf, .docx hoặc .doc.`
    );
  }

  if (file.size === 0) {
    throw new Error(`Tệp "${file.name}" đang trống, không thể tải lên.`);
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `Tệp "${file.name}" vượt quá giới hạn 25 MB (${formatAttachmentSize(file.size)}).`
    );
  }

  const params = new URLSearchParams({
    fileName: file.name,
    mimeType: file.type || DEFAULT_MIME_BY_KIND[kind],
  });

  const buffer = await file.arrayBuffer();
  const res = await fetch(`/api/lessons/upload-attachment?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || DEFAULT_MIME_BY_KIND[kind],
    },
    body: buffer,
  });

  const payload = (await res.json().catch(() => null)) as
    | ({ ok: true; attachment: LessonAttachment })
    | ({ ok?: false; error?: string })
    | null;

  if (!res.ok || !payload || !('ok' in payload) || !payload.ok) {
    throw new Error(
      (payload && 'error' in payload && payload.error) ||
        `Không thể tải lên tệp "${file.name}".`
    );
  }

  return payload.attachment;
}
