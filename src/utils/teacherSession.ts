export interface TeacherLoginResponse {
  ok: boolean;
  authenticated: boolean;
  error?: string;
}

export function validateTeacherPasswordInput(rawPassword: string): string | null {
  if (!rawPassword || !rawPassword.trim()) {
    return 'Vui lòng nhập mật khẩu giáo viên.';
  }
  return null;
}

export async function checkTeacherSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/teacher/session', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as Partial<TeacherLoginResponse>;
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function loginTeacherWithPassword(
  password: string
): Promise<TeacherLoginResponse> {
  const validationError = validateTeacherPasswordInput(password);
  if (validationError) {
    return {
      ok: false,
      authenticated: false,
      error: validationError,
    };
  }

  try {
    const res = await fetch('/api/teacher/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = (await res.json().catch(() => null)) as Partial<TeacherLoginResponse> | null;
    if (res.ok && data?.authenticated) {
      return { ok: true, authenticated: true };
    }

    return {
      ok: false,
      authenticated: false,
      error:
        data?.error ||
        'Mật khẩu chưa đúng. Vui lòng kiểm tra lại và thử lại.',
    };
  } catch {
    return {
      ok: false,
      authenticated: false,
      error: 'Không thể kết nối máy chủ để kiểm tra mật khẩu. Vui lòng thử lại.',
    };
  }
}

export async function logoutTeacherSession(): Promise<void> {
  try {
    await fetch('/api/teacher/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore transient network failures during local sign-out
  }
}
