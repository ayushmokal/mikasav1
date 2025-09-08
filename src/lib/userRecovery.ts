import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { FirebaseUser } from './firestore';

// Recovery function to create Firestore profile for existing Firebase Auth users
export const createProfileForAuthUser = async (authUser: { 
  uid: string; 
  email: string; 
  displayName?: string | null;
}): Promise<FirebaseUser> => {
  try {
    console.log('[RECOVERY] Creating profile for authenticated user:', authUser.email);
    
    // Check if profile already exists
    const q = query(collection(db, 'users'), where('uid', '==', authUser.uid));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      const doc = existing.docs[0];
      console.log('[RECOVERY] Profile already exists, returning existing profile');
      return { id: doc.id, ...doc.data() } as FirebaseUser;
    }
    
    // Create a complete user profile
    const userData: Omit<FirebaseUser, 'id' | 'createdAt' | 'updatedAt'> = {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName || authUser.email.split('@')[0],
      role: 'user',
      loginPassword: '', // Will be set by admin when they assign subscription
      accountEmail: '', // Will be set by admin
      accountPassword: '', // Will be set by admin
      plan: {
        name: 'Netflix', // Default plan - admin can change this
        price: 200,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        status: 'active'
      },
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    const userDoc = {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'users'), userDoc);
    console.log('[RECOVERY] Profile created successfully with ID:', docRef.id);
    
    return { id: docRef.id, ...userDoc } as FirebaseUser;
  } catch (error) {
    console.error('[RECOVERY] Error creating profile:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      authUser,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// Function to recover all orphaned Firebase Auth accounts
export const recoverOrphanedAccounts = async (): Promise<void> => {
  console.log('[RECOVERY] Starting orphaned account recovery...');
  // This would require Firebase Admin SDK to list all auth users
  // For now, we'll handle it case by case through the auth context
};