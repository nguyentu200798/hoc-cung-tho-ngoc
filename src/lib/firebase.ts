import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onIdTokenChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  extractFirebaseAuthErrorCode,
  isSessionExpiredErrorCode,
  shouldFallbackToRedirect,
} from '../utils/authDiagnostics';

export const TEACHER_ALLOWED_EMAIL = 'nguyentu200798@gmail.com';
const PENDING_REDIRECT_KEY = 'tho_may_teacher_redirect_pending';

const customAuthDomain =
  typeof import.meta !== 'undefined' &&
  typeof import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN === 'string' &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN.trim()
    ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN.trim()
    : firebaseConfig.authDomain;

const effectiveFirebaseConfig = {
  ...firebaseConfig,
  authDomain: customAuthDomain,
};

const app = initializeApp(effectiveFirebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let persistencePromise: Promise<void> | null = null;

export function ensureTeacherAuthPersistence(): Promise<void> {
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch(
      async () => {
        try {
          await setPersistence(auth, browserSessionPersistence);
        } catch {
          // In-memory persistence remains active if browser storage is fully restricted
        }
      }
    );
  }
  return persistencePromise;
}

void ensureTeacherAuthPersistence();

export function isAuthorizedTeacher(user: User | null | undefined): boolean {
  if (!user || !user.email) return false;
  return (
    user.emailVerified === true &&
    user.email.trim().toLowerCase() === TEACHER_ALLOWED_EMAIL
  );
}

export function markPendingTeacherRedirect(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PENDING_REDIRECT_KEY, '1');
  } catch {
    // Ignore storage errors in restricted private browsing modes
  }
}

export function consumePendingTeacherRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hasPending = window.sessionStorage.getItem(PENDING_REDIRECT_KEY) === '1';
    if (hasPending) {
      window.sessionStorage.removeItem(PENDING_REDIRECT_KEY);
    }
    return hasPending;
  } catch {
    return false;
  }
}

export type GoogleSignInMode = 'auto' | 'popup' | 'redirect';

export async function signInTeacherWithGoogle(
  mode: GoogleSignInMode = 'auto'
): Promise<User | null> {
  await ensureTeacherAuthPersistence();

  if (mode === 'redirect') {
    markPendingTeacherRedirect();
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    const code = extractFirebaseAuthErrorCode(err);
    if (mode === 'auto' && shouldFallbackToRedirect(code)) {
      markPendingTeacherRedirect();
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function completeTeacherRedirectSignIn(): Promise<{
  user: User | null;
  returnedFromRedirect: boolean;
  error: unknown;
}> {
  await ensureTeacherAuthPersistence();
  const returnedFromRedirect = consumePendingTeacherRedirect();
  try {
    const result = await getRedirectResult(auth);
    return {
      user: result?.user ?? auth.currentUser ?? null,
      returnedFromRedirect: Boolean(result?.user) || returnedFromRedirect,
      error: null,
    };
  } catch (error) {
    return {
      user: auth.currentUser ?? null,
      returnedFromRedirect,
      error,
    };
  }
}

export function subscribeTeacherAuth(
  onUpdate: (user: User | null) => void
): () => void {
  return onIdTokenChanged(auth, (user) => {
    onUpdate(user);
  });
}

export async function verifyOrRefreshTeacherToken(
  user: User | null
): Promise<'valid' | 'expired' | 'signed-out'> {
  if (!user) return 'signed-out';
  try {
    await user.getIdToken(false);
    return 'valid';
  } catch (err) {
    const code = extractFirebaseAuthErrorCode(err);
    if (isSessionExpiredErrorCode(code)) {
      await signOut(auth).catch(() => undefined);
      return 'expired';
    }
    return 'valid';
  }
}

export async function signOutTeacher(): Promise<void> {
  consumePendingTeacherRedirect();
  await signOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
