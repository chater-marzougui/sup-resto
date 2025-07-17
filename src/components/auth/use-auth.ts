import { trpc } from "@/lib/trpc";
import { useRouter } from "next/router";
import { useState } from "react";

export function useAuth() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  const login = async (cin: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await trpc.auth.login.useMutation().mutateAsync({ cin, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return { login, isLoading, error };
}
