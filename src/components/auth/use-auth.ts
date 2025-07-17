"use client";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAuth() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

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
      
      router.push("/dashboard");
      return result;
    } catch (err: any) {
      setError(err.message ?? "Login failed");
      throw err; // Re-throw to allow caller to handle if needed
    } finally {
      setLoading(false);
    }
  };

  return { 
    login, 
    isLoading: isLoading || loginMutation.isPending, 
    error: error || loginMutation.error?.message 
  };
}