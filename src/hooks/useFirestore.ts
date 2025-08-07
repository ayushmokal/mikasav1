import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  updateUserPlan,
  getUsersByPlanStatus,
  FirebaseUser 
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
