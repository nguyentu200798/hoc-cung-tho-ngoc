export type RouteTab = 'home' | 'study' | 'practice' | 'games' | 'play' | 'activities' | 'teacher';

export type SubjectId =
  | 'toan'
  | 'tieng-viet'
  | 'tieng-anh'
  | 'cong-nghe'
  | 'tin-hoc'
  | 'tnxh'
  | 'dao-duc'
  | 'mi-thuat'
  | 'am-nhac'
  | 'the-duc'
  | 'hdtn';

export type LessonAttachmentKind = 'image' | 'pdf' | 'docx' | 'doc';

export interface LessonAttachment {
  id: string;
  name: string;
  kind: LessonAttachmentKind;
  mimeType: string;
  sizeLabel: string;
  url: string;
}

export interface SubjectLesson {
  id: string;
  subjectId?: SubjectId;
  isCustom?: boolean;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  keyPoints: string[];
  flashcards: Array<{ front: string; back: string }>;
  attachments?: LessonAttachment[];
}

export interface SubjectItem {
  id: SubjectId;
  name: string;
  englishLabel: string;
  subtitle: string;
  subtitleEn: string;
  stickerImage?: string;
  accentFrom: string;
  accentTo: string;
  lessons: SubjectLesson[];
}

export type PracticeTopic = 'mul-6-9' | 'div-6-9' | 'add-sub-1000' | 'mixed';

export interface PracticeQuestion {
  id: string;
  prompt: string;
  hint: string;
  options: number[];
  correctAnswer: number;
  topic: PracticeTopic;
}

export interface QuizResult {
  id: string;
  studentName: string;
  teamId: number;
  topic: PracticeTopic;
  topicLabel: string;
  correctCount: number;
  totalCount: number;
  starsEarned: number;
  completedAt: string;
}

export interface LeaderboardEntry {
  studentName: string;
  teamId: number;
  totalCorrect: number;
  totalAnswered: number;
  attempts: number;
  bestAccuracy: number;
}

export interface StudentRecord {
  id: string;
  name: string;
  teamId?: 1 | 2 | 3 | 4;
  bonusStars: number;
}

export interface StudentAchievement {
  id: string;
  studentName: string;
  achievement: string;
  achievementEn: string;
  dateLabel: string;
}

export interface WeeklyHonor {
  id: string;
  studentName: string;
  weekLabel: string;
  note: string;
  rankOrder: number;
}

export interface TeamScore {
  teamId: 1 | 2 | 3 | 4;
  name: string;
  nameEn: string;
  points: number;
}

export interface WeeklyTask {
  id: string;
  title: string;
  titleEn: string;
  completed: boolean;
}

export interface ActivityMemory {
  id: string;
  isCustom?: boolean;
  title: string;
  titleEn: string;
  dateLabel: string;
  imageUrl: string;
  caption: string;
  captionEn: string;
}

export type GameTopic = 'toan' | 'tieng-viet' | 'tieng-anh' | 'kham-pha';

export interface CustomGame {
  id: string;
  title: string;
  titleEn?: string;
  topic?: GameTopic;
  imageUrl?: string;
  sourceType: 'url' | 'zip' | 'html' | 'archive';
  url?: string;
  playUrl?: string;
  entryFile?: string;
  runtimeStatus?: 'ready' | 'vite-built' | 'unbuilt-source' | 'error';
  fileName?: string;
  fileSizeLabel?: string;
  htmlContent?: string;
  archiveDownloadUrl?: string;
  createdAt: string;
}

export interface SiteConfig {
  classTitle: string;
  classSubtitle: string;
  heroHeadline: string;
  heroHeadlineEn: string;
  announcement: string;
  announcementEn: string;
  footerCredit: string;
}

