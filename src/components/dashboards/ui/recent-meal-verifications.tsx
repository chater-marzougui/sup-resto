
// components/dashboards/ui/recent-meal-verifications.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils/main-utils";

interface RecentMealVerificationsProps {
  limit?: number;
}

export const RecentMealVerifications: React.FC<RecentMealVerificationsProps> = ({
  limit = 10,
}) => {
  const { data: recentVerifications, isLoading } = 
    trpc.verification.getRecentVerifications.useQuery({ limit });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>Recent Meal Verifications</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentVerifications && recentVerifications.length > 0 ? (
            recentVerifications.map((verification) => (
              <div
                key={verification.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm">
                      {verification.studentFirstName} {verification.studentLastName}
                    </p>
                    <p className="text-xs text-gray-600">
                      CIN: {verification.studentCin}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1 capitalize">
                    {verification.mealTime}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(verification.createdAt)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No meal verifications yet today</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};