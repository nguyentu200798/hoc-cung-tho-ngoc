export type AuthMismatchCategory =
  | 'domain'
  | 'origin'
  | 'credentials'
  | 'storage-or-cookie'
  | 'popup-blocked'
  | 'network'
  | 'user-cancelled'
  | 'unknown';

export interface AuthRuntimeSnapshot {
  origin: string;
  hostname: string;
  href: string;
  hash: string;
  authDomain: string;
  projectId: string;
  sameOriginAuthHandler: boolean;
  cookiesEnabled: boolean | null;
  sessionStorageAvailable: boolean;
  localStorageAvailable: boolean;
}

export interface SerializedAuthErrorDetails {
  code: string;
  name: string;
  message: string;
  mismatchCategory: AuthMismatchCategory;
  pinpointSummary: string;
  customData: Record<string, unknown> | null;
  rawKeys: string[];
}

export type AuthRedirectLogStage =
  | 'init'
  | 'redirect:start'
  | 'redirect:start:error'
  | 'redirect:resume:check'
  | 'redirect:resume:result'
  | 'redirect:resume:error'
  | 'app:redirect-error'
  | 'auth:state';

const SENSITIVE_KEY_PATTERN =
  /token|secret|password|credential|oauthAccessToken|idToken|refreshToken/i;

function sanitizeRecord(
  value: unknown,
  depth = 0
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 2) {
    return null;
  }
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      output[key] = '[REDACTED]';
      continue;
    }
    if (
      entry === null ||
      typeof entry === 'string' ||
      typeof entry === 'number' ||
      typeof entry === 'boolean'
    ) {
      output[key] = entry;
    } else if (typeof entry === 'object' && !Array.isArray(entry)) {
      const nested = sanitizeRecord(entry, depth + 1);
      if (nested) output[key] = nested;
    }
  }
  return Object.keys(output).length > 0 ? output : null;
}

function testWebStorage(kind: 'sessionStorage' | 'localStorage'): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const store = window[kind];
    const probeKey = '__tho_may_auth_probe__';
    store.setItem(probeKey, '1');
    store.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

export function buildRedirectFlowDiagnosticsContext(config?: {
  authDomain?: string;
  projectId?: string;
  origin?: string;
  hostname?: string;
  href?: string;
  hash?: string;
  cookiesEnabled?: boolean | null;
  sessionStorageAvailable?: boolean;
  localStorageAvailable?: boolean;
}): AuthRuntimeSnapshot {
  const hasWindow = typeof window !== 'undefined';
  const origin =
    config?.origin ?? (hasWindow ? window.location.origin : '');
  const hostname =
    config?.hostname ?? (hasWindow ? window.location.hostname : '');
  const href =
    config?.href ?? (hasWindow ? window.location.href : '');
  const hash =
    config?.hash ?? (hasWindow ? window.location.hash : '');
  const authDomain = config?.authDomain ?? '';
  const projectId = config?.projectId ?? '';
  const hostFromOrigin = origin.replace(/^https?:\/\//i, '').toLowerCase();

  return {
    origin,
    hostname,
    href,
    hash,
    authDomain,
    projectId,
    sameOriginAuthHandler:
      Boolean(authDomain) &&
      Boolean(hostFromOrigin) &&
      authDomain.trim().toLowerCase() === hostFromOrigin,
    cookiesEnabled:
      config?.cookiesEnabled !== undefined
        ? config.cookiesEnabled
        : typeof navigator !== 'undefined'
          ? navigator.cookieEnabled
          : null,
    sessionStorageAvailable:
      config?.sessionStorageAvailable ?? testWebStorage('sessionStorage'),
    localStorageAvailable:
      config?.localStorageAvailable ?? testWebStorage('localStorage'),
  };
}

export function extractFirebaseAuthErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') {
    if (typeof error === 'string') {
      const match = error.match(/auth\/[a-z0-9-]+/i);
      return match ? match[0].toLowerCase() : '';
    }
    return '';
  }

  const maybeCode = (error as { code?: unknown }).code;
  if (typeof maybeCode === 'string' && maybeCode.trim()) {
    return maybeCode.trim().toLowerCase();
  }

  const maybeMessage = (error as { message?: unknown }).message;
  if (typeof maybeMessage === 'string') {
    const match = maybeMessage.match(/auth\/[a-z0-9-]+/i);
    if (match) return match[0].toLowerCase();
  }

  return '';
}

export function classifyAuthErrorMismatch(
  code: string,
  message = ''
): { category: AuthMismatchCategory; pinpointSummary: string } {
  const lowerMsg = message.toLowerCase();

  if (
    code === 'auth/unauthorized-domain' ||
    code === 'auth/unauthorized-continue-uri' ||
    code === 'auth/invalid-continue-uri' ||
    code === 'auth/auth-domain-config-required' ||
    lowerMsg.includes('redirect_uri_mismatch')
  ) {
    return {
      category: 'domain',
      pinpointSummary:
        'Domain / Redirect URI mismatch: verify hostname in Firebase Authorized domains and /__/auth/handler in Google Cloud OAuth Authorized redirect URIs.',
    };
  }

  if (
    code === 'auth/app-not-authorized' ||
    code === 'auth/invalid-api-key' ||
    lowerMsg.includes('referer') ||
    lowerMsg.includes('origin')
  ) {
    return {
      category: 'origin',
      pinpointSummary:
        'Origin / HTTP Referrer mismatch: verify origin in Google Cloud OAuth Authorized JavaScript origins and API key HTTP referrer restrictions.',
    };
  }

  if (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-oauth-client-id' ||
    code === 'auth/invalid-oauth-provider' ||
    code === 'auth/internal-error' ||
    lowerMsg.includes('invalid_client') ||
    lowerMsg.includes('deleted_client')
  ) {
    return {
      category: 'credentials',
      pinpointSummary:
        'Credentials / Provider mismatch: verify Google Sign-In is enabled in Firebase Auth, OAuth client ID exists, and OAuth consent screen allows this account.',
    };
  }

  if (
    code === 'auth/web-storage-unsupported' ||
    code === 'auth/redirect-operation-pending' ||
    code === 'auth/missing-initial-state' ||
    lowerMsg.includes('missing initial state') ||
    lowerMsg.includes('sessionstorage')
  ) {
    return {
      category: 'storage-or-cookie',
      pinpointSummary:
        'Storage / Third-party cookie partitioning: browser cleared or partitioned sessionStorage/cookies during cross-origin redirect to firebaseapp.com.',
    };
  }

  if (
    code === 'auth/popup-blocked' ||
    code === 'auth/operation-not-supported-in-this-environment'
  ) {
    return {
      category: 'popup-blocked',
      pinpointSummary:
        'Popup blocked or unsupported environment; fallback redirect flow required.',
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      category: 'network',
      pinpointSummary:
        'Network failure contacting Google/Firebase Auth endpoints.',
    };
  }

  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/redirect-cancelled-by-user' ||
    code === 'auth/cancelled-popup-request'
  ) {
    return {
      category: 'user-cancelled',
      pinpointSummary:
        'Sign-in flow was cancelled or superseded by the user.',
    };
  }

  return {
    category: 'unknown',
    pinpointSummary:
      'Unclassified Firebase Auth error; inspect raw error object, customData, origin, and authDomain.',
  };
}

export function serializeAuthErrorDetails(
  error: unknown
): SerializedAuthErrorDetails {
  const code = extractFirebaseAuthErrorCode(error);
  const name =
    error && typeof error === 'object' && typeof (error as { name?: unknown }).name === 'string'
      ? (error as { name: string }).name
      : error instanceof Error
        ? error.name
        : typeof error;
  const message =
    error instanceof Error
      ? error.message
      : error &&
          typeof error === 'object' &&
          typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : String(error ?? '');

  const customData =
    error && typeof error === 'object' && 'customData' in error
      ? sanitizeRecord((error as { customData?: unknown }).customData)
      : null;

  const rawKeys =
    error && typeof error === 'object'
      ? Object.getOwnPropertyNames(error)
      : [];

  const { category, pinpointSummary } = classifyAuthErrorMismatch(code, message);

  return {
    code: code || 'unknown',
    name,
    message,
    mismatchCategory: category,
    pinpointSummary,
    customData,
    rawKeys,
  };
}

export function logAuthRedirectEvent(
  stage: AuthRedirectLogStage,
  details: Record<string, unknown>,
  rawError?: unknown
): void {
  if (typeof console === 'undefined') return;
  const prefix = `[Thỏ Mây Auth · Redirect] ${stage}`;
  const isErrorStage = stage.endsWith(':error') || stage === 'app:redirect-error';
  const serializedError =
    rawError !== undefined ? serializeAuthErrorDetails(rawError) : null;
  const payload = serializedError
    ? {
        errorCode: serializedError.code,
        mismatchCategory: serializedError.mismatchCategory,
        pinpointSummary: serializedError.pinpointSummary,
        timestamp: new Date().toISOString(),
        ...details,
        errorDetails: serializedError,
      }
    : {
        timestamp: new Date().toISOString(),
        ...details,
      };

  if (isErrorStage) {
    console.error(prefix, payload);
    if (rawError !== undefined) {
      console.error(`${prefix} raw error object:`, rawError);
    }
    return;
  }

  if (stage === 'redirect:resume:result' && details.possibleCookiePartitioning) {
    console.warn(prefix, payload);
    return;
  }

  console.info(prefix, payload);
}

export function shouldFallbackToRedirect(errorCode: string): boolean {
  return (
    errorCode === 'auth/popup-blocked' ||
    errorCode === 'auth/operation-not-supported-in-this-environment'
  );
}

export function isSessionExpiredErrorCode(errorCode: string): boolean {
  return (
    errorCode === 'auth/user-token-expired' ||
    errorCode === 'auth/invalid-user-token' ||
    errorCode === 'auth/user-disabled'
  );
}

export function formatFirebaseAuthErrorMessage(
  error: unknown,
  currentHostname = ''
): string {
  const code = extractFirebaseAuthErrorCode(error);
  const hostLabel = currentHostname.trim() || 'tên miền hiện tại';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ đăng nhập Google đã được đóng trước khi hoàn tất. Vui lòng thử lại nhé.';
    case 'auth/cancelled-popup-request':
      return 'Yêu cầu đăng nhập trước đó đã bị hủy do mở cửa sổ mới. Vui lòng bấm đăng nhập lại.';
    case 'auth/redirect-cancelled-by-user':
    case 'auth/redirect-operation-pending':
      return 'Phiên chuyển hướng Google đang được xử lý hoặc đã bị hủy. Vui lòng thử đăng nhập lại.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đang chặn cửa sổ pop-up đăng nhập Google. Hãy cho phép pop-up hoặc dùng nút "Đăng nhập bằng chuyển hướng" bên dưới.';
    case 'auth/unauthorized-domain':
      return `Tên miền "${hostLabel}" chưa được cấp phép trong Firebase Authentication (Lỗi auth/unauthorized-domain). Vui lòng thêm "${hostLabel}" vào Firebase Console > Authentication > Settings > Authorized domains.`;
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập Google chưa được bật trong Firebase Authentication (Lỗi auth/operation-not-allowed).';
    case 'auth/unauthorized-continue-uri':
    case 'auth/invalid-continue-uri':
      return `Đường dẫn chuyển hướng của tên miền "${hostLabel}" chưa khớp cấu hình OAuth (Lỗi ${code}). Hãy kiểm tra Authorized redirect URIs và Authorized domains.`;
    case 'auth/network-request-failed':
      return 'Không thể kết nối máy chủ xác thực Google/Firebase. Vui lòng kiểm tra kết nối mạng và thử lại.';
    case 'auth/invalid-api-key':
    case 'auth/app-not-authorized':
      return `Khóa cấu hình Firebase API Key chưa được cấp phép cho tên miền "${hostLabel}" (${code}). Hãy kiểm tra HTTP referrer restrictions trên Google Cloud Console.`;
    case 'auth/user-token-expired':
    case 'auth/invalid-user-token':
      return 'Phiên đăng nhập Google đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản cô Tú.';
    case 'auth/web-storage-unsupported':
      return 'Trình duyệt đang tắt Cookie/Storage bên thứ ba khiến Firebase Auth không lưu được phiên. Hãy bật Cookie hoặc dùng nút Đăng nhập bằng chuyển hướng.';
    case 'auth/auth-domain-config-required':
    case 'auth/internal-error':
      return `Máy chủ xác thực báo lỗi cấu hình cho "${hostLabel}" (${code}). Hãy kiểm tra Google Sign-In đã bật trên Firebase và thử nút "Đăng nhập bằng chuyển hướng" bên dưới.`;
    default:
      return code
        ? `Đăng nhập Google chưa thành công (Mã lỗi: ${code} · Tên miền: ${hostLabel}). Vui lòng thử lại hoặc dùng nút Đăng nhập bằng chuyển hướng.`
        : `Đăng nhập Google không thành công trên "${hostLabel}". Vui lòng kiểm tra kết nối, cho phép pop-up/cookie và thử lại.`;
  }
}

export function resolvePendingTeacherRedirectRoute(
  hasPendingRedirect: boolean,
  currentHash: string
): boolean {
  if (!hasPendingRedirect) return false;
  const cleaned = currentHash.replace(/^#/, '').trim();
  return cleaned === '' || cleaned === 'home' || cleaned === 'teacher';
}
