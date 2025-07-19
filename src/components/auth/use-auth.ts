"use client";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function useAuth() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true); // Start as true
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const router = useRouter();

  // Use the mutation hook at the top level
  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const login = async (cin: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Attempting to login with CIN:", cin);
      
      const result = await loginMutation.mutateAsync({
        cin,
        password
      });
      
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        setIsAuthenticated(true);
        router.push("/dashboard");
      }
      
      return result;
    } catch (err: any) {
      setError(err.message ?? "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      } finally {
        setIsInitialized(true);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Query user data only when authenticated and initialized
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated && isInitialized,
    retry: (failureCount, error: any) => {
      if (error?.data?.code === 'UNAUTHORIZED') {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        return false;
      }
      return failureCount < 3;
    }
  });

  const logout = async () => {
    try {
      setLoading(true);
      await logoutMutation.mutateAsync();
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      
      
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Clear local state even if server call fails
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const finalIsLoading = !isInitialized || isLoading || loginMutation.isPending || userLoading;

  return { 
    login, 
    isLoading: finalIsLoading, 
    error: error || loginMutation.error?.message,
    user,
    logout,
    isAuthenticated,
    isInitialized
  };
}