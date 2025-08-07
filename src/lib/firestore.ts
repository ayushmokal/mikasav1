import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// User interface
export interface FirebaseUser {
  id?: string;
  uid: string; // Firebase Auth UID
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
  accountEmail: string;
  accountPassword: string;
  plan: {
    name: string;
    price: number;
    dueDate: string;
    status: 'active' | 'expired' | 'pending';
  };
  joinDate: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create a new user document
export const createUser = async (userData: Omit<FirebaseUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const userDoc = {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'users'), userDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user by Firebase Auth UID
export const getUserByUid = async (uid: string): Promise<FirebaseUser | null> => {
  try {
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FirebaseUser;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    throw error;
  }
};

// Get user by document ID
export const getUserById = async (id: string): Promise<FirebaseUser | null> => {
  try {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirebaseUser;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Get all users (admin only)
export const getAllUsers = async (): Promise<FirebaseUser[]> => {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirebaseUser[];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (id: string, updates: Partial<FirebaseUser>): Promise<void> => {
  try {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Update user plan
export const updateUserPlan = async (id: string, plan: FirebaseUser['plan']): Promise<void> => {
  try {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, {
      plan,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }
};

// Get users by plan status
export const getUsersByPlanStatus = async (status: 'active' | 'expired' | 'pending'): Promise<FirebaseUser[]> => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('plan.status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirebaseUser[];
  } catch (error) {
    console.error('Error getting users by plan status:', error);
    throw error;
  }
};

// Batch operations for admin
export const batchUpdateUsers = async (updates: Array<{ id: string; data: Partial<FirebaseUser> }>): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    updates.forEach(({ id, data }) => {
      const docRef = doc(db, 'users', id);
      batch.update(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error batch updating users:', error);
    throw error;
  }
};
