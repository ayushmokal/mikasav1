import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/auth';
import { getUserByUid, FirebaseUser } from '@/lib/firestore';

interface AuthContextType {
  currentUser: User | null;
  userProfile: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user); // Debug log
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('Fetching user profile for UID:', user.uid); // Debug log
          // Fetch user profile from Firestore
          const profile = await getUserByUid(user.uid);
          console.log('User profile found:', profile); // Debug log
          console.log('User role:', profile?.role); // Debug log for role
          setUserProfile(profile);
          
          // If no profile exists, create one
          if (!profile) {
            console.log('No user profile found for UID:', user.uid); // Debug log
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userProfile?.role === 'admin';
  console.log('User profile role:', userProfile?.role, 'isAdmin:', isAdmin); // Debug log

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
