import { Menu, LayoutDashboard, Users, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useMemo } from "react";

interface MobileNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const MobileNav = ({ currentView, onViewChange }: MobileNavProps) => {
  const { isAdmin, userProfile } = useAuth();

  const navItems = useMemo(
    () =>
      isAdmin
        ? [
            { id: "dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
            { id: "users", label: "Manage Users", icon: Users },
            { id: "settings", label: "Settings", icon: Settings },
          ]
        : [
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "settings", label: "Settings", icon: Settings },
          ],
    [isAdmin]
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Error signing out:", e);
    }
  };

  return (
    <Card className="sticky top-0 z-40 w-full rounded-none border-0 border-b border-netflix-border bg-netflix-card/80 backdrop-blur supports-[backdrop-filter]:bg-netflix-card/60 shadow-sm">
      <div className="h-14 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 max-w-[85vw]">
              <div className="p-4 border-b">
                {/* Brand */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block h-6 w-6 rounded bg-primary" />
                  <span className="text-base font-semibold">SubVault</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? "Admin Panel" : "User Portal"}
                </p>
                {userProfile && (
                  <div className="mt-2 p-2 bg-accent rounded-md">
                    <p className="text-xs text-muted-foreground">Logged in as</p>
                    <p className="text-sm font-medium break-all">{userProfile.email}</p>
                    <p className="text-xs text-muted-foreground">Role: {userProfile.role}</p>
                  </div>
                )}
              </div>

              <nav className="p-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <SheetClose asChild key={item.id}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start gap-3 my-1 ${
                          isActive
                            ? "bg-gradient-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                        onClick={() => onViewChange(item.id)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </SheetClose>
                  );
                })}

                <div className="mt-4 border-t pt-2">
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          <span className="text-sm font-medium">
            {isAdmin ? "Admin Panel" : "User Portal"}
          </span>
        </div>
        <span className="text-sm font-semibold netflix-text">SubVault</span>
      </div>
    </Card>
  );
};
