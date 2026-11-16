import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  FileArchive,
  Maximize2,
  Minimize2,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CustomGame } from '../types/classroom';
import { processUploadedGameFile } from '../utils/gameArchive';
import {
  GAME_TOPIC_META,
  getGameLaunchMode,
  isUnbuiltViteHtml,
  resolveGameTopic,
} from '../utils/gameCatalog';

interface GamePlayViewProps {
  game: CustomGame | null;
  onBackToGames: () => void;
  onUpdateGame: (updated: CustomGame) => Promise<void> | void;
}

export function GamePlayView({
  game,
  onBackToGames,
  onUpdateGame,
}: GamePlayViewProps) {
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [runtimeState, setRuntimeState] = useState<
    'checking' | 'use-url' | 'use-fallback-html' | 'missing'
  >('checking');
  const [repairing, setRepairing] = useState(false);
  const [repairError, setRepairError] = useState('');
  const [repairNote, setRepairNote] = useState('');

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const launchMode = game ? getGameLaunchMode(game) : null;

  useEffect(() => {
    setRepairError('');
    setRepairNote('');

    if (!launchMode || launchMode.kind !== 'runtime') {
      setRuntimeState('checking');
      return;
    }

    let cancelled = false;
    setRuntimeState('checking');

    fetch(launchMode.playUrl, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        // Guard against SPA 404 HTML fallback returning host site or unbuilt code
        const looksLikeHostApp =
          text.includes('Học Cùng Thỏ Mây và cô Tú') &&
          !text.includes('uploaded_games');
        if (looksLikeHostApp || isUnbuiltViteHtml(text)) {
          throw new Error('Runtime entry not playable');
        }
        if (!cancelled) {
          setRuntimeState('use-url');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRuntimeState(
            launchMode.fallbackHtml ? 'use-fallback-html' : 'missing'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [game?.id, launchMode?.kind === 'runtime' ? launchMode.playUrl : '']);

  const toggleFullscreen = async () => {
    if (!stageContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await stageContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by browser/iframe policies
    }
  };

  const handleRepairZipUpload = async (file: File | null) => {
    if (!file || !game) return;
    setRepairError('');
    setRepairNote('');
    setRepairing(true);
    try {
      const processed = await processUploadedGameFile(file, game.id);
      const updatedGame: CustomGame = {
        ...game,
        sourceType: processed.sourceType,
        fileName: processed.fileName,
        fileSizeLabel: processed.fileSizeLabel,
        playUrl: processed.playUrl,
        entryFile: processed.entryFile,
        runtimeStatus: processed.runtimeStatus,
        htmlContent: processed.htmlContent,
      };
      await onUpdateGame(updatedGame);
      setRepairNote(
        processed.buildNote ?? 'Đã giải nén và cập nhật trò chơi thành công!'
      );
    } catch (err) {
      setRepairError(
        err instanceof Error
          ? err.message
          : 'Không thể giải nén hoặc build tệp ZIP vừa chọn.'
      );
    } finally {
      setRepairing(false);
    }
  };

  if (!game || !launchMode) {
    return (
      <div className="mx-auto max-w-[960px] px-4 pt-8 pb-16 md:px-7">
        <button
          type="button"
          onClick={onBackToGames}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-2 border-white bg-white/95 px-5 py-2 text-sm font-extrabold text-[#164a7e] shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại kho game</span>
        </button>

        <section className="mt-6 rounded-[2rem] border-2 border-white bg-white/95 p-8 text-center shadow-[0_18px_40px_rgba(33,115,176,0.14)]">
          <FileArchive className="mx-auto h-12 w-12 text-[#2684d4]" />
          <h1 className="font-display mt-4 text-2xl font-extrabold text-[#164a7e]">
            Không tìm thấy trò chơi này
          </h1>
          <p className="mt-2 text-sm font-semibold text-[#4a80b5]">
            Trò chơi có thể đang tải từ máy chủ hoặc đã được gỡ khỏi Kho game.
          </p>
          <button
            type="button"
            onClick={onBackToGames}
            className="mt-6 inline-flex min-h-[46px] cursor-pointer items-center gap-2 rounded-full bg-gradient-to-b from-[#ff6ba2] to-[#ff337c] px-6 py-2.5 text-sm font-extrabold text-white shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại kho game</span>
          </button>
        </section>
      </div>
    );
  }

  const resolvedTopic = resolveGameTopic(game);
  const topicMeta = GAME_TOPIC_META[resolvedTopic];

  return (
    <div className="mx-auto max-w-[1220px] px-4 pt-5 pb-14 md:px-7">
      {/* Dedicated Play Header Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border-2 border-white bg-gradient-to-r from-[#dff3ff] via-[#eef8ff] to-[#fff5fa] px-4 py-3 shadow-[0_12px_28px_rgba(33,115,176,0.14)] sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBackToGames}
            className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 border-white bg-white px-4 py-2 text-sm font-extrabold text-[#164a7e] shadow-xs transition-transform hover:-translate-y-0.5 hover:bg-[#e6f5ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại kho game</span>
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-0.5 text-[11px] font-extrabold ${topicMeta.badgeBg} ${topicMeta.badgeText}`}
              >
                {topicMeta.label}
              </span>
              {game.runtimeStatus === 'vite-built' && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                  React/Vite đã build
                </span>
              )}
            </div>
            <h1 className="font-display mt-1 truncate text-lg font-extrabold text-[#164a7e] sm:text-2xl">
              {game.title}
            </h1>
            {game.titleEn && (
              <p className="truncate text-xs font-bold text-[#4a80b5]">
                {game.titleEn}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {game.url && (
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#164a7e] shadow-xs ring-1 ring-[#cce8ff] hover:bg-[#e6f5ff]"
            >
              <span>Mở thẻ mới</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-b from-[#ff6ba2] to-[#ff337c] px-4 py-2 text-xs font-extrabold text-white shadow-sm"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span>Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span>Toàn màn hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      {repairNote && (
        <div
          role="status"
          className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-800"
        >
          ✓ {repairNote}
        </div>
      )}

      {/* Playable Stage Container */}
      <div
        ref={stageContainerRef}
        className="overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_20px_48px_rgba(33,115,176,0.18)]"
      >
        {launchMode.kind === 'url' ? (
          <iframe
            title={game.title}
            src={launchMode.url}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals"
            allow="fullscreen; autoplay"
            className="h-[68dvh] min-h-[340px] w-full border-0 bg-white sm:h-[74dvh] sm:min-h-[480px] lg:h-[78dvh]"
          />
        ) : launchMode.kind === 'html' ? (
          <iframe
            title={game.title}
            srcDoc={launchMode.htmlContent}
            sandbox="allow-scripts allow-forms allow-popups allow-pointer-lock allow-modals"
            allow="fullscreen; autoplay"
            className="h-[68dvh] min-h-[340px] w-full border-0 bg-white sm:h-[74dvh] sm:min-h-[480px] lg:h-[78dvh]"
          />
        ) : launchMode.kind === 'runtime' && runtimeState === 'checking' ? (
          <div className="flex h-[56dvh] min-h-[320px] flex-col items-center justify-center bg-[#f4faff] p-8 text-center sm:h-[65dvh]">
            <RefreshCw className="h-10 w-10 animate-spin text-[#2684d4]" />
            <p className="font-display mt-4 text-xl font-extrabold text-[#164a7e]">
              Đang khởi chạy trò chơi...
            </p>
            <p className="mt-1 text-xs font-semibold text-[#4a80b5]">
              Loading {game.entryFile ?? 'index.html'}...
            </p>
          </div>
        ) : launchMode.kind === 'runtime' && runtimeState === 'use-url' ? (
          <iframe
            title={game.title}
            src={launchMode.playUrl}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals"
            allow="fullscreen; autoplay"
            className="h-[68dvh] min-h-[340px] w-full border-0 bg-white sm:h-[74dvh] sm:min-h-[480px] lg:h-[78dvh]"
          />
        ) : launchMode.kind === 'runtime' &&
          runtimeState === 'use-fallback-html' &&
          launchMode.fallbackHtml ? (
          <iframe
            title={game.title}
            srcDoc={launchMode.fallbackHtml}
            sandbox="allow-scripts allow-forms allow-popups allow-pointer-lock allow-modals"
            allow="fullscreen; autoplay"
            className="h-[68dvh] min-h-[340px] w-full border-0 bg-white sm:h-[74dvh] sm:min-h-[480px] lg:h-[78dvh]"
          />
        ) : (
          /* Clear Error / Unbuilt Source Repair Screen */
          <div className="flex min-h-[460px] flex-col items-center justify-center bg-gradient-to-b from-[#f3faff] to-white p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-4 ring-amber-50">
              <AlertTriangle className="h-10 w-10" />
            </div>

            <h2 className="font-display mt-5 text-2xl font-extrabold text-[#164a7e]">
              Trò chơi này chưa sẵn sàng để chạy trực tiếp
            </h2>

            <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed font-semibold text-[#3c6996]">
              {launchMode.kind === 'error'
                ? launchMode.message
                : 'Không tìm thấy tệp trò chơi đã giải nén trên máy chủ. Vui lòng tải lại file ZIP để hệ thống giải nén và build lại.'}
            </p>

            {game.fileName && (
              <p className="mt-3 rounded-full bg-[#e6f5ff] px-4 py-1.5 text-xs font-extrabold text-[#164a7e]">
                Tệp đã lưu: {game.fileName}
                {game.fileSizeLabel ? ` (${game.fileSizeLabel})` : ''}
              </p>
            )}

            {repairError && (
              <p
                role="alert"
                className="mt-4 max-w-lg rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800"
              >
                {repairError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <label className="inline-flex min-h-[46px] cursor-pointer items-center gap-2 rounded-full bg-gradient-to-b from-[#ff6ba2] to-[#ff337c] px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition-transform hover:-translate-y-0.5">
                <Upload className="h-4 w-4" />
                <span>
                  {repairing
                    ? 'Đang giải nén & build...'
                    : 'Cập nhật lại file ZIP cho trò chơi này'}
                </span>
                <input
                  type="file"
                  accept=".zip,.html,.htm"
                  disabled={repairing}
                  onChange={(e) =>
                    void handleRepairZipUpload(e.target.files?.[0] ?? null)
                  }
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                onClick={onBackToGames}
                className="inline-flex min-h-[46px] cursor-pointer items-center gap-2 rounded-full bg-[#e6f5ff] px-5 py-2.5 text-sm font-extrabold text-[#164a7e] hover:bg-[#d2ecff]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại kho game</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
