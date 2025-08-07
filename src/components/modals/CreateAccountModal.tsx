import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useCreateSharedAccount } from '@/hooks/useFirestore';
import { SubscriptionPlan } from '@/lib/types';
import { toast } from 'sonner';

interface CreateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: SubscriptionPlan[];
}

export const CreateAccountModal = ({ open, onOpenChange, plans }: CreateAccountModalProps) => {
  const createAccountMutation = useCreateSharedAccount();
  
  const [formData, setFormData] = useState({
    planId: '',
    planName: '',
    email: '',
    password: '',
    maxUsers: 1,
    status: 'active' as 'active' | 'inactive' | 'suspended',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.planId || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const accountData = {
        ...formData,
        currentUsers: 0,
        assignedUserIds: [],
      };
      await createAccountMutation.mutateAsync(accountData);
      toast.success('Shared account created successfully');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create shared account');
    }
  };

  const resetForm = () => {
    setFormData({
      planId: '',
      planName: '',
      email: '',
      password: '',
      maxUsers: 1,
      status: 'active',
      notes: '',
    });
  };

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(plan => plan.id === planId);
    setFormData(prev => ({
      ...prev,
      planId,
      planName: selectedPlan?.name || '',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Shared Account</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planId">Subscription Plan *</Label>
              <Select value={formData.planId} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans
                    .filter(plan => plan.isActive)
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price}/month
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Account Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="account@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Account Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Account password"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about this account"
                rows={3}
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createAccountMutation.isPending}
          >
            {createAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
