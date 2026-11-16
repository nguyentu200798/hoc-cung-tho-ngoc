import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTeacherSessionCookieHeader,
  createTeacherSessionToken,
  parseCookieValue,
  TEACHER_SESSION_COOKIE_NAME,
  TEACHER_SESSION_TTL_MS,
  verifyTeacherPassword,
  verifyTeacherSessionToken,
} from './teacherAuth';

test('verifyTeacherPassword accepts exact teacher password and rejects wrong/empty inputs', () => {
  assert.equal(verifyTeacherPassword('nguyentu200798'), true);
  assert.equal(verifyTeacherPassword('  nguyentu200798  '), true);
  assert.equal(verifyTeacherPassword('nguyentu200798@gmail.com'), false);
  assert.equal(verifyTeacherPassword('wrong-password'), false);
  assert.equal(verifyTeacherPassword(''), false);
  assert.equal(verifyTeacherPassword('   '), false);
  assert.equal(verifyTeacherPassword('custom-pass', 'custom-pass'), true);
  assert.equal(verifyTeacherPassword('nguyentu200798', 'custom-pass'), false);
});

test('teacher session tokens validate signatures, expiration, and reject tampering', () => {
  const now = 1_700_000_000_000;
  const secret = 'test-session-secret-key-12345';
  const token = createTeacherSessionToken(now, secret);

  assert.equal(verifyTeacherSessionToken(token, now + 1000, secret), true);
  assert.equal(
    verifyTeacherSessionToken(token, now + TEACHER_SESSION_TTL_MS + 1, secret),
    false
  );
  assert.equal(verifyTeacherSessionToken(`${token}tampered`, now + 1000, secret), false);
  assert.equal(verifyTeacherSessionToken(token, now + 1000, 'different-secret-key'), false);
  assert.equal(verifyTeacherSessionToken(null, now, secret), false);
});

test('parseCookieValue and buildTeacherSessionCookieHeader handle HTTP/HTTPS cookies safely', () => {
  const token = 'abc.def';
  const httpsCookie = buildTeacherSessionCookieHeader(token, true);
  assert.match(httpsCookie, /HttpOnly/);
  assert.match(httpsCookie, /SameSite=None; Secure/);

  const httpCookie = buildTeacherSessionCookieHeader(token, false);
  assert.match(httpCookie, /HttpOnly/);
  assert.match(httpCookie, /SameSite=Lax/);
  assert.doesNotMatch(httpCookie, /Secure/);

  const cleared = buildTeacherSessionCookieHeader('', true, true);
  assert.match(cleared, /Max-Age=0/);

  const parsed = parseCookieValue(
    `foo=bar; ${TEACHER_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; theme=sky`,
    TEACHER_SESSION_COOKIE_NAME
  );
  assert.equal(parsed, token);
});
