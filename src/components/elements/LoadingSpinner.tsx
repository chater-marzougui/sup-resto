// export default function LoadingSpinner() {
//   return (
//     <div className="flex items-center justify-center h-full">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//     </div>
//   );
// }

import React from "react";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
    icon?: React.ComponentType<{ className?: string }>;
    text?: string;
    useLogo?: boolean;
    basicSpinner?: boolean;
}

// SupResto Logo component
const SupRestoLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="none" />
        <path d="M30 50 L45 35 L45 45 L70 45 L70 55 L45 55 L45 65 Z" fill="currentColor" />
    </svg>
);

export const LoadingSpinner: React.FC<SpinnerProps> = ({ icon: Icon, text = "", useLogo = false, basicSpinner = false }) => {
    // Determine which icon to use
    const SpinnerIcon = useLogo ? SupRestoLogo : Icon || Loader2;
    if (basicSpinner) {
        return <SpinnerIcon className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
                <SpinnerIcon className="h-8 w-8 animate-spin text-primary border-blue-600 border-b-2 rounded-full" />
                {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
            </div>
        </div>
    );
};

export default LoadingSpinner;
