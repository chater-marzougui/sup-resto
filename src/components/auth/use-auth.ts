"use client";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function useAuth() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Only use router on client side
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch (e) {
    console.warn('Router not available:', e);
  }

  // Use the mutation hook at the top level of the custom hook
  const loginMutation = trpc.auth.login.useMutation();

  const login = async (cin: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Attempting to login with CIN:", cin);
      
      // Use the mutation instance
      const result = await loginMutation.mutateAsync({
        cin,
        password
      });
      
      // Store the token in localStorage or cookies
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        setIsAuthenticated(true);
      }
      
      if (router && isClient) {
        router.push("/dashboard");
      }
      return result;
    } catch (err: any) {
      setError(err.message ?? "Login failed");
      throw err; // Re-throw to allow caller to handle if needed
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already authenticated on mount
  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Query user data only when authenticated
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: (failureCount, error: any) => {
      // If unauthorized, clear token and don't retry
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
      // Clear local storage
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      
      // If you have a logout endpoint, call it here
      // await logoutMutation.mutateAsync();
      
      if (router && isClient) {
        router.push("/auth/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      // Even if logout fails on server, clear local state
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      if (router && isClient) {
        router.push("/auth/login");
      }
    }
  };

  return { 
    login, 
    isLoading: isLoading || loginMutation.isPending || userLoading, 
    error: error || loginMutation.error?.message,
    user,
    logout,
    isAuthenticated,
    isClient
  };
}