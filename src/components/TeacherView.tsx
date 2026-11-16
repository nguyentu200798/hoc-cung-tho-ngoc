import type { User } from 'firebase/auth';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Gamepad2,
  Globe,
  Image as ImageIcon,
  Link2,
  Lock,
  LogOut,
  Minus,
  Paperclip,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ASSETS, SUBJECTS_DATA } from '../data/classroomSeed';
import { TEACHER_ALLOWED_EMAIL } from '../lib/firebase';
import type {
  ActivityMemory,
  CustomGame,
  GameTopic,
  LessonAttachment,
  QuizResult,
  RouteTab,
  SiteConfig,
  StudentAchievement,
  StudentRecord,
  SubjectId,
  SubjectLesson,
  TeamScore,
  WeeklyHonor,
  WeeklyTask,
} from '../types/classroom';
import { processUploadedGameFile } from '../utils/gameArchive';
import {
  applyGameMetadataEdits,
  GAME_TOPIC_META,
  GAME_TOPIC_OPTIONS,
  normalizeGameUrl,
  resolveGameTopic,
} from '../utils/gameCatalog';
import { compressImageFileToDataUrl } from '../utils/imageCompress';
import {
  getAttachmentKindLabel,
  uploadLessonAttachmentFile,
} from '../utils/lessonAttachments';
import { parseStudentRosterText } from '../utils/rosterParser';

type TeacherTab = 'activities' | 'subjects' | 'games' | 'page';

interface TeacherViewProps {
  authReady: boolean;
  teacherUser: User | null;
  isAuthorized: boolean;
  authError: string;
  onGoogleLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  siteConfig: SiteConfig;
  onSaveSiteConfig: (cfg: SiteConfig) => Promise<void>;
  students: StudentRecord[];
  studentAchievements: StudentAchievement[];
  weeklyHonors: WeeklyHonor[];
  teams: TeamScore[];
  quizResults: QuizResult[];
  tasks: WeeklyTask[];
  activities: ActivityMemory[];
  customLessons: SubjectLesson[];
  games: CustomGame[];
  onAdjustTeamPoints: (teamId: 1 | 2 | 3 | 4, delta: number) => Promise<void> | void;
  onAddStudent: (name: string) => Promise<void> | void;
  onAddStudentsBatch: (names: string[]) => Promise<number>;
  onRemoveStudent: (id: string) => Promise<void> | void;
  onClearStudents: () => Promise<void> | void;
  onAddStudentAchievement: (entry: Omit<StudentAchievement, 'id'>) => Promise<void>;
  onRemoveStudentAchievement: (id: string) => Promise<void>;
  onPublishWeeklyHonors: (
    studentNames: string[],
    weekLabel: string,
    note: string,
    replaceExisting?: boolean
  ) => Promise<void>;
  onRemoveWeeklyHonor: (id: string) => Promise<void>;
  onClearWeeklyHonors: () => Promise<void>;
  onAddTask: (title: string, titleEn?: string) => Promise<void> | void;
  onToggleTask: (id: string) => Promise<void> | void;
  onRemoveTask: (id: string) => Promise<void> | void;
  onAddActivity: (activity: Omit<ActivityMemory, 'id' | 'isCustom'>) => Promise<void>;
  onRemoveActivity: (id: string) => Promise<void>;
  onAddSubjectLesson: (
    lesson: Omit<SubjectLesson, 'id' | 'isCustom'> & { subjectId: SubjectId }
  ) => Promise<void>;
  onRemoveSubjectLesson: (id: string) => Promise<void>;
  onAddGame: (game: CustomGame) => Promise<void> | void;
  onUpdateGame: (game: CustomGame) => Promise<void> | void;
  onRemoveGame: (id: string) => Promise<void> | void;
  onClearResults: () => Promise<void> | void;
  onNavigate: (route: RouteTab) => void;
}

export function TeacherView({
  authReady,
  teacherUser,
  isAuthorized,
  authError,
  onGoogleLogin,
  onLogout,
  siteConfig,
  onSaveSiteConfig,
  students,
  studentAchievements,
  weeklyHonors,
  teams,
  quizResults,
  tasks,
  activities,
  customLessons,
  games,
  onAdjustTeamPoints,
  onAddStudent,
  onAddStudentsBatch,
  onRemoveStudent,
  onClearStudents,
  onAddStudentAchievement,
  onRemoveStudentAchievement,
  onPublishWeeklyHonors,
  onRemoveWeeklyHonor,
  onClearWeeklyHonors,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onAddActivity,
  onRemoveActivity,
  onAddSubjectLesson,
  onRemoveSubjectLesson,
  onAddGame,
  onUpdateGame,
  onRemoveGame,
  onClearResults,
  onNavigate,
}: TeacherViewProps) {
  const [activeTab, setActiveTab] = useState<TeacherTab>('activities');
  const [statusMessage, setStatusMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Whole-class Roster states (Upload file OR Copy-paste into textarea OR quick single add)
  const [bulkRosterText, setBulkRosterText] = useState('');
  const [quickStudentName, setQuickStudentName] = useState('');
  const [isImportingRoster, setIsImportingRoster] = useState(false);

  // Student Personal Achievement states
  const [achStudentName, setAchStudentName] = useState('');
  const [achTitle, setAchTitle] = useState('');
  const [achTitleEn, setAchTitleEn] = useState('');
  const [achDate, setAchDate] = useState(() => new Date().toLocaleDateString('vi-VN'));
  const [isPublishingAch, setIsPublishingAch] = useState(false);

  // Weekly Honor Board states (Multi-select honored students)
  const [honorWeekLabel, setHonorWeekLabel] = useState('Tuần này');
  const [honorNote, setHonorNote] = useState('');
  const [selectedHonorNames, setSelectedHonorNames] = useState<string[]>([]);
  const [manualHonorNames, setManualHonorNames] = useState('');
  const [isPublishingHonors, setIsPublishingHonors] = useState(false);

  // Task states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTitleEn, setNewTaskTitleEn] = useState('');

  // Activity photo post states
  const [actTitle, setActTitle] = useState('');
  const [actTitleEn, setActTitleEn] = useState('');
  const [actDateLabel, setActDateLabel] = useState('');
  const [actImageUrl, setActImageUrl] = useState('');
  const [actCaption, setActCaption] = useState('');
  const [actCaptionEn, setActCaptionEn] = useState('');
  const [isPublishingActivity, setIsPublishingActivity] = useState(false);

  // Subject lesson publisher states
  const [lessonSubjectId, setLessonSubjectId] = useState<SubjectId>('toan');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonTitleEn, setLessonTitleEn] = useState('');
  const [lessonSummary, setLessonSummary] = useState('');
  const [lessonSummaryEn, setLessonSummaryEn] = useState('');
  const [lessonPointsRaw, setLessonPointsRaw] = useState('');
  const [lessonFlashcardsRaw, setLessonFlashcardsRaw] = useState('');
  const [lessonAttachments, setLessonAttachments] = useState<LessonAttachment[]>([]);
  const [isUploadingLessonFile, setIsUploadingLessonFile] = useState(false);
  const [isPublishingLesson, setIsPublishingLesson] = useState(false);

  // Game manager states
  const [gameMode, setGameMode] = useState<'file' | 'link'>('file');
  const [gameTitle, setGameTitle] = useState('');
  const [gameTitleEn, setGameTitleEn] = useState('');
  const [gameTopic, setGameTopic] = useState<GameTopic>('toan');
  const [gameImageUrl, setGameImageUrl] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);

  // Edit existing game modal states
  const [editingGame, setEditingGame] = useState<CustomGame | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editTopic, setEditTopic] = useState<GameTopic>('toan');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editSourceMode, setEditSourceMode] = useState<'file' | 'link'>('file');
  const [editUrl, setEditUrl] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editError, setEditError] = useState('');
  const [isSavingEditGame, setIsSavingEditGame] = useState(false);

  // Page management states
  const [cfgDraft, setCfgDraft] = useState<SiteConfig>(siteConfig);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    setCfgDraft(siteConfig);
  }, [siteConfig]);

  const parsedBulkNames = useMemo(
    () =>
      parseStudentRosterText(
        bulkRosterText,
        students.map((s) => s.name)
      ),
    [bulkRosterText, students]
  );

  const showToast = (msg: string) => {
    setActionError('');
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((curr) => (curr === msg ? '' : curr));
    }, 4500);
  };

  const handleSignInClick = async () => {
    setIsSigningIn(true);
    try {
      await onGoogleLogin();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsSigningIn(true);
    try {
      await onLogout();
      await onGoogleLogin();
    } finally {
      setIsSigningIn(false);
    }
  };

  // Auth Gate UI
  if (!authReady) {
    return (
      <div className="mx-auto max-w-[820px] px-5 pt-12 pb-16 text-center md:px-8">
        <div className="glass-panel rounded-[2rem] p-10">
          <p className="font-display text-xl font-extrabold text-[#4f1d4b]">
            Đang kiểm tra trạng thái đăng nhập giáo viên...
          </p>
          <p className="mt-1 text-xs font-semibold text-[#6b4869]">
            Checking teacher authentication status...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    const isWrongAccount = Boolean(teacherUser && !isAuthorized);

    return (
      <div className="mx-auto max-w-[920px] px-5 pt-10 pb-16 md:px-8">
        <section className="glass-panel rounded-[2rem] p-8 md:p-10">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <img
              src={ASSETS.btnKeHoach}
              alt="Kế hoạch & Sự kiện - Plans & Events"
              referrerPolicy="no-referrer"
              className="sticker-shadow h-20 w-auto object-contain"
            />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-[#7d26c9]">
                <Lock className="h-3.5 w-3.5" />
                <span>Xác thực Gmail Giáo Viên / Teacher Gmail Auth</span>
              </span>
              <h1 className="font-display mt-2 text-3xl font-extrabold text-[#4f1d4b]">
                Đăng nhập giáo viên
              </h1>
              <p className="text-sm font-extrabold text-[#7d26c9]">
                Teacher Portal · Ms. Tu (Class 3.17)
              </p>
            </div>
          </div>

          <p className="mt-5 text-base font-bold text-[#4f1d4b]">
            Chỉ tài khoản Gmail{' '}
            <span className="rounded-lg bg-white/90 px-2 py-0.5 font-black text-[#7d26c9] ring-1 ring-purple-200">
              {TEACHER_ALLOWED_EMAIL}
            </span>{' '}
            mới được phép đăng nhập để thêm danh sách học sinh cả lớp, nhập thành tích, bảng xếp hạng tuần, đăng hoạt động lớp, bài học và trò chơi.
          </p>
          <p className="mt-1 text-xs font-semibold text-[#6b4869]">
            Access is strictly restricted to the verified Google account ({TEACHER_ALLOWED_EMAIL}) to manage class roster, achievements, weekly honors, activities, lessons, and games.
          </p>

          {isWrongAccount && teacherUser && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="text-sm font-extrabold">
                  Tài khoản {teacherUser.email} không có quyền truy cập khu vực Giáo viên!
                </p>
                <p className="mt-0.5 text-xs font-semibold text-rose-700">
                  Access denied for {teacherUser.email}. Please sign in with {TEACHER_ALLOWED_EMAIL}.
                </p>
              </div>
            </div>
          )}

          {authError && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-bold text-rose-800"
            >
              {authError}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isWrongAccount ? (
              <>
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={handleSwitchAccount}
                  className="btn-violet rounded-2xl px-7 py-3 text-center leading-tight transition-all disabled:opacity-60"
                >
                  <span className="block text-sm font-extrabold">
                    {isSigningIn ? 'Đang mở Google...' : 'Đổi sang Gmail cô Tú →'}
                  </span>
                  <span className="block text-[11px] font-bold opacity-90">
                    Switch Google Account
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="rounded-2xl bg-white/85 px-5 py-3 text-sm font-bold text-[#5b2358] hover:bg-white"
                >
                  Đăng xuất / Sign Out
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleSignInClick}
                className="btn-violet rounded-2xl px-7 py-3 text-center leading-tight transition-all disabled:opacity-60"
              >
                <span className="block text-sm font-extrabold">
                  {isSigningIn ? 'Đang xác thực Google...' : 'Đăng nhập bằng Gmail cô Tú →'}
                </span>
                <span className="block text-[11px] font-bold opacity-90">
                  Sign in with Google ({TEACHER_ALLOWED_EMAIL})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="rounded-2xl bg-white/80 px-5 py-3 text-sm font-bold text-[#5b2358] hover:bg-white"
            >
              Về trang chủ / Homepage
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Whole-Class Roster Handlers
  const handleRosterFileUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const content = await file.text();
      setBulkRosterText(content);
      const count = parseStudentRosterText(
        content,
        students.map((s) => s.name)
      ).length;
      if (count === 0) {
        setActionError('Không tìm thấy tên học sinh mới trong tệp vừa tải lên.');
      } else {
        showToast(`Đã đọc ${count} học sinh từ tệp "${file.name}". Nhấn "Thêm danh sách cả lớp" để lưu!`);
      }
    } catch {
      setActionError('Không thể đọc tệp danh sách. Vui lòng chọn tệp .txt hoặc .csv UTF-8.');
    }
  };

  const handleBulkRosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBulkNames.length === 0) {
      setActionError('Vui lòng dán danh sách hoặc tải file danh sách học sinh hợp lệ.');
      return;
    }
    setIsImportingRoster(true);
    try {
      const count = await onAddStudentsBatch(parsedBulkNames);
      setBulkRosterText('');
      showToast(`Đã thêm ${count} học sinh vào Danh sách cả lớp 3.17!`);
    } catch {
      setActionError('Không thể lưu danh sách học sinh. Vui lòng thử lại.');
    } finally {
      setIsImportingRoster(false);
    }
  };

  const handleQuickAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = quickStudentName.trim();
    if (!cleaned) return;
    try {
      await onAddStudent(cleaned);
      setQuickStudentName('');
      showToast(`Đã thêm học sinh ${cleaned} vào lớp 3.17!`);
    } catch {
      setActionError('Không thể thêm học sinh.');
    }
  };

  // Achievement Handler
  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achStudentName.trim() || !achTitle.trim() || !achDate.trim()) {
      setActionError('Vui lòng nhập đầy đủ Họ tên học sinh, Thành tích đạt được và Ngày tháng.');
      return;
    }
    setIsPublishingAch(true);
    try {
      await onAddStudentAchievement({
        studentName: achStudentName.trim(),
        achievement: achTitle.trim(),
        achievementEn: achTitleEn.trim(),
        dateLabel: achDate.trim(),
      });
      setAchStudentName('');
      setAchTitle('');
      setAchTitleEn('');
      showToast('Đã thêm thành tích cá nhân lên trang Hoạt động lớp!');
    } catch {
      setActionError('Không thể lưu thành tích học sinh.');
    } finally {
      setIsPublishingAch(false);
    }
  };

  // Weekly Honor Board Handlers
  const toggleHonorStudent = (name: string) => {
    setSelectedHonorNames((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handlePublishWeeklyHonors = async (e: React.FormEvent) => {
    e.preventDefault();
    const extraManual = parseStudentRosterText(manualHonorNames, selectedHonorNames);
    const finalNames = [...selectedHonorNames, ...extraManual];
    if (finalNames.length === 0) {
      setActionError('Vui lòng chọn hoặc nhập ít nhất 1 học sinh được tuyên dương trong tuần.');
      return;
    }
    setIsPublishingHonors(true);
    try {
      await onPublishWeeklyHonors(
        finalNames,
        honorWeekLabel.trim() || 'Tuần học 3.17',
        honorNote.trim() || 'Tuyên dương tuần',
        true
      );
      setSelectedHonorNames([]);
      setManualHonorNames('');
      showToast(`Đã đăng ${finalNames.length} học sinh lên Bảng xếp hạng trong tuần!`);
    } catch {
      setActionError('Không thể lưu Bảng xếp hạng trong tuần.');
    } finally {
      setIsPublishingHonors(false);
    }
  };

  // Task Handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await onAddTask(newTaskTitle.trim(), newTaskTitleEn.trim() || 'Daily class task');
      setNewTaskTitle('');
      setNewTaskTitleEn('');
      showToast('Đã đăng việc cần làm mới lên Hoạt động lớp!');
    } catch {
      setActionError('Không thể lưu việc cần làm.');
    }
  };

  // Activity Photo Post Handlers
  const handleActivityImageUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setActImageUrl(compressed);
      setActionError('');
    } catch {
      setActionError('Không thể đọc ảnh vừa chọn. Hãy thử ảnh JPG hoặc PNG khác.');
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim() || !actImageUrl.trim() || !actCaption.trim()) {
      setActionError('Vui lòng nhập tiêu đề, hình ảnh và mô tả hoạt động lớp.');
      return;
    }
    setIsPublishingActivity(true);
    try {
      await onAddActivity({
        title: actTitle.trim(),
        titleEn: actTitleEn.trim() || 'Class 3.17 Activity',
        dateLabel: actDateLabel.trim() || 'Lớp 3.17',
        imageUrl: actImageUrl.trim(),
        caption: actCaption.trim(),
        captionEn: actCaptionEn.trim() || '',
      });
      setActTitle('');
      setActTitleEn('');
      setActDateLabel('');
      setActImageUrl('');
      setActCaption('');
      setActCaptionEn('');
      showToast('Đã đăng tin & hình ảnh lên mục Hoạt động lớp!');
    } catch {
      setActionError('Không thể đăng hoạt động lớp. Kiểm tra dung lượng ảnh hoặc kết nối.');
    } finally {
      setIsPublishingActivity(false);
    }
  };

  // Subject Lesson Attachment Upload Handler
  const handleLessonFilesUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (lessonAttachments.length + files.length > 8) {
      setActionError('Mỗi bài học đính kèm tối đa 8 tệp ảnh hoặc tài liệu.');
      return;
    }

    setActionError('');
    setIsUploadingLessonFile(true);
    try {
      const uploaded: LessonAttachment[] = [];
      for (const file of files) {
        const result = await uploadLessonAttachmentFile(file);
        uploaded.push(result);
      }
      setLessonAttachments((prev) => [...prev, ...uploaded].slice(0, 8));
      showToast(`Đã tải lên ${uploaded.length} tệp đính kèm cho bài học!`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Không thể tải tệp đính kèm lên máy chủ.'
      );
    } finally {
      setIsUploadingLessonFile(false);
    }
  };

  const handleRemoveLessonAttachment = (attId: string) => {
    setLessonAttachments((prev) => prev.filter((item) => item.id !== attId));
  };

  // Subject Lesson Handler
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || (!lessonSummary.trim() && lessonAttachments.length === 0)) {
      setActionError('Vui lòng nhập tên bài học và tóm tắt nội dung (hoặc đính kèm tệp tài liệu).');
      return;
    }
    setIsPublishingLesson(true);
    try {
      const keyPoints = lessonPointsRaw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 10);

      const flashcards = lessonFlashcardsRaw
        .split('\n')
        .map((line) => {
          const [front, back] = line.split('|').map((part) => part.trim());
          return front && back ? { front, back } : null;
        })
        .filter((item): item is { front: string; back: string } => item !== null)
        .slice(0, 12);

      const finalSummary =
        lessonSummary.trim() ||
        `Tài liệu bài học đính kèm (${lessonAttachments.map((a) => a.name).join(', ')})`;

      await onAddSubjectLesson({
        subjectId: lessonSubjectId,
        title: lessonTitle.trim(),
        titleEn: lessonTitleEn.trim() || 'Teacher Lesson',
        summary: finalSummary.slice(0, 400),
        summaryEn: lessonSummaryEn.trim() || '',
        keyPoints,
        flashcards,
        attachments: lessonAttachments,
      });

      setLessonTitle('');
      setLessonTitleEn('');
      setLessonSummary('');
      setLessonSummaryEn('');
      setLessonPointsRaw('');
      setLessonFlashcardsRaw('');
      setLessonAttachments([]);
      showToast('Đã đăng bài học mới vào mục Bài học đã học!');
    } catch {
      setActionError('Không thể đăng bài học mới.');
    } finally {
      setIsPublishingLesson(false);
    }
  };

  // Game Add Handler
  const handleGameCoverUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, 720, 180000);
      setGameImageUrl(compressed);
      setActionError('');
    } catch {
      setActionError('Không thể đọc ảnh minh họa vừa chọn.');
    }
  };

  const handleAddGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    const cleanImage = gameImageUrl.trim() || undefined;
    if (gameMode === 'file') {
      if (!gameFile) {
        setActionError('Vui lòng chọn file nén (.zip) hoặc file .html!');
        return;
      }
      const title =
        gameTitle.trim() || gameFile.name.replace(/\.(zip|html?|rar|7z)$/i, '');
      const gameId = `cloud-game-${Date.now()}`;
      setIsAddingGame(true);
      try {
        const processed = await processUploadedGameFile(gameFile, gameId);
        await onAddGame({
          id: gameId,
          title,
          titleEn: gameTitleEn.trim() || undefined,
          topic: gameTopic,
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
        setGameTitle('');
        setGameTitleEn('');
        setGameImageUrl('');
        setGameFile(null);
        showToast(processed.buildNote ?? 'Đã thêm trò chơi mới vào Kho game!');
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Không thể xử lý tệp trò chơi.'
        );
      } finally {
        setIsAddingGame(false);
      }
    } else {
      if (!gameTitle.trim() || !gameUrl.trim()) {
        setActionError('Vui lòng nhập tên trò chơi và đường dẫn!');
        return;
      }
      let safeUrl = gameUrl.trim();
      if (!/^https?:\/\//i.test(safeUrl)) safeUrl = `https://${safeUrl}`;
      setIsAddingGame(true);
      try {
        await onAddGame({
          id: `cloud-game-${Date.now()}`,
          title: gameTitle.trim(),
          titleEn: gameTitleEn.trim() || undefined,
          topic: gameTopic,
          imageUrl: cleanImage,
          sourceType: 'url',
          url: safeUrl,
          createdAt: new Date().toISOString(),
        });
        setGameTitle('');
        setGameTitleEn('');
        setGameImageUrl('');
        setGameUrl('');
        showToast('Đã thêm đường dẫn trò chơi mới vào Kho game!');
      } catch {
        setActionError('Không thể lưu đường dẫn trò chơi.');
      } finally {
        setIsAddingGame(false);
      }
    }
  };

  // Edit Existing Game Handlers
  const openEditGameModal = (game: CustomGame) => {
    setEditingGame(game);
    setEditTitle(game.title);
    setEditTitleEn(game.titleEn ?? '');
    setEditTopic(resolveGameTopic(game));
    setEditImageUrl(game.imageUrl ?? '');
    setEditSourceMode(game.sourceType === 'url' ? 'link' : 'file');
    setEditUrl(game.url ?? '');
    setEditFile(null);
    setEditError('');
    setIsSavingEditGame(false);
  };

  const handleEditGameCoverUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, 720, 180000);
      setEditImageUrl(compressed);
      setEditError('');
    } catch {
      setEditError('Không thể đọc ảnh minh họa vừa chọn.');
    }
  };

  const handleSaveEditGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;
    setEditError('');

    if (!editTitle.trim()) {
      setEditError('Vui lòng nhập tên trò chơi (Tiếng Việt)!');
      return;
    }

    if (editSourceMode === 'link') {
      const safeUrl = normalizeGameUrl(editUrl);
      if (!safeUrl) {
        setEditError('Vui lòng nhập đường dẫn trò chơi hợp lệ!');
        return;
      }
      setIsSavingEditGame(true);
      try {
        const updated = applyGameMetadataEdits(
          {
            ...editingGame,
            sourceType: 'url',
            url: safeUrl,
            playUrl: undefined,
            entryFile: undefined,
            runtimeStatus: undefined,
            fileName: undefined,
            fileSizeLabel: undefined,
            htmlContent: undefined,
          },
          {
            title: editTitle,
            titleEn: editTitleEn,
            topic: editTopic,
            imageUrl: editImageUrl,
            url: safeUrl,
          }
        );
        await onUpdateGame(updated);
        setEditingGame(null);
        showToast(`Đã cập nhật thông tin trò chơi "${updated.title}"!`);
      } catch {
        setEditError('Không thể lưu thay đổi trò chơi. Vui lòng thử lại.');
      } finally {
        setIsSavingEditGame(false);
      }
      return;
    }

    if (editingGame.sourceType === 'url' && !editFile) {
      setEditError('Vui lòng chọn file .zip hoặc .html để thay thế đường dẫn hiện tại.');
      return;
    }

    setIsSavingEditGame(true);
    try {
      let updated: CustomGame;
      let toastText = `Đã cập nhật thông tin trò chơi "${editTitle.trim()}"!`;

      if (editFile) {
        const processed = await processUploadedGameFile(editFile, editingGame.id);
        updated = applyGameMetadataEdits(
          {
            ...editingGame,
            sourceType: processed.sourceType,
            fileName: processed.fileName,
            fileSizeLabel: processed.fileSizeLabel,
            playUrl: processed.playUrl,
            entryFile: processed.entryFile,
            runtimeStatus: processed.runtimeStatus,
            htmlContent: processed.htmlContent,
            url: undefined,
          },
          {
            title: editTitle,
            titleEn: editTitleEn,
            topic: editTopic,
            imageUrl: editImageUrl,
          }
        );
        if (processed.buildNote) {
          toastText = processed.buildNote;
        }
      } else {
        updated = applyGameMetadataEdits(editingGame, {
          title: editTitle,
          titleEn: editTitleEn,
          topic: editTopic,
          imageUrl: editImageUrl,
        });
      }

      await onUpdateGame(updated);
      setEditingGame(null);
      showToast(toastText);
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật tệp trò chơi vừa chọn.'
      );
    } finally {
      setIsSavingEditGame(false);
    }
  };

  // Page Config Handler
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await onSaveSiteConfig(cfgDraft);
      showToast('Đã lưu cấu hình & lời chào trang web!');
    } catch {
      setActionError('Không thể lưu cấu hình trang.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const customActivities = activities.filter((a) => a.isCustom);

  return (
    <div className="mx-auto max-w-[1160px] px-5 pt-7 pb-14 md:px-8">
      {/* Top Teacher Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-extrabold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Đã xác thực · {teacherUser?.email}</span>
          </span>
          <h1 className="font-display mt-1.5 text-3xl font-extrabold text-[#4f1d4b]">
            Góc Giáo Viên · Cô Tú (Lớp 3.17)
          </h1>
          <p className="text-xs font-extrabold text-[#7d26c9]">
            Teacher Dashboard · Roster, Achievements, Weekly Honors, Subjects &amp; Games
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-4 py-2 text-xs font-extrabold text-[#4f1d4b] shadow-xs hover:bg-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Đăng xuất / Sign Out</span>
        </button>
      </div>

      {/* Feedback banners */}
      {statusMessage && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-extrabold text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-bold text-rose-800"
        >
          {actionError}
        </div>
      )}

      {/* Teacher Management Tabs */}
      <div
        role="tablist"
        aria-label="Chức năng quản lý giáo viên / Teacher Management Sections"
        className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-4"
      >
        {[
          {
            id: 'activities' as TeacherTab,
            icon: Users,
            vi: 'Lớp, Thành tích & Tuần',
            en: 'Roster, Awards & Activities',
          },
          {
            id: 'subjects' as TeacherTab,
            icon: BookOpen,
            vi: 'Môn học & Bài học',
            en: 'Subjects & Lessons',
          },
          {
            id: 'games' as TeacherTab,
            icon: Gamepad2,
            vi: 'Thêm trò chơi',
            en: 'Game Zone Manager',
          },
          {
            id: 'page' as TeacherTab,
            icon: Globe,
            vi: 'Quản lý trang',
            en: 'Page Settings',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-left transition-all ${
                active
                  ? 'btn-violet shadow-md'
                  : 'glass-card text-[#4f1d4b] hover:bg-white/80'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="leading-tight">
                <span className="block text-xs font-extrabold">{tab.vi}</span>
                <span className="block text-[10px] font-bold opacity-85">{tab.en}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Danh sách cả lớp, Thành tích, Bảng xếp hạng tuần & Hoạt động lớp */}
      {activeTab === 'activities' && (
        <div className="mt-6 space-y-6">
          {/* 1. Whole-Class Roster Import (Upload file OR Copy/Paste into text box) */}
          <section className="glass-panel rounded-[1.75rem] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[#4f1d4b]">
                  <FileSpreadsheet className="h-5 w-5 text-[#7d26c9]" />
                  <span>Danh sách học sinh cả lớp · Class Roster ({students.length})</span>
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-[#6b4869]">
                  Tải lên file danh sách (.txt, .csv) hoặc sao chép (copy) tên cả lớp dán vào ô trống bên dưới để thêm hàng loạt.
                </p>
              </div>
              {students.length > 0 && (
                <button
                  type="button"
                  onClick={() => void onClearStudents()}
                  className="rounded-full bg-white/85 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                >
                  Xóa cả danh sách
                </button>
              )}
            </div>

            <form onSubmit={handleBulkRosterSubmit} className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-purple-100 px-4 py-2 text-xs font-extrabold text-[#4f1d4b] hover:bg-purple-200">
                  <Upload className="h-4 w-4" />
                  <span>Tải file danh sách (.txt, .csv)</span>
                  <input
                    type="file"
                    accept=".txt,.csv,text/plain,text/csv"
                    onChange={(e) => void handleRosterFileUpload(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>

                <span className="text-xs font-bold text-[#7d26c9]">
                  {parsedBulkNames.length > 0
                    ? `Sẵn sàng thêm ${parsedBulkNames.length} học sinh mới`
                    : 'Mỗi dòng 1 họ tên (hỗ trợ có số thứ tự 1, 2, 3...)'}
                </span>
              </div>

              <textarea
                rows={4}
                value={bulkRosterText}
                onChange={(e) => setBulkRosterText(e.target.value)}
                placeholder={
                  'Copy & dán danh sách học sinh cả lớp vào đây...\nVí dụ:\n1. Nguyễn Ngọc Minh Anh\n2. Trần Gia Bảo\n3. Lê Thảo Vy'
                }
                aria-label="Ô trống dán danh sách học sinh cả lớp"
                className="w-full rounded-2xl border border-purple-200 bg-white px-4 py-3 text-sm font-semibold text-[#4f1d4b] placeholder:text-purple-300"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={isImportingRoster || parsedBulkNames.length === 0}
                  className="btn-violet rounded-xl px-6 py-2.5 text-xs font-extrabold disabled:opacity-50"
                >
                  {isImportingRoster
                    ? 'Đang thêm danh sách...'
                    : `Thêm danh sách cả lớp (${parsedBulkNames.length})`}
                </button>

                <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                  <input
                    type="text"
                    value={quickStudentName}
                    onChange={(e) => setQuickStudentName(e.target.value)}
                    placeholder="Hoặc thêm nhanh 1 học sinh..."
                    aria-label="Thêm nhanh 1 học sinh"
                    className="min-w-[200px] rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#4f1d4b]"
                  />
                  <button
                    type="button"
                    onClick={(e) => void handleQuickAddStudent(e)}
                    className="inline-flex items-center gap-1 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-[#4f1d4b] shadow-xs hover:bg-purple-50"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Thêm 1 em</span>
                  </button>
                </div>
              </div>
            </form>

            {students.length > 0 && (
              <div className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-white/80 bg-white/55 p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {students.map((st, idx) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-[#4f1d4b]"
                    >
                      <span className="truncate">
                        {idx + 1}. {st.name}
                      </span>
                      <button
                        type="button"
                        aria-label={`Xóa ${st.name}`}
                        onClick={() => void onRemoveStudent(st.id)}
                        className="shrink-0 rounded-full bg-rose-50 p-1 text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 2. Personal Achievements Publisher (Họ tên, Thành tích, Ngày tháng) */}
            <section className="glass-panel rounded-[1.75rem] p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[#4f1d4b]">
                <Award className="h-5 w-5 text-amber-500" />
                <span>Thêm thành tích cá nhân / Student Achievement</span>
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-[#6b4869]">
                Mục Thành tích cá nhân ở Hoạt động lớp chỉ hiển thị khi cô Tú thêm tại đây.
              </p>

              <form onSubmit={handleCreateAchievement} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#4f1d4b]">
                    Họ và tên học sinh *
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      list="class-roster-datalist"
                      value={achStudentName}
                      onChange={(e) => setAchStudentName(e.target.value)}
                      placeholder="Nhập hoặc chọn tên học sinh..."
                      className="flex-1 rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                    />
                    {students.length > 0 && (
                      <select
                        aria-label="Chọn nhanh học sinh từ danh sách"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) setAchStudentName(e.target.value);
                        }}
                        className="max-w-[160px] rounded-xl border border-purple-200 bg-white px-2.5 py-2 text-xs font-bold text-[#4f1d4b]"
                      >
                        <option value="">Chọn từ lớp...</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <datalist id="class-roster-datalist">
                    {students.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#4f1d4b]">
                    Thành tích đạt được *
                  </label>
                  <input
                    type="text"
                    value={achTitle}
                    onChange={(e) => setAchTitle(e.target.value)}
                    placeholder="Ví dụ: Giải Nhất Viết chữ đẹp cấp trường"
                    className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-extrabold text-[#4f1d4b]">
                      Ngày tháng *
                    </label>
                    <input
                      type="text"
                      value={achDate}
                      onChange={(e) => setAchDate(e.target.value)}
                      placeholder="14/11/2026"
                      className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-[#4f1d4b]">
                      English Note (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={achTitleEn}
                      onChange={(e) => setAchTitleEn(e.target.value)}
                      placeholder="1st Prize Handwriting Contest"
                      className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPublishingAch}
                  className="btn-violet rounded-xl px-5 py-2.5 text-xs font-extrabold disabled:opacity-60"
                >
                  {isPublishingAch ? 'Đang lưu...' : 'Thêm thành tích học sinh'}
                </button>
              </form>

              {studentAchievements.length > 0 && (
                <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {studentAchievements.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-white/80 px-3.5 py-2.5 text-xs font-bold text-[#4f1d4b]"
                    >
                      <div>
                        <p className="text-sm font-extrabold">
                          🏅 {item.studentName}{' '}
                          <span className="font-semibold text-[#7d26c9]">({item.dateLabel})</span>
                        </p>
                        <p className="text-[#6b4869]">{item.achievement}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Xóa thành tích của ${item.studentName}`}
                        onClick={() => void onRemoveStudentAchievement(item.id)}
                        className="rounded-full bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 3. Weekly Honor Leaderboard Selector */}
            <section className="glass-panel rounded-[1.75rem] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[#4f1d4b]">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>Bảng xếp hạng trong tuần · Weekly Honors</span>
                </h2>
                {weeklyHonors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void onClearWeeklyHonors()}
                    className="rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
                  >
                    Xóa bảng tuần
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-[#6b4869]">
                Chọn tên các học sinh được tuyên dương trong tuần để hiển thị lên Bảng xếp hạng.
              </p>

              <form onSubmit={handlePublishWeeklyHonors} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-extrabold text-[#4f1d4b]">
                      Tên tuần *
                    </label>
                    <input
                      type="text"
                      value={honorWeekLabel}
                      onChange={(e) => setHonorWeekLabel(e.target.value)}
                      placeholder="Ví dụ: Tuần 11 (11/11 - 15/11)"
                      className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-[#4f1d4b]">
                      Lời khen / Lý do tuyên dương
                    </label>
                    <input
                      type="text"
                      value={honorNote}
                      onChange={(e) => setHonorNote(e.target.value)}
                      placeholder="Ví dụ: Chăm ngoan, tích cực phát biểu"
                      className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                    />
                  </div>
                </div>

                {students.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between text-xs font-extrabold text-[#4f1d4b]">
                      <span>
                        Chọn học sinh từ danh sách lớp ({selectedHonorNames.length} đã chọn):
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedHonorNames(
                            selectedHonorNames.length === students.length
                              ? []
                              : students.map((s) => s.name)
                          )
                        }
                        className="text-[#7d26c9] hover:underline"
                      >
                        {selectedHonorNames.length === students.length
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả'}
                      </button>
                    </div>
                    <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-2xl border border-purple-100 bg-white/70 p-3">
                      {students.map((st) => {
                        const checked = selectedHonorNames.includes(st.name);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => toggleHonorStudent(st.name)}
                            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                              checked
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white text-[#4f1d4b] hover:bg-purple-50'
                            }`}
                          >
                            {checked ? '✓ ' : '+ '}
                            {st.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl bg-amber-50/85 px-3.5 py-2 text-xs font-bold text-amber-800">
                    Chưa có danh sách lớp ở trên — Cô Tú có thể tải danh sách lớp hoặc nhập tên học sinh được tuyên dương ở ô dưới.
                  </p>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-[#4f1d4b]">
                    Nhập thêm tên học sinh tuyên dương (mỗi dòng hoặc cách dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={manualHonorNames}
                    onChange={(e) => setManualHonorNames(e.target.value)}
                    placeholder="Ví dụ: Lê Thảo Vy, Nguyễn Ngọc Minh Anh"
                    className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#4f1d4b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPublishingHonors}
                  className="btn-violet rounded-xl px-5 py-2.5 text-xs font-extrabold disabled:opacity-60"
                >
                  {isPublishingHonors
                    ? 'Đang đăng bảng xếp hạng...'
                    : 'Hiển thị lên Bảng xếp hạng tuần'}
                </button>
              </form>

              {weeklyHonors.length > 0 && (
                <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
                  {weeklyHonors.map((h, idx) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-white/80 px-3.5 py-2 text-xs font-bold text-[#4f1d4b]"
                    >
                      <span>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐'}{' '}
                        {h.studentName}{' '}
                        <span className="font-semibold text-[#7d26c9]">({h.weekLabel})</span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Xóa ${h.studentName} khỏi bảng xếp hạng`}
                        onClick={() => void onRemoveWeeklyHonor(h.id)}
                        className="rounded-full bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* 4. Post Class Activity & Photo */}
          <section className="glass-panel rounded-[1.75rem] p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[#4f1d4b]">
              <Camera className="h-5 w-5 text-[#7d26c9]" />
              <span>Đăng thông tin &amp; hình ảnh Hoạt động lớp / Post Class Activity</span>
            </h2>
            <form onSubmit={handleCreateActivity} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Tiêu đề hoạt động (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  placeholder="Ví dụ: Tiết học STEM làm đèn lồng"
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  English Title
                </label>
                <input
                  type="text"
                  value={actTitleEn}
                  onChange={(e) => setActTitleEn(e.target.value)}
                  placeholder="e.g. STEM Lantern Making Lesson"
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Ngày / Địa điểm · Date &amp; Place
                </label>
                <input
                  type="text"
                  value={actDateLabel}
                  onChange={(e) => setActDateLabel(e.target.value)}
                  placeholder="Ví dụ: 15/11 · Phòng học 3.17"
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Tải ảnh từ máy hoặc dán Link ảnh *
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={actImageUrl}
                    onChange={(e) => setActImageUrl(e.target.value)}
                    placeholder="Dán link ảnh hoặc chọn file bên cạnh..."
                    className="flex-1 rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-purple-100 px-3.5 py-2 text-xs font-extrabold text-[#4f1d4b] hover:bg-purple-200">
                    <Upload className="h-4 w-4" />
                    <span>Chọn ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleActivityImageUpload(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Mô tả hoạt động (Tiếng Việt) *
                </label>
                <textarea
                  rows={2}
                  value={actCaption}
                  onChange={(e) => setActCaption(e.target.value)}
                  placeholder="Các bạn nhỏ lớp 3.17 cùng nhau thực hành..."
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  English Caption
                </label>
                <textarea
                  rows={2}
                  value={actCaptionEn}
                  onChange={(e) => setActCaptionEn(e.target.value)}
                  placeholder="Class 3.17 students worked together happily..."
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={isPublishingActivity}
                  className="btn-violet rounded-xl px-6 py-2.5 text-xs font-extrabold disabled:opacity-60"
                >
                  {isPublishingActivity ? 'Đang đăng...' : 'Đăng lên Hoạt động lớp / Publish Activity'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('activities')}
                  className="text-xs font-extrabold text-[#7d26c9] hover:underline"
                >
                  Xem trang Hoạt động lớp →
                </button>
              </div>
            </form>

            {customActivities.length > 0 && (
              <div className="mt-5 border-t border-purple-100 pt-4">
                <p className="text-xs font-extrabold text-[#6b4869]">
                  Các bài hoạt động cô Tú đã đăng ({customActivities.length}):
                </p>
                <ul className="mt-2 space-y-2">
                  {customActivities.map((act) => (
                    <li
                      key={act.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-bold text-[#4f1d4b]"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={act.imageUrl}
                          alt={act.title}
                          className="h-10 w-14 rounded-lg object-cover"
                        />
                        <div>
                          <p>{act.title}</p>
                          <p className="text-[11px] font-semibold text-[#7d4e78]">{act.dateLabel}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void onRemoveActivity(act.id)}
                        aria-label={`Xóa bài ${act.title}`}
                        className="rounded-full bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 5. Team Score Management & Daily Tasks */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="glass-panel rounded-[1.75rem] p-6">
              <h2 className="font-display text-xl font-extrabold text-[#4f1d4b]">
                ⭐ Điều chỉnh điểm thi đua tổ / nhóm · Team Points
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {teams.map((t) => (
                  <div key={t.teamId} className="glass-card rounded-2xl p-4 text-center">
                    <p className="text-xs font-extrabold text-[#4f1d4b]">
                      {t.name} · {t.nameEn}
                    </p>
                    <p className="font-display my-1 text-2xl font-extrabold text-[#4f1d4b] tabular-nums">
                      {t.points} điểm
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        aria-label={`Trừ 5 điểm ${t.name}`}
                        onClick={() => void onAdjustTeamPoints(t.teamId, -5)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#4f1d4b] shadow-xs hover:bg-rose-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Cộng 5 điểm ${t.name}`}
                        onClick={() => void onAdjustTeamPoints(t.teamId, 5)}
                        className="btn-violet flex h-8 items-center gap-1 rounded-full px-3 text-xs font-extrabold"
                      >
                        <Plus className="h-3 w-3" />5
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Daily / Weekly Tasks Management */}
            <section className="glass-panel rounded-[1.75rem] p-6">
              <h2 className="font-display text-xl font-extrabold text-[#4f1d4b]">
                🌷 Kế hoạch &amp; Sự kiện · Plans &amp; Tasks
              </h2>
              <form onSubmit={handleCreateTask} className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Việc cần làm / Sự kiện (Tiếng Việt)..."
                    aria-label="Thêm nhiệm vụ mới"
                    className="flex-1 rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                  />
                  <button
                    type="submit"
                    className="btn-violet rounded-xl px-4 py-2 text-xs font-extrabold whitespace-nowrap"
                  >
                    Thêm việc
                  </button>
                </div>
                <input
                  type="text"
                  value={newTaskTitleEn}
                  onChange={(e) => setNewTaskTitleEn(e.target.value)}
                  placeholder="English task label (optional)..."
                  className="w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#4f1d4b]"
                />
              </form>

              <ul className="mt-4 space-y-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-white/75 px-4 py-2.5 text-sm font-bold text-[#4f1d4b]"
                  >
                    <button
                      type="button"
                      onClick={() => void onToggleTask(task.id)}
                      className={`text-left ${task.completed ? 'line-through opacity-60' : ''}`}
                    >
                      <span className="block">{task.title}</span>
                      <span className="block text-[11px] font-semibold text-[#7d4e78]">
                        {task.titleEn}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Xóa nhiệm vụ ${task.title}`}
                      onClick={() => void onRemoveTask(task.id)}
                      className="rounded-full bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* 6. Quiz Results History */}
          {quizResults.length > 0 && (
            <section className="glass-panel rounded-[1.75rem] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-extrabold text-[#4f1d4b]">
                  📝 Kết quả luyện tập Toán / Quiz Results ({quizResults.length})
                </h2>
                <button
                  type="button"
                  onClick={() => void onClearResults()}
                  className="rounded-full bg-white/85 px-4 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                >
                  Xóa lịch sử / Clear History
                </button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-purple-200/70 text-xs font-extrabold text-[#7d4e78]">
                      <th className="py-2 pr-3">Học sinh / Student</th>
                      <th className="py-2 pr-3">Chủ đề / Topic</th>
                      <th className="py-2 pr-3 text-right">Kết quả / Score</th>
                      <th className="py-2 text-right">Sao / Stars</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100/80 font-bold text-[#4f1d4b]">
                    {quizResults.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2.5 pr-3">{r.studentName}</td>
                        <td className="py-2.5 pr-3 text-[#6b4869]">{r.topicLabel}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {r.correctCount}/{r.totalCount}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{r.starsEarned}⭐</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {/* TAB 2: Môn học & Bài học */}
      {activeTab === 'subjects' && (
        <div className="mt-6 space-y-6">
          <section className="glass-panel rounded-[1.75rem] p-6">
            <h2 className="font-display text-xl font-extrabold text-[#4f1d4b]">
              📚 Đăng bài học mới cho các môn / Publish Subject Lesson
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-[#6b4869]">
              Bài học sẽ hiển thị ngay trong mục Bài học đã học (Học tập) để học sinh ôn tập.
            </p>

            <form onSubmit={handleCreateLesson} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Chọn môn học / Subject
                </label>
                <select
                  value={lessonSubjectId}
                  onChange={(e) => setLessonSubjectId(e.target.value as SubjectId)}
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2.5 text-sm font-extrabold text-[#4f1d4b]"
                >
                  {SUBJECTS_DATA.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name} ({subj.englishLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Tên bài học (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Ví dụ: Tuần 10 - Bảng chia 7"
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  English Lesson Title
                </label>
                <input
                  type="text"
                  value={lessonTitleEn}
                  onChange={(e) => setLessonTitleEn(e.target.value)}
                  placeholder="e.g. Week 10 - Division Table of 7"
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Tóm tắt nội dung (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  value={lessonSummary}
                  onChange={(e) => setLessonSummary(e.target.value)}
                  placeholder="Kiến thức trọng tâm cần ghi nhớ..."
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  English Summary
                </label>
                <input
                  type="text"
                  value={lessonSummaryEn}
                  onChange={(e) => setLessonSummaryEn(e.target.value)}
                  placeholder="Key takeaways to review..."
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Ý chính cần nhớ (mỗi dòng 1 ý)
                </label>
                <textarea
                  rows={4}
                  value={lessonPointsRaw}
                  onChange={(e) => setLessonPointsRaw(e.target.value)}
                  placeholder={'49 : 7 = 7\n63 : 7 = 9'}
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Thẻ ghi nhớ nhanh (Mỗi dòng: Câu hỏi | Đáp án)
                </label>
                <textarea
                  rows={4}
                  value={lessonFlashcardsRaw}
                  onChange={(e) => setLessonFlashcardsRaw(e.target.value)}
                  placeholder={'56 : 7 = ? | 8\n70 : 7 = ? | 10'}
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
                />
              </div>

              <div className="md:col-span-2">
                <span className="block text-xs font-extrabold text-[#4f1d4b]">
                  📎 Thêm file ảnh hoặc tài liệu bài học (.png, .jpg, .docx, .doc, .pdf)
                </span>
                <p className="mt-0.5 text-[11px] font-semibold text-[#6b4869]">
                  Attach images or lesson worksheets (.pdf, .docx, .doc — up to 8 files, max 25 MB/file).
                </p>

                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-300 bg-white/80 px-4 py-5 text-center transition-colors hover:bg-white">
                  <Upload className="h-6 w-6 text-[#7d26c9]" />
                  <span className="mt-1.5 text-sm font-extrabold text-[#4f1d4b]">
                    {isUploadingLessonFile
                      ? 'Đang tải tệp lên máy chủ...'
                      : 'Nhấn để chọn ảnh hoặc tệp .docx, .doc, .pdf'}
                  </span>
                  <span className="mt-0.5 text-xs font-semibold text-[#7d4e78]">
                    Có thể chọn nhiều tệp cùng lúc ({lessonAttachments.length}/8 tệp đã đính kèm)
                  </span>
                  <input
                    id="lesson-attachments-input"
                    type="file"
                    multiple
                    disabled={isUploadingLessonFile}
                    accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const files = e.target.files;
                      void handleLessonFilesUpload(files).finally(() => {
                        e.target.value = '';
                      });
                    }}
                    className="sr-only"
                  />
                </label>

                {lessonAttachments.length > 0 && (
                  <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {lessonAttachments.map((att) => {
                      const meta = getAttachmentKindLabel(att.kind);
                      return (
                        <li
                          key={att.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-purple-200/80 bg-white/90 px-3.5 py-2.5 shadow-xs"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {att.kind === 'image' ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                className="h-11 w-11 shrink-0 rounded-xl border border-purple-100 object-cover"
                              />
                            ) : (
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[10px] font-black text-white ${
                                  att.kind === 'pdf'
                                    ? 'bg-rose-500'
                                    : 'bg-sky-600'
                                }`}
                              >
                                {meta.short}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-extrabold text-[#4f1d4b]">
                                {att.name}
                              </p>
                              <p className="text-[11px] font-semibold text-[#7d4e78]">
                                {meta.label} · {att.sizeLabel}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveLessonAttachment(att.id)}
                            aria-label={`Gỡ tệp ${att.name}`}
                            className="shrink-0 rounded-full bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={isPublishingLesson || isUploadingLessonFile}
                  className="btn-violet rounded-xl px-6 py-2.5 text-xs font-extrabold disabled:opacity-60"
                >
                  {isPublishingLesson ? 'Đang đăng bài học...' : 'Đăng bài học lên mục Học tập'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('study')}
                  className="text-xs font-extrabold text-[#7d26c9] hover:underline"
                >
                  Mở mục Bài học đã học →
                </button>
              </div>
            </form>
          </section>

          <section className="glass-panel rounded-[1.75rem] p-6">
            <h3 className="font-display text-lg font-extrabold text-[#4f1d4b]">
              Bài học cô Tú đã đăng ({customLessons.length})
            </h3>
            {customLessons.length === 0 ? (
              <p className="mt-2 text-sm font-semibold text-[#6b4869]">
                Chưa có bài học tự đăng nào. Cô Tú hãy điền mẫu ở trên để thêm bài mới nhé!
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {customLessons.map((lesson) => {
                  const subjName =
                    SUBJECTS_DATA.find((s) => s.id === lesson.subjectId)?.name ?? lesson.subjectId;
                  return (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-[#4f1d4b]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-extrabold text-[#7d26c9]">
                            {subjName}
                          </span>
                          <span>{lesson.title}</span>
                          {lesson.attachments && lesson.attachments.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-extrabold text-sky-800">
                              <Paperclip className="h-3 w-3" />
                              {lesson.attachments.length} tệp
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-[#6b4869]">
                          {lesson.summary}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void onRemoveSubjectLesson(lesson.id)}
                        aria-label={`Xóa bài học ${lesson.title}`}
                        className="shrink-0 rounded-full bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: Thêm & Quản lý Trò chơi */}
      {activeTab === 'games' && (
        <div className="mt-6 space-y-6">
          <section className="glass-panel rounded-[1.75rem] p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[#4f1d4b]">
              <Sparkles className="h-5 w-5 text-[#7d26c9]" />
              <span>Thêm trò chơi vào Kho game / Add Cloud Game</span>
            </h2>

            <div className="mt-4 grid max-w-md grid-cols-2 gap-2 rounded-2xl bg-purple-100/70 p-1.5">
              <button
                type="button"
                onClick={() => setGameMode('file')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold ${
                  gameMode === 'file' ? 'bg-white text-[#4f1d4b] shadow-xs' : 'text-[#6b4869]'
                }`}
              >
                <FileArchive className="h-4 w-4" />
                <span>File nén / HTML</span>
              </button>
              <button
                type="button"
                onClick={() => setGameMode('link')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold ${
                  gameMode === 'link' ? 'bg-white text-[#4f1d4b] shadow-xs' : 'text-[#6b4869]'
                }`}
              >
                <Link2 className="h-4 w-4" />
                <span>Dán đường dẫn</span>
              </button>
            </div>

            <form onSubmit={handleAddGameSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Tên trò chơi (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="Ví dụ: Đuổi hình bắt chữ 3.17"
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  English Subtitle
                </label>
                <input
                  type="text"
                  value={gameTitleEn}
                  onChange={(e) => setGameTitleEn(e.target.value)}
                  placeholder="e.g. Word Guessing Challenge"
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Chủ đề trò chơi / Game Topic
                </label>
                <select
                  value={gameTopic}
                  onChange={(e) => setGameTopic(e.target.value as GameTopic)}
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                >
                  {GAME_TOPIC_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {GAME_TOPIC_META[t].label} ({GAME_TOPIC_META[t].labelEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#4f1d4b]">
                  Ảnh minh họa (tùy chọn)
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={gameImageUrl}
                    onChange={(e) => setGameImageUrl(e.target.value)}
                    placeholder="Link ảnh hoặc tải ảnh lên..."
                    className="min-w-0 flex-1 rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#4f1d4b]"
                  />
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-purple-100 px-3 py-2 text-xs font-extrabold text-[#4f1d4b] hover:bg-purple-200">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Chọn ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleGameCoverUpload(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {gameMode === 'file' ? (
                <div className="md:col-span-2">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-300 bg-white/80 px-4 py-6 text-center hover:bg-white">
                    <Upload className="h-6 w-6 text-purple-600" />
                    <span className="mt-1.5 text-sm font-extrabold text-[#4f1d4b]">
                      {gameFile ? gameFile.name : 'Chọn file .zip, .html, .rar từ máy tính'}
                    </span>
                    <input
                      type="file"
                      accept=".zip,.html,.htm,.rar,.7z"
                      onChange={(e) => setGameFile(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                  </label>
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-[#4f1d4b]">
                    Đường dẫn trò chơi / Game URL *
                  </label>
                  <input
                    type="text"
                    value={gameUrl}
                    onChange={(e) => setGameUrl(e.target.value)}
                    placeholder="https://wordwall.net/..."
                    className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={isAddingGame}
                  className="btn-violet rounded-xl px-6 py-2.5 text-xs font-extrabold disabled:opacity-60"
                >
                  {isAddingGame ? 'Đang tạo đám mây...' : 'Tạo đám mây trò chơi ✨'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('games')}
                  className="text-xs font-extrabold text-[#7d26c9] hover:underline"
                >
                  Mở Kho game →
                </button>
              </div>
            </form>
          </section>

          <section className="glass-panel rounded-[1.75rem] p-6">
            <h3 className="font-display text-lg font-extrabold text-[#4f1d4b]">
              Các đám mây trò chơi hiện có ({games.length})
            </h3>
            {games.length === 0 ? (
              <p className="mt-2 text-sm font-semibold text-[#6b4869]">
                Kho game hiện đang trống.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {games.map((g) => (
                  <li
                    key={g.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/85 px-4 py-3 text-sm font-bold text-[#4f1d4b] shadow-xs"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {g.imageUrl ? (
                        <img
                          src={g.imageUrl}
                          alt={g.title}
                          referrerPolicy="no-referrer"
                          className="h-12 w-16 shrink-0 rounded-xl border border-purple-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                          <Gamepad2 className="h-5 w-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-extrabold text-[#4f1d4b]">
                            {g.title}
                          </span>
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-extrabold text-sky-800">
                            {GAME_TOPIC_META[resolveGameTopic(g)].label}
                          </span>
                        </div>
                        {g.titleEn && (
                          <p className="truncate text-xs font-bold text-[#7d26c9]">
                            {g.titleEn}
                          </p>
                        )}
                        <p className="truncate text-xs font-semibold text-[#6b4869]">
                          {g.sourceType.toUpperCase()} {g.url ? `· ${g.url}` : g.fileName ? `· ${g.fileName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditGameModal(g)}
                        aria-label={`Sửa trò chơi ${g.title}`}
                        className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1.5 text-xs font-extrabold text-[#5b2358] transition-colors hover:bg-purple-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void onRemoveGame(g.id)}
                        aria-label={`Xóa trò chơi ${g.title}`}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* TAB 4: Quản lý trang */}
      {activeTab === 'page' && (
        <section className="glass-panel mt-6 rounded-[1.75rem] p-6">
          <h2 className="font-display text-xl font-extrabold text-[#4f1d4b]">
            ⚙️ Quản lý trang &amp; Thông báo lớp / Page Management
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-[#6b4869]">
            Thay đổi tiêu đề lớp, lời chào ở Trang chủ và bảng thông báo hằng ngày cho học sinh.
          </p>

          <form onSubmit={handleSavePage} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-extrabold text-[#4f1d4b]">
                Tên lớp / Website Title (Tiếng Việt)
              </label>
              <input
                type="text"
                value={cfgDraft.classTitle}
                onChange={(e) => setCfgDraft((p) => ({ ...p, classTitle: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#4f1d4b]">
                Dòng phụ đầu trang / Header Subtitle
              </label>
              <input
                type="text"
                value={cfgDraft.classSubtitle}
                onChange={(e) => setCfgDraft((p) => ({ ...p, classSubtitle: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#4f1d4b]">
                Lời mời chính ở Trang chủ (Tiếng Việt)
              </label>
              <input
                type="text"
                value={cfgDraft.heroHeadline}
                onChange={(e) => setCfgDraft((p) => ({ ...p, heroHeadline: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#4f1d4b]">
                Hero Headline (English)
              </label>
              <input
                type="text"
                value={cfgDraft.heroHeadlineEn}
                onChange={(e) => setCfgDraft((p) => ({ ...p, heroHeadlineEn: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#4f1d4b]">
                Thông báo hôm nay ở Trang chủ (Tiếng Việt)
              </label>
              <textarea
                rows={3}
                value={cfgDraft.announcement}
                onChange={(e) => setCfgDraft((p) => ({ ...p, announcement: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#4f1d4b]">
                Today’s Announcement (English)
              </label>
              <textarea
                rows={3}
                value={cfgDraft.announcementEn}
                onChange={(e) => setCfgDraft((p) => ({ ...p, announcementEn: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#4f1d4b]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-[#4f1d4b]">
                Chữ ký cuối trang / Footer Credit
              </label>
              <input
                type="text"
                value={cfgDraft.footerCredit}
                onChange={(e) => setCfgDraft((p) => ({ ...p, footerCredit: e.target.value }))}
                className="mt-1 w-full max-w-sm rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="btn-violet rounded-xl px-6 py-2.5 text-xs font-extrabold disabled:opacity-60"
              >
                {isSavingConfig ? 'Đang lưu...' : 'Lưu cấu hình trang / Save Page Settings'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-xs font-extrabold text-[#7d26c9] hover:underline"
              >
                Xem Trang chủ →
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Edit Game Modal */}
      {editingGame && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-game-modal-title"
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#2a122e]/45 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border-2 border-white bg-white p-6 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="edit-game-modal-title"
                  className="font-display text-2xl font-extrabold text-[#4f1d4b]"
                >
                  Sửa thông tin trò chơi
                </h2>
                <p className="text-xs font-extrabold text-[#7d26c9]">
                  Edit Game Details · {editingGame.title}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng hộp thoại sửa trò chơi"
                onClick={() => setEditingGame(null)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-purple-50 text-[#5b2358] hover:bg-purple-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGameSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="edit-game-title"
                  className="block text-xs font-extrabold text-[#4f1d4b]"
                >
                  Tên trò chơi (Tiếng Việt) *
                </label>
                <input
                  id="edit-game-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Đuổi hình bắt chữ 3.17"
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-game-topic"
                    className="block text-xs font-extrabold text-[#4f1d4b]"
                  >
                    Chủ đề trò chơi / Topic
                  </label>
                  <select
                    id="edit-game-topic"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value as GameTopic)}
                    className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
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
                    htmlFor="edit-game-title-en"
                    className="block text-xs font-extrabold text-[#4f1d4b]"
                  >
                    English Subtitle (tùy chọn)
                  </label>
                  <input
                    id="edit-game-title-en"
                    type="text"
                    value={editTitleEn}
                    onChange={(e) => setEditTitleEn(e.target.value)}
                    placeholder="e.g. Math Adventure"
                    className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-game-image-url"
                  className="block text-xs font-extrabold text-[#4f1d4b]"
                >
                  Ảnh minh họa (tùy chọn — để trống để dùng ảnh chủ đề mặc định)
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <input
                    id="edit-game-image-url"
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="Dán link ảnh hoặc bấm Chọn ảnh..."
                    className="min-w-[180px] flex-1 rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#4f1d4b]"
                  />
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-purple-100 px-3 py-2 text-xs font-extrabold text-[#4f1d4b] hover:bg-purple-200">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Chọn ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        void handleEditGameCoverUpload(e.target.files?.[0] ?? null)
                      }
                      className="sr-only"
                    />
                  </label>
                  {editImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditImageUrl('')}
                      className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
                {editImageUrl && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl bg-purple-50/70 p-2">
                    <img
                      src={editImageUrl}
                      alt="Xem trước ảnh trò chơi"
                      referrerPolicy="no-referrer"
                      className="h-14 w-20 rounded-lg border border-white object-cover shadow-xs"
                    />
                    <span className="text-xs font-semibold text-[#6b4869]">
                      Ảnh minh họa hiện tại sẽ hiển thị trên thẻ Kho game.
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3.5">
                <span className="block text-xs font-extrabold text-[#4f1d4b]">
                  Nguồn trò chơi / Game Source
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-white p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditSourceMode('file');
                      setEditError('');
                    }}
                    className={`rounded-lg py-1.5 text-xs font-extrabold ${
                      editSourceMode === 'file'
                        ? 'bg-purple-100 text-[#4f1d4b]'
                        : 'text-[#6b4869]'
                    }`}
                  >
                    File ZIP / HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditSourceMode('link');
                      setEditError('');
                    }}
                    className={`rounded-lg py-1.5 text-xs font-extrabold ${
                      editSourceMode === 'link'
                        ? 'bg-purple-100 text-[#4f1d4b]'
                        : 'text-[#6b4869]'
                    }`}
                  >
                    Đường dẫn URL
                  </button>
                </div>

                {editSourceMode === 'file' ? (
                  <div className="mt-3 space-y-2">
                    {editingGame.sourceType !== 'url' && (
                      <p className="text-xs font-semibold text-[#6b4869]">
                        Tệp hiện tại:{' '}
                        <span className="font-extrabold text-[#4f1d4b]">
                          {editingGame.fileName ?? editingGame.entryFile ?? 'HTML5'}
                        </span>
                        {editingGame.fileSizeLabel ? ` (${editingGame.fileSizeLabel})` : ''}
                        {' — giữ nguyên nếu không chọn tệp mới.'}
                      </p>
                    )}
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-purple-300 bg-white px-3.5 py-2.5 text-xs font-extrabold text-[#4f1d4b] hover:bg-purple-50/60">
                      <Upload className="h-4 w-4 text-[#7d26c9]" />
                      <span>
                        {editFile
                          ? `Thay bằng: ${editFile.name}`
                          : 'Tải lên file .zip / .html mới (tùy chọn)'}
                      </span>
                      <input
                        type="file"
                        accept=".zip,.html,.htm"
                        onChange={(e) => {
                          setEditFile(e.target.files?.[0] ?? null);
                          setEditError('');
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="mt-3">
                    <label
                      htmlFor="edit-game-url"
                      className="block text-xs font-extrabold text-[#4f1d4b]"
                    >
                      Đường dẫn trò chơi / Game URL *
                    </label>
                    <input
                      id="edit-game-url"
                      type="text"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://wordwall.net/..."
                      className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-sm font-bold text-[#4f1d4b]"
                    />
                  </div>
                )}
              </div>

              {editError && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700"
                >
                  {editError}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGame(null)}
                  className="min-h-[42px] cursor-pointer rounded-full bg-purple-50 px-5 py-2 text-xs font-extrabold text-[#5b2358] hover:bg-purple-100"
                >
                  Hủy / Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditGame}
                  className="btn-violet min-h-[42px] cursor-pointer rounded-full px-6 py-2 text-xs font-extrabold disabled:opacity-60"
                >
                  {isSavingEditGame ? 'Đang lưu thay đổi...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
