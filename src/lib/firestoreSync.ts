import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, safeSignOut } from './firebase';
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
  INITIAL_ORGANISATIONS,
  INITIAL_MEMBERS,
  INITIAL_CREWS,
  INITIAL_SYLLABUS,
  INITIAL_PROGRESS,
  INITIAL_EVENTS,
  INITIAL_ATTENDANCE,
  INITIAL_JOURNALS,
  INITIAL_DISCIPLINARY,
  INITIAL_MEETING_MINUTES,
  INITIAL_ROVER_POLICY,
  INITIAL_POLICY_POLLS,
  INITIAL_FEE_REQUESTS,
  INITIAL_PAYMENT_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
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
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.warn('Firestore Notice:', JSON.stringify(errInfo));
}

// Helper to seed initial data if collection is empty
async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string,
  initialData: T[]
) {
  if (!db) return;
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
  if (!db) return;
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
  if (!db) return;
  seedCollectionIfEmpty('organisations', INITIAL_ORGANISATIONS);
  seedCollectionIfEmpty('members', INITIAL_MEMBERS);
  seedCollectionIfEmpty('crews', INITIAL_CREWS);
  seedCollectionIfEmpty('syllabus', INITIAL_SYLLABUS);
  seedCollectionIfEmpty('progress', INITIAL_PROGRESS);
  seedCollectionIfEmpty('journals', INITIAL_JOURNALS);
  seedCollectionIfEmpty('events', INITIAL_EVENTS);
  seedCollectionIfEmpty('attendance', INITIAL_ATTENDANCE);
  seedCollectionIfEmpty('disciplinary', INITIAL_DISCIPLINARY);
  seedCollectionIfEmpty('minutes', INITIAL_MEETING_MINUTES);
  seedCollectionIfEmpty('policy', [INITIAL_ROVER_POLICY]);
  seedCollectionIfEmpty('polls', INITIAL_POLICY_POLLS);
  seedCollectionIfEmpty('fee_requests', INITIAL_FEE_REQUESTS);
  seedCollectionIfEmpty('payment_transactions', INITIAL_PAYMENT_TRANSACTIONS);
  seedCollectionIfEmpty('audit_logs', INITIAL_AUDIT_LOGS);
  seedSettingsIfEmpty(INITIAL_SETTINGS);
}

// Subscribe to a single document
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
) {
  if (!db) {
    return () => {};
  }
  try {
    const docRef = doc(db, collectionName, docId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as T);
        } else {
          callback(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${collectionName}/${docId}`);
    return () => {};
  }
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export function subscribeToSyncStatus(callback: (status: SyncStatus, lastSyncedAt?: Date) => void) {
  if (!db) {
    callback('offline');
    return () => {};
  }

  let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const handleOnline = () => {
    isOnline = true;
    callback('syncing');
  };

  const handleOffline = () => {
    isOnline = false;
    callback('offline');
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  try {
    const colRef = collection(db, 'settings');
    const unsubscribe = onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          callback('offline');
        } else if (snapshot.metadata.hasPendingWrites) {
          callback('syncing');
        } else {
          callback('synced', new Date());
        }
      },
      (error) => {
        console.warn('Firestore sync status notice:', error);
        callback('offline');
      }
    );

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      unsubscribe();
    };
  } catch (err) {
    callback('offline');
    return () => {};
  }
}

// Subscribe to real-time updates for a collection
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void
) {
  if (!db) {
    return () => {};
  }

  try {
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
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, collectionName);
    return () => {};
  }
}

// Generic saver for single or list items
export async function saveDocumentToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T
) {
  if (!db) return;
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
  if (!db) return;
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
  if (!db) return;
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
  if (!db) return;
  try {
    const docRef = doc(db, 'settings', 'portal');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/portal');
  }
}
