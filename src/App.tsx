import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { ActivitiesView } from './components/ActivitiesView';
import { GamePlayView } from './components/GamePlayView';
import { GamesView } from './components/GamesView';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { PracticeView } from './components/PracticeView';
import { StudentIdentityModal } from './components/StudentIdentityModal';
import { StudyView } from './components/StudyView';
import { TeacherView } from './components/TeacherView';
import { ThoMayWidget } from './components/ThoMayWidget';
import {
  ACTIVITY_MEMORIES,
  DEFAULT_SITE_CONFIG,
} from './data/classroomSeed';
import {
  auth,
  isAuthorizedTeacher,
  signInTeacherWithGoogle,
  signOutTeacher,
} from './lib/firebase';
import type {
  ActivityMemory,
  CustomGame,
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
} from './types/classroom';
import {
  addActivityRemote,
  addGameRemote,
  addQuizResultRemote,
  addStudentAchievementRemote,
  addStudentRemote,
  addStudentsBatchRemote,
  addSubjectLessonRemote,
  addTaskRemote,
  clearQuizResultsRemote,
  clearStudentsRemote,
  clearWeeklyHonorsRemote,
  publishWeeklyHonorsRemote,
  removeActivityRemote,
  removeGameRemote,
  removeStudentAchievementRemote,
  removeStudentRemote,
  removeSubjectLessonRemote,
  removeTaskRemote,
  removeWeeklyHonorRemote,
  saveSiteConfigRemote,
  saveTeamPointsRemote,
  subscribeActivities,
  subscribeQuizResults,
  subscribeRemoteGames,
  subscribeSiteConfig,
  subscribeStudentAchievements,
  subscribeStudents,
  subscribeSubjectLessons,
  subscribeTasks,
  subscribeTeams,
  subscribeWeeklyHonors,
  toggleTaskRemote,
  updateGameRemote,
} from './utils/classroomSync';
import { loadCustomGames, persistCustomGames } from './utils/gameStorage';
import {
  loadActiveStudentName,
  saveActiveStudentName,
  shouldAutoShowStudentPicker,
} from './utils/studentSession';
import {
  loadClassroomState,
  saveQuizResults,
  saveStudents,
  saveTasks,
  saveTeams,
} from './utils/storage';

const VALID_ROUTES: RouteTab[] = [
  'home',
  'study',
  'practice',
  'games',
  'play',
  'activities',
  'teacher',
];

function parseHashState(): { route: RouteTab; playGameId: string | null } {
  if (typeof window === 'undefined') return { route: 'home', playGameId: null };
  const raw = window.location.hash.replace(/^#/, '');
  if (raw.startsWith('play/')) {
    const gameId = decodeURIComponent(raw.slice('play/'.length)).trim();
    if (gameId) return { route: 'play', playGameId: gameId };
    return { route: 'games', playGameId: null };
  }
  const route = raw as RouteTab;
  return {
    route: VALID_ROUTES.includes(route) && route !== 'play' ? route : 'home',
    playGameId: null,
  };
}

export default function App() {
  const initialHash = parseHashState();
  const [activeRoute, setActiveRoute] = useState<RouteTab>(initialHash.route);
  const [playingGameId, setPlayingGameId] = useState<string | null>(initialHash.playGameId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId | null>(null);

  // Active Student Identity (shown immediately on entry unless dismissed/autostart/teacher route)
  const [currentStudentName, setCurrentStudentName] = useState<string>(() =>
    loadActiveStudentName()
  );
  const [showStudentPicker, setShowStudentPicker] = useState<boolean>(() =>
    shouldAutoShowStudentPicker({
      activeStudentName: loadActiveStudentName(),
      activeRoute: initialHash.route,
      search: typeof window !== 'undefined' ? window.location.search : '',
      dismissedForSession: false,
    })
  );

  // Firebase Auth state for Teacher (restricted to nguyentu200798@gmail.com)
  const [authReady, setAuthReady] = useState(false);
  const [teacherUser, setTeacherUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState('');

  const initial = loadClassroomState();
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [quizResults, setQuizResults] = useState<QuizResult[]>(initial.quizResults);
  const [teams, setTeams] = useState<TeamScore[]>(initial.teams);
  const [students, setStudents] = useState<StudentRecord[]>(initial.students);
  const [studentAchievements, setStudentAchievements] = useState<StudentAchievement[]>([]);
  const [weeklyHonors, setWeeklyHonors] = useState<WeeklyHonor[]>([]);
  const [tasks, setTasks] = useState<WeeklyTask[]>(initial.tasks);
  const [remoteActivities, setRemoteActivities] = useState<ActivityMemory[]>([]);
  const [customLessons, setCustomLessons] = useState<SubjectLesson[]>([]);
  const [localGames, setLocalGames] = useState<CustomGame[]>([]);
  const [remoteGames, setRemoteGames] = useState<CustomGame[]>([]);

  const isTeacherAuthorized = isAuthorizedTeacher(teacherUser);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setTeacherUser(user);
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    void loadCustomGames().then((saved) => {
      setLocalGames(saved);
    });

    const unsubs = [
      subscribeSiteConfig(setSiteConfig),
      subscribeTeams(setTeams),
      subscribeStudents(setStudents),
      subscribeStudentAchievements(setStudentAchievements),
      subscribeWeeklyHonors(setWeeklyHonors),
      subscribeTasks(setTasks),
      subscribeActivities(setRemoteActivities),
      subscribeSubjectLessons(setCustomLessons),
      subscribeRemoteGames(setRemoteGames),
      subscribeQuizResults(setQuizResults),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHashState();
      setActiveRoute(parsed.route);
      setPlayingGameId(parsed.playGameId);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const combinedGames = useMemo(() => {
    const map = new Map<string, CustomGame>();
    for (const g of remoteGames) map.set(g.id, g);
    for (const g of localGames) {
      const existing = map.get(g.id);
      if (!existing) {
        map.set(g.id, g);
      } else {
        map.set(g.id, {
          ...existing,
          playUrl: existing.playUrl || g.playUrl,
          entryFile: existing.entryFile || g.entryFile,
          htmlContent: existing.htmlContent || g.htmlContent,
          runtimeStatus:
            existing.runtimeStatus === 'vite-built'
              ? existing.runtimeStatus
              : g.runtimeStatus ?? existing.runtimeStatus,
        });
      }
    }
    return Array.from(map.values());
  }, [remoteGames, localGames]);

  const activePlayingGame = useMemo(
    () =>
      playingGameId
        ? combinedGames.find((g) => g.id === playingGameId) ?? null
        : null,
    [combinedGames, playingGameId]
  );

  const combinedActivities = useMemo(
    () => [...remoteActivities, ...ACTIVITY_MEMORIES],
    [remoteActivities]
  );

  const navigate = (route: RouteTab) => {
    setActiveRoute(route);
    if (route !== 'play') {
      setPlayingGameId(null);
    }
    if (route !== 'study') {
      setSelectedSubjectId(null);
    }
    if (route === 'teacher') {
      setShowStudentPicker(false);
    }
    if (route !== 'play') {
      window.location.hash = route;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToGame = (gameId: string) => {
    setPlayingGameId(gameId);
    setActiveRoute('play');
    window.location.hash = `play/${encodeURIComponent(gameId)}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCurrentStudent = (name: string) => {
    const saved = saveActiveStudentName(name);
    setCurrentStudentName(saved);
    setShowStudentPicker(false);
  };

  const handleClearCurrentStudent = () => {
    saveActiveStudentName('');
    setCurrentStudentName('');
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const user = await signInTeacherWithGoogle();
      setTeacherUser(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user')) {
        setAuthError('Cửa sổ đăng nhập Google đã được đóng. Vui lòng thử lại nhé.');
      } else {
        setAuthError('Đăng nhập Google không thành công. Vui lòng kiểm tra kết nối và thử lại.');
      }
    }
  };

  const handleLogout = async () => {
    setAuthError('');
    await signOutTeacher();
    setTeacherUser(null);
  };

  const handleSaveQuizResult = (result: QuizResult) => {
    setQuizResults((prev) => {
      const next = [result, ...prev];
      saveQuizResults(next);
      return next;
    });
    if (result.starsEarned > 0) {
      setTeams((prev) => {
        const next = prev.map((t) =>
          t.teamId === result.teamId
            ? { ...t, points: t.points + result.starsEarned }
            : t
        );
        saveTeams(next);
        return next;
      });
    }
    void addQuizResultRemote(result).catch(() => {
      // Offline fallback preserved in localStorage
    });
  };

  const handleToggleTask = async (taskId: string) => {
    if (isTeacherAuthorized) {
      await toggleTaskRemote(tasks, taskId);
      return;
    }
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      saveTasks(next);
      return next;
    });
  };

  const handleAddGame = async (game: CustomGame) => {
    setLocalGames((prev) => {
      const next = [...prev, game];
      void persistCustomGames(next);
      return next;
    });
    if (isTeacherAuthorized) {
      await addGameRemote(game);
    }
  };

  const handleUpdateGame = async (updatedGame: CustomGame) => {
    setLocalGames((prev) => {
      const exists = prev.some((g) => g.id === updatedGame.id);
      const next = exists
        ? prev.map((g) => (g.id === updatedGame.id ? updatedGame : g))
        : [...prev, updatedGame];
      void persistCustomGames(next);
      return next;
    });
    if (isTeacherAuthorized && remoteGames.some((g) => g.id === updatedGame.id)) {
      await updateGameRemote(updatedGame);
    }
  };

  const handleRemoveGame = async (id: string) => {
    setLocalGames((prev) => {
      const next = prev.filter((g) => g.id !== id);
      void persistCustomGames(next);
      return next;
    });
    if (isTeacherAuthorized && remoteGames.some((g) => g.id === id)) {
      await removeGameRemote(id);
    }
  };

  const handleAdjustTeamPoints = async (teamId: 1 | 2 | 3 | 4, delta: number) => {
    if (isTeacherAuthorized) {
      await saveTeamPointsRemote(teams, teamId, delta);
      return;
    }
    setTeams((prev) => {
      const next = prev.map((t) =>
        t.teamId === teamId ? { ...t, points: Math.max(0, t.points + delta) } : t
      );
      saveTeams(next);
      return next;
    });
  };

  const handleAddStudent = async (name: string) => {
    if (isTeacherAuthorized) {
      await addStudentRemote(students, name, 1);
      return;
    }
    setStudents((prev) => {
      const next = [...prev, { id: `s-${Date.now()}`, name, teamId: 1 as const, bonusStars: 0 }];
      saveStudents(next);
      return next;
    });
  };

  const handleAddStudentsBatch = async (names: string[]): Promise<number> => {
    if (isTeacherAuthorized) {
      return addStudentsBatchRemote(names);
    }
    setStudents((prev) => {
      const added: StudentRecord[] = names.map((name, i) => ({
        id: `s-${Date.now()}-${i}`,
        name,
        teamId: 1 as const,
        bonusStars: 0,
      }));
      const next = [...prev, ...added];
      saveStudents(next);
      return next;
    });
    return names.length;
  };

  const handleClearStudents = async () => {
    if (isTeacherAuthorized) {
      await clearStudentsRemote();
      return;
    }
    setStudents([]);
    saveStudents([]);
  };

  const handleRemoveStudent = async (id: string) => {
    if (isTeacherAuthorized) {
      await removeStudentRemote(students, id);
      return;
    }
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveStudents(next);
      return next;
    });
  };

  const handleAddTask = async (title: string, titleEn = 'Weekly class task') => {
    if (isTeacherAuthorized) {
      await addTaskRemote(tasks, title, titleEn);
      return;
    }
    setTasks((prev) => {
      const next = [
        ...prev,
        { id: `t-${Date.now()}`, title, titleEn, completed: false },
      ];
      saveTasks(next);
      return next;
    });
  };

  const handleRemoveTask = async (id: string) => {
    if (isTeacherAuthorized) {
      await removeTaskRemote(tasks, id);
      return;
    }
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTasks(next);
      return next;
    });
  };

  const handleClearResults = async () => {
    setQuizResults([]);
    saveQuizResults([]);
    if (isTeacherAuthorized) {
      await clearQuizResultsRemote();
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-16 z-0 flex justify-around text-2xl text-white/75 select-none"
      >
        <span>✧</span>
        <span className="mt-4 text-lg">✦</span>
        <span>⋆</span>
        <span className="mt-3 text-xl">✧</span>
        <span>✦</span>
      </div>

      <Header
        activeRoute={activeRoute}
        siteConfig={siteConfig}
        currentStudentName={currentStudentName}
        onOpenStudentPicker={() => setShowStudentPicker(true)}
        onNavigate={navigate}
      />

      <main className="relative flex-1">
        {activeRoute === 'home' && (
          <HomeView siteConfig={siteConfig} onNavigate={navigate} />
        )}
        {activeRoute === 'study' && (
          <StudyView
            onNavigate={navigate}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={setSelectedSubjectId}
            customLessons={customLessons}
          />
        )}
        {activeRoute === 'practice' && (
          <PracticeView
            students={students}
            currentStudentName={currentStudentName}
            onSaveResult={handleSaveQuizResult}
            onNavigate={navigate}
          />
        )}
        {activeRoute === 'games' && (
          <GamesView
            games={combinedGames}
            onAddGame={handleAddGame}
            onPlayGame={navigateToGame}
            onNavigate={navigate}
          />
        )}
        {activeRoute === 'play' && (
          <GamePlayView
            game={activePlayingGame}
            onBackToGames={() => navigate('games')}
            onUpdateGame={handleUpdateGame}
          />
        )}
        {activeRoute === 'activities' && (
          <ActivitiesView
            currentStudentName={currentStudentName}
            studentAchievements={studentAchievements}
            weeklyHonors={weeklyHonors}
            teams={teams}
            tasks={tasks}
            activities={combinedActivities}
            onToggleTask={(id) => void handleToggleTask(id)}
            onNavigate={navigate}
          />
        )}
        {activeRoute === 'teacher' && (
          <TeacherView
            authReady={authReady}
            teacherUser={teacherUser}
            isAuthorized={isTeacherAuthorized}
            authError={authError}
            onGoogleLogin={handleGoogleLogin}
            onLogout={handleLogout}
            siteConfig={siteConfig}
            onSaveSiteConfig={saveSiteConfigRemote}
            students={students}
            studentAchievements={studentAchievements}
            weeklyHonors={weeklyHonors}
            teams={teams}
            quizResults={quizResults}
            tasks={tasks}
            activities={combinedActivities}
            customLessons={customLessons}
            games={combinedGames}
            onAdjustTeamPoints={handleAdjustTeamPoints}
            onAddStudent={handleAddStudent}
            onAddStudentsBatch={handleAddStudentsBatch}
            onRemoveStudent={handleRemoveStudent}
            onClearStudents={handleClearStudents}
            onAddStudentAchievement={addStudentAchievementRemote}
            onRemoveStudentAchievement={removeStudentAchievementRemote}
            onPublishWeeklyHonors={publishWeeklyHonorsRemote}
            onRemoveWeeklyHonor={removeWeeklyHonorRemote}
            onClearWeeklyHonors={clearWeeklyHonorsRemote}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onRemoveTask={handleRemoveTask}
            onAddActivity={addActivityRemote}
            onRemoveActivity={removeActivityRemote}
            onAddSubjectLesson={addSubjectLessonRemote}
            onRemoveSubjectLesson={removeSubjectLessonRemote}
            onAddGame={handleAddGame}
            onUpdateGame={handleUpdateGame}
            onRemoveGame={handleRemoveGame}
            onClearResults={handleClearResults}
            onNavigate={navigate}
          />
        )}
      </main>

      <footer className="relative z-0 mx-auto w-full max-w-[1200px] px-6 pt-6 pb-20 text-center text-xs font-semibold text-[#6b4869] md:pb-12 md:pr-56 md:pl-56">
        <p className="font-bold text-[#4f1d4b]">{siteConfig.classTitle} · Lớp 3.17</p>
        <p className="mt-0.5">
          Mỗi ngày đến lớp là một ngày vui ♡ · A New Joy Every Day
        </p>
        <p className="mt-1.5 text-[11px] opacity-75">{siteConfig.footerCredit}</p>
      </footer>

      <ThoMayWidget onNavigate={navigate} />

      {showStudentPicker && (
        <StudentIdentityModal
          students={students}
          currentStudentName={currentStudentName}
          onSelectStudent={handleSelectCurrentStudent}
          onClearStudent={handleClearCurrentStudent}
          onClose={() => setShowStudentPicker(false)}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
