import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUser } from '@/lib/auth';
import { getUserByUid } from '@/lib/firestore';

export const DebugPanel: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  const checkUserProfile = async () => {
    const user = getCurrentUser();
    if (!user) {
      setDebugInfo({ error: 'No authenticated user' });
      return;
    }

    try {
      const profile = await getUserByUid(user.uid);
      setDebugInfo({
        authUser: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
        firestoreProfile: profile,
        profileExists: !!profile,
      });
    } catch (error) {
      setDebugInfo({ error: error.message });
    }
  };

  useEffect(() => {
    if (currentUser) {
      checkUserProfile();
    }
  }, [currentUser]);

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🐛 Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Auth State:</strong>
          <pre className="bg-muted p-2 rounded text-sm">
            {JSON.stringify({ 
              loading, 
              hasCurrentUser: !!currentUser,
              hasUserProfile: !!userProfile,
              userEmail: currentUser?.email 
            }, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Debug Info:</strong>
          <pre className="bg-muted p-2 rounded text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
