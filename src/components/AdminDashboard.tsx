import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, TrendingUp, Activity, Loader2, Bell, UserPlus, Settings } from "lucide-react";
import { useUsers, useDashboardStats, useUpdateUser, useDeleteUser } from "@/hooks/useFirestore";
import { FirebaseUser } from "@/lib/firestore";
import { CreateUserModal } from "@/components/modals/CreateUserModal";
import { EditUserModal } from "@/components/modals/EditUserModal";
import { RemindersManagement } from "@/components/RemindersManagement";
import { SubscriptionAccountManagement } from "@/components/SubscriptionAccountManagement";
import { format, parseISO } from 'date-fns';

export const AdminDashboard = () => {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null);

  const handleEditUser = (user: FirebaseUser) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = parseISO(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (usersLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users and monitor subscription metrics
          </p>
        </div>
        <Button 
          className="bg-gradient-primary"
          onClick={() => setCreateUserModalOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(stats.totalUsers * 0.2)} from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% active rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.growthRate}%</div>
            <p className="text-xs text-muted-foreground">
              Month over month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="accounts">
            <Settings className="mr-2 h-4 w-4" />
            Subscription Accounts
          </TabsTrigger>
          <TabsTrigger value="reminders">
            <Bell className="mr-2 h-4 w-4" />
            Reminders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {users && users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Email</TableHead>
                      <TableHead>Account Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const daysUntilDue = getDaysUntilDue(user.plan.dueDate);
                      const isNearDue = daysUntilDue <= 7 && daysUntilDue >= 0;
                      const isOverdue = daysUntilDue < 0;
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.accountEmail}</TableCell>
                          <TableCell>{user.plan.name}</TableCell>
                          <TableCell>₹{user.plan.price}/mo</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.plan.status)}>
                              {user.plan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className={isOverdue ? 'text-red-600 font-semibold' : isNearDue ? 'text-yellow-600 font-semibold' : ''}>
                                {format(parseISO(user.plan.dueDate), 'MMM dd, yyyy')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {isOverdue 
                                  ? `${Math.abs(daysUntilDue)} days overdue`
                                  : `${daysUntilDue} days left`
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteUser(user.id!)}
                                disabled={deleteUserMutation.isPending}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No users found</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first user.
                  </p>
                  <Button onClick={() => setCreateUserModalOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create First User
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <SubscriptionAccountManagement />
        </TabsContent>

        <TabsContent value="reminders">
          <RemindersManagement />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateUserModal 
        open={createUserModalOpen} 
        onOpenChange={setCreateUserModalOpen} 
      />
      
      <EditUserModal 
        open={editUserModalOpen} 
        onOpenChange={setEditUserModalOpen}
        user={selectedUser}
      />
    </div>
  );
};