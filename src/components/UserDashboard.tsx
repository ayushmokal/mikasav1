import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, User, Calendar, DollarSign, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const UserDashboard = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { userProfile, loading } = useAuth();

  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'expired':
        return 'bg-destructive text-destructive-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and account details
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Subscription Status */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Badge className={getStatusColor(userProfile.plan.status)}>
                {userProfile.plan.status.toUpperCase()}
              </Badge>
              <div>
                <div className="text-2xl font-bold">{userProfile.plan.name}</div>
                <p className="text-xs text-muted-foreground">Current Plan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Details */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Details</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">${userProfile.plan.price}/mo</div>
                <p className="text-xs text-muted-foreground">Monthly Price</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Due: {userProfile.plan.dueDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Email */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Email</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-lg font-medium break-all">{userProfile.accountEmail}</div>
                <p className="text-xs text-muted-foreground">Service Account</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Credentials */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="mt-1 p-3 bg-accent rounded-md border">
                <code className="text-sm">{userProfile.accountEmail}</code>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 p-3 bg-accent rounded-md border">
                  <code className="text-sm">
                    {showPassword ? userProfile.accountPassword : '••••••••••••'}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button className="bg-gradient-primary">
          Manage Subscription
        </Button>
        <Button variant="outline">
          Contact Support
        </Button>
      </div>
    </div>
  );
};