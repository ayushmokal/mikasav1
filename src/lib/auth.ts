import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'user' | 'admin';
}

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName?: string): Promise<AuthUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    return {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || displayName,
      role: 'user' // Default role
    };
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  try {
    // First, try normal sign in
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        role: 'user' // This would typically be fetched from Firestore
      };
    } catch (signInError: any) {
      // If sign in fails, check if it's because the user doesn't exist in Firebase Auth
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
        console.log('Auth account missing/invalid. Checking invited users in Firestore...');
        
        // Check if user exists in Firestore with this email
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('./firebase');
        
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          // First-time login: allow user to set a password now.
          // Create the Firebase Auth account with the provided password (min 6 chars).
          if (typeof password !== 'string' || password.length < 6) {
            throw new Error('Please enter a password with at least 6 characters for first-time login.');
          }

          console.log('Creating Firebase Auth account for invited user...');
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const newUser = userCredential.user;

          // Update the user document with the real UID
          const { updateDoc, doc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'users', userDoc.id), {
            uid: newUser.uid,
            updatedAt: new Date()
          });

          console.log('Firebase Auth account created and user document updated');

          return {
            uid: newUser.uid,
            email: newUser.email!,
            displayName: newUser.displayName || userData.displayName || undefined,
            role: userData.role || 'user'
          };
        } else {
          throw signInError; // Re-throw original error if user doesn't exist in Firestore
        }
      } else {
        throw signInError; // Re-throw other auth errors
      }
    }
  } catch (error) {
    throw error;
  }
};

// Sign out
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
