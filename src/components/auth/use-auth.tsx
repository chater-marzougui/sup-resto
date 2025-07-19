"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { RoleEnum } from '@/server/db/enums';
import { AuthUser } from '@/server/trpc/services/auth-service';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (cin: string, password: string) => Promise<any>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
  hasRole: (role: number) => boolean;
  hasAnyRole: (roles: number[]) => boolean;
}

// Create context with undefined initial value and proper type assertion
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const router = useRouter();
  
  // tRPC mutations
  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  // Only fetch user data once during initialization
  const { data: userData, isLoading: userDataLoading } = trpc.auth.me.useQuery(undefined, {
    enabled: !hasInitialized && !!localStorage.getItem('auth_token'),
    retry: (failureCount, error: any) => {
      if (error?.data?.code === 'UNAUTHORIZED') {
        handleAuthFailure();
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity, // Never refetch automatically
  });

  // Handle authentication failure
  const handleAuthFailure = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    setError('Session expired. Please log in again.');
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          // No token, user is not authenticated
          setIsAuthenticated(false);
          setUser(null);
          setHasInitialized(true);
          setIsLoading(false);
          return;
        }

        // Token exists, wait for user data
        setIsAuthenticated(true);
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleAuthFailure();
      }
    };

    initializeAuth();
  }, []);

  // Handle user data response
  useEffect(() => {
    if (hasInitialized) return;

    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
      setHasInitialized(true);
      setIsLoading(false);
    } else if (!userDataLoading && localStorage.getItem('auth_token')) {
      // User data failed to load but we have a token
      handleAuthFailure();
      setHasInitialized(true);
      setIsLoading(false);
    } else if (!localStorage.getItem('auth_token')) {
      // No token case
      setHasInitialized(true);
      setIsLoading(false);
    }
  }, [userData, userDataLoading, hasInitialized]);

  const login = async (cin: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await loginMutation.mutateAsync({
        cin,
        password
      });
      
      if (result.token && result.user) {
        localStorage.setItem('auth_token', result.token);
        setUser(result.user);
        setIsAuthenticated(true);
        setError(null);
        
        // Redirect based on role or to dashboard
        router.push('/dashboard');
        return result;
      }
      
      throw new Error('Invalid response from server');
      
    } catch (err: any) {
      const errorMessage = err.message ?? 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call server logout (don't wait for it to complete)
      logoutMutation.mutate(undefined, {
        onSettled: () => {
          // Always clear local state regardless of server response
          localStorage.removeItem('auth_token');
          setUser(null);
          setIsAuthenticated(false);
          setError(null);
          setIsLoading(false);
          router.push('/auth/login');
        }
      });
      
    } catch (err) {
      console.error('Logout error:', err);
      // Always clear local state even if server call fails
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setIsLoading(false);
      router.push('/auth/login');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const hasRole = (role: number): boolean => {
    return user?.role ? user.role === role : false;
  };

  const hasAnyRole = (roles: number[]): boolean => {
    if (!user || user.role === undefined) return false;

    return roles.includes(user.role);
  };

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading || userDataLoading,
    isAuthenticated,
    login,
    logout,
    error,
    clearError,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}