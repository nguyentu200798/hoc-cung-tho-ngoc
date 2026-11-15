import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import JSZip from 'jszip';

const execFileAsync = promisify(execFile);

const MAX_FILES = 2500;
const MAX_HTML_FALLBACK_LENGTH = 650000;

export interface ZipInspectionResult {
  kind: 'prebuilt-dist' | 'static-html' | 'vite-source' | 'invalid';
  projectRoot: string;
  deploySourceDir?: string;
  entryFile?: string;
  errorMessage?: string;
  needsViteBuild: boolean;
}

export interface DeployZipGameResult {
  gameId: string;
  fileName: string;
  fileSizeLabel: string;
  playUrl: string;
  entryFile: string;
  runtimeStatus: 'ready' | 'vite-built';
  htmlContent?: string;
  buildNote: string;
}

export function sanitizeGameId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (cleaned.length < 3) {
    throw new Error('Mã trò chơi (gameId) không hợp lệ.');
  }
  return cleaned;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isUnbuiltViteHtml(html: string): boolean {
  if (!html) return false;
  if (/src\s*=\s*["'][^"']*(?:\.tsx|\.jsx|\.ts)(?:\?[^"']*)?["']/i.test(html)) {
    return true;
  }
  if (/\/@vite\/client/i.test(html)) {
    return true;
  }
  return false;
}

export function normalizeZipEntryPath(entryName: string): string | null {
  if (!entryName || entryName.includes('\0')) return null;
  const slashNormalized = entryName.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!slashNormalized) return null;
  if (slashNormalized.startsWith('__MACOSX/') || slashNormalized.endsWith('/.DS_Store') || slashNormalized === '.DS_Store') {
    return null;
  }
  if (/^[a-zA-Z]:/.test(slashNormalized)) return null;
  const parts = slashNormalized.split('/').filter(Boolean);
  if (parts.length === 0 || parts.some((p) => p === '..' || p === '.')) {
    return null;
  }
  return parts.join('/');
}

async function listFilesRecursive(dir: string, baseDir = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFilesRecursive(full, baseDir);
      results.push(...nested);
    } else if (entry.isFile()) {
      results.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return results;
}

async function unwrapSingleRootDirectory(extractDir: string): Promise<string> {
  let currentDir = extractDir;
  for (let depth = 0; depth < 3; depth++) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const visible = entries.filter((e) => !e.name.startsWith('.') && e.name !== '__MACOSX');
    if (visible.length === 1 && visible[0].isDirectory()) {
      currentDir = path.join(currentDir, visible[0].name);
    } else {
      break;
    }
  }
  return currentDir;
}

export async function inspectExtractedProject(
  extractDir: string
): Promise<ZipInspectionResult> {
  const projectRoot = await unwrapSingleRootDirectory(extractDir);
  const allFiles = await listFilesRecursive(projectRoot);

  if (allFiles.length === 0) {
    return {
      kind: 'invalid',
      projectRoot,
      needsViteBuild: false,
      errorMessage: 'File ZIP không chứa tệp nào để chạy trò chơi.',
    };
  }

  // 1. Check if a pre-built dist/index.html or build/index.html already exists and is built
  for (const buildFolder of ['dist', 'build']) {
    const builtHtmlRel = `${buildFolder}/index.html`;
    if (allFiles.includes(builtHtmlRel)) {
      const content = await fs.readFile(path.join(projectRoot, builtHtmlRel), 'utf8');
      if (!isUnbuiltViteHtml(content)) {
        return {
          kind: 'prebuilt-dist',
          projectRoot,
          deploySourceDir: path.join(projectRoot, buildFolder),
          entryFile: 'index.html',
          needsViteBuild: false,
        };
      }
    }
  }

  // 2. Check package.json / vite config / raw index.html for unbuilt Vite/React project
  let hasVitePkg = false;
  if (allFiles.includes('package.json')) {
    try {
      const rawPkg = await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8');
      const pkg = JSON.parse(rawPkg) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        scripts?: Record<string, string>;
      };
      const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      if (
        'vite' in allDeps ||
        Boolean(pkg.scripts?.build && /\bvite\b/.test(pkg.scripts.build))
      ) {
        hasVitePkg = true;
      }
    } catch {
      // Ignore invalid JSON and inspect index.html directly
    }
  }

  const hasViteConfig = allFiles.some((f) => /^vite\.config\.(ts|js|mjs|mts|cjs)$/i.test(f));

  let rootHtmlContent = '';
  if (allFiles.includes('index.html')) {
    rootHtmlContent = await fs.readFile(path.join(projectRoot, 'index.html'), 'utf8');
  } else if (allFiles.includes('index.htm')) {
    rootHtmlContent = await fs.readFile(path.join(projectRoot, 'index.htm'), 'utf8');
  }

  const rootHtmlIsUnbuilt = isUnbuiltViteHtml(rootHtmlContent);

  if (rootHtmlIsUnbuilt || hasVitePkg || hasViteConfig) {
    if (!allFiles.includes('package.json')) {
      return {
        kind: 'invalid',
        projectRoot,
        needsViteBuild: false,
        errorMessage:
          'File ZIP chứa mã nguồn React/Vite (/src/main.tsx) nhưng thiếu package.json để hệ thống build. Vui lòng nén lại đầy đủ thư mục dự án hoặc build sẵn thư mục dist/.',
      };
    }
    return {
      kind: 'vite-source',
      projectRoot,
      entryFile: 'index.html',
      needsViteBuild: true,
    };
  }

  // 3. Static HTML5 game: prefer root index.html, otherwise closest .html file
  const htmlFiles = allFiles
    .filter((f) => /\.html?$/i.test(f))
    .sort((a, b) => {
      const aIsIndex = /(^|\/)index\.html?$/i.test(a) ? 0 : 1;
      const bIsIndex = /(^|\/)index\.html?$/i.test(b) ? 0 : 1;
      if (aIsIndex !== bIsIndex) return aIsIndex - bIsIndex;
      return a.split('/').length - b.split('/').length;
    });

  if (htmlFiles.length === 0) {
    return {
      kind: 'invalid',
      projectRoot,
      needsViteBuild: false,
      errorMessage:
        'Không tìm thấy tệp khởi chạy (index.html) hoặc dự án React/Vite hợp lệ trong file ZIP.',
    };
  }

  const chosenHtml = htmlFiles[0];
  const chosenContent = await fs.readFile(path.join(projectRoot, chosenHtml), 'utf8');
  if (isUnbuiltViteHtml(chosenContent)) {
    return {
      kind: 'invalid',
      projectRoot,
      needsViteBuild: false,
      errorMessage:
        'Tệp HTML trong ZIP trỏ tới mã nguồn chưa được biên dịch (.tsx/.jsx). Hãy tải lên trọn bộ thư mục dự án hoặc bản đã build (dist).',
    };
  }

  const entrySubDir = chosenHtml.includes('/')
    ? path.dirname(chosenHtml)
    : '.';
  const entryBaseName = path.basename(chosenHtml);

  return {
    kind: 'static-html',
    projectRoot,
    deploySourceDir: entrySubDir === '.' ? projectRoot : path.join(projectRoot, entrySubDir),
    entryFile: entryBaseName,
    needsViteBuild: false,
  };
}

async function copyDirectoryFiltered(srcDir: string, destDir: string): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectoryFiltered(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function rewriteRootRelativeAssetsInHtml(
  deployedDir: string,
  entryFileName: string
): Promise<void> {
  const entryPath = path.join(deployedDir, entryFileName);
  let html = await fs.readFile(entryPath, 'utf8');
  const deployedFiles = new Set(await listFilesRecursive(deployedDir));

  html = html.replace(
    /(src|href)=["']\/([^"']+)["']/gi,
    (full, attr: string, relPath: string) => {
      const cleanRel = relPath.split('?')[0].split('#')[0];
      if (deployedFiles.has(cleanRel)) {
        return `${attr}="./${relPath}"`;
      }
      return full;
    }
  );

  await fs.writeFile(entryPath, html, 'utf8');
}

function guessMimeForInline(filePath: string): string | null {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'application/javascript';
  if (lower.endsWith('.css')) return 'text/css';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.webp')) return 'image/webp';
  return null;
}

export async function buildInlineHtmlFallbackIfCompact(
  deployedDir: string,
  entryFileName: string
): Promise<string | undefined> {
  const entryPath = path.join(deployedDir, entryFileName);
  let html = await fs.readFile(entryPath, 'utf8');
  const files = await listFilesRecursive(deployedDir);

  let totalBytes = Buffer.byteLength(html, 'utf8');
  for (const rel of files) {
    if (rel === entryFileName) continue;
    const stat = await fs.stat(path.join(deployedDir, rel));
    totalBytes += stat.size;
  }

  // Only inline when entire bundle comfortably fits Firestore doc limits
  if (totalBytes > 480000) {
    return undefined;
  }

  const assetMap = new Map<string, string>();
  for (const rel of files) {
    if (rel === entryFileName) continue;
    const mime = guessMimeForInline(rel);
    if (!mime) continue;
    const buf = await fs.readFile(path.join(deployedDir, rel));
    assetMap.set(rel.replace(/^\.\//, ''), `data:${mime};base64,${buf.toString('base64')}`);
  }

  // Inline local stylesheets cleanly without breaking relative paths
  html = html.replace(
    /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
    (full, href: string) => {
      const clean = href.replace(/^\.\//, '').replace(/^\//, '').split('?')[0];
      const relHit = files.find((f) => f === clean);
      if (!relHit) return full;
      const uri = assetMap.get(clean);
      return uri ? `<link rel="stylesheet" href="${uri}">` : full;
    }
  );

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
      const clean = rawRef.replace(/^\.\//, '').replace(/^\//, '').split('?')[0].split('#')[0];
      const dataUri = assetMap.get(clean);
      return dataUri ? `${attr}="${dataUri}"` : full;
    }
  );

  return html.length <= MAX_HTML_FALLBACK_LENGTH ? html : undefined;
}

function stripAnsi(input: string): string {
  // Remove terminal color codes before displaying build messages in the UI
  // eslint-disable-next-line no-control-regex
  return input.replace(/\u001b\[[0-9;]*m/g, '');
}

async function runViteBuildInProject(projectRoot: string): Promise<string> {
  const pkgPath = path.join(projectRoot, 'package.json');
  const pkgRaw = await fs.readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgRaw) as {
    scripts?: Record<string, string>;
  };

  // Check if node_modules exists already; otherwise install dependencies + devDependencies cleanly
  let hasNodeModules = false;
  try {
    const st = await fs.stat(path.join(projectRoot, 'node_modules'));
    hasNodeModules = st.isDirectory();
  } catch {
    hasNodeModules = false;
  }

  const installEnv: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    NODE_ENV: 'development',
  };

  const buildEnv: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    NODE_ENV: 'production',
  };

  if (!hasNodeModules) {
    try {
      await execFileAsync(
        'npm',
        ['install', '--include=dev', '--no-audit', '--no-fund', '--prefer-offline'],
        {
          cwd: projectRoot,
          env: installEnv,
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
        }
      );
    } catch (err) {
      const detail = stripAnsi(err instanceof Error ? err.message : String(err));
      throw new Error(
        `Không thể cài đặt thư viện cho dự án React/Vite trong file ZIP (${detail.slice(0, 180)}).`
      );
    }
  }

  try {
    // Prefer local vite binary with --base=./ so asset links work at /games-runtime/<gameId>/
    const viteBin = path.join(projectRoot, 'node_modules', '.bin', 'vite');
    let hasLocalVite = false;
    try {
      await fs.access(viteBin);
      hasLocalVite = true;
    } catch {
      hasLocalVite = false;
    }

    if (hasLocalVite) {
      await execFileAsync(viteBin, ['build', '--base=./'], {
        cwd: projectRoot,
        env: buildEnv,
        timeout: 90000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } else if (pkg.scripts?.build) {
      await execFileAsync('npm', ['run', 'build', '--', '--base=./'], {
        cwd: projectRoot,
        env: buildEnv,
        timeout: 90000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } else {
      throw new Error('Không tìm thấy lệnh build trong package.json hoặc vite.');
    }
  } catch (err) {
    const detail = stripAnsi(err instanceof Error ? err.message : String(err));
    throw new Error(
      `Quá trình build dự án React/Vite bị lỗi: ${detail.slice(0, 220)}`
    );
  }

  const distDir = path.join(projectRoot, 'dist');
  const distIndex = path.join(distDir, 'index.html');
  try {
    const builtHtml = await fs.readFile(distIndex, 'utf8');
    if (isUnbuiltViteHtml(builtHtml)) {
      throw new Error('File dist/index.html sau build vẫn chứa đường dẫn mã nguồn chưa biên dịch.');
    }
  } catch {
    throw new Error(
      'Build xong nhưng không tìm thấy dist/index.html hợp lệ.'
    );
  }

  return distDir;
}

export async function deployUploadedZipGame(params: {
  zipBuffer: Buffer | Uint8Array;
  gameId: string;
  fileName: string;
  runtimeRootDir: string;
}): Promise<DeployZipGameResult> {
  const safeId = sanitizeGameId(params.gameId);
  const fileSizeLabel = formatBytes(params.zipBuffer.byteLength);

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(params.zipBuffer);
  } catch {
    throw new Error(
      'Không thể mở tệp ZIP. Tệp có thể bị hỏng hoặc không phải định dạng .zip chuẩn.'
    );
  }

  const stagingRoot = await fs.mkdtemp(path.join(os.tmpdir(), `thomay-game-${safeId}-`));

  try {
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);
    if (entries.length === 0) {
      throw new Error('File ZIP trống, không có tệp nào bên trong.');
    }
    if (entries.length > MAX_FILES) {
      throw new Error(`File ZIP chứa quá nhiều tệp (${entries.length} tệp).`);
    }

    for (const entry of entries) {
      const safeRel = normalizeZipEntryPath(entry.name);
      if (!safeRel) continue;
      // Do not unpack uploaded node_modules into staging if huge; re-install cleanly if Vite build needed
      const destPath = path.resolve(stagingRoot, safeRel);
      if (!destPath.startsWith(path.resolve(stagingRoot) + path.sep)) {
        throw new Error(`Đường dẫn không an toàn trong file ZIP: ${entry.name}`);
      }
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      const buf = await entry.async('nodebuffer');
      await fs.writeFile(destPath, buf);
    }

    const inspection = await inspectExtractedProject(stagingRoot);
    if (inspection.kind === 'invalid') {
      throw new Error(
        inspection.errorMessage ?? 'Cấu trúc thư mục trò chơi trong file ZIP không hợp lệ.'
      );
    }

    let deploySourceDir = inspection.deploySourceDir ?? inspection.projectRoot;
    let entryFile = inspection.entryFile ?? 'index.html';
    let runtimeStatus: 'ready' | 'vite-built' = 'ready';
    let buildNote = 'Đã giải nén trò chơi HTML5 và sẵn sàng chơi.';

    if (inspection.kind === 'vite-source') {
      deploySourceDir = await runViteBuildInProject(inspection.projectRoot);
      entryFile = 'index.html';
      runtimeStatus = 'vite-built';
      buildNote =
        'Phát hiện dự án React/Vite chưa build — hệ thống đã tự động build thành công bản dist/ và triển khai.';
    }

    const targetGameDir = path.join(params.runtimeRootDir, safeId);
    await fs.rm(targetGameDir, { recursive: true, force: true });
    await copyDirectoryFiltered(deploySourceDir, targetGameDir);
    await rewriteRootRelativeAssetsInHtml(targetGameDir, entryFile);

    const htmlFallback = await buildInlineHtmlFallbackIfCompact(targetGameDir, entryFile);

    return {
      gameId: safeId,
      fileName: params.fileName,
      fileSizeLabel,
      playUrl: `/games-runtime/${safeId}/${entryFile}`,
      entryFile,
      runtimeStatus,
      htmlContent: htmlFallback,
      buildNote,
    };
  } finally {
    await fs.rm(stagingRoot, { recursive: true, force: true });
  }
}
