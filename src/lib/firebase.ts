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
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
  } catch (err) {
    console.warn('Firebase initialization skipped or failed:', err);
  }
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
