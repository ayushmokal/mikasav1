import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Users, Eye, EyeOff } from 'lucide-react';
import { 
  useSubscriptionPlans, 
  useSharedAccounts, 
  useDeleteSubscriptionPlan,
  useDeleteSharedAccount 
} from '@/hooks/useFirestore';
import { CreatePlanModal } from './modals/CreatePlanModal';
import { CreateAccountModal } from './modals/CreateAccountModal';
import { EditPlanModal } from './modals/EditPlanModal';
import { EditAccountModal } from './modals/EditAccountModal';
import { AssignAccountModal } from './modals/AssignAccountModal';
import { SubscriptionPlan, SharedAccount } from '@/lib/types';
import { toast } from 'sonner';

export const SubscriptionAccountManagement = () => {
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [assignAccountOpen, setAssignAccountOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<SharedAccount | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const { data: accounts = [], isLoading: accountsLoading } = useSharedAccounts();
  const deletePlanMutation = useDeleteSubscriptionPlan();
  const deleteAccountMutation = useDeleteSharedAccount();

  const togglePasswordVisibility = (accountId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (confirm(`Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`)) {
      try {
        await deletePlanMutation.mutateAsync(plan.id);
        toast.success('Plan deleted successfully');
      } catch (error) {
        toast.error('Failed to delete plan');
      }
    }
  };

  const handleDeleteAccount = async (account: SharedAccount) => {
    if (confirm(`Are you sure you want to delete the account "${account.email}"? This action cannot be undone.`)) {
      try {
        await deleteAccountMutation.mutateAsync(account.id);
        toast.success('Account deleted successfully');
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setEditPlanOpen(true);
  };

  const handleEditAccount = (account: SharedAccount) => {
    setSelectedAccount(account);
    setEditAccountOpen(true);
  };

  const handleAssignAccount = (account: SharedAccount) => {
    setSelectedAccount(account);
    setAssignAccountOpen(true);
  };

  if (plansLoading || accountsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {accounts.length === 0 && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              No shared accounts found. Create an account before assigning users.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCreatePlanOpen(true)}>Create Plan</Button>
              <Button size="sm" onClick={() => setCreateAccountOpen(true)}>Create Account</Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Subscription Account Management</h2>
          <p className="text-muted-foreground">Manage subscription plans and shared accounts</p>
        </div>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="accounts">Shared Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Subscription Plans</h3>
            <Button onClick={() => setCreatePlanOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold">
                      ₹{plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                    
                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Features:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        {accounts.filter(acc => acc.planId === plan.id).length} accounts
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePlan(plan)}
                          disabled={deletePlanMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Shared Accounts</h3>
            <Button onClick={() => setCreateAccountOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {accounts.map((account) => {
              const plan = plans.find(p => p.id === account.planId);
              const isPasswordVisible = visiblePasswords.has(account.id);
              
              return (
                <Card key={account.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{account.planName}</CardTitle>
                        <CardDescription>{account.email}</CardDescription>
                      </div>
                      <Badge variant={account.status === 'active' ? "default" : account.status === 'suspended' ? "destructive" : "secondary"}>
                        {account.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Password:</label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePasswordVisibility(account.id)}
                          >
                            {isPasswordVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                        <div className="text-sm font-mono bg-muted p-2 rounded">
                          {isPasswordVisible ? account.password : '••••••••'}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {account.currentUsers}/{account.maxUsers} users
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ₹{plan?.price || 0}/month
                        </div>
                      </div>

                      {account.notes && (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          <strong>Notes:</strong> {account.notes}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssignAccount(account)}
                          disabled={account.currentUsers >= account.maxUsers}
                        >
                          <Users className="mr-1 h-3 w-3" />
                          Assign User
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAccount(account)}
                            disabled={deleteAccountMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreatePlanModal 
        open={createPlanOpen} 
        onOpenChange={setCreatePlanOpen}
      />
      
      <CreateAccountModal 
        open={createAccountOpen} 
        onOpenChange={setCreateAccountOpen}
        plans={plans}
      />
      
      {selectedPlan && (
        <EditPlanModal 
          open={editPlanOpen} 
          onOpenChange={setEditPlanOpen}
          plan={selectedPlan}
        />
      )}
      
      {selectedAccount && (
        <EditAccountModal 
          open={editAccountOpen} 
          onOpenChange={setEditAccountOpen}
          account={selectedAccount}
          plans={plans}
        />
      )}
      
      {selectedAccount && (
        <AssignAccountModal 
          open={assignAccountOpen} 
          onOpenChange={setAssignAccountOpen}
          account={selectedAccount}
        />
      )}
    </div>
  );
};
