"use client"

import { useAuth } from "@/components/auth/use-auth";
import LoadingSpinner from "@/components/elements/LoadingSpinner";
import { useRouter } from "next/navigation"
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <LoadingSpinner />; // Show loading while redirecting
  }

  return (
    <>
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <h1 className="text-4xl font-bold text-center sm:text-left">Welcome to Sup Resto</h1>
          <p className="text-lg text-gray-700 text-center sm:text-left">
            Your one-stop solution for restaurant management.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="/auth/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Login
          </a>
          <a href="/auth/register" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Register
          </a>
        </div>
      </main>
      <footer className="text-sm text-gray-500 row-start-3">
        <p>&copy; {new Date().getFullYear()} Sup Resto. All rights reserved.</p>
        <p>Built with ❤️ by the Sup Resto Team</p>
      </footer>
    </div>
  </>
  );
}