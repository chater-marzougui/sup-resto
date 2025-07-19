"use client";

// src/components/dashboards/Visitor-dashboard.tsx
import { ChefHat, Clock, TrendingUp, Calendar } from 'lucide-react';
import { withDashboardLayout } from './withDashboardLayout';
import { DashboardLayout } from '../layouts/dashboardLayout';
import { RoleEnum } from '@/server/db/enums';

interface VisitorDashboardProps {}

const VisitorDashboardComponent = (props: VisitorDashboardProps) => {
  const mockData = {
    todayScheduled: 287,
    lunchScheduled: 156,
    dinnerScheduled: 131,
    avgDaily: 245
  };

  return (
    <DashboardLayout 
      title="Visitor Dashboard" 
      subtitle="Meal planning and preparation overview"
      actions={
        <>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Weekly Plan</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Forecasts</span>
          </button>
        </>
      }
    >
      {/* Visitor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.todayScheduled}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Lunch</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.lunchScheduled}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Dinner</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.dinnerScheduled}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Daily Average</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.avgDaily}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Planning */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Today's Meal Planning</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Lunch (12:00 - 14:00)</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{mockData.lunchScheduled} meals scheduled</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Prepare portions 30 minutes before service
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Dinner (18:00 - 20:00)</h4>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>{mockData.dinnerScheduled} meals scheduled</strong>
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Start prep at 17:00 for optimal timing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export const VisitorDashboard = withDashboardLayout(VisitorDashboardComponent, {
  requiredRole: RoleEnum.normalUser
});