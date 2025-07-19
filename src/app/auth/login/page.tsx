"use client";
import { LoginForm } from "@/components/auth/login-form";
import { GuestRoute } from "@/components/providers/role-guard";

export default function LoginPage() {
  return (
    <GuestRoute>
      <div className="flex flex-col items-center justify-center p-8 min-h-[80vh]">
        <h1 className="mb-4 text-2xl font-bold">Login</h1>
        <LoginForm />
      </div>
    </GuestRoute>
  );
}
