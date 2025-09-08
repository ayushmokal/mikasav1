import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  Shield, 
  User, 
  Clock, 
  Ban, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff 
} from 'lucide-react';
import { 
  useResetUserPassword, 
  useForcePasswordChange, 
  useToggleUserStatus,
  useUserLoginHistory 
} from '@/hooks/useFirestore';
import { FirebaseUser } from '@/lib/firestore';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: FirebaseUser | null;
}

export const UserManagementModal = ({ open, onOpenChange, user }: UserManagementModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const resetPasswordMutation = useResetUserPassword();
  const forcePasswordChangeMutation = useForcePasswordChange();
  const toggleStatusMutation = useToggleUserStatus();
  const { data: loginHistory, isLoading: historyLoading } = useUserLoginHistory(user?.id || '');

  const handlePasswordReset = async () => {
    if (!user?.id || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ 
        userId: user.id, 
        newPassword 
      });
      toast.success('Password reset successfully. User will need to sign in with the new password.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const handleForcePasswordChange = async () => {
    if (!user?.id) return;

    try {
      await forcePasswordChangeMutation.mutateAsync(user.id);
      toast.success('User will be prompted to reset password on next login');
    } catch (error) {
      console.error('Error forcing password change:', error);
      toast.error('Failed to force password change');
    }
  };

  const handleToggleStatus = async (isActive: boolean) => {
    if (!user?.id) return;

    try {
      await toggleStatusMutation.mutateAsync({ 
        userId: user.id, 
        isActive 
      });
      toast.success(`User ${isActive ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(`Failed to ${isActive ? 'activate' : 'suspend'} user`);
    }
  };

  if (!user) return null;

  const isActive = user.plan.status === 'active';
  const hasAuthAccount = user.uid && !user.uid.startsWith('temp_');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Management - {user.email}
          </DialogTitle>
          <DialogDescription>
            Manage user account, passwords, and access permissions.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Account Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">{user.email}</div>
                </div>
                <div>
                  <Label>Display Name</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">{user.displayName || 'Not set'}</div>
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="mt-1">
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={isActive ? 'default' : 'destructive'}>
                      {user.plan.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Subscription Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plan</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm">{user.plan.name}</div>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm">₹{user.plan.price}/month</div>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm">
                      {format(new Date(user.plan.dueDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div>
                    <Label>Account Email</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm">{user.accountEmail}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Actions */}
              <div className="space-y-3">
                <h4 className="font-semibold">Account Actions</h4>
                <div className="flex gap-2">
                  {isActive ? (
                    <Button
                      variant="destructive"
                      onClick={() => handleToggleStatus(false)}
                      disabled={toggleStatusMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {toggleStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                      Suspend Account
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => handleToggleStatus(true)}
                      disabled={toggleStatusMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {toggleStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Activate Account
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password Management
              </h3>

              {!hasAuthAccount && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This user hasn't signed in yet. Set a login password they can use for their first sign-in.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePasswordReset}
                    disabled={resetPasswordMutation.isPending || !newPassword}
                    className="flex items-center gap-2"
                  >
                    {resetPasswordMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    Reset Password
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleForcePasswordChange}
                    disabled={forcePasswordChangeMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {forcePasswordChangeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    Force Password Change
                  </Button>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Reset Password:</strong> Sets a new password for the user. They can sign in immediately with this password.
                    <br />
                    <strong>Force Password Change:</strong> User will be prompted to set a new password on their next login.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Firebase Auth UID</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                    {hasAuthAccount ? user.uid : 'Not created yet'}
                  </div>
                </div>
                <div>
                  <Label>Account Created</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">
                    {user.createdAt ? format(user.createdAt.toDate(), 'PPP') : 'Unknown'}
                  </div>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">
                    {user.updatedAt ? format(user.updatedAt.toDate(), 'PPP') : 'Unknown'}
                  </div>
                </div>
                <div>
                  <Label>Join Date</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">{user.joinDate}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Authentication Status</Label>
                <div className="flex items-center gap-2">
                  {hasAuthAccount ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Firebase Auth Account Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending First Login
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Login History
              </h3>

              {historyLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading history...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {loginHistory && loginHistory.length > 0 ? (
                    loginHistory.map((entry, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {format(entry.timestamp, 'PPP p')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.device} • {entry.ip}
                            </div>
                          </div>
                          <Badge variant={entry.success ? 'default' : 'destructive'}>
                            {entry.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      No login history available
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};