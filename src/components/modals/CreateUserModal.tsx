import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateUser } from '@/hooks/useFirestore';
import { FirebaseUser, upsertUserReminder } from '@/lib/firestore';
import { toast } from 'sonner';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.accountEmail || !formData.planName || !formData.dueDate) {
      toast.error('Please fill in all required fields');
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
        accountEmail: formData.accountEmail,
        accountPassword: formData.accountPassword,
        plan: {
          name: planName,
          price: formData.planPrice,
          dueDate: format(formData.dueDate, 'yyyy-MM-dd'),
          status: formData.planStatus,
        },
        joinDate: format(new Date(), 'yyyy-MM-dd'),
      };

      const userId = await createUserMutation.mutateAsync(userData);
      
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
      
      toast.success(`User created successfully! Login credentials: Email: ${formData.email}, Password: ${formData.email} (Firebase Auth account will be created on first login)`);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      displayName: '',
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
                <strong>Note:</strong> The user will be able to login with their email address. The initial password will be set to their email address. The Firebase Auth account will be automatically created when they first log in.
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
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription Account Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountEmail">Account Email *</Label>
                <Input
                  id="accountEmail"
                  type="email"
                  value={formData.accountEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountEmail: e.target.value }))}
                  placeholder="netflix.account@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountPassword">Account Password</Label>
                <Input
                  id="accountPassword"
                  type="password"
                  value={formData.accountPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountPassword: e.target.value }))}
                  placeholder="Account password"
                />
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription Plan</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Service *</Label>
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
                  <Label htmlFor="customPlanName">Custom Service Name *</Label>
                  <Input
                    id="customPlanName"
                    value={formData.customPlanName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customPlanName: e.target.value }))}
                    placeholder="Enter service name"
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planPrice">Price (₹/month)</Label>
                <Input
                  id="planPrice"
                  type="number"
                  value={formData.planPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, planPrice: Number(e.target.value) }))}
                  placeholder="200"
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
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
