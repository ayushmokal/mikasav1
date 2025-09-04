import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  createUserWithAuth,
  updateUser, 
  deleteUser, 
  updateUserPlan,
  getUsersByPlanStatus,
  FirebaseUser,
  getReminders,
  getPendingReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  markReminderAsSent,
  getUserReminders,
  Reminder,
  resetUserPassword,
  forcePasswordChange,
  toggleUserStatus,
  getUserLoginHistory
} from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

// Hook to get all users (admin only)
export const useUsers = () => {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
    enabled: isAdmin,
  });
};

// Hook to get a single user by ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};

// Hook to get users by plan status
export const useUsersByPlanStatus = (status: 'active' | 'expired' | 'pending') => {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['users', 'by-status', status],
    queryFn: () => getUsersByPlanStatus(status),
    enabled: isAdmin,
  });
};

// Hook to create a new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Hook to create a new user with Firebase Auth
export const useCreateUserWithAuth = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userData, password }: { 
      userData: Omit<FirebaseUser, 'id' | 'createdAt' | 'updatedAt' | 'uid'>;
      password: string;
    }) => createUserWithAuth(userData, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Hook to update a user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FirebaseUser> }) =>
      updateUser(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
};

// Hook to delete a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Hook to update user plan
export const useUpdateUserPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: FirebaseUser['plan'] }) =>
      updateUserPlan(id, plan),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
};

// Hook to get dashboard statistics
export const useDashboardStats = () => {
  const { data: users, isLoading } = useUsers();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    growthRate: 0,
  });

  useEffect(() => {
    if (users) {
      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.plan.status === 'active').length;
      const totalRevenue = users
        .filter(user => user.plan.status === 'active')
        .reduce((sum, user) => sum + user.plan.price, 0);
      
      // Mock growth rate calculation (you'd calculate this based on historical data)
      const growthRate = 12.5;

      setStats({
        totalUsers,
        activeUsers,
        totalRevenue,
        growthRate,
      });
    }
  }, [users]);

  return {
    stats,
    isLoading,
  };
};

// Reminder hooks
export const useReminders = () => {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['reminders'],
    queryFn: getReminders,
    enabled: isAdmin,
  });
};

export const usePendingReminders = () => {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['reminders', 'pending'],
    queryFn: getPendingReminders,
    enabled: isAdmin,
  });
};

export const useUserReminders = (userId: string) => {
  return useQuery({
    queryKey: ['reminders', 'user', userId],
    queryFn: () => getUserReminders(userId),
    enabled: !!userId,
  });
};

export const useCreateReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useUpdateReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Reminder> }) =>
      updateReminder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useDeleteReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useMarkReminderAsSent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markReminderAsSent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

// Admin password management hooks
export const useResetUserPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      resetUserPassword(userId, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useForcePasswordChange = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: forcePasswordChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      toggleUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUserLoginHistory = (userId: string) => {
  return useQuery({
    queryKey: ['user-login-history', userId],
    queryFn: () => getUserLoginHistory(userId),
    enabled: !!userId,
  });
};

// =============================================
// SUBSCRIPTION PLAN HOOKS
// =============================================

import { 
  createSubscriptionPlan, 
  getSubscriptionPlans, 
  updateSubscriptionPlan, 
  deleteSubscriptionPlan,
  createSharedAccount,
  getSharedAccounts,
  getSharedAccountsByPlan,
  updateSharedAccount,
  deleteSharedAccount,
  assignAccountToUser,
  unassignAccountFromUser,
  getAssignmentsByUser,
  getAssignmentsByAccount
} from '@/lib/firestore';
import { SubscriptionPlan, SharedAccount, AccountAssignment } from '@/lib/types';

// Hook to get all subscription plans
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: getSubscriptionPlans,
  });
};

// Hook to create a subscription plan
export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) =>
      createSubscriptionPlan(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    },
  });
};

// Hook to update a subscription plan
export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SubscriptionPlan> }) =>
      updateSubscriptionPlan(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    },
  });
};

// Hook to delete a subscription plan
export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    },
  });
};

// =============================================
// SHARED ACCOUNT HOOKS
// =============================================

// Hook to get all shared accounts
export const useSharedAccounts = () => {
  return useQuery({
    queryKey: ['sharedAccounts'],
    queryFn: getSharedAccounts,
  });
};

// Hook to get shared accounts by plan
export const useSharedAccountsByPlan = (planId: string) => {
  return useQuery({
    queryKey: ['sharedAccounts', 'plan', planId],
    queryFn: () => getSharedAccountsByPlan(planId),
    enabled: !!planId,
  });
};

// Hook to create a shared account
export const useCreateSharedAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (accountData: Omit<SharedAccount, 'id' | 'createdAt' | 'updatedAt'>) =>
      createSharedAccount(accountData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedAccounts'] });
    },
  });
};

// Hook to update a shared account
export const useUpdateSharedAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SharedAccount> }) =>
      updateSharedAccount(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedAccounts'] });
    },
  });
};

// Hook to delete a shared account
export const useDeleteSharedAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSharedAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedAccounts'] });
    },
  });
};

// =============================================
// ACCOUNT ASSIGNMENT HOOKS
// =============================================

// Hook to assign account to user
export const useAssignAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, userEmail, accountId, planId }: { 
      userId: string; 
      userEmail: string; 
      accountId: string; 
      planId: string; 
    }) => assignAccountToUser(userId, userEmail, accountId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['accountAssignments'] });
    },
  });
};

// Hook to unassign account from user
export const useUnassignAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, accountId }: { userId: string; accountId: string }) =>
      unassignAccountFromUser(userId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['accountAssignments'] });
    },
  });
};

// Hook to get assignments by user
export const useAssignmentsByUser = (userId: string) => {
  return useQuery({
    queryKey: ['accountAssignments', 'user', userId],
    queryFn: () => getAssignmentsByUser(userId),
    enabled: !!userId,
  });
};

// Hook to get assignments by account
export const useAssignmentsByAccount = (accountId: string) => {
  return useQuery({
    queryKey: ['accountAssignments', 'account', accountId],
    queryFn: () => getAssignmentsByAccount(accountId),
    enabled: !!accountId,
  });
};
