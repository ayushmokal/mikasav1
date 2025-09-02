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
import { useUpdateUser } from '@/hooks/useFirestore';
import { FirebaseUser, upsertUserReminder } from '@/lib/firestore';
import { toast } from 'sonner';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: FirebaseUser | null;
}

const SUBSCRIPTION_PLANS = [
  { name: 'Netflix', price: 200, currency: 'INR' },
  { name: 'Amazon Prime', price: 150, currency: 'INR' },
  { name: 'Disney+ Hotstar', price: 100, currency: 'INR' },
  { name: 'Spotify', price: 119, currency: 'INR' },
  { name: 'YouTube Premium', price: 129, currency: 'INR' },
  { name: 'Custom', price: 0, currency: 'INR' },
];

export const EditUserModal = ({ open, onOpenChange, user }: EditUserModalProps) => {
  const updateUserMutation = useUpdateUser();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    accountEmail: '',
    accountPassword: '',
    planName: '',
    customPlanName: '',
    planPrice: 0,
    dueDate: null as Date | null,
    planStatus: 'active' as 'active' | 'expired' | 'pending',
    reminderDays: 3,
  });

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      const dueDate = user.plan.dueDate ? new Date(user.plan.dueDate) : null;
      const isCustomPlan = !SUBSCRIPTION_PLANS.some(plan => plan.name === user.plan.name);
      
      setFormData({
        email: user.email,
        displayName: user.displayName || '',
        accountEmail: user.accountEmail,
        accountPassword: user.accountPassword,
        planName: isCustomPlan ? 'Custom' : user.plan.name,
        customPlanName: isCustomPlan ? user.plan.name : '',
        planPrice: user.plan.price,
        dueDate,
        planStatus: user.plan.status,
        reminderDays: 3, // Default reminder days
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !formData.email || !formData.accountEmail || !formData.planName || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const planName = formData.planName === 'Custom' ? formData.customPlanName : formData.planName;
    
    if (!planName) {
      toast.error('Please provide a plan name');
      return;
    }

    try {
      const updates: Partial<FirebaseUser> = {
        email: formData.email,
        displayName: formData.displayName || formData.email.split('@')[0],
        accountEmail: formData.accountEmail,
        accountPassword: formData.accountPassword,
        plan: {
          name: planName,
          price: formData.planPrice,
          dueDate: format(formData.dueDate, 'yyyy-MM-dd'),
          status: formData.planStatus,
        },
      };

      await updateUserMutation.mutateAsync({ id: user.id, updates });
      
      // Handle reminder updates
      if (formData.dueDate && formData.reminderDays > 0) {
        try {
          const updatedUser: FirebaseUser = {
            ...user,
            ...updates,
            plan: updates.plan!
          };
          await upsertUserReminder(user.id, updatedUser, formData.reminderDays);
          console.log(`Reminder updated for ${formData.reminderDays} days before due date`);
        } catch (reminderError) {
          console.error('Error updating reminder:', reminderError);
          // Don't fail the user update if reminder fails
        }
      }
      
      toast.success('User updated successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handlePlanChange = (planName: string) => {
    const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.name === planName);
    setFormData(prev => ({
      ...prev,
      planName,
      planPrice: selectedPlan?.price || prev.planPrice,
    }));
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">User Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-displayName">Display Name</Label>
                <Input
                  id="edit-displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription Account Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-accountEmail">Account Email *</Label>
                <Input
                  id="edit-accountEmail"
                  type="email"
                  value={formData.accountEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountEmail: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-accountPassword">Account Password</Label>
                <div className="relative">
                  <Input
                    id="edit-accountPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.accountPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountPassword: e.target.value }))}
                    placeholder="Account password"
                    className="pr-10"
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
                <p className="text-xs text-muted-foreground">
                  Password for the subscription account (e.g., Netflix password)
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription Plan</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-planName">Service *</Label>
                <Select value={formData.planName} onValueChange={handlePlanChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <SelectItem key={plan.name} value={plan.name}>
                        {plan.name} {plan.price > 0 && `(₹${plan.price}/mo)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.planName === 'Custom' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-customPlanName">Custom Service Name *</Label>
                  <Input
                    id="edit-customPlanName"
                    value={formData.customPlanName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customPlanName: e.target.value }))}
                    placeholder="Enter service name"
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-planPrice">Price (₹/month)</Label>
                <Input
                  id="edit-planPrice"
                  type="number"
                  value={formData.planPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, planPrice: Number(e.target.value) }))}
                  placeholder="200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-planStatus">Status</Label>
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
                <Label htmlFor="edit-reminderDays">Reminder (days before)</Label>
                <Input
                  id="edit-reminderDays"
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
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
