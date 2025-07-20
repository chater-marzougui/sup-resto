import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string | number;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  includeMargin?: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 128,
  fgColor = "#000000",
  bgColor = "#ffffff",
  includeMargin = false,
}) => {
  const stringValue = String(value);

  return (
    <div>
      <QRCodeSVG
        value={stringValue}
        size={size}
        fgColor={fgColor}
        bgColor={bgColor}
        marginSize={includeMargin ? 4 : 0}
      />
    </div>
  );
};

export default QRCodeGenerator;
