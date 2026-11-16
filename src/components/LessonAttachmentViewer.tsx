import DOMPurify from 'dompurify';
import {
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useEffect, useRef, useState } from 'react';
import type { LessonAttachment } from '../types/classroom';
import {
  buildLessonDocPreviewUrl,
  buildLessonDownloadUrl,
  getAttachmentKindLabel,
} from '../utils/lessonAttachments';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export function InlineImageAttachmentCard({
  image,
  onZoom,
}: {
  image: LessonAttachment;
  onZoom: (img: LessonAttachment) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/95 bg-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100/80 bg-purple-50/45 px-3.5 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <ImageIcon className="h-4 w-4 shrink-0 text-[#7d26c9]" />
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-[#4f1d4b] sm:text-sm">
              {image.name}
            </p>
            {image.sizeLabel && (
              <p className="text-[11px] font-semibold text-[#7d4e78]">
                {image.sizeLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!imgError && (
            <button
              type="button"
              onClick={() => onZoom(image)}
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#5b2358] ring-1 ring-purple-200 hover:bg-purple-50"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Phóng to</span>
            </button>
          )}
          <a
            href={buildLessonDownloadUrl(image.url)}
            download={image.name}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-[#5b2358] hover:bg-purple-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải ảnh</span>
          </a>
        </div>
      </div>

      {imgError ? (
        <div className="bg-amber-50/70 px-4 py-6 text-center text-xs font-bold text-amber-900">
          <p>Hình ảnh bài học hiện không còn trên máy chủ tạm.</p>
          <p className="mt-1 font-semibold opacity-85">
            Cô Tú có thể đăng lại ảnh mới trong mục Giáo viên để học sinh xem trực tiếp nhé!
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onZoom(image)}
          aria-label={`Xem phóng to ảnh ${image.name}`}
          className="block w-full cursor-zoom-in bg-white p-2 sm:p-3"
        >
          <img
            src={image.url}
            alt={image.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="mx-auto h-auto max-h-[82vh] w-full rounded-xl object-contain"
          />
        </button>
      )}
    </article>
  );
}

function InlinePdfCanvasPages({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const next = Math.floor(el.clientWidth);
      setContainerWidth((prev) => (Math.abs(prev - next) >= 12 ? next : prev));
    };
    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!containerWidth) return;
    let cancelled = false;
    const host = canvasHostRef.current;
    if (!host) return;

    setStatus('loading');
    const loadingTask = pdfjsLib.getDocument({ url });

    loadingTask.promise
      .then(async (pdf) => {
        if (cancelled) return;
        setNumPages(pdf.numPages);
        host.innerHTML = '';

        const targetWidth = Math.max(240, containerWidth - 16);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) break;
          const page = await pdf.getPage(pageNum);
          if (cancelled) break;

          const baseViewport = page.getViewport({ scale: 1 });
          const fitScale = targetWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: fitScale });

          const pageWrap = document.createElement('div');
          pageWrap.className =
            'overflow-hidden rounded-xl border border-purple-100 bg-white shadow-xs';

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.setAttribute('aria-label', `${title} - Trang ${pageNum}`);

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

          await page.render({ canvasContext: ctx, canvas, viewport }).promise;
          if (cancelled) break;

          if (pdf.numPages > 1) {
            const caption = document.createElement('div');
            caption.className =
              'border-t border-purple-50 bg-purple-50/40 px-3 py-1 text-right text-[11px] font-bold text-[#7d4e78]';
            caption.textContent = `Trang ${pageNum} / ${pdf.numPages}`;
            pageWrap.appendChild(canvas);
            pageWrap.appendChild(caption);
          } else {
            pageWrap.appendChild(canvas);
          }

          host.appendChild(pageWrap);
        }

        if (!cancelled) {
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      void loadingTask.destroy();
    };
  }, [url, title, containerWidth]);

  return (
    <div ref={containerRef} className="mt-3 w-full">
      {status === 'loading' && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-purple-100 bg-purple-50/45 py-8 text-xs font-extrabold text-[#5b2358]">
          <RefreshCw className="h-4 w-4 animate-spin text-[#7d26c9]" />
          <span>Đang hiển thị nội dung PDF...</span>
        </div>
      )}

      {status === 'error' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-center text-xs font-bold text-amber-900">
          <p>Trình duyệt không thể hiển thị trực tiếp tệp PDF này.</p>
          <p className="mt-1 font-semibold opacity-85">
            Em bấm “Mở thẻ mới” hoặc “Tải về” ở góc trên để xem rõ toàn bộ trang nhé!
          </p>
        </div>
      ) : (
        <div
          ref={canvasHostRef}
          className={
            status === 'loading'
              ? 'hidden'
              : 'max-h-[78vh] space-y-3 overflow-y-auto rounded-2xl border border-purple-100 bg-purple-50/35 p-2 sm:p-3'
          }
          data-pdf-pages={numPages}
        />
      )}
    </div>
  );
}

function InlineWordDocContent({ docItem }: { docItem: LessonAttachment }) {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'docx'; safeHtml: string }
    | { status: 'doc'; paragraphs: string[] }
    | { status: 'error' }
  >({ status: 'loading' });

  useEffect(() => {
    const previewUrl = buildLessonDocPreviewUrl(docItem.url);
    if (!previewUrl) {
      setState({ status: 'error' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    fetch(previewUrl)
      .then(async (res) => {
        const data = (await res.json()) as {
          ok?: boolean;
          kind?: 'docx' | 'doc';
          html?: string;
          paragraphs?: string[];
        };
        if (!res.ok || !data.ok) {
          throw new Error('Failed to load word preview');
        }
        if (cancelled) return;

        if (data.kind === 'docx') {
          const safeHtml = DOMPurify.sanitize(data.html ?? '', {
            USE_PROFILES: { html: true },
          });
          setState({ status: 'docx', safeHtml });
        } else {
          setState({ status: 'doc', paragraphs: data.paragraphs ?? [] });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [docItem.url]);

  if (state.status === 'loading') {
    return (
      <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-purple-100 bg-purple-50/45 py-8 text-xs font-extrabold text-[#5b2358]">
        <RefreshCw className="h-4 w-4 animate-spin text-[#7d26c9]" />
        <span>Đang mở nội dung tài liệu Word...</span>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-center text-xs font-bold text-amber-900">
        Không thể hiển thị trước tệp này trên trình duyệt. Em hãy bấm “Mở thẻ mới” hoặc “Tải về” ở trên để xem nhé!
      </div>
    );
  }

  if (state.status === 'docx') {
    if (!state.safeHtml.trim()) {
      return (
        <div className="mt-3 rounded-2xl border border-purple-100 bg-white p-4 text-xs font-semibold text-[#6b4869]">
          Tài liệu chưa có chữ hoặc dùng khung vẽ nâng cao. Em có thể bấm “Tải về” để mở đầy đủ định dạng.
        </div>
      );
    }

    return (
      <div
        className="lesson-doc-prose mt-3 max-h-[72vh] overflow-x-auto overflow-y-auto rounded-2xl border border-purple-100 bg-white p-4 text-sm leading-relaxed text-[#3b1538] shadow-inner sm:p-6"
        dangerouslySetInnerHTML={{ __html: state.safeHtml }}
      />
    );
  }

  return (
    <div className="mt-3 max-h-[72vh] space-y-2.5 overflow-y-auto rounded-2xl border border-purple-100 bg-white p-4 text-sm leading-relaxed font-medium text-[#3b1538] shadow-inner sm:p-6">
      {state.paragraphs.length > 0 ? (
        state.paragraphs.map((p, idx) => <p key={idx}>{p}</p>)
      ) : (
        <p className="text-xs font-semibold text-[#6b4869]">
          Tệp Word (.doc) không có văn bản thuần. Em hãy bấm “Tải về” ở trên để xem đầy đủ nhé!
        </p>
      )}
    </div>
  );
}

export function InlineDocumentAttachmentCard({
  docItem,
}: {
  docItem: LessonAttachment;
}) {
  // Always open inline by default so students view content without clicking
  const [expanded, setExpanded] = useState(true);
  const meta = getAttachmentKindLabel(docItem.kind);

  return (
    <article className="rounded-2xl border border-white/95 bg-white/90 p-3.5 shadow-xs sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white shadow-xs ${
              docItem.kind === 'pdf' ? 'bg-rose-500' : 'bg-sky-600'
            }`}
          >
            {meta.short}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-extrabold text-[#4f1d4b]">
              <FileText className="h-4 w-4 shrink-0 text-[#7d26c9]" />
              <span className="truncate">{docItem.name}</span>
            </p>
            <p className="text-xs font-semibold text-[#7d4e78]">
              {meta.label}
              {docItem.sizeLabel ? ` · ${docItem.sizeLabel}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex min-h-[38px] cursor-pointer items-center gap-1 rounded-full bg-purple-100 px-3.5 py-1.5 text-xs font-extrabold text-[#5b2358] hover:bg-purple-200"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Thu gọn</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Xem nội dung</span>
              </>
            )}
          </button>

          <a
            href={docItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#4f1d4b] ring-1 ring-purple-200 hover:bg-purple-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Mở thẻ mới</span>
          </a>

          <a
            href={buildLessonDownloadUrl(docItem.url)}
            download={docItem.name}
            className="btn-violet inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải về</span>
          </a>
        </div>
      </div>

      {expanded &&
        (docItem.kind === 'pdf' ? (
          <InlinePdfCanvasPages url={docItem.url} title={docItem.name} />
        ) : (
          <InlineWordDocContent docItem={docItem} />
        ))}
    </article>
  );
}
