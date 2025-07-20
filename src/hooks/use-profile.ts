// src/hooks/use-profile.ts
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/auth/use-auth';

export function useProfile() {
  const [isEditing, setIsEditing] = useState(false);
  
  // Get user profile
  const { data: user, isLoading: isLoadingUser, refetch: refetchUser } = trpc.user.getProfile.useQuery();

  const { data: transactions, isLoading: isLoadingTransactions } = trpc.transaction.getUserTransactionHistory.useQuery(
    { userId: user?.id ?? "", limit: 10 },
    { enabled: !!user?.id }
  );

  // Update profile mutation
  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully');
      refetchUser();
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Change password mutation (you'll need to add this to your auth router)
  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to change password');
    },
  });

  const updateProfile = (data: { firstName?: string; lastName?: string; email?: string }) => {
    updateProfileMutation.mutate(data);
  };

  const changePassword = (data: { oldPassword: string; newPassword: string }) => {
    changePasswordMutation.mutate(data);
  };

  return {
    user,
    transactions,
    isLoadingUser,
    isLoadingTransactions,
    isEditing,
    setIsEditing,
    updateProfile,
    changePassword,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
  };
}