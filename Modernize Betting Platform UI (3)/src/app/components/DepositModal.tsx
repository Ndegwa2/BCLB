import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CreditCard, Smartphone, Wallet } from "lucide-react";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amount: number, method: string) => void;
}

const quickAmounts = [10, 25, 50, 100, 250];

export function DepositModal({ open, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState(50);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleDeposit = (method: string) => {
    if (amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (method === "mpesa" && !phoneNumber) {
      alert("Please enter your phone number");
      return;
    }
    onDeposit(amount, method);
    onClose();
    setAmount(50);
    setPhoneNumber("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds to Wallet</DialogTitle>
          <DialogDescription>
            Choose your payment method and amount
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="mpesa" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mpesa" className="gap-1">
              <Smartphone className="size-4" />
              M-Pesa
            </TabsTrigger>
            <TabsTrigger value="card" className="gap-1">
              <CreditCard className="size-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-1">
              <Wallet className="size-4" />
              Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mpesa" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Select Amount</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant={amount === quickAmount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(quickAmount)}
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="pl-7"
                  min="1"
                  step="1"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-center">
                You will receive an M-Pesa prompt on{" "}
                <span className="font-semibold">{phoneNumber || "your phone"}</span> for{" "}
                <span className="font-bold text-green-600">${amount.toFixed(2)}</span>
              </p>
            </div>

            <Button
              onClick={() => handleDeposit("mpesa")}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={!phoneNumber || amount <= 0}
            >
              Send M-Pesa Prompt
            </Button>
          </TabsContent>

          <TabsContent value="card" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Card Number</Label>
              <Input placeholder="1234 5678 9012 3456" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Expiry</Label>
                <Input placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <Input placeholder="123" type="password" maxLength={3} />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="pl-7"
                  min="1"
                />
              </div>
            </div>

            <Button
              onClick={() => handleDeposit("card")}
              className="w-full"
              disabled={amount <= 0}
            >
              Pay ${amount.toFixed(2)}
            </Button>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-muted text-center">
              <Wallet className="size-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Connect your external wallet to deposit funds
              </p>
            </div>

            <Button variant="outline" className="w-full">
              Connect Wallet
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
