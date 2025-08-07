import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { UserDashboard } from '@/components/UserDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { DebugPanel } from '@/components/DebugPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAdmin, loading, currentUser, userProfile } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Show debug panel if we're stuck loading or have auth but no profile
  const showDebug = loading || (currentUser && !userProfile);

  if (showDebug) {
    return (
      <div className="min-h-screen bg-background p-8">
        <DebugPanel />
      </div>
    );
  }

  const renderContent = () => {
    if (isAdmin) {
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
