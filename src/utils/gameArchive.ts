import JSZip from 'jszip';
import { isUnbuiltViteHtml } from './gameCatalog';

export interface ProcessedGameUpload {
  sourceType: 'zip' | 'html' | 'archive';
  fileName: string;
  fileSizeLabel: string;
  playUrl?: string;
  entryFile?: string;
  runtimeStatus?: 'ready' | 'vite-built' | 'unbuilt-source' | 'error';
  htmlContent?: string;
  buildNote?: string;
  archiveDataUrl?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function guessMimeType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'application/javascript';
  if (lower.endsWith('.css')) return 'text/css';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

function normalizePath(p: string): string {
  return p.replace(/^\.\//, '').replace(/^\/+/, '');
}

export async function extractHtmlFromZipBuffer(
  buffer: ArrayBuffer | Uint8Array
): Promise<string | null> {
  const zip = await JSZip.loadAsync(buffer);
  const fileEntries = Object.values(zip.files).filter((entry) => !entry.dir);

  const htmlCandidates = fileEntries
    .filter((f) => /\.html?$/i.test(f.name))
    .sort((a, b) => {
      const aIsIndex = /(^|\/)index\.html?$/i.test(a.name) ? 0 : 1;
      const bIsIndex = /(^|\/)index\.html?$/i.test(b.name) ? 0 : 1;
      if (aIsIndex !== bIsIndex) return aIsIndex - bIsIndex;
      return a.name.split('/').length - b.name.split('/').length;
    });

  if (htmlCandidates.length === 0) {
    return null;
  }

  const entryFile = htmlCandidates[0];
  let html = await entryFile.async('string');
  const baseDir = entryFile.name.includes('/')
    ? entryFile.name.slice(0, entryFile.name.lastIndexOf('/') + 1)
    : '';

  const assetMap = new Map<string, string>();
  for (const file of fileEntries) {
    if (file.name === entryFile.name) continue;
    const relName =
      baseDir && file.name.startsWith(baseDir)
        ? file.name.slice(baseDir.length)
        : file.name;
    const mime = guessMimeType(file.name);
    if (
      mime === 'text/css' ||
      mime === 'application/javascript' ||
      mime.startsWith('image/') ||
      mime.startsWith('audio/')
    ) {
      const base64 = await file.async('base64');
      assetMap.set(normalizePath(relName), `data:${mime};base64,${base64}`);
      assetMap.set(normalizePath(file.name), `data:${mime};base64,${base64}`);
    }
  }

  html = html.replace(
    /(src|href)=["']([^"']+)["']/gi,
    (full, attr: string, rawRef: string) => {
      if (
        rawRef.startsWith('http://') ||
        rawRef.startsWith('https://') ||
        rawRef.startsWith('data:') ||
        rawRef.startsWith('#')
      ) {
        return full;
      }
      const cleanRef = normalizePath(rawRef.split('?')[0].split('#')[0]);
      const dataUri = assetMap.get(cleanRef);
      if (!dataUri) return full;
      return `${attr}="${dataUri}"`;
    }
  );

  return html;
}

export async function processUploadedGameFile(
  file: File,
  gameId = `cloud-game-${Date.now()}`
): Promise<ProcessedGameUpload> {
  const lower = file.name.toLowerCase();
  const fileSizeLabel = formatFileSize(file.size);

  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    const htmlContent = await file.text();
    if (isUnbuiltViteHtml(htmlContent)) {
      throw new Error(
        'Tệp HTML này gọi mã nguồn chưa build (/src/main.tsx). Hãy nén toàn bộ thư mục dự án thành file .zip để hệ thống tự build trước khi chạy nhé!'
      );
    }
    return {
      sourceType: 'html',
      fileName: file.name,
      fileSizeLabel,
      entryFile: file.name,
      runtimeStatus: 'ready',
      htmlContent,
    };
  }

  if (lower.endsWith('.zip')) {
    const query = new URLSearchParams({
      gameId,
      fileName: file.name,
    });
    const response = await fetch(`/api/games/upload-zip?${query.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: file,
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          ok: true;
          playUrl: string;
          entryFile: string;
          runtimeStatus: 'ready' | 'vite-built';
          fileName: string;
          fileSizeLabel: string;
          htmlContent?: string;
          buildNote?: string;
        }
      | { ok: false; error?: string }
      | null;

    if (!response.ok || !payload || !payload.ok) {
      throw new Error(
        payload && !payload.ok && payload.error
          ? payload.error
          : 'Không thể giải nén hoặc kiểm tra cấu trúc file ZIP trên máy chủ.'
      );
    }

    return {
      sourceType: 'zip',
      fileName: payload.fileName,
      fileSizeLabel: payload.fileSizeLabel,
      playUrl: payload.playUrl,
      entryFile: payload.entryFile,
      runtimeStatus: payload.runtimeStatus,
      htmlContent: payload.htmlContent,
      buildNote: payload.buildNote,
    };
  }

  throw new Error(
    'Hệ thống hiện chỉ hỗ trợ tải lên tệp trò chơi .zip hoặc .html đơn lẻ. Với tệp .rar / .7z, vui lòng giải nén và nén lại thành .zip trước khi tải lên.'
  );
}
