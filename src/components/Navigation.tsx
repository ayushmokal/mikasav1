import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react";

interface NavigationProps {
  userRole: 'user' | 'admin';
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Navigation = ({ userRole, currentView, onViewChange }: NavigationProps) => {
  const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : userNavItems;

  return (
    <Card className="w-64 h-screen bg-gradient-card shadow-elevated border-0 rounded-none">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SubVault
          </h2>
          <p className="text-sm text-muted-foreground">
            {userRole === 'admin' ? 'Admin Panel' : 'User Portal'}
          </p>
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
            onClick={() => {/* Handle logout */}}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </Card>
  );
};