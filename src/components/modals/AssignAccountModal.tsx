import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, UserMinus } from 'lucide-react';
import { useUsers, useAssignAccount, useUnassignAccount, useAssignmentsByAccount } from '@/hooks/useFirestore';
import { SharedAccount } from '@/lib/types';
import { toast } from 'sonner';

interface AssignAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SharedAccount;
}

export const AssignAccountModal = ({ open, onOpenChange, account }: AssignAccountModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: assignments = [] } = useAssignmentsByAccount(account?.id || '');
  const assignAccountMutation = useAssignAccount();
  const unassignAccountMutation = useUnassignAccount();

  const assignedUserIds = assignments.map(assignment => assignment.userId);
  const availableUsers = users.filter(user => 
    !assignedUserIds.includes(user.id) && 
    user.role !== 'admin' &&
    (user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const assignedUsers = users.filter(user => assignedUserIds.includes(user.id));

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user to assign');
      return;
    }

    const selectedUser = users.find(user => user.id === selectedUserId);
    if (!selectedUser) {
      toast.error('User not found');
      return;
    }

    try {
      await assignAccountMutation.mutateAsync({
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        accountId: account.id,
        planId: account.planId,
      });
      toast.success(`Account assigned to ${selectedUser.email}`);
      setSelectedUserId('');
    } catch (error: any) {
      console.error('Error assigning account:', error);
      toast.error(error.message || 'Failed to assign account');
    }
  };

  const handleUnassign = async (userId: string) => {
    const user = users.find(user => user.id === userId);
    if (!user) return;

    if (confirm(`Are you sure you want to unassign this account from ${user.email}?`)) {
      try {
        await unassignAccountMutation.mutateAsync({
          userId,
          accountId: account.id,
        });
        toast.success(`Account unassigned from ${user.email}`);
      } catch (error) {
        console.error('Error unassigning account:', error);
        toast.error('Failed to unassign account');
      }
    }
  };

  if (usersLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading users...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Account: {account?.email}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {account?.planName} • {account?.currentUsers}/{account?.maxUsers} users assigned
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Assign New User */}
          {account.currentUsers < account.maxUsers && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Assign to New User</h4>
              
              <div className="space-y-2">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userSelect">Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} - {user.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleAssign}
                disabled={!selectedUserId || assignAccountMutation.isPending}
                className="w-full"
              >
                {assignAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Account
              </Button>
            </div>
          )}

          {account.currentUsers >= account.maxUsers && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                This account is at maximum capacity ({account.maxUsers} users). 
                To assign new users, please unassign existing users first.
              </p>
            </div>
          )}

          {/* Currently Assigned Users */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Currently Assigned Users</h4>
            
            {assignedUsers.length === 0 ? (
              <p className="text-muted-foreground">No users assigned to this account.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.plan?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.plan?.status === 'active' ? 'default' : 'secondary'}>
                          {user.plan?.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnassign(user.id)}
                          disabled={unassignAccountMutation.isPending}
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          Unassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
