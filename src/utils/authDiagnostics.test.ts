import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRedirectFlowDiagnosticsContext,
  classifyAuthErrorMismatch,
  extractFirebaseAuthErrorCode,
  formatFirebaseAuthErrorMessage,
  isSessionExpiredErrorCode,
  resolvePendingTeacherRedirectRoute,
  serializeAuthErrorDetails,
  shouldFallbackToRedirect,
} from './authDiagnostics';

test('extractFirebaseAuthErrorCode reads code property or parses auth code from message', () => {
  assert.equal(
    extractFirebaseAuthErrorCode({ code: 'auth/unauthorized-domain' }),
    'auth/unauthorized-domain'
  );
  assert.equal(
    extractFirebaseAuthErrorCode(new Error('Firebase: Error (auth/popup-blocked).')),
    'auth/popup-blocked'
  );
  assert.equal(extractFirebaseAuthErrorCode(null), '');
});

test('shouldFallbackToRedirect triggers only for blocked/unsupported popups', () => {
  assert.equal(shouldFallbackToRedirect('auth/popup-blocked'), true);
  assert.equal(
    shouldFallbackToRedirect('auth/operation-not-supported-in-this-environment'),
    true
  );
  assert.equal(shouldFallbackToRedirect('auth/popup-closed-by-user'), false);
  assert.equal(shouldFallbackToRedirect('auth/unauthorized-domain'), false);
});

test('formatFirebaseAuthErrorMessage surfaces actionable domain and OAuth errors', () => {
  const domainMsg = formatFirebaseAuthErrorMessage(
    { code: 'auth/unauthorized-domain' },
    'thomay.example.com'
  );
  assert.match(domainMsg, /thomay\.example\.com/);
  assert.match(domainMsg, /Authorized domains/);

  const popupMsg = formatFirebaseAuthErrorMessage({ code: 'auth/popup-blocked' });
  assert.match(popupMsg, /chuyển hướng/i);

  const expiredMsg = formatFirebaseAuthErrorMessage({ code: 'auth/user-token-expired' });
  assert.match(expiredMsg, /hết hạn/i);
  assert.equal(isSessionExpiredErrorCode('auth/user-token-expired'), true);
});

test('resolvePendingTeacherRedirectRoute restores teacher route after Google redirect', () => {
  assert.equal(resolvePendingTeacherRedirectRoute(true, ''), true);
  assert.equal(resolvePendingTeacherRedirectRoute(true, '#home'), true);
  assert.equal(resolvePendingTeacherRedirectRoute(true, '#teacher'), true);
  assert.equal(resolvePendingTeacherRedirectRoute(true, '#games'), false);
  assert.equal(resolvePendingTeacherRedirectRoute(false, ''), false);
});

test('classifyAuthErrorMismatch pinpoints domain, origin, credentials, and storage errors', () => {
  assert.equal(
    classifyAuthErrorMismatch('auth/unauthorized-domain').category,
    'domain'
  );
  assert.equal(
    classifyAuthErrorMismatch('auth/app-not-authorized').category,
    'origin'
  );
  assert.equal(
    classifyAuthErrorMismatch('auth/operation-not-allowed').category,
    'credentials'
  );
  assert.equal(
    classifyAuthErrorMismatch('auth/web-storage-unsupported').category,
    'storage-or-cookie'
  );
});

test('serializeAuthErrorDetails preserves safe customData and redacts tokens', () => {
  const err = Object.assign(new Error('Firebase: Error (auth/invalid-credential).'), {
    code: 'auth/invalid-credential',
    customData: {
      appName: '[DEFAULT]',
      email: 'teacher@example.com',
      _tokenResponse: { idToken: 'secret-jwt' },
      oauthAccessToken: 'secret-oauth',
    },
  });

  const details = serializeAuthErrorDetails(err);
  assert.equal(details.code, 'auth/invalid-credential');
  assert.equal(details.mismatchCategory, 'credentials');
  assert.equal(details.customData?.appName, '[DEFAULT]');
  assert.equal(details.customData?.email, 'teacher@example.com');
  assert.equal(details.customData?._tokenResponse, '[REDACTED]');
  assert.equal(details.customData?.oauthAccessToken, '[REDACTED]');
});

test('buildRedirectFlowDiagnosticsContext detects same-origin vs cross-origin authDomain', () => {
  const crossOrigin = buildRedirectFlowDiagnosticsContext({
    origin: 'https://ais-pre-example.run.app',
    hostname: 'ais-pre-example.run.app',
    authDomain: 'gen-lang-client.firebaseapp.com',
    projectId: 'gen-lang-client',
  });
  assert.equal(crossOrigin.sameOriginAuthHandler, false);

  const sameOrigin = buildRedirectFlowDiagnosticsContext({
    origin: 'https://ais-pre-example.run.app',
    hostname: 'ais-pre-example.run.app',
    authDomain: 'ais-pre-example.run.app',
    projectId: 'gen-lang-client',
  });
  assert.equal(sameOrigin.sameOriginAuthHandler, true);
});
