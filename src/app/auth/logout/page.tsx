"use client";
import { useAuth } from "@/components/auth/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isLoadingAnimation } from "@/components/elements/isLoading";

export default function LogoutPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("Not authenticated, redirecting to login");
        router.push("/auth/login");
      } else {
        console.log("Logging out user");
        logout();
      }
    }
  }, [isLoading, isAuthenticated, logout, router]);

  if (isLoading) {
    console.log("still loading");
    return isLoadingAnimation;
  }

  // Show loading while logout is in progress
  return isLoadingAnimation;
}