import crypto from 'node:crypto';

export const TEACHER_SESSION_COOKIE_NAME = 'tho_may_teacher_session';
export const TEACHER_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const TEACHER_SESSION_TTL_SEC = Math.floor(TEACHER_SESSION_TTL_MS / 1000);

// Precomputed SHA-256 hex digest of the teacher portal password
const DEFAULT_TEACHER_PASSWORD_SHA256 =
  'bcf096e12ced0ad8a31129eb160904e4ef464c9c6622ca153c8dc0a9b2b9d26c';

function sha256Buffer(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

export function resolveExpectedPasswordDigest(overridePassword?: string): Buffer {
  const custom = (overridePassword ?? process.env.TEACHER_PASSWORD ?? '').trim();
  if (custom.length > 0) {
    return sha256Buffer(custom);
  }
  return Buffer.from(DEFAULT_TEACHER_PASSWORD_SHA256, 'hex');
}

export function verifyTeacherPassword(
  submittedPassword: string,
  overridePassword?: string
): boolean {
  if (typeof submittedPassword !== 'string') return false;
  const cleaned = submittedPassword.trim();
  if (!cleaned) return false;

  const candidateDigest = sha256Buffer(cleaned);
  const expectedDigest = resolveExpectedPasswordDigest(overridePassword);
  if (candidateDigest.length !== expectedDigest.length) {
    return false;
  }
  return crypto.timingSafeEqual(candidateDigest, expectedDigest);
}

export function resolveSessionSecret(overrideSecret?: string): string {
  const configured = (overrideSecret ?? process.env.TEACHER_SESSION_SECRET ?? '').trim();
  if (configured.length >= 16) {
    return configured;
  }
  return crypto
    .createHash('sha256')
    .update(`tho-may-3-17-session:${DEFAULT_TEACHER_PASSWORD_SHA256}`)
    .digest('hex');
}

interface TeacherSessionPayload {
  role: 'teacher';
  iat: number;
  exp: number;
}

function signPayload(encodedPayload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(encodedPayload, 'utf8')
    .digest('base64url');
}

export function createTeacherSessionToken(
  nowMs = Date.now(),
  secret = resolveSessionSecret()
): string {
  const payload: TeacherSessionPayload = {
    role: 'teacher',
    iat: nowMs,
    exp: nowMs + TEACHER_SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = signPayload(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifyTeacherSessionToken(
  token: string | undefined | null,
  nowMs = Date.now(),
  secret = resolveSessionSecret()
): boolean {
  if (!token || typeof token !== 'string') return false;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return false;

  const encoded = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!encoded || !providedSig) return false;

  const expectedSig = signPayload(encoded, secret);
  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return false;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as Partial<TeacherSessionPayload>;
    if (decoded.role !== 'teacher') return false;
    if (typeof decoded.exp !== 'number' || !Number.isFinite(decoded.exp)) return false;
    return decoded.exp > nowMs;
  } catch {
    return false;
  }
}

export function parseCookieValue(
  cookieHeader: string | undefined,
  cookieName: string
): string | null {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key !== cookieName) continue;
    const rawValue = part.slice(eqIdx + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }
  return null;
}

export function buildTeacherSessionCookieHeader(
  token: string,
  isHttps: boolean,
  clear = false
): string {
  const securityFlags = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
  if (clear) {
    return `${TEACHER_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; ${securityFlags}`;
  }
  return `${TEACHER_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Max-Age=${TEACHER_SESSION_TTL_SEC}; ${securityFlags}`;
}
