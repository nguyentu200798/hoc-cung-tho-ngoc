import type { RouteTab, StudentRecord } from '../types/classroom';

const ACTIVE_STUDENT_KEY = 'tho_may_317_active_student_v1';

export function normalizeVietnameseText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim()
    .toLowerCase();
}

export function filterStudentsByQuery(
  students: StudentRecord[],
  query: string
): StudentRecord[] {
  const cleanQuery = normalizeVietnameseText(query);
  if (!cleanQuery) return students;
  return students.filter((s) =>
    normalizeVietnameseText(s.name).includes(cleanQuery)
  );
}

export function shouldAutoShowStudentPicker(params: {
  activeStudentName: string;
  activeRoute: RouteTab;
  search?: string;
  dismissedForSession: boolean;
}): boolean {
  if (params.activeStudentName.trim().length > 0) return false;
  if (params.activeRoute === 'teacher') return false;
  if (params.dismissedForSession) return false;
  if (params.search && /(?:\?|&)autostart=1(?:&|$)/.test(params.search)) {
    return false;
  }
  return true;
}

export function loadActiveStudentName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (window.localStorage.getItem(ACTIVE_STUDENT_KEY) ?? '').trim();
  } catch {
    return '';
  }
}

export function saveActiveStudentName(name: string): string {
  const cleaned = name.trim().slice(0, 100);
  if (typeof window !== 'undefined') {
    try {
      if (cleaned) {
        window.localStorage.setItem(ACTIVE_STUDENT_KEY, cleaned);
      } else {
        window.localStorage.removeItem(ACTIVE_STUDENT_KEY);
      }
    } catch {
      // Ignore storage quota / private mode errors
    }
  }
  return cleaned;
}
