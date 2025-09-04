import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/auth';
import { getUserByUid, FirebaseUser } from '@/lib/firestore';
import { createProfileForAuthUser } from '@/lib/userRecovery';

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
      console.log('[AUTH] State changed:', {
        hasUser: !!user,
        uid: user?.uid,
        email: user?.email,
        timestamp: new Date().toISOString()
      });
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('[AUTH] Fetching user profile for UID:', user.uid);
          const startTime = Date.now();
          
          // Fetch user profile from Firestore with timeout
          let profile = null;
          try {
            profile = await Promise.race([
              getUserByUid(user.uid),
              new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
              )
            ]);
          } catch (timeoutError) {
            console.error('[AUTH] Profile fetch timed out or failed:', {
              error: timeoutError instanceof Error ? timeoutError.message : 'Unknown error',
              uid: user.uid,
              email: user.email
            });
          }
          
          // If no profile exists, create one for this authenticated user
          let wasCreated = false;
          if (!profile) {
            console.log('[AUTH] No profile found, creating profile for authenticated user');
            try {
              profile = await createProfileForAuthUser({
                uid: user.uid,
                email: user.email!,
                displayName: user.displayName
              });
              wasCreated = true;
            } catch (creationError) {
              console.error('[AUTH] Error creating profile:', {
                error: creationError instanceof Error ? creationError.message : 'Unknown error',
                uid: user.uid,
                email: user.email
              });
            }
          }
          
          const fetchTime = Date.now() - startTime;
          console.log('[AUTH] User profile fetch completed:', {
            success: !!profile,
            role: profile?.role,
            email: profile?.email,
            fetchTimeMs: fetchTime,
            profileId: profile?.id,
            wasCreated
          });
          
          setUserProfile(profile);
        } catch (error) {
          console.error('[AUTH] Error fetching/creating user profile:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            uid: user.uid,
            email: user.email,
            timestamp: new Date().toISOString()
          });
          setUserProfile(null);
        }
      } else {
        console.log('[AUTH] No user, clearing profile');
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userProfile?.role === 'admin' && userProfile !== null;
  
  // Enhanced debug logging for admin status
  console.log('[AUTH] Admin check:', {
    hasProfile: !!userProfile,
    role: userProfile?.role,
    isAdmin,
    userId: userProfile?.id,
    timestamp: new Date().toISOString()
  });

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