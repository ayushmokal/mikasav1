import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { UserDashboard } from '@/components/UserDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  // Demo state - in real app this would come from authentication
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [currentView, setCurrentView] = useState('dashboard');

  // Mock data
  const mockUser = {
    email: 'john@example.com',
    accountEmail: 'john.doe@netflix.com',
    accountPassword: 'SecurePass123!',
    plan: {
      name: 'Premium',
      price: 29.99,
      dueDate: '2024-08-15',
      status: 'active' as const,
    },
  };

  const mockUsers = [
    {
      id: '1',
      email: 'john@example.com',
      accountEmail: 'john.doe@netflix.com',
      plan: {
        name: 'Premium',
        price: 29.99,
        dueDate: '2024-08-15',
        status: 'active' as const,
      },
      joinDate: '2024-01-15',
    },
    {
      id: '2',
      email: 'jane@example.com',
      accountEmail: 'jane.smith@spotify.com',
      plan: {
        name: 'Basic',
        price: 9.99,
        dueDate: '2024-08-20',
        status: 'active' as const,
      },
      joinDate: '2024-02-10',
    },
    {
      id: '3',
      email: 'bob@example.com',
      accountEmail: 'bob.wilson@hulu.com',
      plan: {
        name: 'Pro',
        price: 19.99,
        dueDate: '2024-07-30',
        status: 'expired' as const,
      },
      joinDate: '2023-12-05',
    },
  ];

  const renderContent = () => {
    if (userRole === 'admin') {
      switch (currentView) {
        case 'dashboard':
          return <AdminDashboard users={mockUsers} />;
        case 'users':
          return <AdminDashboard users={mockUsers} />;
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
          return <AdminDashboard users={mockUsers} />;
      }
    } else {
      switch (currentView) {
        case 'dashboard':
          return <UserDashboard user={mockUser} />;
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
          return <UserDashboard user={mockUser} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation 
        userRole={userRole} 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      <div className="flex-1 p-8">
        {/* Demo Role Switcher */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={userRole === 'user' ? 'default' : 'outline'}
            onClick={() => setUserRole('user')}
            size="sm"
          >
            User View
          </Button>
          <Button
            variant={userRole === 'admin' ? 'default' : 'outline'}
            onClick={() => setUserRole('admin')}
            size="sm"
          >
            Admin View
          </Button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
