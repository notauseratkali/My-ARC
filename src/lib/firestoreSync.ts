import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Member,
  CrewEvent,
  AttendanceRecord,
  JournalEntry,
  DisciplinaryIncident,
  MeetingMinutes,
  PortalSettings,
} from '../types';
import {
  INITIAL_MEMBERS,
  INITIAL_EVENTS,
  INITIAL_ATTENDANCE,
  INITIAL_JOURNALS,
  INITIAL_DISCIPLINARY,
  INITIAL_MEETING_MINUTES,
  INITIAL_SETTINGS,
} from '../data/initialData';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Helper to seed initial data if collection is empty
async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string,
  initialData: T[]
) {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && initialData.length > 0) {
      const batch = writeBatch(db);
      initialData.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
      console.log(`Seeded ${initialData.length} items to ${collectionName}`);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
  }
}

async function seedSettingsIfEmpty(initialSettings: PortalSettings) {
  try {
    const docRef = doc(db, 'settings', 'portal');
    const snapshot = await getDocs(collection(db, 'settings'));
    if (snapshot.empty) {
      await setDoc(docRef, initialSettings);
      console.log('Seeded initial settings');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/portal');
  }
}

export function initializeFirestoreDatabase() {
  seedCollectionIfEmpty('members', INITIAL_MEMBERS);
  seedCollectionIfEmpty('events', INITIAL_EVENTS);
  seedCollectionIfEmpty('attendance', INITIAL_ATTENDANCE);
  seedCollectionIfEmpty('journals', INITIAL_JOURNALS);
  seedCollectionIfEmpty('disciplinary', INITIAL_DISCIPLINARY);
  seedCollectionIfEmpty('minutes', INITIAL_MEETING_MINUTES);
  seedSettingsIfEmpty(INITIAL_SETTINGS);
}

// Subscribe to real-time updates for a collection
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void
) {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as T);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
    }
  );
}

// Generic saver for single or list items
export async function saveDocumentToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T
) {
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${item.id}`);
  }
}

export async function deleteDocumentFromFirestore(
  collectionName: string,
  id: string
) {
  try {
    const docRef = doc(db, collectionName, id);
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

export async function saveBatchToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[]
) {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
  }
}

export async function saveSettingsToFirestore(settings: PortalSettings) {
  try {
    const docRef = doc(db, 'settings', 'portal');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/portal');
  }
}

