import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  deleteDoc, 
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, SavedContent, OperationType } from '../types';

// Implementation of handleFirestoreError as per instructions
interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const USER_COLLECTION = 'users';
export const SERMON_COLLECTION = 'sermons';

export const dbService = {
  // User Profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, USER_COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, 'get', `${USER_COLLECTION}/${uid}`);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const docRef = doc(db, USER_COLLECTION, profile.uid);
      await setDoc(docRef, {
        ...profile,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'write', `${USER_COLLECTION}/${profile.uid}`);
    }
  },

  // Sermons
  async saveSermon(sermon: SavedContent): Promise<void> {
    try {
      const id = sermon.id || doc(collection(db, SERMON_COLLECTION)).id;
      const docRef = doc(db, SERMON_COLLECTION, id);
      await setDoc(docRef, {
        ...sermon,
        id,
        createdAt: sermon.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'write', `${SERMON_COLLECTION}/${sermon.id}`);
    }
  },

  async getUserSermons(userId: string): Promise<SavedContent[]> {
    try {
      const q = query(
        collection(db, SERMON_COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as SavedContent);
    } catch (error) {
      handleFirestoreError(error, 'list', SERMON_COLLECTION);
      return [];
    }
  },

  async deleteSermon(sermonId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, SERMON_COLLECTION, sermonId));
    } catch (error) {
      handleFirestoreError(error, 'delete', `${SERMON_COLLECTION}/${sermonId}`);
    }
  }
};
