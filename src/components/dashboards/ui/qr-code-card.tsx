// src/components/dashboard/qr-code-card.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode } from 'lucide-react';
import QRCodeGenerator from '@/components/codeQR/qr-code-generator';

interface QRCodeCardProps {
  cin: string;
  userName: string;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ cin, userName }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCode className="h-5 w-5" />
          <span>QR Code</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <QRCodeGenerator 
              value={cin} 
              size={120}
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-gray-600">
            Show this QR code at the canteen entrance
          </p>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                View Full Size
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>QR Code - {userName}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4 p-4">
                <QRCodeGenerator 
                  value={cin} 
                  size={250}
                  includeMargin={true}
                />
                <p className="text-sm text-gray-600 text-center">
                  CIN: {cin}
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Present this code to the canteen staff for meal access
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};