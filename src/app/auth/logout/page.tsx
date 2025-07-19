"use client";
import { useAuth } from "@/components/auth/use-auth";
import LoadingSpinner from "@/components/elements/LoadingSpinner";
import { useEffect } from "react";

export default function LogoutPage() {
  const { logout, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      logout();
    }
  }, [isAuthenticated, logout]);

  return <LoadingSpinner />;
}
