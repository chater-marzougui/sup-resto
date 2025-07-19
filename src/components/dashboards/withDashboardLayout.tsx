// src/components/dashboards/with-dashboard-layout.tsx
'use client';

import React from 'react';
import { useAuth } from '@/components/auth/use-auth';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Bell, Wifi, WifiOff } from 'lucide-react';

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
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const [isOnline, setIsOnline] = React.useState(true);

    // Monitor online/offline status
    React.useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);

    // Authentication check
    React.useEffect(() => {
      if (!isLoading && !user) {
        router.push(redirectTo);
        return;
      }

      if (user && requiredRole && user.role > requiredRole) {
        router.push('/dashboard'); // Redirect to default dashboard if insufficient permissions
        return;
      }
    }, [user, isLoading, router, requiredRole, redirectTo]);

    const handleLogout = async () => {
      await logout();
      router.push('/auth/login');
    };

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      return null; // Will redirect in useEffect
    }

    const getRoleName = (role: number) => {
      const roleNames: Record<number, string> = {
        1: 'Super Admin',
        2: 'Admin',
        3: 'Kitchen Staff',
        4: 'Staff',
        5: 'Student'
      };
      return roleNames[role] || 'User';
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Restau
                </h1>
                <div className="ml-4 flex items-center space-x-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-500">
                    {isOnline ? 'Online' : 'Offline Mode'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <Settings className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{getRoleName(user.role)}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <WrappedComponent {...props} />
        </main>
      </div>
    );
  };
}