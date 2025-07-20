"use client";

// src/components/dashboards/Teacher-dashboard.tsx
import { CreditCard, Calendar, Clock, Plus, QrCode } from 'lucide-react';
import React from 'react';
import { withDashboardLayout } from './withDashboardLayout';
import { DashboardLayout } from '../layouts/dashboardLayout';
import { RoleEnum } from '@/server/db/enums';

interface TeacherDashboardProps {}

const TeacherDashboardComponent = (props: TeacherDashboardProps) => {
  // Mock data - replace with actual tRPC calls
  const mockData = {
    balance: 15.50,
    scheduledMeals: 3,
    upcomingMeal: 'Tomorrow - Lunch'
  };

  return (
    <DashboardLayout 
      title="Teacher Dashboard" 
      subtitle="Manage your meals and account balance"
      actions={
        <>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Buy Meals</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Schedule</span>
          </button>
        </>
      }
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Balance</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.balance} TND</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.scheduledMeals}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Next Meal</p>
              <p className="text-sm font-bold text-gray-900">{mockData.upcomingMeal}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <QrCode className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">QR Ready</p>
              <p className="text-sm font-bold text-green-600">Scan to Enter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-500">No recent activities. Charge your account to get started!</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export const TeacherDashboard = withDashboardLayout(TeacherDashboardComponent, {
  requiredRole: RoleEnum.teacher
});