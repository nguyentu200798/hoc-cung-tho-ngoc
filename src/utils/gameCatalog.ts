import type { CustomGame, GameTopic } from '../types/classroom';
import { normalizeVietnameseText } from './studentSession';

export type GameTopicFilter = 'all' | GameTopic;

export interface GameTopicMeta {
  id: GameTopicFilter;
  label: string;
  labelEn: string;
  badgeBg: string;
  badgeText: string;
}

export const GAME_TOPIC_META: Record<GameTopicFilter, GameTopicMeta> = {
  all: {
    id: 'all',
    label: 'Tất cả',
    labelEn: 'All',
    badgeBg: 'bg-[#e6f5ff]',
    badgeText: 'text-[#155a9c]',
  },
  toan: {
    id: 'toan',
    label: 'Toán học',
    labelEn: 'Math',
    badgeBg: 'bg-[#fff2d6]',
    badgeText: 'text-[#b45309]',
  },
  'tieng-viet': {
    id: 'tieng-viet',
    label: 'Tiếng Việt',
    labelEn: 'Vietnamese',
    badgeBg: 'bg-[#ffe6f0]',
    badgeText: 'text-[#be185d]',
  },
  'tieng-anh': {
    id: 'tieng-anh',
    label: 'Tiếng Anh',
    labelEn: 'English',
    badgeBg: 'bg-[#ede9fe]',
    badgeText: 'text-[#6d28d9]',
  },
  'kham-pha': {
    id: 'kham-pha',
    label: 'Khám phá',
    labelEn: 'Discovery',
    badgeBg: 'bg-[#dcfce7]',
    badgeText: 'text-[#15803d]',
  },
};

export const GAME_TOPIC_OPTIONS: GameTopic[] = [
  'toan',
  'tieng-viet',
  'tieng-anh',
  'kham-pha',
];

export function isValidGameTopic(value: unknown): value is GameTopic {
  return (
    value === 'toan' ||
    value === 'tieng-viet' ||
    value === 'tieng-anh' ||
    value === 'kham-pha'
  );
}

export function resolveGameTopic(
  game: Pick<CustomGame, 'topic' | 'title' | 'titleEn'>
): GameTopic {
  if (isValidGameTopic(game.topic)) {
    return game.topic;
  }

  const normalized = normalizeVietnameseText(
    `${game.title} ${game.titleEn ?? ''}`
  );

  if (
    /(?:\btoan\b|\bmath\b|bang nhan|bang chia|tinh nham|phep cong|phep tru|phep nhan|phep chia|hinh hoc|\d+\s*[+\-x*×:/÷])/.test(
      normalized
    )
  ) {
    return 'toan';
  }

  if (
    /(?:tieng viet|vietnamese|tap doc|chinh ta|luyen tu|bat chu|ke chuyen|ghep chu|tu vung tieng viet|cau van)/.test(
      normalized
    )
  ) {
    return 'tieng-viet';
  }

  if (
    /(?:tieng anh|\benglish\b|vocab|phonics|spelling|\babc\b|\bword\b)/.test(
      normalized
    )
  ) {
    return 'tieng-anh';
  }

  return 'kham-pha';
}

export function filterGames(
  games: CustomGame[],
  topicFilter: GameTopicFilter,
  searchQuery: string
): CustomGame[] {
  const normalizedQuery = normalizeVietnameseText(searchQuery);

  return games.filter((game) => {
    const resolvedTopic = resolveGameTopic(game);
    if (topicFilter !== 'all' && resolvedTopic !== topicFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const topicMeta = GAME_TOPIC_META[resolvedTopic];
    const searchable = normalizeVietnameseText(
      `${game.title} ${game.titleEn ?? ''} ${topicMeta.label} ${topicMeta.labelEn}`
    );
    return searchable.includes(normalizedQuery);
  });
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

export type GameLaunchMode =
  | { kind: 'runtime'; playUrl: string; fallbackHtml?: string }
  | { kind: 'html'; htmlContent: string }
  | { kind: 'url'; url: string }
  | {
      kind: 'error';
      reason: 'unbuilt-source' | 'archive-not-runnable';
      message: string;
      fileName?: string;
      fileSizeLabel?: string;
    };

export function getGameLaunchMode(game: CustomGame): GameLaunchMode {
  const validFallbackHtml =
    game.htmlContent &&
    game.htmlContent.trim().length > 0 &&
    !isUnbuiltViteHtml(game.htmlContent)
      ? game.htmlContent
      : undefined;

  if (game.playUrl && game.playUrl.trim().length > 0) {
    return {
      kind: 'runtime',
      playUrl: game.playUrl.trim(),
      fallbackHtml: validFallbackHtml,
    };
  }

  if (game.url && game.url.trim().length > 0) {
    return { kind: 'url', url: game.url.trim() };
  }

  if (game.htmlContent && game.htmlContent.trim().length > 0) {
    if (isUnbuiltViteHtml(game.htmlContent)) {
      return {
        kind: 'error',
        reason: 'unbuilt-source',
        message:
          'Trò chơi này đang lưu mã nguồn React/Vite chưa được build (file index.html gọi trực tiếp /src/main.tsx). Cô Tú hãy bấm "Cập nhật file ZIP" và chọn lại tệp ZIP để hệ thống tự động giải nén và build bản chạy nhé!',
        fileName: game.fileName,
        fileSizeLabel: game.fileSizeLabel,
      };
    }
    return { kind: 'html', htmlContent: game.htmlContent };
  }

  return {
    kind: 'error',
    reason: 'archive-not-runnable',
    message:
      'Gói trò chơi này chưa có tệp khởi chạy HTML5 hợp lệ trên máy chủ. Hãy tải lên file ZIP chứa trò chơi HTML5 (index.html) hoặc mã nguồn React/Vite hoàn chỉnh.',
    fileName: game.fileName,
    fileSizeLabel: game.fileSizeLabel,
  };
}
