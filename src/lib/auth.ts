import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, Timestamp, updateDoc, doc, deleteField, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

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
  const signInStartTime = Date.now();
  console.log('[AUTH] Sign in attempt started:', {
    email,
    timestamp: new Date().toISOString()
  });
  
  try {
    // First, try normal sign in
    try {
      console.log('[AUTH] Attempting Firebase Auth sign in');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const authResult = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        role: 'user' // This would typically be fetched from Firestore
      };
      
      console.log('[AUTH] Firebase Auth sign in successful:', {
        uid: user.uid,
        email: user.email,
        timeMs: Date.now() - signInStartTime
      });
      
      return authResult;
    } catch (signInError: any) {
      console.log('[AUTH] Firebase Auth failed, checking Firestore for invited users:', {
        errorCode: signInError.code,
        errorMessage: signInError.message
      });
      
      // If sign in fails, check if it's because the user doesn't exist in Firebase Auth
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
        console.log('[AUTH] Auth account missing/invalid. Checking invited users in Firestore...');
        
        // Check if user exists in Firestore with this email
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          console.log('[AUTH] Found user in Firestore:', {
            docId: userDoc.id,
            email: userData.email,
            role: userData.role,
            hasLoginPassword: !!(userData as any).loginPassword
          });
          
          // Only allow first-time auth creation if password matches admin-set loginPassword
          const expected = (userData as any).loginPassword as string | undefined;
          if (!expected) {
            throw new Error('Your account is not yet activated. Please contact your administrator.');
          }
          if (password !== expected) {
            throw new Error('Invalid credentials. Please check your password or contact admin.');
          }
          if (typeof password !== 'string' || password.length < 6) {
            throw new Error('Password must be at least 6 characters.');
          }

          console.log('[AUTH] Provisioning Firebase Auth account for admin-created user...');
          const userCredential = await createUserWithEmailAndPassword(auth, email, expected);
          const newUser = userCredential.user;

          // Update the user document with the real UID
          await updateDoc(doc(db, 'users', userDoc.id), {
            uid: newUser.uid,
            // Remove the stored login password once Auth account is provisioned
            loginPassword: deleteField(),
            updatedAt: new Date()
          });

          // Ensure admin documents also exist at users/{uid} so security rules can check isAdmin()
          if ((userData as any).role === 'admin') {
            const adminDoc = {
              ...userData,
              uid: newUser.uid,
              updatedAt: new Date(),
            };
            await setDoc(doc(db, 'users', newUser.uid), adminDoc, { merge: true });
          }

          console.log('[AUTH] Firebase Auth account created and user document updated:', {
            uid: newUser.uid,
            email: newUser.email,
            role: userData.role,
            timeMs: Date.now() - signInStartTime
          });

          return {
            uid: newUser.uid,
            email: newUser.email!,
            displayName: newUser.displayName || userData.displayName || undefined,
            role: userData.role || 'user'
          };
        } else {
          // No Firestore user found. Support a dev admin bootstrap if using the alias email.
          if (email === 'admin@local.dev') {
            const bootstrapPassword = (typeof password === 'string' && password.length >= 6) ? password : 'adminadmin';
            console.log('[AUTH] Bootstrapping local admin account in Auth + Firestore...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, bootstrapPassword);
            const newUser = userCredential.user;

            // Create admin user document
            await setDoc(doc(db, 'users', newUser.uid), {
              uid: newUser.uid,
              email: newUser.email,
              displayName: newUser.displayName || 'Admin',
              role: 'admin',
              accountEmail: '',
              accountPassword: '',
              plan: { name: 'Admin', price: 0, dueDate: '2099-12-31', status: 'active' },
              joinDate: new Date().toISOString().split('T')[0],
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });

            console.log('[AUTH] Admin bootstrap completed:', {
              uid: newUser.uid,
              email: newUser.email
            });

            return {
              uid: newUser.uid,
              email: newUser.email!,
              displayName: newUser.displayName || 'Admin',
              role: 'admin'
            };
          }

          throw signInError; // Re-throw original error if user doesn't exist in Firestore
        }
      } else {
        throw signInError; // Re-throw other auth errors
      }
    }
  } catch (error) {
    console.error('[AUTH] Sign in failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email,
      timeMs: Date.now() - signInStartTime,
      timestamp: new Date().toISOString()
    });
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
