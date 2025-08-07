import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useReminders, usePendingReminders, useMarkReminderAsSent } from '@/hooks/useFirestore';
import { Reminder } from '@/lib/firestore';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export const RemindersManagement = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');

  const { data: allReminders, isLoading: allLoading } = useReminders();
  const { data: pendingReminders, isLoading: pendingLoading } = usePendingReminders();
  const markSentMutation = useMarkReminderAsSent();

  const reminders = activeTab === 'all' ? allReminders : pendingReminders;
  const isLoading = activeTab === 'all' ? allLoading : pendingLoading;

  const getReminderStatus = (reminder: Reminder) => {
    if (reminder.sent) return 'sent';
    
    const today = new Date();
    const reminderDate = parseISO(reminder.reminderDate);
    const dueDate = parseISO(reminder.dueDate);
    
    if (dueDate < today) return 'overdue';
    if (reminderDate <= today) return 'pending';
    return 'scheduled';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Bell className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleMarkAsSent = async (reminderId: string) => {
    if (confirm('Mark this reminder as sent?')) {
      try {
        await markSentMutation.mutateAsync(reminderId);
        toast.success('Reminder marked as sent');
      } catch (error) {
        toast.error('Failed to mark reminder as sent');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reminders...</span>
      </div>
    );
  }

  const pendingCount = pendingReminders?.length || 0;
  const totalCount = allReminders?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reminders Management</h2>
          <p className="text-muted-foreground">
            Track and manage subscription payment reminders
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reminders</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reminders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              All time reminders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCount > 0 ? Math.round(((totalCount - pendingCount) / totalCount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Reminders processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          All Reminders ({totalCount})
        </Button>
      </div>

      {/* Reminders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'pending' ? 'Pending Reminders' : 'All Reminders'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reminders && reminders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Reminder Date</TableHead>
                  <TableHead>Days Before</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => {
                  const status = getReminderStatus(reminder);
                  const daysUntilDue = differenceInDays(parseISO(reminder.dueDate), new Date());
                  
                  return (
                    <TableRow key={reminder.id}>
                      <TableCell className="font-medium">{reminder.userEmail}</TableCell>
                      <TableCell>{reminder.serviceName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(parseISO(reminder.dueDate), 'MMM dd, yyyy')}</span>
                          <span className="text-xs text-muted-foreground">
                            {daysUntilDue >= 0 ? `${daysUntilDue} days away` : `${Math.abs(daysUntilDue)} days overdue`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{format(parseISO(reminder.reminderDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{reminder.daysBefore} days</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(status)}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!reminder.sent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsSent(reminder.id!)}
                            disabled={markSentMutation.isPending}
                          >
                            {markSentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Mark Sent'
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No reminders found</h3>
              <p className="text-muted-foreground">
                {activeTab === 'pending' 
                  ? 'All caught up! No pending reminders at the moment.' 
                  : 'No reminders have been created yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
