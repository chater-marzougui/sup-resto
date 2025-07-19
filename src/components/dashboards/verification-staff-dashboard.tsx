"use client";

// src/components/dashboards/staff-dashboard.tsx
import { Scan, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { withDashboardLayout} from './withDashboardLayout';
import { DashboardLayout } from '../layouts/dashboardLayout';
import { RoleEnum } from '@/server/db/enums';

interface StaffDashboardProps {}

const VerificationStaffDashboardComponent = (props: StaffDashboardProps) => {
  const mockData = {
    todayCheckins: 142,
    pendingSync: 5,
    lastSync: '5 minutes ago',
    activeStudents: 1250
  };

  return (
    <DashboardLayout 
      title="Staff Dashboard" 
      subtitle="Manage student check-ins and system operations"
      actions={
        <>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Scan className="h-4 w-4" />
            <span>QR Scanner</span>
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Sync Data</span>
          </button>
        </>
      }
    >
      {/* Staff Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Scan className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Check-ins</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.todayCheckins}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.activeStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <RefreshCw className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Sync</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.pendingSync}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Sync</p>
              <p className="text-sm font-bold text-gray-900">{mockData.lastSync}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Scan className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">Scan Student QR</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
            <Users className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">Manual Check-in</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">Force Sync</p>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export const VerificationStaffDashboard = withDashboardLayout(VerificationStaffDashboardComponent, {
  requiredRole: RoleEnum.verificationStaff
});