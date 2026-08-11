import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleAuthProvider: GoogleAuthProvider | null = null;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleAuthProvider = new GoogleAuthProvider();
    googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
  } catch (err) {
    console.warn('Firebase initialization skipped or failed:', err);
  }
}

export function getFirebaseAuthErrorMessage(err: any): string {
  if (!err) return 'Authentication failed. Please try again.';
  const code = String(err.code || err.message || '');
  if (code.includes('auth/unauthorized-domain')) {
    return 'Domain Unauthorized: This preview domain is not listed under Firebase Authorized Domains in Firebase Console. You can select your registered email in the Sandbox Account Selector below.';
  }
  if (code.includes('auth/popup-blocked')) {
    return 'Popup Blocked: Your browser blocked the Google authentication popup window in this preview frame. Please allow popups or select your registered email below.';
  }
  if (code.includes('auth/operation-not-allowed')) {
    return 'Google Sign-In Provider Disabled: Google auth is not enabled in Firebase Console. Please enable Google Sign-In under Firebase Authentication -> Sign-in method.';
  }
  if (code.includes('auth/popup-closed-by-user')) {
    return 'Sign-In Cancelled: The Google authentication popup was closed before completion.';
  }
  return err.message || 'Authentication failed. Please try again.';
}

export function safeOnAuthStateChanged(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, callback);
  } catch (err) {
    console.warn('onAuthStateChanged error:', err);
    callback(null);
    return () => {};
  }
}

export async function safeSignInWithPopup() {
  if (!auth || !googleAuthProvider) {
    throw new Error('Firebase Auth is not configured on this host.');
  }
  return signInWithPopup(auth, googleAuthProvider);
}

export async function safeSignOut() {
  if (!auth) return;
  return signOut(auth);
}

export { app, auth, db, googleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User };
