// Debug script to check Firebase connection and create admin user
// Run this in the browser console or create a debug page

import { auth, db } from './src/lib/firebase';
import { createUser, getUserByUid } from './src/lib/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

const debugFirebase = async () => {
  try {
    console.log('🔍 Debugging Firebase setup...');
    
    // Check if Firebase is initialized
    console.log('Firebase Auth:', auth);
    console.log('Firestore:', db);
    
    // Try to sign in with your user
    const email = 'admin@mikasav1.com';
    const password = 'your-password'; // Replace with your actual password
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ User signed in:', userCredential.user);
      
      // Check if user document exists in Firestore
      const userDoc = await getUserByUid(userCredential.user.uid);
      console.log('📄 User document:', userDoc);
      
      if (!userDoc) {
        console.log('❌ User document not found, creating one...');
        
        // Create user document
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || 'Admin User',
          role: 'admin', // Making this user an admin
          accountEmail: 'admin@netflix.com', // Example service account
          accountPassword: 'AdminPassword123!',
          plan: {
            name: 'Premium',
            price: 29.99,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
          },
          joinDate: new Date().toISOString().split('T')[0],
        };
        
        const docId = await createUser(userData);
        console.log('✅ User document created with ID:', docId);
      }
      
    } catch (authError) {
      console.error('❌ Authentication error:', authError);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

// Export for console use
window.debugFirebase = debugFirebase;

console.log('🚀 Debug script loaded. Run debugFirebase() in console to test.');
