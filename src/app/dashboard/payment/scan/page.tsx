"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Camera, CameraOff, RefreshCw, CheckCircle, AlertCircle, User, QrCode } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import BarcodeScannerButton from '@/components/elements/qr-code';

const QRScannerPageComponent = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCin, setScannedCin] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Quick deposit amounts
  const quickAmounts = [1000, 2000, 5000, 10000, 20000];

  // tRPC queries and mutations
  const validateCinMutation = trpc.payment.validateCin.useMutation();
  const quickDepositMutation = trpc.payment.createDeposit.useMutation();

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Simulate QR code scanning (in real implementation, you'd use a QR scanning library)
  const simulateQRScan = () => {
    // This is a simulation - in real implementation, you'd integrate with a QR scanning library
    const mockCin = '12345678901234567890'; // 20-digit mock CIN
    handleCinScanned(mockCin);
  };

  // Handle scanned CIN
  const handleCinScanned = async (cin: string) => {
    setScannedCin(cin);
    setIsValidating(true);
    
    try {
      const result = await validateCinMutation.mutateAsync({ cin });
      
      if (result.valid) {
        setStudentInfo(result.student);
        stopCamera();
        toast.success(`Student found: ${result.student?.fullName}`);
      } else {
        toast.error(result.message || 'Invalid CIN');
        setStudentInfo(null);
      }
    } catch (error) {
      toast.error('Failed to validate CIN');
      setStudentInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle quick deposit
  const handleQuickDeposit = async (amount: number) => {
    if (!scannedCin) {
      toast.error('No student selected');
      return;
    }

    try {
      const result = await quickDepositMutation.mutateAsync({
        cin: scannedCin,
        amount,
      });
      
      toast.success(`Deposit of ${amount.toLocaleString()} millimes completed successfully!`);
      
      // Reset for next transaction
      setScannedCin('');
      setStudentInfo(null);
      setSelectedAmount(null);
      
      // Restart camera for next scan
      startCamera();
    } catch (error) {
      toast.error('Failed to process deposit');
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setScannedCin('');
    setStudentInfo(null);
    setSelectedAmount(null);
    startCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} mill`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Section */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Camera Scanner</span>
            </CardTitle>
            <CardDescription>
              Position the student's QR code within the camera frame
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Element */}
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <QrCode className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Position QR code here</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Loading Overlay */}
              {isValidating && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p>Validating student...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex space-x-2">
              {!isScanning ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                  <Button onClick={simulateQRScan} className="flex-1">
                    📱 Simulate Scan
                  </Button>
                </>
              )}
            </div>
            
            <BarcodeScannerButton
                onScan={(data) => handleCinScanned(data)}
            />

            {/* Manual CIN Entry */}
            <div className="space-y-2">
              <Label htmlFor="manual-cin">Manual CIN Entry</Label>
              <div className="flex space-x-2">
                <Input
                  id="manual-cin"
                  placeholder="Enter CIN if QR scan fails..."
                  value={scannedCin}
                  onChange={(e) => setScannedCin(e.target.value)}
                  className="font-mono"
                />
                <Button
                  onClick={() => handleCinScanned(scannedCin)}
                  disabled={!scannedCin || isValidating}
                  variant="outline"
                >
                  {isValidating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Validate'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Student Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentInfo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-bold text-green-900">{studentInfo.fullName}</div>
                      <div className="text-sm text-green-700 font-mono">CIN: {studentInfo.cin}</div>
                    </div>
                  </div>
                  <Badge variant={studentInfo.isActive ? "default" : "destructive"}>
                    {studentInfo.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Current Balance</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatAmount(studentInfo.currentBalance)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No student selected</p>
                <p className="text-sm">Scan a QR code or enter CIN manually</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deposit Section */}
        <Card>
          <CardHeader>
            <CardTitle>Process Deposit</CardTitle>
            <CardDescription>
              Select amount to add to student's account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentInfo ? (
              <>
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount ? "default" : "outline"}
                      onClick={() => {
                        setSelectedAmount(amount);
                        handleQuickDeposit(amount);
                      }}
                      disabled={quickDepositMutation.isPending}
                      className="h-14 text-lg"
                    >
                      {quickDepositMutation.isPending && selectedAmount === amount ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        formatAmount(amount)
                      )}
                    </Button>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={resetScanner}
                    variant="outline"
                    className="flex-1"
                  >
                    Next Student
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Please scan or select a student first</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Export with role-based access control
export default QRScannerPageComponent;