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
import { QrCode, Camera, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils/main-utils";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import BarcodeScannerButton from "@/components/elements/qr-code";

interface PaymentDepositCardProps {
  offlineTransactions: any[];
  setOfflineTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  isOnline: boolean;
}

export const PaymentDepositCard: React.FC<PaymentDepositCardProps> = ({
  offlineTransactions,
  setOfflineTransactions,
  isOnline,
}) => {
  const [manualCin, setManualCin] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const createDepositMutation = trpc.payment.createDeposit.useMutation({
    onSuccess: () => {
      utils.payment.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to create deposit:", { description: error.message });
    },
  });
  // Quick deposit amounts
  const quickAmounts = [1000, 2000, 5000, 10000, 20000];

  const handleDeposit = async () => {
    if (!manualCin || !amount) {
      toast.error("Please enter both CIN and amount");
      return;
    }

    if (amount < 100 || amount > 100000) {
      toast.error("Amount must be between 100 and 100,000 millimes");
      return;
    }

    if (isOnline) {
      await createDepositMutation.mutateAsync({
        cin: manualCin,
        amount,
      });

      await utils.payment.invalidate();
      setManualCin("");
      setAmount(null);
      toast.success(
        `Deposit of ${formatCurrency(amount)} created successfully!`
      );
    } else {
      // Store offline
      const offlineTransaction = {
        id: `offline-${Date.now()}`,
        cin: manualCin,
        amount,
        timestamp: new Date(),
        synced: false,
      };

      const updated = [...offlineTransactions, offlineTransaction];
      setOfflineTransactions(updated);
      localStorage.setItem("offlineTransactions", JSON.stringify(updated));

      toast.success("Transaction saved offline. Will sync when online.");
      setManualCin("");
      setAmount(null);
    }
  };

  return (
    <div className="flex-1">
      {/* QR Scanner & Deposit Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Student Deposit</span>
          </CardTitle>
          <CardDescription>
            Scan student QR code or enter CIN manually to process deposits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Scanner Button */}
          <BarcodeScannerButton onScan={setManualCin} withManualInput={false} />

          {/* Manual CIN Entry */}
          <div className="space-y-2">
            <Label htmlFor="cin">Student CIN</Label>
            <Input
              id="cin"
              placeholder="Enter student CIN..."
              value={manualCin}
              onChange={(e) => setManualCin(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Manual Amount Entry */}
          <div className="flex space-x-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount..."
                value={amount || ""}
                onChange={(e) =>
                  setAmount(e.target.value ? Number(e.target.value) : null)
                }
                min="200"
                max="100000"
                step={100}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleDeposit}
                disabled={
                  !manualCin || !amount || createDepositMutation.isPending
                }
                className="h-10"
              >
                {createDepositMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Deposit"
                )}
              </Button>
            </div>
          </div>

          <Separator className="my-4" />
          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant={amount === quickAmount ? "default" : "outline"}
                  onClick={() => {
                    setAmount(quickAmount);
                  }}
                  disabled={!manualCin || createDepositMutation.isPending}
                  className="h-12"
                >
                  {formatCurrency(quickAmount)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/*
 
file:text-foreground
placeholder:text-muted-foreground
selection:bg-primary
selection:text-primary-foreground
dark:bg-input/30
border-input
flex
h-9
w-full
min-w-0
rounded-md
border
bg-transparent
px-3
py-1
text-base
shadow-xs
transition-[color,box-shadow]
outline-none
file:inline-flex
file:h-7
file:border-0
file:bg-transparent
file:text-sm
file:font-medium
disabled:pointer-events-none
disabled:cursor-not-allowed
disabled:opacity-50
md:text-sm
focus-visible:border-ring
focus-visible:ring-ring/50
focus-visible:ring-[3px]
aria-invalid:ring-destructive/20
dark:aria-invalid:ring-destructive/40
aria-invalid:border-destructive

 */
