import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_SITE_CONFIG,
  INITIAL_TASKS,
  INITIAL_TEAMS,
} from '../data/classroomSeed';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  ActivityMemory,
  CustomGame,
  QuizResult,
  SiteConfig,
  StudentAchievement,
  StudentRecord,
  SubjectId,
  SubjectLesson,
  TeamScore,
  WeeklyHonor,
  WeeklyTask,
} from '../types/classroom';
import { isValidGameTopic } from './gameCatalog';

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

function clampStr(val: string | undefined, max: number, fallback = ''): string {
  const cleaned = (val ?? fallback).trim();
  return cleaned.slice(0, max);
}

function toMillis(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function subscribeSiteConfig(onData: (cfg: SiteConfig) => void): () => void {
  const path = 'site_config/main';
  return onSnapshot(
    doc(db, 'site_config', 'main'),
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_SITE_CONFIG);
        return;
      }
      const d = snap.data();
      onData({
        classTitle: String(d.classTitle || DEFAULT_SITE_CONFIG.classTitle),
        classSubtitle: String(d.classSubtitle || DEFAULT_SITE_CONFIG.classSubtitle),
        heroHeadline: String(d.heroHeadline || DEFAULT_SITE_CONFIG.heroHeadline),
        heroHeadlineEn: String(d.heroHeadlineEn || DEFAULT_SITE_CONFIG.heroHeadlineEn),
        announcement: String(d.announcement ?? DEFAULT_SITE_CONFIG.announcement),
        announcementEn: String(d.announcementEn ?? DEFAULT_SITE_CONFIG.announcementEn),
        footerCredit: String(d.footerCredit || DEFAULT_SITE_CONFIG.footerCredit),
      });
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    }
  );
}

export async function saveSiteConfigRemote(config: SiteConfig): Promise<void> {
  const path = 'site_config/main';
  try {
    await setDoc(doc(db, 'site_config', 'main'), {
      classTitle: clampStr(config.classTitle, 120, DEFAULT_SITE_CONFIG.classTitle),
      classSubtitle: clampStr(config.classSubtitle, 140, DEFAULT_SITE_CONFIG.classSubtitle),
      heroHeadline: clampStr(config.heroHeadline, 180, DEFAULT_SITE_CONFIG.heroHeadline),
      heroHeadlineEn: clampStr(config.heroHeadlineEn, 180, DEFAULT_SITE_CONFIG.heroHeadlineEn),
      announcement: clampStr(config.announcement, 500, ''),
      announcementEn: clampStr(config.announcementEn, 500, ''),
      footerCredit: clampStr(config.footerCredit, 100, DEFAULT_SITE_CONFIG.footerCredit),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeTeams(onData: (teams: TeamScore[]) => void): () => void {
  const path = 'teams';
  return onSnapshot(
    query(collection(db, path), where('isPublic', '==', true)),
    (snap) => {
      if (snap.empty) {
        onData(INITIAL_TEAMS);
        return;
      }
      const list: TeamScore[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            teamId: Number(data.teamId) as 1 | 2 | 3 | 4,
            name: String(data.name),
            nameEn: String(data.nameEn),
            points: Number(data.points),
          };
        })
        .sort((a, b) => a.teamId - b.teamId);
      onData(list);
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function saveTeamPointsRemote(
  teams: TeamScore[],
  teamId: 1 | 2 | 3 | 4,
  delta: number
): Promise<void> {
  const path = `teams/team-${teamId}`;
  try {
    const existingSnap = await getDocs(
      query(collection(db, 'teams'), where('isPublic', '==', true))
    );
    if (existingSnap.empty) {
      const batch = writeBatch(db);
      for (const t of INITIAL_TEAMS) {
        const currentPoints = teams.find((item) => item.teamId === t.teamId)?.points ?? t.points;
        const nextPoints =
          t.teamId === teamId ? Math.max(0, Math.min(100000, currentPoints + delta)) : currentPoints;
        batch.set(doc(db, 'teams', `team-${t.teamId}`), {
          isPublic: true,
          teamId: t.teamId,
          name: t.name,
          nameEn: t.nameEn,
          points: nextPoints,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      return;
    }

    const target = teams.find((t) => t.teamId === teamId) ?? INITIAL_TEAMS[teamId - 1];
    const nextPoints = Math.max(0, Math.min(100000, target.points + delta));
    await setDoc(doc(db, 'teams', `team-${teamId}`), {
      isPublic: true,
      teamId: target.teamId,
      name: clampStr(target.name, 40, `Tổ ${teamId}`),
      nameEn: clampStr(target.nameEn, 40, `Team ${teamId}`),
      points: nextPoints,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeStudents(onData: (students: StudentRecord[]) => void): () => void {
  const path = 'students';
  return onSnapshot(
    query(collection(db, path), where('isPublic', '==', true)),
    (snap) => {
      if (snap.empty) {
        onData([]);
        return;
      }
      const docs = [...snap.docs].sort(
        (a, b) => toMillis(a.data().createdAt) - toMillis(b.data().createdAt)
      );
      onData(
        docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name),
            teamId: Number(data.teamId || 1) as 1 | 2 | 3 | 4,
            bonusStars: Number(data.bonusStars ?? 0),
          };
        })
      );
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function addStudentRemote(
  _current: StudentRecord[],
  name: string,
  teamId: 1 | 2 | 3 | 4 = 1
): Promise<void> {
  const id = makeSafeId('student');
  const path = `students/${id}`;
  try {
    await setDoc(doc(db, 'students', id), {
      isPublic: true,
      name: clampStr(name, 100, 'Học sinh 3.17'),
      teamId,
      bonusStars: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function addStudentsBatchRemote(names: string[]): Promise<number> {
  const cleanNames = names.map((n) => clampStr(n, 100)).filter(Boolean);
  if (cleanNames.length === 0) return 0;

  const path = 'students';
  try {
    for (let i = 0; i < cleanNames.length; i += 400) {
      const chunk = cleanNames.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((studentName, idx) => {
        const id = makeSafeId(`st${i + idx}`);
        batch.set(doc(db, 'students', id), {
          isPublic: true,
          name: studentName,
          teamId: 1,
          bonusStars: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
    return cleanNames.length;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    return 0;
  }
}

export async function clearStudentsRemote(): Promise<void> {
  const path = 'students';
  try {
    const snap = await getDocs(query(collection(db, path), where('isPublic', '==', true)));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function awardStudentStarRemote(
  current: StudentRecord[],
  studentId: string
): Promise<void> {
  const path = `students/${studentId}`;
  try {
    const target = current.find((s) => s.id === studentId);
    if (!target) return;
    await updateDoc(doc(db, 'students', studentId), {
      bonusStars: Math.min(10000, (target.bonusStars ?? 0) + 1),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function removeStudentRemote(
  _current: StudentRecord[],
  studentId: string
): Promise<void> {
  const path = `students/${studentId}`;
  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeStudentAchievements(
  onData: (items: StudentAchievement[]) => void
): () => void {
  const path = 'student_achievements';
  return onSnapshot(
    query(collection(db, path), where('isPublic', '==', true)),
    (snap) => {
      const docs = [...snap.docs].sort(
        (a, b) => toMillis(b.data().createdAt) - toMillis(a.data().createdAt)
      );
      onData(
        docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            studentName: String(data.studentName),
            achievement: String(data.achievement),
            achievementEn: String(data.achievementEn ?? ''),
            dateLabel: String(data.dateLabel ?? ''),
          };
        })
      );
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function addStudentAchievementRemote(
  entry: Omit<StudentAchievement, 'id'>
): Promise<void> {
  const id = makeSafeId('ach');
  const path = `student_achievements/${id}`;
  try {
    await setDoc(doc(db, 'student_achievements', id), {
      isPublic: true,
      studentName: clampStr(entry.studentName, 100, 'Học sinh 3.17'),
      achievement: clampStr(entry.achievement, 300, 'Thành tích xuất sắc'),
      achievementEn: clampStr(entry.achievementEn, 300, ''),
      dateLabel: clampStr(entry.dateLabel, 60, new Date().toLocaleDateString('vi-VN')),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function removeStudentAchievementRemote(achievementId: string): Promise<void> {
  const path = `student_achievements/${achievementId}`;
  try {
    await deleteDoc(doc(db, 'student_achievements', achievementId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeWeeklyHonors(onData: (items: WeeklyHonor[]) => void): () => void {
  const path = 'weekly_honors';
  return onSnapshot(
    query(collection(db, path), where('isPublic', '==', true)),
    (snap) => {
      const docs = [...snap.docs].sort((a, b) => {
        const rankDiff = Number(a.data().rankOrder ?? 1) - Number(b.data().rankOrder ?? 1);
        if (rankDiff !== 0) return rankDiff;
        return toMillis(b.data().createdAt) - toMillis(a.data().createdAt);
      });
      onData(
        docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            studentName: String(data.studentName),
            weekLabel: String(data.weekLabel ?? ''),
            note: String(data.note ?? ''),
            rankOrder: Number(data.rankOrder ?? 1),
          };
        })
      );
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function publishWeeklyHonorsRemote(
  studentNames: string[],
  weekLabel: string,
  note: string,
  replaceExisting = true
): Promise<void> {
  const path = 'weekly_honors';
  const cleanNames = studentNames.map((n) => clampStr(n, 100)).filter(Boolean).slice(0, 100);
  if (cleanNames.length === 0) return;

  try {
    const batch = writeBatch(db);
    if (replaceExisting) {
      const existingSnap = await getDocs(
        query(collection(db, path), where('isPublic', '==', true))
      );
      existingSnap.docs.forEach((d) => batch.delete(d.ref));
    }

    cleanNames.forEach((studentName, idx) => {
      const id = makeSafeId(`honor${idx}`);
      batch.set(doc(db, path, id), {
        isPublic: true,
        studentName,
        weekLabel: clampStr(weekLabel, 80, 'Tuần học 3.17'),
        note: clampStr(note, 240, ''),
        rankOrder: Math.min(100, idx + 1),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeWeeklyHonorRemote(honorId: string): Promise<void> {
  const path = `weekly_honors/${honorId}`;
  try {
    await deleteDoc(doc(db, 'weekly_honors', honorId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function clearWeeklyHonorsRemote(): Promise<void> {
  const path = 'weekly_honors';
  try {
    const snap = await getDocs(query(collection(db, path), where('isPublic', '==', true)));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeTasks(onData: (tasks: WeeklyTask[]) => void): () => void {
  const path = 'tasks';
  return onSnapshot(
    query(collection(db, path), where('isPublic', '==', true)),
    (snap) => {
      if (snap.empty) {
        onData(INITIAL_TASKS);
        return;
      }
      const docs = [...snap.docs].sort(
        (a, b) => toMillis(a.data().createdAt) - toMillis(b.data().createdAt)
      );
      onData(
        docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title),
            titleEn: String(data.titleEn ?? ''),
            completed: Boolean(data.completed),
          };
        })
      );
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

async function seedTasksIfNeeded(current: WeeklyTask[]): Promise<void> {
  const snap = await getDocs(query(collection(db, 'tasks'), where('isPublic', '==', true)));
  if (!snap.empty) return;
  const batch = writeBatch(db);
  for (const t of current) {
    const safeId = t.id.replace(/[^a-zA-Z0-9_-]/g, '');
    batch.set(doc(db, 'tasks', safeId), {
      isPublic: true,
      title: clampStr(t.title, 200),
      titleEn: clampStr(t.titleEn, 200),
      completed: Boolean(t.completed),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function addTaskRemote(
  current: WeeklyTask[],
  title: string,
  titleEn = 'Daily classroom task'
): Promise<void> {
  const id = makeSafeId('task');
  const path = `tasks/${id}`;
  try {
    await seedTasksIfNeeded(current);
    await setDoc(doc(db, 'tasks', id), {
      isPublic: true,
      title: clampStr(title, 200, 'Nhiệm vụ mới'),
      titleEn: clampStr(titleEn, 200, 'Daily classroom task'),
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function toggleTaskRemote(
  current: WeeklyTask[],
  taskId: string
): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await seedTasksIfNeeded(current);
    const target = current.find((t) => t.id === taskId);
    if (!target) return;
    await updateDoc(doc(db, 'tasks', taskId), {
      completed: !target.completed,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function removeTaskRemote(
  current: WeeklyTask[],
  taskId: string
): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await seedTasksIfNeeded(current);
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeActivities(onData: (activities: ActivityMemory[]) => void): () => void {
  const path = 'activities';
  return onSnapshot(
    query(collection(db, path), where('isPublic', '==', true)),
    (snap) => {
      const docs = [...snap.docs].sort(
        (a, b) => toMillis(b.data().createdAt) - toMillis(a.data().createdAt)
      );
      onData(
        docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            isCustom: true,
            title: String(data.title),
            titleEn: String(data.titleEn ?? ''),
            dateLabel: String(data.dateLabel ?? ''),
            imageUrl: String(data.imageUrl),
            caption: String(data.caption),
            captionEn: String(data.captionEn ?? ''),
          };
        })
      );
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function addActivityRemote(
  activity: Omit<ActivityMemory, 'id' | 'isCustom'>
): Promise<void> {
  const id = makeSafeId('act');
  const path = `activities/${id}`;
  try {
    await setDoc(doc(db, 'activities', id), {
      isPublic: true,
      title: clampStr(activity.title, 160, 'Hoạt động lớp 3.17'),
      titleEn: clampStr(activity.titleEn, 160, 'Class 3.17 Activity'),
      dateLabel: clampStr(activity.dateLabel, 80, 'Lớp 3.17'),
      imageUrl: clampStr(activity.imageUrl, 250000),
      caption: clampStr(activity.caption, 500, activity.title),
      captionEn: clampStr(activity.captionEn, 500, ''),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function removeActivityRemote(activityId: string): Promise<void> {
  const path = `activities/${activityId}`;
  try {
    await deleteDoc(doc(db, 'activities', activityId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeSubjectLessons(onData: (lessons: SubjectLesson[]) => void): () => void {
  const path = 'subject_lessons';
  return onSnapshot(
    query(collection(db, path), where('isPublic', '==', true)),
    (snap) => {
      const docs = [...snap.docs].sort(
        (a, b) => toMillis(b.data().createdAt) - toMillis(a.data().createdAt)
      );
      onData(
        docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            subjectId: data.subjectId as SubjectId,
            isCustom: true,
            title: String(data.title),
            titleEn: String(data.titleEn ?? ''),
            summary: String(data.summary),
            summaryEn: String(data.summaryEn ?? ''),
            keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.map(String) : [],
            flashcards: Array.isArray(data.flashcards)
              ? data.flashcards.map((fc: { front?: unknown; back?: unknown }) => ({
                  front: String(fc.front ?? ''),
                  back: String(fc.back ?? ''),
                }))
              : [],
            attachments: Array.isArray(data.attachments)
              ? data.attachments.map(
                  (att: {
                    id?: unknown;
                    name?: unknown;
                    kind?: unknown;
                    mimeType?: unknown;
                    sizeLabel?: unknown;
                    url?: unknown;
                  }) => ({
                    id: String(att.id ?? ''),
                    name: String(att.name ?? 'Tài liệu'),
                    kind: (att.kind as 'image' | 'pdf' | 'docx' | 'doc') || 'pdf',
                    mimeType: String(att.mimeType ?? ''),
                    sizeLabel: String(att.sizeLabel ?? ''),
                    url: String(att.url ?? ''),
                  })
                )
              : undefined,
          };
        })
      );
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function addSubjectLessonRemote(
  lesson: Omit<SubjectLesson, 'id' | 'isCustom'> & { subjectId: SubjectId }
): Promise<void> {
  const id = makeSafeId('lesson');
  const path = `subject_lessons/${id}`;
  try {
    const cleanAttachments = (lesson.attachments ?? [])
      .slice(0, 8)
      .filter((a) => a.name.trim() && a.url.trim())
      .map((a) => ({
        id: clampStr(a.id, 64, makeSafeId('att')),
        name: clampStr(a.name, 200, 'tai-lieu'),
        kind: a.kind,
        mimeType: clampStr(a.mimeType, 120, 'application/octet-stream'),
        sizeLabel: clampStr(a.sizeLabel, 40, ''),
        url: clampStr(a.url, 250000),
      }));

    const payload: Record<string, unknown> = {
      isPublic: true,
      subjectId: lesson.subjectId,
      title: clampStr(lesson.title, 160, 'Bài học mới'),
      titleEn: clampStr(lesson.titleEn, 160, 'New Lesson'),
      summary: clampStr(lesson.summary, 400, lesson.title),
      summaryEn: clampStr(lesson.summaryEn, 400, ''),
      keyPoints: lesson.keyPoints.slice(0, 10).map((k) => clampStr(k, 300)).filter(Boolean),
      flashcards: lesson.flashcards
        .slice(0, 12)
        .filter((f) => f.front.trim() && f.back.trim())
        .map((f) => ({
          front: clampStr(f.front, 160),
          back: clampStr(f.back, 220),
        })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (cleanAttachments.length > 0) {
      payload.attachments = cleanAttachments;
    }

    await setDoc(doc(db, 'subject_lessons', id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function removeSubjectLessonRemote(lessonId: string): Promise<void> {
  const path = `subject_lessons/${lessonId}`;
  try {
    await deleteDoc(doc(db, 'subject_lessons', lessonId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeRemoteGames(onData: (games: CustomGame[]) => void): () => void {
  const path = 'games';
  return onSnapshot(
    query(collection(db, path), where('isPublic', '==', true)),
    (snap) => {
      const docs = [...snap.docs].sort(
        (a, b) => toMillis(a.data().createdAt) - toMillis(b.data().createdAt)
      );
      onData(
        docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title),
            titleEn: data.titleEn ? String(data.titleEn) : undefined,
            topic: isValidGameTopic(data.topic) ? data.topic : undefined,
            imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
            sourceType: data.sourceType as CustomGame['sourceType'],
            url: data.url ? String(data.url) : undefined,
            playUrl: data.playUrl ? String(data.playUrl) : undefined,
            entryFile: data.entryFile ? String(data.entryFile) : undefined,
            runtimeStatus: data.runtimeStatus
              ? (String(data.runtimeStatus) as CustomGame['runtimeStatus'])
              : undefined,
            fileName: data.fileName ? String(data.fileName) : undefined,
            fileSizeLabel: data.fileSizeLabel ? String(data.fileSizeLabel) : undefined,
            htmlContent: data.htmlContent ? String(data.htmlContent) : undefined,
            createdAt: new Date().toISOString(),
          };
        })
      );
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function addGameRemote(game: CustomGame): Promise<void> {
  const safeId = game.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || makeSafeId('game');
  const path = `games/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      isPublic: true,
      title: clampStr(game.title, 120, 'Trò chơi Thỏ Mây'),
      sourceType: game.sourceType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (game.titleEn) payload.titleEn = clampStr(game.titleEn, 120);
    if (game.topic && isValidGameTopic(game.topic)) payload.topic = game.topic;
    if (game.imageUrl) payload.imageUrl = clampStr(game.imageUrl, 250000);
    if (game.url) payload.url = clampStr(game.url, 1000);
    if (game.playUrl) payload.playUrl = clampStr(game.playUrl, 500);
    if (game.entryFile) payload.entryFile = clampStr(game.entryFile, 200);
    if (game.runtimeStatus) payload.runtimeStatus = clampStr(game.runtimeStatus, 40);
    if (game.fileName) payload.fileName = clampStr(game.fileName, 200);
    if (game.fileSizeLabel) payload.fileSizeLabel = clampStr(game.fileSizeLabel, 40);
    if (game.htmlContent && game.htmlContent.length <= 750000) {
      payload.htmlContent = game.htmlContent;
    }
    await setDoc(doc(db, 'games', safeId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateGameRemote(game: CustomGame): Promise<void> {
  const safeId = game.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (!safeId) return;
  const path = `games/${safeId}`;
  try {
    const patch: Record<string, unknown> = {
      title: clampStr(game.title, 120, 'Trò chơi Thỏ Mây'),
      sourceType: game.sourceType,
      updatedAt: serverTimestamp(),
      titleEn: game.titleEn?.trim() ? clampStr(game.titleEn, 120) : deleteField(),
      topic:
        game.topic && isValidGameTopic(game.topic)
          ? game.topic
          : deleteField(),
      imageUrl: game.imageUrl?.trim()
        ? clampStr(game.imageUrl, 250000)
        : deleteField(),
      url: game.url?.trim() ? clampStr(game.url, 1000) : deleteField(),
      playUrl: game.playUrl?.trim() ? clampStr(game.playUrl, 500) : deleteField(),
      entryFile: game.entryFile?.trim()
        ? clampStr(game.entryFile, 200)
        : deleteField(),
      runtimeStatus: game.runtimeStatus
        ? clampStr(game.runtimeStatus, 40)
        : deleteField(),
      fileName: game.fileName?.trim()
        ? clampStr(game.fileName, 200)
        : deleteField(),
      fileSizeLabel: game.fileSizeLabel?.trim()
        ? clampStr(game.fileSizeLabel, 40)
        : deleteField(),
      htmlContent:
        game.htmlContent && game.htmlContent.length <= 750000
          ? game.htmlContent
          : deleteField(),
    };
    await updateDoc(doc(db, 'games', safeId), patch);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function removeGameRemote(gameId: string): Promise<void> {
  const path = `games/${gameId}`;
  try {
    await deleteDoc(doc(db, 'games', gameId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeQuizResults(onData: (results: QuizResult[]) => void): () => void {
  const path = 'quiz_results';
  return onSnapshot(
    query(collection(db, path), where('isPublic', '==', true)),
    (snap) => {
      if (snap.empty) return;
      const docs = [...snap.docs].sort(
        (a, b) => toMillis(b.data().createdAt) - toMillis(a.data().createdAt)
      );
      onData(
        docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            studentName: String(data.studentName),
            teamId: Number(data.teamId),
            topic: data.topic as QuizResult['topic'],
            topicLabel: String(data.topicLabel),
            correctCount: Number(data.correctCount),
            totalCount: Number(data.totalCount),
            starsEarned: Number(data.starsEarned),
            completedAt: String(data.completedAt),
          };
        })
      );
    },
    (err) => {
      if (String(err).includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }
  );
}

export async function addQuizResultRemote(result: QuizResult): Promise<void> {
  const safeId = result.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || makeSafeId('qr');
  const path = `quiz_results/${safeId}`;
  try {
    await setDoc(doc(db, 'quiz_results', safeId), {
      isPublic: true,
      studentName: clampStr(result.studentName, 100, 'Học sinh'),
      teamId: Math.min(4, Math.max(1, Math.round(result.teamId))),
      topic: result.topic,
      topicLabel: clampStr(result.topicLabel, 100),
      correctCount: Math.max(0, Math.min(50, result.correctCount)),
      totalCount: Math.max(1, Math.min(50, result.totalCount)),
      starsEarned: Math.max(0, Math.min(10, result.starsEarned)),
      completedAt: clampStr(result.completedAt, 40),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function clearQuizResultsRemote(): Promise<void> {
  const path = 'quiz_results';
  try {
    const snap = await getDocs(
      query(collection(db, path), where('isPublic', '==', true))
    );
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
