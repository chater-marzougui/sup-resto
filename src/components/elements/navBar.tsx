"use client";
import Link from 'next/link';
import { useAuth } from '@/components/auth/use-auth';
import { RoleBasedComponent } from '../providers/role-guard';
import { RoleEnum } from '@/server/db/enums';
import { NavUser } from './navUser';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-blue-600">
              SupResto
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {/* Public Links */}
              <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                Home
              </Link>
              
              <Link href="/about" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                About
              </Link>

              {/* Authenticated User Links */}
              {isAuthenticated && (
                <>
                  <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                    Dashboard
                  </Link>

                  {/* Student Links */}
                  <RoleBasedComponent allowedRoles={[RoleEnum.student]}>
                    <Link href="/my-courses" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                      My Courses
                    </Link>
                    <Link href="/assignments" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                      Assignments
                    </Link>
                  </RoleBasedComponent>

                  {/* Teacher Links */}
                  <RoleBasedComponent allowedRoles={[RoleEnum.teacher, RoleEnum.admin]}>
                    <Link href="/courses" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                      Courses
                    </Link>
                  </RoleBasedComponent>

                  {/* Staff Links */}
                  <RoleBasedComponent allowedRoles={[RoleEnum.verificationStaff, RoleEnum.paymentStaff]}>
                    <Link href="/staff-tools" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                      Staff Tools
                    </Link>
                  </RoleBasedComponent>

                  {/* Admin Links */}
                  <RoleBasedComponent allowedRoles={[RoleEnum.admin]}>
                    <Link href="/admin" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                      Admin Panel
                    </Link>
                  </RoleBasedComponent>
                </>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-700">
                  Hello, {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {user?.role}
                </span> 
                <NavUser />
              </>
            ) : (
              <Link
                href="/auth/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu button (you can expand this) */}
      <div className="md:hidden">
        {/* Add mobile navigation here if needed */}
      </div>
    </nav>
  );
}
