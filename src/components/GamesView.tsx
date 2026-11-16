import {
  BookOpen,
  Calculator,
  Gamepad2,
  ImagePlus,
  Languages,
  LayoutGrid,
  Leaf,
  Link2,
  Play,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
  FileArchive,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ASSETS } from '../data/classroomSeed';
import type { CustomGame, GameTopic, RouteTab } from '../types/classroom';
import { processUploadedGameFile } from '../utils/gameArchive';
import {
  filterGames,
  GAME_TOPIC_META,
  GAME_TOPIC_OPTIONS,
  resolveGameTopic,
  type GameTopicFilter,
} from '../utils/gameCatalog';
import { compressImageFileToDataUrl } from '../utils/imageCompress';
import { GameCoverArtwork } from './GameCoverArtwork';

interface GamesViewProps {
  games: CustomGame[];
  onAddGame: (game: CustomGame) => Promise<void> | void;
  onPlayGame: (gameId: string) => void;
  onNavigate: (route: RouteTab) => void;
}

const TOPIC_TAB_ICONS = {
  all: LayoutGrid,
  toan: Calculator,
  'tieng-viet': BookOpen,
  'tieng-anh': Languages,
  'kham-pha': Leaf,
} as const;

export function GamesView({
  games,
  onAddGame,
  onPlayGame,
  onNavigate,
}: GamesViewProps) {
  const [topicFilter, setTopicFilter] = useState<GameTopicFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [topic, setTopic] = useState<GameTopic>('toan');
  const [imageUrl, setImageUrl] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [statusNotice, setStatusNotice] = useState('');

  const filteredGames = useMemo(
    () => filterGames(games, topicFilter, searchQuery),
    [games, topicFilter, searchQuery]
  );

  const resetForm = () => {
    setUploadMode('file');
    setTitle('');
    setTitleEn('');
    setTopic('toan');
    setImageUrl('');
    setUrl('');
    setSelectedFile(null);
    setError('');
    setIsProcessing(false);
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setError('');
    if (file && !title.trim()) {
      const cleanName = file.name
        .replace(/\.(zip|html?|rar|7z)$/i, '')
        .replace(/[_-]+/g, ' ');
      setTitle(cleanName);
    }
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, 720, 180000);
      setImageUrl(compressed);
      setError('');
    } catch {
      setError('Không thể đọc ảnh minh họa. Vui lòng thử ảnh PNG hoặc JPG khác.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusNotice('');

    const cleanImage = imageUrl.trim() || undefined;

    if (uploadMode === 'file') {
      if (!selectedFile) {
        setError(
          'Vui lòng chọn file nén (.zip) hoặc file .html / Please select a game file.'
        );
        return;
      }
      const gameName =
        title.trim() || selectedFile.name.replace(/\.(zip|html?|rar|7z)$/i, '');
      const gameId = `cloud-game-${Date.now()}`;
      setIsProcessing(true);
      try {
        const processed = await processUploadedGameFile(selectedFile, gameId);
        await onAddGame({
          id: gameId,
          title: gameName,
          titleEn: titleEn.trim() || undefined,
          topic,
          imageUrl: cleanImage,
          sourceType: processed.sourceType,
          fileName: processed.fileName,
          fileSizeLabel: processed.fileSizeLabel,
          playUrl: processed.playUrl,
          entryFile: processed.entryFile,
          runtimeStatus: processed.runtimeStatus,
          htmlContent: processed.htmlContent,
          createdAt: new Date().toISOString(),
        });
        if (processed.buildNote) {
          setStatusNotice(processed.buildNote);
        }
        resetForm();
        setShowAddModal(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể giải nén tệp vừa chọn. Hãy kiểm tra file .zip hoặc .html nhé!'
        );
        setIsProcessing(false);
      }
    } else {
      if (!title.trim() || !url.trim()) {
        setError(
          'Vui lòng nhập tên trò chơi và đường dẫn / Please enter both title and link.'
        );
        return;
      }
      let safeUrl = url.trim();
      if (!/^https?:\/\//i.test(safeUrl)) {
        safeUrl = `https://${safeUrl}`;
      }
      await onAddGame({
        id: `cloud-game-${Date.now()}`,
        title: title.trim(),
        titleEn: titleEn.trim() || undefined,
        topic,
        imageUrl: cleanImage,
        sourceType: 'url',
        url: safeUrl,
        runtimeStatus: 'ready',
        createdAt: new Date().toISOString(),
      });
      resetForm();
      setShowAddModal(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-5 pb-14 md:px-7">
      {/* Return Home Button (keeps existing navigation intact) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-extrabold text-[#194b7d] shadow-xs transition-colors hover:bg-white"
        >
          <img
            src={ASSETS.btnHomepage}
            alt="Trang chủ - Homepage"
            referrerPolicy="no-referrer"
            className="h-9 w-auto object-contain"
          />
          <span>← Trang chủ / Home</span>
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f5ff] px-3.5 py-1.5 text-xs font-extrabold text-[#165896] ring-1 ring-white">
          <Gamepad2 className="h-4 w-4 text-[#ff4d8d]" />
          <span>{games.length} trò chơi hiện có</span>
        </span>
      </div>

      {statusNotice && (
        <div
          role="status"
          className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm font-extrabold text-emerald-800 shadow-xs"
        >
          <span>✓ {statusNotice}</span>
          <button
            type="button"
            onClick={() => setStatusNotice('')}
            aria-label="Đóng thông báo"
            className="rounded-full p-1 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Sky-Blue & Fluffy Cloud Game Zone Stage */}
      <div className="relative overflow-hidden rounded-[2.25rem] border-4 border-white bg-gradient-to-b from-[#6ec8ff] via-[#bae6ff] to-[#eef9ff] shadow-[0_22px_50px_rgba(38,125,196,0.22)]">
        {/* Top Atmospheric Sky Banner */}
        <section className="relative px-4 pt-5 pb-12 sm:px-7 md:pt-6 md:pb-14">
          {/* Decorative soft rainbow arc on desktop right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 right-4 hidden h-56 w-72 opacity-80 lg:block"
          >
            <svg viewBox="0 0 280 200" className="h-full w-full">
              <path
                d="M15 170 A120 115 0 0 1 255 170"
                fill="none"
                stroke="#ff7eb6"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.72"
              />
              <path
                d="M27 170 A108 103 0 0 1 243 170"
                fill="none"
                stroke="#fde047"
                strokeWidth="11"
                strokeLinecap="round"
                opacity="0.72"
              />
              <path
                d="M39 170 A96 91 0 0 1 231 170"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="11"
                strokeLinecap="round"
                opacity="0.75"
              />
              <rect x="172" y="96" width="52" height="44" rx="8" fill="#ffffff" opacity="0.88" />
              <polygon points="168,98 198,64 228,98" fill="#ff74ad" opacity="0.9" />
              <rect x="150" y="114" width="24" height="28" rx="6" fill="#f8fafc" opacity="0.88" />
              <polygon points="147,115 162,92 177,115" fill="#c084fc" opacity="0.9" />
              <rect x="220" y="114" width="24" height="28" rx="6" fill="#f8fafc" opacity="0.88" />
              <polygon points="217,115 232,92 247,115" fill="#60a5fa" opacity="0.9" />
              <circle cx="198" cy="58" r="7" fill="#facc15" />
            </svg>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-10 left-12 h-10 w-28 rounded-full bg-white/45 blur-[1px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-20 right-1/4 h-8 w-24 rounded-full bg-white/40 blur-[1px]"
          />

          {/* Header Controls Row: Brand badge, Search input, Add Game button */}
          <div className="relative z-20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/90 py-1.5 pr-4 pl-2 shadow-sm ring-2 ring-white">
              <img
                src={ASSETS.thoMayMascot}
                alt="Thỏ Mây"
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full bg-[#e0f2fe] object-contain p-0.5"
              />
              <div className="leading-tight">
                <span className="block text-sm font-black text-[#ff3d84]">Thỏ Mây</span>
                <span className="block text-[11px] font-bold text-[#1d5b99]">
                  Lớp 3.17 · Cô Tú
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
              <label className="relative flex min-w-[210px] flex-1 items-center sm:max-w-xs">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 h-4 w-4 text-[#3b82c4]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm trò chơi... / Search games..."
                  aria-label="Tìm trò chơi / Search games"
                  className="min-h-[44px] w-full rounded-full border-2 border-white bg-white/95 pr-4 pl-10 text-sm font-bold text-[#144578] shadow-sm placeholder:text-[#6aa2d6] focus:border-[#ff5c97] focus:outline-none"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border-2 border-white bg-gradient-to-b from-[#ff6ba2] to-[#ff3b82] px-5 py-2 text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(255,59,130,0.35)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Thêm trò chơi</span>
              </button>
            </div>
          </div>

          {/* Center Playful Banner with Thỏ Mây Mascot on Smiling Cloud */}
          <div className="relative z-10 mt-6 flex flex-col items-center justify-center gap-4 text-center md:mt-5 md:flex-row md:gap-8">
            <div className="relative flex shrink-0 flex-col items-center">
              <img
                src={ASSETS.thoMayMascot}
                alt="Linh vật Thỏ Mây vui vẻ"
                referrerPolicy="no-referrer"
                className="animate-float-gentle relative z-10 h-28 w-auto drop-shadow-[0_10px_18px_rgba(20,85,150,0.22)] md:h-32"
              />
              <div
                aria-hidden="true"
                className="-mt-6 flex h-12 w-32 items-center justify-center rounded-full border-2 border-white bg-white shadow-[0_8px_20px_rgba(45,127,196,0.2)]"
              >
                <div className="flex items-center gap-2 text-[11px] font-black text-[#ff5c97]">
                  <span>◠</span>
                  <span className="text-rose-400">◡</span>
                  <span>◠</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative inline-flex items-center">
                <span
                  aria-hidden="true"
                  className="mr-2 hidden text-2xl font-black text-[#fde047] drop-shadow-xs sm:inline"
                >
                  ✦
                </span>
                <h1
                  className="font-display text-4xl font-black tracking-tight text-[#ff3b82] sm:text-5xl md:text-6xl"
                  style={{
                    WebkitTextStroke: '3px #ffffff',
                    paintOrder: 'stroke fill',
                    textShadow: '0 6px 16px rgba(21, 90, 156, 0.24)',
                  }}
                >
                  Kho game
                </h1>
                <span
                  aria-hidden="true"
                  className="ml-2 hidden text-2xl font-black text-[#fde047] drop-shadow-xs sm:inline"
                >
                  ✦
                </span>
              </div>

              <div className="mt-2.5 inline-flex flex-col items-center rounded-full border-2 border-white bg-white/95 px-6 py-2 shadow-[0_8px_20px_rgba(45,127,196,0.16)]">
                <p className="flex items-center gap-2 text-sm font-extrabold text-[#164a7e] sm:text-base">
                  <span aria-hidden="true" className="text-[#facc15]">
                    ★
                  </span>
                  <span>Chọn trò chơi và bắt đầu khám phá!</span>
                  <span aria-hidden="true" className="text-[#facc15]">
                    ★
                  </span>
                </p>
                <p className="text-[11px] font-bold text-[#4a80b5]">
                  Choose a game card and start exploring!
                </p>
              </div>
            </div>
          </div>

          <svg
            aria-hidden="true"
            viewBox="0 0 1200 72"
            preserveAspectRatio="none"
            className="pointer-events-none absolute right-0 -bottom-1 left-0 h-12 w-full sm:h-14"
          >
            <path
              d="M0,48 C65,12 145,12 205,42 C255,14 345,14 405,40 C475,8 565,8 635,38 C705,12 795,12 855,40 C920,10 1015,12 1080,42 C1125,22 1170,22 1200,38 L1200,72 L0,72 Z"
              fill="#f3faff"
              opacity="0.72"
            />
            <path
              d="M0,56 C90,24 190,26 260,52 C325,24 425,24 490,50 C570,20 675,20 750,50 C820,24 915,24 985,50 C1055,28 1135,28 1200,48 L1200,72 L0,72 Z"
              fill="#f8fcff"
            />
          </svg>
        </section>

        {/* Lower Sky Meadow Content: Topic Filter Tabs + Responsive Game Card Grid */}
        <section className="relative bg-gradient-to-b from-[#f8fcff] to-[#eaf6ff] px-4 pt-3 pb-10 sm:px-7 md:pb-12">
          <div
            role="tablist"
            aria-label="Lọc trò chơi theo chủ đề / Filter games by topic"
            className="flex flex-wrap items-center justify-center gap-2.5 pb-7"
          >
            {(Object.keys(GAME_TOPIC_META) as GameTopicFilter[]).map((key) => {
              const meta = GAME_TOPIC_META[key];
              const Icon = TOPIC_TAB_ICONS[key];
              const isActive = topicFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTopicFilter(key)}
                  className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold transition-all ${
                    isActive
                      ? 'bg-gradient-to-b from-[#ff6ba2] to-[#ff3b82] text-white shadow-[0_8px_20px_rgba(255,59,130,0.3)] ring-2 ring-white'
                      : 'bg-white text-[#184c82] shadow-[0_4px_12px_rgba(45,127,196,0.1)] ring-1 ring-[#cce8ff] hover:bg-[#e8f5ff]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {games.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-[2rem] border-2 border-white bg-white/95 p-8 text-center shadow-[0_14px_34px_rgba(33,115,176,0.12)] md:p-12">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#e6f5ff] ring-4 ring-[#cdeaff]">
                <Sparkles className="h-10 w-10 text-[#ff3b82]" />
              </div>
              <h2 className="font-display mt-5 text-2xl font-extrabold text-[#164a7e]">
                Kho game đang chờ cô Tú thêm trò chơi
              </h2>
              <p className="mt-1 text-sm font-extrabold text-[#ff3b82]">
                Game Zone is ready — Add your first game!
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm font-semibold text-[#3c6996]">
                Khi thêm trò chơi mới (tải file HTML5/.zip hoặc dán link), trò chơi sẽ tự động hiện thành một thẻ xinh xắn ở đây để học sinh bấm chơi ngay.
              </p>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="mt-6 inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full bg-gradient-to-b from-[#ff6ba2] to-[#ff3b82] px-7 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(255,59,130,0.3)] transition-transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Thêm trò chơi đầu tiên</span>
              </button>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-white bg-white/95 p-8 text-center shadow-[0_12px_28px_rgba(33,115,176,0.1)]">
              <p className="font-display text-xl font-extrabold text-[#164a7e]">
                Chưa có trò chơi nào phù hợp với tìm kiếm này
              </p>
              <p className="mt-1 text-xs font-semibold text-[#4a80b5]">
                No matching games found for the selected topic or search keyword.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTopicFilter('all');
                  setSearchQuery('');
                }}
                className="mt-5 inline-flex min-h-[44px] cursor-pointer items-center rounded-full bg-[#e6f5ff] px-6 py-2 text-sm font-extrabold text-[#164a7e] hover:bg-[#d3ecff]"
              >
                Xem tất cả trò chơi ({games.length})
              </button>
            </div>
          ) : (
            <div
              aria-label="Danh sách trò chơi / Game Cards"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredGames.map((game, idx) => {
                const resolvedTopic = resolveGameTopic(game);
                const topicMeta = GAME_TOPIC_META[resolvedTopic];

                return (
                  <article
                    key={game.id}
                    className="group relative flex flex-col rounded-[1.85rem] border-2 border-white bg-white p-3.5 shadow-[0_14px_30px_rgba(33,115,176,0.14)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(33,115,176,0.2)]"
                  >
                    <button
                      type="button"
                      onClick={() => onPlayGame(game.id)}
                      className="flex flex-1 cursor-pointer flex-col text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3b82]"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.35rem] bg-[#e6f5ff]">
                        <GameCoverArtwork game={game} index={idx} />
                      </div>

                      <div className="mt-3.5 flex flex-1 flex-col items-center justify-center px-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-extrabold ${topicMeta.badgeBg} ${topicMeta.badgeText}`}
                        >
                          {topicMeta.label}
                        </span>

                        <h2 className="font-display mt-2 line-clamp-2 text-xl leading-snug font-extrabold text-[#164a7e] text-balance">
                          {game.title}
                        </h2>

                        {game.titleEn && (
                          <p className="mt-0.5 line-clamp-1 text-xs font-bold text-[#4a80b5]">
                            {game.titleEn}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="mt-4 flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => onPlayGame(game.id)}
                        className="inline-flex min-h-[46px] w-full max-w-[220px] cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ff6ba2] to-[#ff337c] px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(255,51,124,0.3)] transition-all group-hover:brightness-105 hover:scale-[1.02] active:scale-[0.99]"
                      >
                        <Play className="h-4 w-4 fill-white" />
                        <span>Chơi ngay</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Add Game Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-game-modal-title"
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#0c2d52]/45 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-[2rem] border-2 border-white bg-white p-6 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="add-game-modal-title"
                  className="font-display text-2xl font-extrabold text-[#164a7e]"
                >
                  Thêm trò chơi mới
                </h2>
                <p className="text-xs font-extrabold text-[#ff3b82]">
                  Add a New Game to Kho game
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng hộp thoại / Close modal"
                onClick={() => setShowAddModal(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#e6f5ff] text-[#164a7e] hover:bg-[#d2ecff]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#eaf6ff] p-1.5">
              <button
                type="button"
                onClick={() => {
                  setUploadMode('file');
                  setError('');
                }}
                className={`flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold transition-all ${
                  uploadMode === 'file'
                    ? 'bg-white text-[#164a7e] shadow-xs'
                    : 'text-[#4a80b5] hover:text-[#164a7e]'
                }`}
              >
                <FileArchive className="h-4 w-4" />
                <span>Tải file ZIP / HTML</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('link');
                  setError('');
                }}
                className={`flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold transition-all ${
                  uploadMode === 'link'
                    ? 'bg-white text-[#164a7e] shadow-xs'
                    : 'text-[#4a80b5] hover:text-[#164a7e]'
                }`}
              >
                <Link2 className="h-4 w-4" />
                <span>Dán đường dẫn / Game Link</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="cloud-game-title"
                  className="block text-xs font-extrabold text-[#164a7e]"
                >
                  Tên trò chơi (Tiếng Việt) / Game Title *
                </label>
                <input
                  id="cloud-game-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Bé vui học Toán"
                  className="mt-1 w-full rounded-2xl border border-[#bce0fd] bg-[#f8fcff] px-4 py-2.5 text-sm font-bold text-[#164a7e]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="cloud-game-topic"
                    className="block text-xs font-extrabold text-[#164a7e]"
                  >
                    Chủ đề / Topic
                  </label>
                  <select
                    id="cloud-game-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value as GameTopic)}
                    className="mt-1 w-full rounded-2xl border border-[#bce0fd] bg-[#f8fcff] px-3.5 py-2.5 text-sm font-bold text-[#164a7e]"
                  >
                    {GAME_TOPIC_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {GAME_TOPIC_META[t].label} ({GAME_TOPIC_META[t].labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cloud-game-title-en"
                    className="block text-xs font-extrabold text-[#164a7e]"
                  >
                    Tên tiếng Anh (tùy chọn)
                  </label>
                  <input
                    id="cloud-game-title-en"
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. Math Adventure"
                    className="mt-1 w-full rounded-2xl border border-[#bce0fd] bg-[#f8fcff] px-3.5 py-2.5 text-sm font-bold text-[#164a7e]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cloud-game-image-url"
                  className="block text-xs font-extrabold text-[#164a7e]"
                >
                  Ảnh minh họa (tùy chọn — tự tạo ảnh đẹp theo chủ đề nếu để trống)
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <input
                    id="cloud-game-image-url"
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Dán link ảnh hoặc bấm nút tải ảnh lên..."
                    className="min-w-[180px] flex-1 rounded-2xl border border-[#bce0fd] bg-[#f8fcff] px-3.5 py-2 text-xs font-semibold text-[#164a7e]"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl bg-[#e6f5ff] px-3.5 py-2 text-xs font-extrabold text-[#164a7e] hover:bg-[#d2ecff]">
                    <ImagePlus className="h-4 w-4" />
                    <span>Chọn ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        void handleCoverUpload(e.target.files?.[0] ?? null)
                      }
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <label
                    htmlFor="game-archive-input"
                    className="block text-xs font-extrabold text-[#164a7e]"
                  >
                    Chọn file nén .zip (HTML5 hoặc dự án React/Vite) hoặc file .html
                  </label>
                  <label
                    htmlFor="game-archive-input"
                    className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#8cc8fa] bg-[#f4faff] px-4 py-5 text-center transition-colors hover:bg-[#e8f5ff]"
                  >
                    <Upload className="h-7 w-7 text-[#2684d4]" />
                    <span className="mt-2 text-sm font-extrabold text-[#164a7e]">
                      {selectedFile
                        ? selectedFile.name
                        : 'Nhấn để chọn file trò chơi (.zip, .html)'}
                    </span>
                    <span className="mt-0.5 text-xs font-semibold text-[#4a80b5]">
                      {selectedFile
                        ? 'Hệ thống sẽ giải nén, kiểm tra cấu trúc và tự build nếu cần'
                        : 'Hỗ trợ cả trò chơi HTML5 (index.html) & mã nguồn React/Vite'}
                    </span>
                    <input
                      id="game-archive-input"
                      type="file"
                      accept=".zip,.html,.htm"
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="cloud-game-url"
                    className="block text-xs font-extrabold text-[#164a7e]"
                  >
                    Đường dẫn trò chơi / Game URL *
                  </label>
                  <input
                    id="cloud-game-url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://wordwall.net/... hoặc link game bất kỳ"
                    className="mt-1 w-full rounded-2xl border border-[#bce0fd] bg-[#f8fcff] px-4 py-2.5 text-sm font-bold text-[#164a7e]"
                  />
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700"
                >
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[42px] cursor-pointer rounded-full bg-[#eef7ff] px-5 py-2 text-xs font-extrabold text-[#4a80b5]"
                >
                  Hủy / Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="min-h-[42px] cursor-pointer rounded-full bg-gradient-to-b from-[#ff6ba2] to-[#ff337c] px-6 py-2 text-xs font-extrabold text-white shadow-md disabled:opacity-60"
                >
                  {isProcessing
                    ? 'Đang giải nén & build trò chơi...'
                    : 'Lưu vào Kho game ✨ / Save Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
