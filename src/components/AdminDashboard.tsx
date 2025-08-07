import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, DollarSign, TrendingUp, Activity } from "lucide-react";

interface AdminDashboardProps {
  users: Array<{
    id: string;
    email: string;
    accountEmail: string;
    plan: {
      name: string;
      price: number;
      dueDate: string;
      status: 'active' | 'expired' | 'pending';
    };
    joinDate: string;
  }>;
}

export const AdminDashboard = ({ users }: AdminDashboardProps) => {
  const totalRevenue = users
    .filter(user => user.plan.status === 'active')
    .reduce((sum, user) => sum + user.plan.price, 0);

  const activeUsers = users.filter(user => user.plan.status === 'active').length;
  const totalUsers = users.length;

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
        <Button className="bg-gradient-primary">Add New User</Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(totalUsers * 0.2)} from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((activeUsers / totalUsers) * 100).toFixed(1)}% active rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue}</div>
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
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              Month over month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
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
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.accountEmail}</TableCell>
                  <TableCell>{user.plan.name}</TableCell>
                  <TableCell>${user.plan.price}/mo</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.plan.status)}>
                      {user.plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.plan.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};