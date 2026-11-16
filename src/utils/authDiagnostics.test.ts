import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFirebaseAuthErrorCode,
  formatFirebaseAuthErrorMessage,
  isSessionExpiredErrorCode,
  resolvePendingTeacherRedirectRoute,
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
