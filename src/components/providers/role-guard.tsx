"use client";
import { useAuth } from '../auth/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { RoleEnum } from '@/server/db/enums';

interface RouteGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

interface RoleGuardProps extends RouteGuardProps {
  allowedRoles: number[];
  fallbackPath?: string;
}

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Public Route - accessible to everyone (authenticated and non-authenticated)
export function PublicRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Protected Route - only authenticated users
export function ProtectedRoute({ children, fallbackPath = '/auth/login' }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(fallbackPath);
    }
  }, [isAuthenticated, isLoading, router, fallbackPath]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner />; // Show loading while redirecting
  }

  return <>{children}</>;
}

// Guest Route - only non-authenticated users (login, register pages)
export function GuestRoute({ children, fallbackPath = '/dashboard' }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(fallbackPath);
    }
  }, [isAuthenticated, isLoading, router, fallbackPath]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <LoadingSpinner />; // Show loading while redirecting
  }

  return <>{children}</>;
}

// Role-based Route - only specific roles
export function RoleGuard({ children, allowedRoles, fallbackPath = '/dashboard' }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading, hasAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
        return;
      }
      
      if (user && !hasAnyRole(allowedRoles)) {
        router.replace(fallbackPath);
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, hasAnyRole, allowedRoles, router, fallbackPath]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  if (user && !hasAnyRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Utility component for conditional rendering based on roles
export function RoleBasedComponent({ 
  allowedRoles, 
  children, 
  fallback 
}: { 
  allowedRoles: number[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasAnyRole } = useAuth();

  if (hasAnyRole(allowedRoles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}