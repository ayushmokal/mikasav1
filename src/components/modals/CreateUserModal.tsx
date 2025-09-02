import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateUser, useSharedAccounts, useAssignAccount, useSubscriptionPlans } from '@/hooks/useFirestore';
import { FirebaseUser, upsertUserReminder } from '@/lib/firestore';
import { toast } from 'sonner';
import { SharedAccount } from '@/lib/types';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUBSCRIPTION_PLANS = [
  { name: 'Netflix', price: 200, currency: 'INR' },
  { name: 'Amazon Prime', price: 150, currency: 'INR' },
  { name: 'Disney+ Hotstar', price: 100, currency: 'INR' },
  { name: 'Spotify', price: 119, currency: 'INR' },
  { name: 'YouTube Premium', price: 129, currency: 'INR' },
  { name: 'Custom', price: 0, currency: 'INR' },
];

export const CreateUserModal = ({ open, onOpenChange }: CreateUserModalProps) => {
  const createUserMutation = useCreateUser();
  const assignAccountMutation = useAssignAccount();
  const { data: accounts = [], isLoading: accountsLoading } = useSharedAccounts();
  const { data: plans = [] } = useSubscriptionPlans();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    loginPassword: '',
    accountEmail: '',
    accountPassword: '',
    planName: '',
    customPlanName: '',
    planPrice: 0,
    dueDate: null as Date | null,
    planStatus: 'active' as 'active' | 'expired' | 'pending',
    reminderDays: 3,
  });

  const [selectedAccountId, setSelectedAccountId] = useState('');

  const availableAccounts: SharedAccount[] = (accounts || []).filter(
    (a) => a.status === 'active' && a.currentUsers < a.maxUsers
  );

  const selectedAccount = availableAccounts.find(a => a.id === selectedAccountId);

  // Auto-select first available account when dialog opens and none selected
  useEffect(() => {
    if (open && !selectedAccountId && availableAccounts.length > 0) {
      setSelectedAccountId(availableAccounts[0].id);
      syncFormFromSelectedAccount(availableAccounts[0]);
    }
  }, [open, availableAccounts]);

  const syncFormFromSelectedAccount = (account: SharedAccount | undefined) => {
    if (!account) return;
    const plan = plans.find(p => p.id === account.planId);
    setFormData(prev => ({
      ...prev,
      accountEmail: account.email,
      accountPassword: account.password,
      // keep using our plan fields; mirror from account
      planName: account.planName,
      customPlanName: '',
      planPrice: plan?.price ?? prev.planPrice,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Required: must assign from an existing shared account
    if (!formData.email || !formData.dueDate || !formData.loginPassword) {
      toast.error('Please provide email, login password and due date');
      return;
    }
    if (formData.loginPassword.length < 6) {
      toast.error('Login password must be at least 6 characters');
      return;
    }
    if (!selectedAccountId || !selectedAccount) {
      toast.error('Please select a shared subscription account to assign');
      return;
    }

    const planName = formData.planName === 'Custom' ? formData.customPlanName : formData.planName;
    
    if (!planName) {
      toast.error('Please provide a plan name');
      return;
    }

    try {
      const userData: Omit<FirebaseUser, 'id' | 'createdAt' | 'updatedAt'> = {
        uid: `temp_${Date.now()}`, // Temporary UID, will be updated when user first logs in
        email: formData.email,
        displayName: formData.displayName || formData.email.split('@')[0],
        role: 'user',
        loginPassword: formData.loginPassword,
        accountEmail: selectedAccount.email,
        accountPassword: selectedAccount.password,
        plan: {
          name: planName,
          price: formData.planPrice,
          dueDate: format(formData.dueDate, 'yyyy-MM-dd'),
          status: formData.planStatus,
        },
        joinDate: format(new Date(), 'yyyy-MM-dd'),
      };

      const userId = await createUserMutation.mutateAsync(userData);

      // Link the selected shared account (updates account counts and user doc)
      try {
        await assignAccountMutation.mutateAsync({
          userId,
          userEmail: formData.email,
          accountId: selectedAccount.id,
          planId: selectedAccount.planId,
        });
      } catch (assignErr: any) {
        console.error('Error assigning account after user creation:', assignErr);
        toast.error(assignErr?.message || 'Failed to assign selected account');
      }
      
      // Create reminder if due date is set and reminder days > 0
      if (formData.dueDate && formData.reminderDays > 0) {
        try {
          const fullUserData: FirebaseUser = {
            ...userData,
            id: userId,
            createdAt: null as any, // These will be set by the system
            updatedAt: null as any,
          };
          await upsertUserReminder(userId, fullUserData, formData.reminderDays);
          console.log(`Reminder created for ${formData.reminderDays} days before due date`);
        } catch (reminderError) {
          console.error('Error creating reminder:', reminderError);
          // Don't fail the user creation if reminder fails
        }
      }
      
      toast.success(`User created and assigned to ${selectedAccount.email}. They will log in with the password you set.`);
      onOpenChange(false);
      resetForm();
      setSelectedAccountId('');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      displayName: '',
      loginPassword: '',
      accountEmail: '',
      accountPassword: '',
      planName: '',
      customPlanName: '',
      planPrice: 0,
      dueDate: null,
      planStatus: 'active',
      reminderDays: 3,
    });
  };

  const handlePlanChange = (planName: string) => {
    const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.name === planName);
    setFormData(prev => ({
      ...prev,
      planName,
      planPrice: selectedPlan?.price || 0,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">User Information</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The user will sign in using the email and the login password you set below. You can share these credentials with the user.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">Login Password *</Label>
              <div className="relative">
                <Input
                  id="loginPassword"
                  type={showLoginPassword ? "text" : "password"}
                  value={formData.loginPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, loginPassword: e.target.value }))}
                  placeholder="Set user's app login password"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 characters. Used for SubVault login.</p>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription Account Details</h3>
            <div className="space-y-2">
              <Label htmlFor="accountSelect">Select Shared Account</Label>
              <Select value={selectedAccountId} onValueChange={(val) => {
                setSelectedAccountId(val);
                const acc = availableAccounts.find(a => a.id === val);
                syncFormFromSelectedAccount(acc);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={accountsLoading ? 'Loading accounts...' : (availableAccounts.length ? 'Choose an available account' : 'No available accounts — create one first')} />
                </SelectTrigger>
                <SelectContent>
                  {availableAccounts.length === 0 && (
                    <SelectItem value="no-available" disabled>No available accounts</SelectItem>
                  )}
                  {availableAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.planName} — {acc.email} ({acc.currentUsers}/{acc.maxUsers})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountEmail">Account Email *</Label>
                <Input
                  id="accountEmail"
                  type="email"
                  value={formData.accountEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountEmail: e.target.value }))}
                  placeholder="netflix.account@example.com"
                  required={false}
                  disabled={true}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountPassword">Account Password</Label>
                <div className="relative">
                  <Input
                    id="accountPassword"
                    type={showAccountPassword ? "text" : "password"}
                    value={formData.accountPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountPassword: e.target.value }))}
                    placeholder="Account password"
                    className="pr-10"
                    disabled={true}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowAccountPassword(!showAccountPassword)}
                    disabled={!formData.accountPassword}
                  >
                    {showAccountPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription Plan</h3>
            {
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Input value={selectedAccount?.planName || ''} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Linked Account</Label>
                  <Input value={selectedAccount?.email || ''} readOnly />
                </div>
              </div>
            }
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planPrice">Price (₹/month)</Label>
                <Input
                  id="planPrice"
                  type="number"
                  value={formData.planPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, planPrice: Number(e.target.value) }))}
                  placeholder="200"
                  disabled={true}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planStatus">Status</Label>
                <Select 
                  value={formData.planStatus} 
                  onValueChange={(value: 'active' | 'expired' | 'pending') => 
                    setFormData(prev => ({ ...prev, planStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminderDays">Reminder (days before)</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min="0"
                  max="30"
                  value={formData.reminderDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminderDays: Number(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createUserMutation.isPending || availableAccounts.length === 0 || !selectedAccountId}
          >
            {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
