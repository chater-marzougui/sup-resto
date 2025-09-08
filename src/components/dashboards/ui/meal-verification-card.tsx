// components/dashboards/ui/meal-verification-card.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QrCode, Scan, User, CheckCircle, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/main-utils";

interface MealVerificationCardProps {
  offlineVerifications: any[];
  setOfflineVerifications: (transactions: any[]) => void;
  isOnline: boolean;
}

export const MealVerificationCard: React.FC<MealVerificationCardProps> = ({
  offlineVerifications,
  setOfflineVerifications,
  isOnline,
}) => {
  const [cin, setCin] = useState("");
  const [mealTime, setMealTime] = useState<"lunch" | "dinner">("lunch");
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const utils = trpc.useUtils();

  // Mutations
  const verifyMealMutation = trpc.verification.verifyMeal.useMutation();
  const validateCinMutation = trpc.verification.validateCinForMeal.useMutation();

  const handleValidateCin = async () => {
    if (!cin.trim()) {
      toast.error("Please enter a CIN");
      return;
    }

    try {
      const result = await validateCinMutation.mutateAsync({
        cin: cin.trim(),
        mealTime,
        date: new Date(),
      });

      setValidationResult(result);

      if (!result.valid) {
        toast.error(result.message);
      } else {
        toast.success(`Student found: ${result.student?.fullName}`);
      }
    } catch (error) {
      toast.error("Failed to validate CIN");
      setValidationResult(null);
    }
  };

  const handleVerifyMeal = async () => {
    if (!validationResult?.valid) {
      toast.error("Please validate CIN first");
      return;
    }

    const verificationData = {
      cin: cin.trim(),
      mealTime,
      verificationDate: new Date(),
    };

    if (!isOnline) {
      // Handle offline verification
      const offlineVerification = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...verificationData,
        timestamp: new Date(),
      };

      const updatedOfflineVerifications = [...offlineVerifications, offlineVerification];
      setOfflineVerifications(updatedOfflineVerifications);
      localStorage.setItem("offlineVerifications", JSON.stringify(updatedOfflineVerifications));

      toast.success("Meal verification saved offline");
      resetForm();
      return;
    }

    try {
      const result = await verifyMealMutation.mutateAsync(verificationData);
      
      toast.success(result.message);
      resetForm();
      
      // Refresh verification stats
      await utils.verification.invalidate();
    } catch (error: any) {
      toast.error(error?.message || "Failed to verify meal");
    }
  };

  const resetForm = () => {
    setCin("");
    setValidationResult(null);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCode className="h-5 w-5" />
          <span>Meal Verification</span>
        </CardTitle>
        <CardDescription>
          Verify student meal consumption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meal Time Selection */}
        <div className="space-y-2">
          <Label htmlFor="mealTime">Meal Time</Label>
          <Select value={mealTime} onValueChange={(value: "lunch" | "dinner") => setMealTime(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select meal time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CIN Input */}
        <div className="space-y-2">
          <Label htmlFor="cin">Student CIN</Label>
          <div className="flex space-x-2">
            <Input
              id="cin"
              type="text"
              placeholder="Enter CIN or scan QR"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidateCin()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScanning(!isScanning)}
            >
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <Card className={`border-2 ${
            validationResult.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                {validationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  {validationResult.valid ? (
                    <div>
                      <p className="font-medium text-green-800">
                        {validationResult.student.fullName}
                      </p>
                      <p className="text-sm text-green-600">
                        Balance: {formatCurrency(validationResult.student.currentBalance)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {validationResult.mealStatus}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-red-800">{validationResult.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleValidateCin}
            disabled={!cin.trim() || validateCinMutation.isPending}
            className="w-full"
            variant="outline"
          >
            <User className="h-4 w-4 mr-2" />
            {validateCinMutation.isPending ? "Validating..." : "Validate Student"}
          </Button>

          <Button
            onClick={handleVerifyMeal}
            disabled={!validationResult?.valid || verifyMealMutation.isPending}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {verifyMealMutation.isPending ? "Verifying..." : `Verify ${mealTime}`}
          </Button>
        </div>

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="text-center">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              Offline Mode - Verifications will sync when online
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
