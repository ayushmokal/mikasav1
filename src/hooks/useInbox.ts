import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserEmails, 
  getUnreadEmailCount, 
  updateEmailMessage, 
  deleteEmailMessage,
  markAllEmailsAsRead,
  updateInboxSettings,
  cleanupOldEmails
} from '@/lib/firestore';
import { EmailMessage, InboxSettings } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useInbox = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  // Get user emails
  const {
    data: emails = [],
    isLoading: emailsLoading,
    error: emailsError
  } = useQuery({
    queryKey: ['emails', userProfile?.id],
    queryFn: () => getUserEmails(userProfile!.id!),
    enabled: !!userProfile?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get unread count
  const {
    data: unreadCount = 0,
    isLoading: unreadLoading
  } = useQuery({
    queryKey: ['unreadCount', userProfile?.id],
    queryFn: () => getUnreadEmailCount(userProfile!.id!),
    enabled: !!userProfile?.id,
    refetchInterval: 30000,
  });

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: ({ emailId, updates }: { emailId: string; updates: Partial<EmailMessage> }) =>
      updateEmailMessage(emailId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', userProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userProfile?.id] });
    },
    onError: (error) => {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    }
  });

  // Delete email mutation
  const deleteEmailMutation = useMutation({
    mutationFn: deleteEmailMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', userProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userProfile?.id] });
      toast.success('Email deleted');
    },
    onError: (error) => {
      console.error('Error deleting email:', error);
      toast.error('Failed to delete email');
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllEmailsAsRead(userProfile!.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', userProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userProfile?.id] });
      toast.success('All emails marked as read');
    },
    onError: (error) => {
      console.error('Error marking emails as read:', error);
      toast.error('Failed to mark emails as read');
    }
  });

  // Update inbox settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: InboxSettings) => updateInboxSettings(userProfile!.id!, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Inbox settings updated');
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error('Failed to update inbox settings');
    }
  });

  // Cleanup old emails mutation
  const cleanupEmailsMutation = useMutation({
    mutationFn: (retentionDays: number) => cleanupOldEmails(userProfile!.id!, retentionDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', userProfile?.id] });
      toast.success('Old emails cleaned up');
    },
    onError: (error) => {
      console.error('Error cleaning up emails:', error);
      toast.error('Failed to cleanup old emails');
    }
  });

  // Helper functions
  const markAsRead = (emailId: string) => {
    updateEmailMutation.mutate({ emailId, updates: { isRead: true } });
  };

  const markAsUnread = (emailId: string) => {
    updateEmailMutation.mutate({ emailId, updates: { isRead: false } });
  };

  const toggleStar = (emailId: string, isStarred: boolean) => {
    updateEmailMutation.mutate({ emailId, updates: { isStarred: !isStarred } });
  };

  const deleteEmail = (emailId: string) => {
    deleteEmailMutation.mutate(emailId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const updateSettings = (settings: InboxSettings) => {
    updateSettingsMutation.mutate(settings);
  };

  const cleanupOldEmailsAction = (retentionDays: number) => {
    cleanupEmailsMutation.mutate(retentionDays);
  };

  return {
    // Data
    emails,
    unreadCount,
    
    // Loading states
    emailsLoading,
    unreadLoading,
    isUpdating: updateEmailMutation.isPending,
    isDeleting: deleteEmailMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
    isCleaning: cleanupEmailsMutation.isPending,
    
    // Error states
    emailsError,
    
    // Actions
    markAsRead,
    markAsUnread,
    toggleStar,
    deleteEmail,
    markAllAsRead,
    updateSettings,
    cleanupOldEmailsAction,
  };
};

export default useInbox;