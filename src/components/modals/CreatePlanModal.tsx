import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useCreateSubscriptionPlan } from '@/hooks/useFirestore';
import { toast } from 'sonner';

interface CreatePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePlanModal = ({ open, onOpenChange }: CreatePlanModalProps) => {
  const createPlanMutation = useCreateSubscriptionPlan();
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    currency: 'INR',
    description: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const planData = {
        ...formData,
      };
      
      await createPlanMutation.mutateAsync(planData);
      toast.success('Subscription plan created successfully');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create subscription plan');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      currency: 'INR',
      description: '',
      isActive: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Subscription Plan</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Netflix Premium"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="200"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  placeholder="INR"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the plan"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active Plan</Label>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createPlanMutation.isPending}
          >
            {createPlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
