import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUser } from '@/lib/auth';
import { getUserByUid, createUser } from '@/lib/firestore';

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

  const createMissingProfile = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const userData = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || 'Admin User',
        role: 'admin' as const,
        accountEmail: 'admin@netflix.com',
        accountPassword: 'AdminPassword123!',
        plan: {
          name: 'Premium',
          price: 29.99,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active' as const,
        },
        joinDate: new Date().toISOString().split('T')[0],
      };

      const docId = await createUser(userData);
      setDebugInfo({ ...debugInfo, createdProfile: docId });
      window.location.reload(); // Reload to update context
    } catch (error) {
      setDebugInfo({ ...debugInfo, createError: error.message });
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

        <div className="flex gap-2">
          <Button onClick={checkUserProfile}>
            Check User Profile
          </Button>
          <Button onClick={createMissingProfile} variant="outline">
            Create Missing Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
