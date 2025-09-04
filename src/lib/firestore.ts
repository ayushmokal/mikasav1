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
import { EmailMessage, InboxSettings } from './types';

// User interface
export interface FirebaseUser {
  id?: string;
  uid: string; // Firebase Auth UID
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
  // Optional login password seed for first-time auth creation (dev only).
  // Never store plaintext passwords in production.
  loginPassword?: string;
  accountEmail: string;
  accountPassword: string;
  plan: {
    name: string;
    price: number;
    dueDate: string;
    status: 'active' | 'expired' | 'pending';
  };
  reminders?: {
    enabled: boolean;
    daysBefore: number;
    lastSent?: string;
  };
  inboxSettings?: InboxSettings;
  joinDate: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Reminder interface
export interface Reminder {
  id?: string;
  userId: string;
  userEmail: string;
  serviceName: string;
  dueDate: string;
  reminderDate: string;
  daysBefore: number;
  sent: boolean;
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

// Create a new user with Firebase Auth account
export const createUserWithAuth = async (
  userData: Omit<FirebaseUser, 'id' | 'createdAt' | 'updatedAt' | 'uid'>, 
  password: string
): Promise<{ userId: string; authUid: string }> => {
  try {
    // Import auth functions here to avoid circular dependencies
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const { auth } = await import('./firebase');
    
    // Store current user to restore later
    const currentUser = auth.currentUser;
    const wasSignedIn = !!currentUser;
    
    console.log('[AUTH] Creating new user with email:', userData.email);
    
    // Create Firebase Auth account directly
    // If email already exists, Firebase will throw auth/email-already-in-use
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
    const authUser = userCredential.user;
    
    console.log('[AUTH] Firebase Auth user created successfully:', authUser.uid);
    
    // Update display name if provided
    if (userData.displayName) {
      await updateProfile(authUser, { displayName: userData.displayName });
    }
    
    // Create Firestore document with the Auth UID
    const userDoc = {
      ...userData,
      uid: authUser.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'users'), userDoc);
    console.log('[AUTH] Firestore profile created successfully:', docRef.id);
    
    // Sign out the newly created user
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    
    // Don't try to restore admin session automatically to avoid issues
    if (wasSignedIn) {
      console.log('[AUTH] Admin will need to sign in again after user creation');
    }
    
    return {
      userId: docRef.id,
      authUid: authUser.uid
    };
  } catch (error: any) {
    console.error('Error creating user with auth:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      // Check if the existing Firebase Auth user has a Firestore profile
      try {
        console.log('[AUTH] Email already in use, checking for existing profile...');
        
        // Try to sign in with the provided credentials to get the UID
        const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');
        const { auth } = await import('./firebase');
        
        const testCredential = await signInWithEmailAndPassword(auth, userData.email, password);
        const existingUid = testCredential.user.uid;
        
        console.log('[AUTH] Successfully signed in to existing account:', existingUid);
        
        // Check if they have a Firestore profile
        const existingProfile = await getUserByUid(existingUid);
        if (existingProfile) {
          await signOut(auth);
          throw new Error(`User with email ${userData.email} already exists with a complete profile`);
        }
        
        // They have Firebase Auth but no Firestore profile - create profile
        console.log('[AUTH] Found existing Firebase Auth user without profile, creating Firestore profile');
        const userDoc = {
          ...userData,
          uid: existingUid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const docRef = await addDoc(collection(db, 'users'), userDoc);
        console.log('[AUTH] Recovery profile created successfully:', docRef.id);
        
        // Sign out the session
        await signOut(auth);
        
        return {
          userId: docRef.id,
          authUid: existingUid
        };
      } catch (recoveryError: any) {
        console.error('[AUTH] Recovery attempt failed:', recoveryError);
        if (recoveryError.code === 'auth/wrong-password' || recoveryError.code === 'auth/invalid-credential') {
          throw new Error(`User with email ${userData.email} already exists but with a different password`);
        }
        throw recoveryError;
      }
    }
    
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
    // Fetch all users ordered by creation time, then filter out admins on the client.
    // This avoids requiring composite Firestore indexes while ensuring the admin
    // account never shows up in "managed users" lists.
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const all = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirebaseUser[];
    
    // Only return real end-users (exclude admin accounts)
    return all.filter(u => u.role !== 'admin');
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
    // Keep query simple to avoid composite index requirements, then filter admins out.
    const q = query(
      collection(db, 'users'), 
      where('plan.status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirebaseUser[];
    
    return users.filter(u => u.role !== 'admin');
  } catch (error) {
    console.error('Error getting users by plan status:', error);
    throw error;
  }
};

// Admin password management functions
export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  try {
    console.log('[ADMIN] Resetting password for user:', userId);
    
    // Get user document to find their UID
    const userDoc = await getUserById(userId);
    if (!userDoc) {
      throw new Error('User not found');
    }

    // Import Firebase Auth admin functions
    const { updatePassword, signInWithEmailAndPassword, signOut } = await import('firebase/auth');
    const { auth } = await import('./firebase');
    
    // Store current admin session
    const currentUser = auth.currentUser;
    
    if (userDoc.uid && userDoc.uid !== `temp_${Date.now()}`) {
      // User has Firebase Auth account - attempt password reset
      // Note: In a real app, you'd use Firebase Admin SDK for this
      // For now, we'll store a temporary password for next login
      await updateUser(userId, {
        loginPassword: newPassword,
        updatedAt: new Date() as any
      });
      
      console.log('[ADMIN] Password reset completed - user must sign in with new password');
    } else {
      // User doesn't have Firebase Auth yet - set login password
      await updateUser(userId, {
        loginPassword: newPassword,
        updatedAt: new Date() as any
      });
      
      console.log('[ADMIN] Login password set for new user');
    }
  } catch (error) {
    console.error('[ADMIN] Error resetting user password:', error);
    throw error;
  }
};

// Force user to change password on next login
export const forcePasswordChange = async (userId: string): Promise<void> => {
  try {
    await updateUser(userId, {
      loginPassword: undefined, // Clear existing password to force reset
      updatedAt: new Date() as any
    });
    console.log('[ADMIN] User will be prompted to reset password on next login');
  } catch (error) {
    console.error('[ADMIN] Error forcing password change:', error);
    throw error;
  }
};

// Suspend/Activate user account
export const toggleUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  try {
    const status = isActive ? 'active' : 'suspended';
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');

    await updateUser(userId, {
      plan: {
        ...user.plan,
        status: status as any
      },
      updatedAt: new Date() as any
    });
    
    console.log(`[ADMIN] User ${isActive ? 'activated' : 'suspended'}:`, userId);
  } catch (error) {
    console.error('[ADMIN] Error toggling user status:', error);
    throw error;
  }
};

// Get user login history (mock - in real app this would track actual logins)
export const getUserLoginHistory = async (userId: string): Promise<any[]> => {
  try {
    // In a real app, you'd have a separate collection for login history
    const user = await getUserById(userId);
    if (!user) return [];
    
    // Mock login history
    return [
      {
        timestamp: new Date(),
        ip: '192.168.1.1',
        device: 'Chrome Browser',
        success: true
      }
    ];
  } catch (error) {
    console.error('[ADMIN] Error getting login history:', error);
    return [];
  }
};
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

// Reminder functions
export const createReminder = async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const reminder = {
      ...reminderData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'reminders'), reminder);
    return docRef.id;
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
};

export const getReminders = async (): Promise<Reminder[]> => {
  try {
    const q = query(collection(db, 'reminders'), orderBy('reminderDate', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reminder[];
  } catch (error) {
    console.error('Error getting reminders:', error);
    throw error;
  }
};

export const getPendingReminders = async (): Promise<Reminder[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'reminders'), 
      where('sent', '==', false),
      where('reminderDate', '<=', today),
      orderBy('reminderDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reminder[];
  } catch (error) {
    console.error('Error getting pending reminders:', error);
    throw error;
  }
};

export const updateReminder = async (id: string, updates: Partial<Reminder>): Promise<void> => {
  try {
    const docRef = doc(db, 'reminders', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
};

export const deleteReminder = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'reminders', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
};

export const markReminderAsSent = async (id: string): Promise<void> => {
  try {
    await updateReminder(id, { sent: true });
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
    throw error;
  }
};

// Get reminders for a specific user
export const getUserReminders = async (userId: string): Promise<Reminder[]> => {
  try {
    const q = query(
      collection(db, 'reminders'), 
      where('userId', '==', userId),
      orderBy('reminderDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reminder[];
  } catch (error) {
    console.error('Error getting user reminders:', error);
    throw error;
  }
};

// Create or update reminder for a user
export const upsertUserReminder = async (userId: string, user: FirebaseUser, daysBefore: number): Promise<void> => {
  try {
    // Calculate reminder date
    const dueDate = new Date(user.plan.dueDate);
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(dueDate.getDate() - daysBefore);
    
    // Check if reminder already exists for this user
    const existingReminders = await getUserReminders(userId);
    const existingReminder = existingReminders.find(r => !r.sent);
    
    if (existingReminder && existingReminder.id) {
      // Update existing reminder
      await updateReminder(existingReminder.id, {
        serviceName: user.plan.name,
        dueDate: user.plan.dueDate,
        reminderDate: reminderDate.toISOString().split('T')[0],
        daysBefore,
        sent: false
      });
    } else {
      // Create new reminder
      await createReminder({
        userId,
        userEmail: user.email,
        serviceName: user.plan.name,
        dueDate: user.plan.dueDate,
        reminderDate: reminderDate.toISOString().split('T')[0],
        daysBefore,
        sent: false
      });
    }
  } catch (error) {
    console.error('Error upserting user reminder:', error);
    throw error;
  }
};

// =============================================
// SUBSCRIPTION PLAN MANAGEMENT
// =============================================

import { SubscriptionPlan, SharedAccount, AccountAssignment } from './types';

// Create subscription plan
export const createSubscriptionPlan = async (planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const planDoc = {
      ...planData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'subscriptionPlans'), planDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    throw error;
  }
};

// Get all subscription plans
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'subscriptionPlans'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubscriptionPlan));
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Update subscription plan
export const updateSubscriptionPlan = async (id: string, updates: Partial<SubscriptionPlan>): Promise<void> => {
  try {
    const docRef = doc(db, 'subscriptionPlans', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    throw error;
  }
};

// Delete subscription plan
export const deleteSubscriptionPlan = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'subscriptionPlans', id));
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    throw error;
  }
};

// =============================================
// SHARED ACCOUNT MANAGEMENT
// =============================================

// Create shared account
export const createSharedAccount = async (accountData: Omit<SharedAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const accountDoc = {
      ...accountData,
      currentUsers: 0,
      assignedUserIds: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'sharedAccounts'), accountDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating shared account:', error);
    throw error;
  }
};

// Get all shared accounts
export const getSharedAccounts = async (): Promise<SharedAccount[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sharedAccounts'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SharedAccount));
  } catch (error) {
    console.error('Error fetching shared accounts:', error);
    throw error;
  }
};

// Get shared accounts by plan
export const getSharedAccountsByPlan = async (planId: string): Promise<SharedAccount[]> => {
  try {
    const q = query(collection(db, 'sharedAccounts'), where('planId', '==', planId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SharedAccount));
  } catch (error) {
    console.error('Error fetching shared accounts by plan:', error);
    throw error;
  }
};

// Update shared account
export const updateSharedAccount = async (id: string, updates: Partial<SharedAccount>): Promise<void> => {
  try {
    const docRef = doc(db, 'sharedAccounts', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating shared account:', error);
    throw error;
  }
};

// Delete shared account
export const deleteSharedAccount = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'sharedAccounts', id));
  } catch (error) {
    console.error('Error deleting shared account:', error);
    throw error;
  }
};

// =============================================
// ACCOUNT ASSIGNMENT MANAGEMENT
// =============================================

// Assign account to user
export const assignAccountToUser = async (userId: string, userEmail: string, accountId: string, planId: string): Promise<string> => {
  try {
    // First check if account has space
    const accountRef = doc(db, 'sharedAccounts', accountId);
    const accountSnap = await getDoc(accountRef);
    
    if (!accountSnap.exists()) {
      throw new Error('Shared account not found');
    }
    
    const account = accountSnap.data() as SharedAccount;
    if (account.currentUsers >= account.maxUsers) {
      throw new Error('Account is at maximum capacity');
    }
    
    // Validate target user is not an admin
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    const targetUser = userSnap.data() as FirebaseUser;
    if (targetUser.role === 'admin') {
      throw new Error('Cannot assign accounts to admin users');
    }

    // Create assignment
    const assignmentDoc = {
      userId,
      userEmail,
      accountId,
      planId,
      assignedAt: Timestamp.now(),
      status: 'active' as const
    };
    
    const assignmentRef = await addDoc(collection(db, 'accountAssignments'), assignmentDoc);
    
    // Update account user count and assigned users
    await updateDoc(accountRef, {
      currentUsers: account.currentUsers + 1,
      assignedUserIds: [...account.assignedUserIds, userId],
      updatedAt: Timestamp.now()
    });
    
    // Update user with account details
    await updateDoc(userRef, {
      accountEmail: account.email,
      accountPassword: account.password,
      updatedAt: Timestamp.now()
    });
    
    return assignmentRef.id;
  } catch (error) {
    console.error('Error assigning account to user:', error);
    throw error;
  }
};

// Unassign account from user
export const unassignAccountFromUser = async (userId: string, accountId: string): Promise<void> => {
  try {
    // Find and delete assignment
    const q = query(
      collection(db, 'accountAssignments'), 
      where('userId', '==', userId),
      where('accountId', '==', accountId)
    );
    const assignmentSnap = await getDocs(q);
    
    if (!assignmentSnap.empty) {
      const assignmentDoc = assignmentSnap.docs[0];
      await deleteDoc(assignmentDoc.ref);
    }
    
    // Update account user count
    const accountRef = doc(db, 'sharedAccounts', accountId);
    const accountSnap = await getDoc(accountRef);
    
    if (accountSnap.exists()) {
      const account = accountSnap.data() as SharedAccount;
      await updateDoc(accountRef, {
        currentUsers: Math.max(0, account.currentUsers - 1),
        assignedUserIds: account.assignedUserIds.filter(id => id !== userId),
        updatedAt: Timestamp.now()
      });
    }
    
    // Clear user account details
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      accountEmail: '',
      accountPassword: '',
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error unassigning account from user:', error);
    throw error;
  }
};

// Get assignments by user
export const getAssignmentsByUser = async (userId: string): Promise<AccountAssignment[]> => {
  try {
    const q = query(collection(db, 'accountAssignments'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AccountAssignment));
  } catch (error) {
    console.error('Error fetching assignments by user:', error);
    throw error;
  }
};

// Get assignments by account
export const getAssignmentsByAccount = async (accountId: string): Promise<AccountAssignment[]> => {
  try {
    const q = query(collection(db, 'accountAssignments'), where('accountId', '==', accountId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AccountAssignment));
  } catch (error) {
    console.error('Error fetching assignments by account:', error);
    throw error;
  }
};

// =================== EMAIL INBOX FUNCTIONS ===================

// Create email message
export const createEmailMessage = async (emailData: Omit<EmailMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const emailDoc = {
      ...emailData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'emails'), emailDoc);
    console.log('Email message created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating email message:', error);
    throw error;
  }
};

// Get user emails
export const getUserEmails = async (userId: string, limit: number = 50): Promise<EmailMessage[]> => {
  try {
    const q = query(
      collection(db, 'emails'),
      where('userId', '==', userId),
      orderBy('receivedAt', 'desc'),
      // Note: Firebase has a limit of 100 documents per query
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EmailMessage[];
  } catch (error) {
    console.error('Error fetching user emails:', error);
    throw error;
  }
};

// Update email (mark as read, starred, etc.)
export const updateEmailMessage = async (emailId: string, updates: Partial<EmailMessage>): Promise<void> => {
  try {
    const emailRef = doc(db, 'emails', emailId);
    await updateDoc(emailRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    console.log('Email updated:', emailId);
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
};

// Delete email
export const deleteEmailMessage = async (emailId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'emails', emailId));
    console.log('Email deleted:', emailId);
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
};

// Update user inbox settings
export const updateInboxSettings = async (userId: string, settings: InboxSettings): Promise<void> => {
  try {
    await updateUser(userId, {
      inboxSettings: settings,
      updatedAt: Timestamp.now()
    });
    console.log('Inbox settings updated for user:', userId);
  } catch (error) {
    console.error('Error updating inbox settings:', error);
    throw error;
  }
};

// Get unread email count
export const getUnreadEmailCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'emails'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread email count:', error);
    return 0;
  }
};

// Mark all emails as read
export const markAllEmailsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'emails'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isRead: true,
        updatedAt: Timestamp.now()
      });
    });
    
    await batch.commit();
    console.log(`Marked ${snapshot.size} emails as read for user:`, userId);
  } catch (error) {
    console.error('Error marking emails as read:', error);
    throw error;
  }
};

// Clean up old emails based on retention policy
export const cleanupOldEmails = async (userId: string, retentionDays: number): Promise<void> => {
  try {
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
    const q = query(
      collection(db, 'emails'),
      where('userId', '==', userId),
      where('receivedAt', '<', Timestamp.fromDate(cutoffDate))
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (snapshot.size > 0) {
      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} old emails for user:`, userId);
    }
  } catch (error) {
    console.error('Error cleaning up old emails:', error);
    throw error;
  }
};
