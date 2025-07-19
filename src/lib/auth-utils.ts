import { RoleEnum } from '@/server/db/enums';

export const ROUTE_PERMISSIONS = {
  // Public routes - no authentication required
  PUBLIC: [
    '/',
    '/about',
    '/contact',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
  ],
  
  // Protected routes - authentication required
  PROTECTED: [
    '/dashboard',
    '/profile',
    '/settings',
  ],
  
  // Role-based routes
  ADMIN_ONLY: [
    '/admin',
    '/admin/users',
    '/admin/settings',
    '/admin/reports',
  ],
  
  TEACHER_AND_ADMIN: [
    '/courses',
    '/courses/create',
    '/courses/manage',
  ],
  
  STAFF_ONLY: [
    '/verification',
    '/payments',
    '/staff-tools',
  ],
  
  STUDENT_ONLY: [
    '/my-courses',
    '/assignments',
    '/grades',
  ],
} as const;

// Helper function to check if a route requires authentication
export function isPublicRoute(pathname: string): boolean {
  return ROUTE_PERMISSIONS.PUBLIC.some(route => {
    if (route === pathname) return true;
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return false;
  });
}

// Helper function to check if user has access to a route
export function hasRouteAccess(pathname: string, userRole?: number): boolean {
  // Public routes are always accessible
  if (isPublicRoute(pathname)) return true;
  
  // If no user role, only public routes are accessible
  if (!userRole) return false;
  
  // Check admin-only routes
  if (ROUTE_PERMISSIONS.ADMIN_ONLY.some(route => pathname.startsWith(route))) {
    return userRole === RoleEnum.admin;
  }
  
  // Check teacher and admin routes
  if (ROUTE_PERMISSIONS.TEACHER_AND_ADMIN.some(route => pathname.startsWith(route))) {
    return userRole === RoleEnum.teacher || userRole === RoleEnum.admin;
  }
  
  // Check staff routes
  if (ROUTE_PERMISSIONS.STAFF_ONLY.some(route => pathname.startsWith(route))) {
    return userRole === RoleEnum.verificationStaff || 
           userRole === RoleEnum.paymentStaff || 
           userRole === RoleEnum.admin;
  }
  
  // Check student-only routes
  if (ROUTE_PERMISSIONS.STUDENT_ONLY.some(route => pathname.startsWith(route))) {
    return userRole === RoleEnum.student;
  }
  
  // Default protected routes - any authenticated user
  return true;
}