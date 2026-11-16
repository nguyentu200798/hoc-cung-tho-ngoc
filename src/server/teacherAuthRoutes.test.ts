import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleTeacherLogin,
  handleTeacherLogout,
  handleTeacherSession,
} from './teacherAuthRoutes';
import { TEACHER_SESSION_COOKIE_NAME } from './teacherAuth';

const BASE = 'https://class.example.test';
const ENV_KEYS = ['VERCEL', 'TEACHER_PASSWORD', 'TEACHER_SESSION_SECRET'] as const;

function withEnv(vars: Partial<Record<(typeof ENV_KEYS)[number], string>>, fn: () => Promise<void>) {
  return async () => {
    const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    for (const k of ENV_KEYS) delete process.env[k];
    Object.assign(process.env, vars);
    try {
      await fn();
    } finally {
      for (const k of ENV_KEYS) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    }
  };
}

function loginRequest(body: string): Request {
  return new Request(`${BASE}/api/teacher/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

function sessionRequest(cookie?: string): Request {
  return new Request(`${BASE}/api/teacher/session`, {
    headers: cookie ? { cookie } : {},
  });
}

const configured = {
  VERCEL: '1',
  TEACHER_PASSWORD: 'route-test-password',
  TEACHER_SESSION_SECRET: 'route-test-session-secret-0123456789',
};

test(
  'login with the configured password sets a session cookie that the session route accepts',
  withEnv(configured, async () => {
    const res = await handleTeacherLogin(
      loginRequest(JSON.stringify({ password: 'route-test-password' }))
    );
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, authenticated: true });

    const setCookie = res.headers.get('set-cookie') ?? '';
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /Secure/);
    const cookiePair = setCookie.split(';')[0];
    assert.ok(cookiePair.startsWith(`${TEACHER_SESSION_COOKIE_NAME}=`));

    const session = handleTeacherSession(sessionRequest(cookiePair));
    assert.deepEqual(await session.json(), { ok: true, authenticated: true });
  })
);

test(
  'login rejects wrong, missing, non-string, and malformed passwords with JSON errors',
  withEnv(configured, async () => {
    const wrong = await handleTeacherLogin(loginRequest(JSON.stringify({ password: 'nope' })));
    assert.equal(wrong.status, 401);
    assert.equal(wrong.headers.get('set-cookie'), null);

    const empty = await handleTeacherLogin(loginRequest(JSON.stringify({ password: '  ' })));
    assert.equal(empty.status, 400);

    const nonString = await handleTeacherLogin(loginRequest(JSON.stringify({ password: { a: 1 } })));
    assert.equal(nonString.status, 400);

    const malformed = await handleTeacherLogin(loginRequest('{bad'));
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).authenticated, false);
  })
);

test(
  'the built-in default password and session secret are refused on Vercel',
  withEnv({ VERCEL: '1' }, async () => {
    const res = await handleTeacherLogin(loginRequest(JSON.stringify({ password: 'anything' })));
    assert.equal(res.status, 503);
    assert.equal(res.headers.get('set-cookie'), null);

    const session = handleTeacherSession(sessionRequest(`${TEACHER_SESSION_COOKIE_NAME}=x.y`));
    assert.deepEqual(await session.json(), { ok: true, authenticated: false });
  })
);

test(
  'a cookie signed with a different secret is rejected',
  withEnv(configured, async () => {
    const res = await handleTeacherLogin(
      loginRequest(JSON.stringify({ password: 'route-test-password' }))
    );
    const cookiePair = (res.headers.get('set-cookie') ?? '').split(';')[0];
    process.env.TEACHER_SESSION_SECRET = 'a-completely-different-secret-value';
    const session = handleTeacherSession(sessionRequest(cookiePair));
    assert.deepEqual(await session.json(), { ok: true, authenticated: false });
  })
);

test('logout clears the session cookie', async () => {
  const res = handleTeacherLogout(
    new Request(`${BASE}/api/teacher/logout`, { method: 'POST' })
  );
  assert.equal(res.status, 200);
  assert.match(res.headers.get('set-cookie') ?? '', /Max-Age=0/);
});
