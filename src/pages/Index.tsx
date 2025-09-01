import { useEffect, useRef, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { UserDashboard } from '@/components/UserDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { DebugPanel } from '@/components/DebugPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAdmin, loading, currentUser, userProfile } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Run a one-time migration to ensure users/{uid} docs exist when an admin visits
  const migratedRef = useRef(false)
  useEffect(() => {
    if (!migratedRef.current && isAdmin) {
      migratedRef.current = true
      import('@/lib/migrations')
        .then(({ migrateUsersToUidDocs }) => migrateUsersToUidDocs())
        .catch((e) => console.warn('User migration skipped:', e))
    }
  }, [isAdmin])

  // Only show debug panel during loading, not for missing profiles
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <DebugPanel />
      </div>
    );
  }

  // If user is authenticated but has no profile, show a message to contact admin
  if (currentUser && !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Account Setup Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your account has been authenticated, but no profile has been set up yet. 
              Please contact your administrator to complete your account setup.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Email: {currentUser.email}
            </p>
            <button 
              onClick={() => {
                import('@/lib/auth').then(({ logout }) => {
                  logout().then(() => {
                    window.location.href = '/login';
                  });
                });
              }}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Sign Out & Try Different Account
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    if (isAdmin === true) {
      switch (currentView) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'users':
          return <AdminDashboard />;
        case 'settings':
          return (
            <Card className="bg-gradient-card shadow-card border-0">
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Admin settings panel would go here.</p>
              </CardContent>
            </Card>
          );
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (currentView) {
        case 'dashboard':
          return <UserDashboard />;
        case 'settings':
          return (
            <Card className="bg-gradient-card shadow-card border-0">
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User settings panel would go here.</p>
              </CardContent>
            </Card>
          );
        default:
          return <UserDashboard />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      <div className="flex-1 p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
