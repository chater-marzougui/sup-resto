// app/dashboard/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/components/auth/use-auth';
import { useRouter } from 'next/navigation';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { VerificationStaffDashboard } from '@/components/dashboards/verification-staff-dashboard';
import { PaymentStaffDashboard } from '@/components/dashboards/payment-staff-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';
import { VisitorDashboard } from '@/components/dashboards/visitor-dashboard';
import { RoleEnum } from '@/server/db/enums';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.error('User not authenticated, redirecting to login');
    router.push('/auth/login');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('User role:', user.role);

  switch (user.role) {
    case RoleEnum.student:
      return <StudentDashboard />;
    case RoleEnum.admin:
      return <AdminDashboard />;
    case RoleEnum.verificationStaff:
      return <VerificationStaffDashboard />;
    case RoleEnum.paymentStaff:
      return <PaymentStaffDashboard />;
    case RoleEnum.teacher:
      return <TeacherDashboard />;
    case RoleEnum.normalUser:
      return <VisitorDashboard />;
    default:
      return <VisitorDashboard />;
  }
}