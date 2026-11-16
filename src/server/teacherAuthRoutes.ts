// Web-standard (Request -> Response) handlers for the teacher login API.
// Used by the Vercel Functions in /api/teacher, where server.ts does not run.
import {
  buildTeacherSessionCookieHeader,
  createTeacherSessionToken,
  parseCookieValue,
  TEACHER_SESSION_COOKIE_NAME,
  TeacherAuthConfigError,
  verifyTeacherPassword,
  verifyTeacherSessionToken,
} from './teacherAuth.js';

const MISSING_PASSWORD_MESSAGE = 'Vui lòng nhập mật khẩu giáo viên.';
const WRONG_PASSWORD_MESSAGE = 'Mật khẩu chưa đúng. Vui lòng kiểm tra lại và thử lại.';
const NOT_CONFIGURED_MESSAGE =
  'Máy chủ chưa được cấu hình mật khẩu giáo viên. Vui lòng liên hệ quản trị viên.';

function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function isHttpsRequest(request: Request): boolean {
  const forwardedProto = (request.headers.get('x-forwarded-proto') ?? '')
    .split(',')[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProto) return forwardedProto === 'https';
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

async function readSubmittedPassword(request: Request): Promise<string> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === 'object' && 'password' in body) {
      const raw = (body as { password?: unknown }).password;
      return typeof raw === 'string' ? raw : '';
    }
  } catch {
    // Malformed or empty JSON body: treat as missing password
  }
  return '';
}

export function handleTeacherSession(request: Request): Response {
  let authenticated = false;
  try {
    const token = parseCookieValue(
      request.headers.get('cookie') ?? undefined,
      TEACHER_SESSION_COOKIE_NAME
    );
    authenticated = verifyTeacherSessionToken(token);
  } catch (err) {
    if (err instanceof TeacherAuthConfigError) console.error(err.message);
    authenticated = false;
  }
  return jsonResponse({ ok: true, authenticated });
}

export async function handleTeacherLogin(request: Request): Promise<Response> {
  const password = await readSubmittedPassword(request);
  if (!password.trim()) {
    return jsonResponse(
      { ok: false, authenticated: false, error: MISSING_PASSWORD_MESSAGE },
      400
    );
  }

  try {
    if (!verifyTeacherPassword(password)) {
      return jsonResponse(
        { ok: false, authenticated: false, error: WRONG_PASSWORD_MESSAGE },
        401
      );
    }
    const token = createTeacherSessionToken();
    return jsonResponse({ ok: true, authenticated: true }, 200, {
      'Set-Cookie': buildTeacherSessionCookieHeader(token, isHttpsRequest(request), false),
    });
  } catch (err) {
    if (err instanceof TeacherAuthConfigError) {
      console.error(err.message);
      return jsonResponse(
        { ok: false, authenticated: false, error: NOT_CONFIGURED_MESSAGE },
        503
      );
    }
    throw err;
  }
}

export function handleTeacherLogout(request: Request): Response {
  return jsonResponse({ ok: true, authenticated: false }, 200, {
    'Set-Cookie': buildTeacherSessionCookieHeader('', isHttpsRequest(request), true),
  });
}
