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
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <Card className="min-w-[280px] max-w-[420px] flex-1 gap-3">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCode className="h-5 w-5" />
          <span>QR Code</span>
        </CardTitle>
      </CardHeader>
      <CardContent >
        <div className="text-center">
          <div className="flex justify-center cursor-pointer" onClick={handleOpen}>
            <QRCodeGenerator 
              value={cin} 
              size={130}
              includeMargin={true}
            />
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>QR Code - {userName}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4 p-4">
                <QRCodeGenerator 
                  value={cin} 
                  size={320}
                  includeMargin={true}
                />
                <p className="text-sm text-gray-600 text-center">
                  CIN: {cin}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};