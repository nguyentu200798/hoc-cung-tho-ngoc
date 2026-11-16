import express from 'express';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  deployUploadedZipGame,
  sanitizeGameId,
} from './src/server/zipGameDeployer.ts';
import {
  extractWordDocumentPreview,
  resolveMimeTypeForServedFile,
  sanitizeAttachmentId,
  storeUploadedLessonAttachment,
} from './src/server/lessonAttachmentStore.ts';

const PORT = 3000;
const ROOT_DIR = process.cwd();
const GAMES_RUNTIME_DIR = path.join(ROOT_DIR, 'uploaded_games');
const LESSON_FILES_DIR = path.join(ROOT_DIR, 'uploaded_lessons');

function loadFirebaseAuthDomain(): string {
  try {
    const raw = readFileSync(path.join(ROOT_DIR, 'firebase-applet-config.json'), 'utf8');
    const parsed = JSON.parse(raw) as { authDomain?: string };
    return parsed.authDomain || 'gen-lang-client-0914265374.firebaseapp.com';
  } catch {
    return 'gen-lang-client-0914265374.firebaseapp.com';
  }
}

async function startServer() {
  await fs.mkdir(GAMES_RUNTIME_DIR, { recursive: true });
  await fs.mkdir(LESSON_FILES_DIR, { recursive: true });

  const firebaseAuthDomain = loadFirebaseAuthDomain();
  const app = express();

  // Preserve window.opener across Google/Firebase Auth popups in Chrome & Safari
  app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  // Same-origin reverse proxy for Firebase Auth helpers (/__/auth/* and /__/firebase/*)
  app.use(['/__/auth', '/__/firebase'], async (req, res) => {
    try {
      const targetUrl = `https://${firebaseAuthDomain}${req.originalUrl}`;
      const forwardHeaders: Record<string, string> = {};
      if (typeof req.headers['content-type'] === 'string') {
        forwardHeaders['content-type'] = req.headers['content-type'];
      }
      if (typeof req.headers['user-agent'] === 'string') {
        forwardHeaders['user-agent'] = req.headers['user-agent'];
      }

      const method = req.method.toUpperCase();
      let body: Buffer | undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        body = Buffer.concat(chunks);
      }

      const upstream = await fetch(targetUrl, {
        method,
        headers: forwardHeaders,
        body,
        redirect: 'manual',
      });

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (
          lower !== 'transfer-encoding' &&
          lower !== 'content-encoding' &&
          lower !== 'content-length'
        ) {
          res.setHeader(key, value);
        }
      });

      const arrBuf = await upstream.arrayBuffer();
      res.send(Buffer.from(arrBuf));
    } catch {
      res.status(502).send('Không thể kết nối máy chủ xác thực Firebase.');
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Upload lesson attachment (image, pdf, docx, doc)
  app.post(
    '/api/lessons/upload-attachment',
    express.raw({
      type: () => true,
      limit: '25mb',
    }),
    async (req, res) => {
      try {
        const fileName = String(req.query.fileName ?? 'tai-lieu');
        const mimeType = String(req.query.mimeType ?? req.headers['content-type'] ?? '');
        const bodyBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

        const attachment = await storeUploadedLessonAttachment({
          buffer: bodyBuf,
          fileName,
          mimeType,
          storageRootDir: LESSON_FILES_DIR,
        });

        res.json({ ok: true, attachment });
      } catch (err) {
        res.status(422).json({
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Không thể tải tệp đính kèm lên máy chủ.',
        });
      }
    }
  );

  // Serve lesson attachments safely (inline preview or download)
  app.get('/lesson-files/:attachmentId/:fileName', async (req, res) => {
    try {
      const safeId = sanitizeAttachmentId(req.params.attachmentId);
      const safeName = path.basename(req.params.fileName);
      const targetDir = path.resolve(LESSON_FILES_DIR, safeId);
      const targetFile = path.resolve(targetDir, safeName);

      if (!targetFile.startsWith(targetDir + path.sep)) {
        res.status(400).send('Đường dẫn tệp không hợp lệ.');
        return;
      }

      await fs.access(targetFile);
      res.setHeader('Content-Type', resolveMimeTypeForServedFile(safeName));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      if (req.query.download === '1') {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${safeName.replace(/"/g, '')}"`
        );
      } else {
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${safeName.replace(/"/g, '')}"`
        );
      }

      res.sendFile(targetFile);
    } catch {
      res.status(404).send('Không tìm thấy tệp tài liệu bài học.');
    }
  });

  // Extract inline HTML/text preview for Word (.docx, .doc) lesson attachments
  app.get('/api/lessons/doc-preview/:attachmentId/:fileName', async (req, res) => {
    try {
      const safeId = sanitizeAttachmentId(req.params.attachmentId);
      const safeName = path.basename(req.params.fileName);
      const targetDir = path.resolve(LESSON_FILES_DIR, safeId);
      const targetFile = path.resolve(targetDir, safeName);

      if (!targetFile.startsWith(targetDir + path.sep)) {
        res.status(400).json({ ok: false, error: 'Đường dẫn tệp không hợp lệ.' });
        return;
      }

      await fs.access(targetFile);
      const preview = await extractWordDocumentPreview(targetFile);
      res.json({ ok: true, ...preview });
    } catch (err) {
      res.status(422).json({
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Không thể đọc nội dung tài liệu để xem trực tiếp.',
      });
    }
  });

  // Upload, extract, inspect, build (if Vite/React source), and deploy ZIP game
  app.post(
    '/api/games/upload-zip',
    express.raw({
      type: ['application/zip', 'application/octet-stream'],
      limit: '60mb',
    }),
    async (req, res) => {
      try {
        const rawGameId = String(req.query.gameId ?? `cloud-game-${Date.now()}`);
        const fileName = String(req.query.fileName ?? 'game.zip');

        let safeId: string;
        try {
          safeId = sanitizeGameId(rawGameId);
        } catch (err) {
          res.status(400).json({
            ok: false,
            error: err instanceof Error ? err.message : 'Mã trò chơi không hợp lệ.',
          });
          return;
        }

        const bodyBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        if (bodyBuf.byteLength === 0) {
          res.status(400).json({
            ok: false,
            error: 'Không nhận được dữ liệu tệp ZIP tải lên.',
          });
          return;
        }

        const deployed = await deployUploadedZipGame({
          zipBuffer: bodyBuf,
          gameId: safeId,
          fileName,
          runtimeRootDir: GAMES_RUNTIME_DIR,
        });

        res.json({
          ok: true,
          ...deployed,
        });
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Không thể giải nén hoặc khởi chạy file ZIP vừa tải lên.';
        res.status(422).json({
          ok: false,
          error: msg,
        });
      }
    }
  );

  // Serve extracted & built static game directories at /games-runtime/:gameId/...
  app.use('/games-runtime/:gameId', async (req, res, next) => {
    try {
      const safeId = sanitizeGameId(req.params.gameId);
      const gameDir = path.join(GAMES_RUNTIME_DIR, safeId);
      await fs.access(gameDir);

      // Disable stale caching so updated game builds reflect immediately
      res.setHeader('Cache-Control', 'no-store');
      return express.static(gameDir, { index: ['index.html', 'index.htm'] })(
        req,
        res,
        next
      );
    } catch {
      res.status(404).send('Trò chơi chưa được triển khai trên máy chủ.');
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tho May Learning World server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
