import {
  INITIAL_QUIZ_RESULTS,
  INITIAL_STUDENTS,
  INITIAL_TASKS,
  INITIAL_TEAMS,
} from '../data/classroomSeed';
import type {
  QuizResult,
  StudentRecord,
  TeamScore,
  WeeklyTask,
} from '../types/classroom';

const KEYS = {
  results: 'tho_may_317_quiz_results_v2',
  teams: 'tho_may_317_teams_v2',
  students: 'tho_may_317_students_v2',
  tasks: 'tho_may_317_tasks_v2',
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

export function loadClassroomState() {
  return {
    quizResults: readJson<QuizResult[]>(KEYS.results, INITIAL_QUIZ_RESULTS),
    teams: readJson<TeamScore[]>(KEYS.teams, INITIAL_TEAMS),
    students: readJson<StudentRecord[]>(KEYS.students, INITIAL_STUDENTS),
    tasks: readJson<WeeklyTask[]>(KEYS.tasks, INITIAL_TASKS),
  };
}

export function saveQuizResults(data: QuizResult[]) {
  writeJson(KEYS.results, data);
}

export function saveTeams(data: TeamScore[]) {
  writeJson(KEYS.teams, data);
}

export function saveStudents(data: StudentRecord[]) {
  writeJson(KEYS.students, data);
}

export function saveTasks(data: WeeklyTask[]) {
  writeJson(KEYS.tasks, data);
}
