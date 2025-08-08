import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeCameraScanConfig,
  CameraDevice,
  Html5QrcodeResult,
} from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scan, Eye, EyeOff, Camera } from "lucide-react";

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => boolean;
  isVisible?: boolean;
  onVisibilityToggle?: () => void;
  scanDelay?: number;
  className?: string;
}

const borderColors = {
  default: "border-gray-300",
  success: "border-green-300",
  error: "border-red-300",
};

export function BarcodeScanner({
  onBarcodeScanned,
  isVisible = true,
  onVisibilityToggle,
  scanDelay = 800,
  className = "",
}: BarcodeScannerProps) {
  const [cameraNumber, setCameraNumber] = useState<number>(0);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [borderColor, setBorderColor] = useState<
    (typeof borderColors)[keyof typeof borderColors]
  >(borderColors.default);
  const isWaitCompleteRef = useRef(true);
  const qrRegionRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const updateBorderColor = async (isSuccess: boolean) => {
    setBorderColor(isSuccess ? borderColors.success : borderColors.error);
    await new Promise(() =>
      setTimeout(() => {
        setBorderColor(borderColors.default);
      }, 400)
    );
  };

  // QR Code scanner setup
  useEffect(() => {
    if (!qrRegionRef.current || !isVisible) return;

    const scannerId = "qr-reader";
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.CODABAR,
      Html5QrcodeSupportedFormats.EAN_13,
    ];
    const html5QrCode = new Html5Qrcode(scannerId, {
      formatsToSupport,
      verbose: false,
    });
    html5QrCodeRef.current = html5QrCode;

    let isMounted = true;
    let isRunning = false;

    Html5Qrcode.getCameras()
      .then((availableDevices) => {
        if (!isMounted) return;
        setDevices(availableDevices);
        if (availableDevices.length === 0) {
          console.warn("No camera found.");
          return;
        }

        const cameraId = availableDevices[cameraNumber].id;
        const config: Html5QrcodeCameraScanConfig = {
          fps: 15,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: cameraNumber === 0 ? "user" : "environment",
            aspectRatio: 1.0,
            frameRate: { ideal: 15, max: 30 },
          },
        };

        html5QrCode
          .start(
            cameraId,
            config,
            async (decodedText, result: Html5QrcodeResult) => {
              if (!isMounted || !isWaitCompleteRef.current) return;
              console.log("QR Code scanned:", decodedText);
              // Allow vibration for all scans
              if (navigator.vibrate) navigator.vibrate(150);
              // Call the callback and get result
              let res: string = decodedText;
              if (result.result.format?.formatName === "ITF") {
                res = decodedText.slice(0, 8);
              } else if (result.result.format?.formatName === "CODE_128") {
                res = decodedText.slice(3, 11);
              } else if (result.result.format?.formatName === "QR_CODE") {
                res = decodedText;
              } else {
                return;
              }

              // Call the callback and get result
              updateBorderColor(await onBarcodeScanned(res));
              isWaitCompleteRef.current = false;
              await new Promise<void>(() => {
                setTimeout(() => {
                  if (isMounted) {
                    isWaitCompleteRef.current = true;
                  }
                  isWaitCompleteRef.current = true;
                }, scanDelay);
              });
            },
            () => {}
          )
          .then(() => {
            isRunning = true;
          })
          .catch((err) => {
            console.error("Camera start error:", err);
          });
      })
      .catch((err) => {
        console.error("Camera access error:", err);
      });

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current && isRunning) {
        html5QrCodeRef.current
          .stop()
          .then(() => html5QrCodeRef.current?.clear())
          .catch(() => {});
      } else if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear();
      }
    };
  }, [isVisible, cameraNumber, scanDelay]);

  const toggleCamera = () => {
    setCameraNumber((prev) => 1 - prev);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Barcode Scanner
          </CardTitle>
          <div className="flex items-center gap-2">
            {devices.length > 1 && (
              <Button
                onClick={toggleCamera}
                variant="outline"
                size="sm"
                className="w-20"
              >
                <Camera className="mr-2 h-4 w-4" />
                {cameraNumber === 0 ? "Front" : "Back"}
              </Button>
            )}
            {onVisibilityToggle && (
              <Button onClick={onVisibilityToggle} variant="outline" size="sm">
                {isVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {isVisible ? "Hide" : "Show"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isVisible && (
          <div className="space-y-4">
            <div
              id="qr-reader"
              ref={qrRegionRef}
              className={`mx-auto max-w-sm h-fit rounded-lg border-4 border-dashed ${borderColor}`}
            />
          </div>
        )}

        {!isVisible && (
          <div className="py-8 text-center text-gray-500">
            Scanner is hidden. Click "Show" to enable scanning.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
