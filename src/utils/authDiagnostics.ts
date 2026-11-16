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
    default:
      return code
        ? `Đăng nhập Google chưa thành công (Mã lỗi: ${code}). Vui lòng thử lại hoặc dùng nút Đăng nhập bằng chuyển hướng.`
        : 'Đăng nhập Google không thành công. Vui lòng kiểm tra kết nối, cho phép pop-up/cookie và thử lại.';
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
