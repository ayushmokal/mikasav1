import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, User, Calendar, DollarSign, Eye, EyeOff, Loader2, Settings, Shield, Mail } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { InboxManagement } from "@/components/InboxManagement";

export const UserDashboard = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { userProfile, loading, currentUser } = useAuth();

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!currentUser) {
      toast.error('No user logged in');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(currentUser, newPassword);
      toast.success('Password updated successfully!');
      setChangePasswordOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in before changing your password');
      } else {
        toast.error('Failed to update password. Please try again.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  const dueDate = parseISO(userProfile.plan.dueDate);
  const daysUntilDue = differenceInDays(dueDate, new Date());
  const isNearDue = daysUntilDue <= 7 && daysUntilDue >= 0;
  const isOverdue = daysUntilDue < 0;
  
  // Check if this is likely a first login (password equals email)
  const isFirstLogin = userProfile.accountPassword === userProfile.email;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button 
                onClick={handlePasswordChange}
                disabled={isChangingPassword}
                className="w-full"
              >
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* First Login Warning */}
      {isFirstLogin && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Security Notice</h3>
                <p className="text-sm text-yellow-700">
                  Your password is currently set to your email address. For security, please change your password using the button above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className="text-2xl font-bold">₹{userProfile.plan.price}/mo</div>
                <p className="text-xs text-muted-foreground">Monthly Price</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : isNearDue ? 'text-yellow-600 font-semibold' : ''}`}>
                  Due: {format(dueDate, 'MMM dd, yyyy')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isOverdue 
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : `${daysUntilDue} days remaining`
                }
              </p>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These are your {userProfile.plan.name} account credentials. Use them to log into the service directly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Inbox Section */}
      <InboxManagement />

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button className="bg-gradient-primary">
          <Settings className="mr-2 h-4 w-4" />
          Manage Subscription
        </Button>
        <Button variant="outline">
          Contact Support
        </Button>
      </div>
    </div>
  );
};