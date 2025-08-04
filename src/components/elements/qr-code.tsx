import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, RotateCcw } from "lucide-react";
import { BarcodeScanner } from "./BarcodeScanner";

interface BarcodeScannerButtonProps {
  onScan: (data: string) => void;
  buttonText?: string;
}

const BarcodeScannerButton: React.FC<BarcodeScannerButtonProps> = ({
  onScan,
  buttonText = "Scan Barcode",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [manualInput, setManualInput] = useState("");

  const onScanComplete = (data: string) => {
    if (data) {
      onScan(data);
      setManualInput(data);
    }
    return true; // Indicate successful scan
  }

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Camera className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Barcode Scanner</DialogTitle>
          </DialogHeader>
          <BarcodeScanner onBarcodeScanned={onScanComplete} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-input">Or enter barcode manually:</Label>
              <div className="flex space-x-2">
                <Input
                  id="manual-input"
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyUp={handleKeyPress}
                  placeholder="Enter barcode"
                  className="flex-1"
                />
                <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                  Submit
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <div>• Point camera at barcode to scan</div>
              <div>• 2-second delay between consecutive scans</div>
              {cameras.length > 1 && (
                <div>• Switch cameras using the rotate button</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarcodeScannerButton;