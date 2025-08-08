'use client';

import React from 'react';
import { useAuth } from '@/components/auth/use-auth';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../elements/LoadingSpinner';

interface WithDashboardLayoutProps {
  requiredRole?: number;
  redirectTo?: string;
}

// HOC for dashboard layout
export function withDashboardLayout<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithDashboardLayoutProps = {}
) {
  const { requiredRole, redirectTo = '/auth/login' } = options;

  return function DashboardWrapper(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // Authentication check
    React.useEffect(() => {
      if (!isLoading && !user) {
        router.push(redirectTo);
        return;
      }

      if (user && requiredRole && user.role !== requiredRole) {
        router.push('/dashboard'); // Redirect to default dashboard if insufficient permissions
        return;
      }
    }, [user, isLoading, router, requiredRole, redirectTo]);

    if (isLoading) {
      return <LoadingSpinner />;
    }

    return (
      <div className="bg-background">
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <WrappedComponent {...props} />
        </main>
      </div>
    );
  };
}