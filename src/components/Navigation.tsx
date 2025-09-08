import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const { isAdmin, userProfile, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <Card className="relative w-64 h-screen bg-netflix-card shadow-elevated border-netflix-border rounded-none">
      <div className="p-6">
        <div className="mb-8">
          <Logo size="sm" glow={true} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'Admin Panel' : 'User Portal'}
          </p>
          {userProfile && (
            <div className="mt-2 p-2 bg-accent rounded-md">
              <p className="text-xs text-muted-foreground">Logged in as:</p>
              <p className="text-sm font-medium">{userProfile.email}</p>
              <p className="text-xs text-muted-foreground">Role: {userProfile.role}</p>
            </div>
          )}
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  isActive 
                    ? 'bg-gradient-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </Card>
  );
};
