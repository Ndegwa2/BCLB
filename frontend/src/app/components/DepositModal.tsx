import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Smartphone, 
  CreditCard, 
  Bitcoin, 
  Wallet, 
  Check,
  Copy,
  QrCode,
  Lock
} from "lucide-react";
import { Button } from "./ui/button";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
  isProcessing?: boolean;
}

type PaymentMethod = "mpesa" | "card" | "crypto";

const quickAmounts = [10, 25, 50, 100, 500];

export function DepositModal({ isOpen, onClose, onSuccess, currentBalance, isProcessing }: DepositModalProps) {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>("mpesa");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("btc");
  const [walletAddressCopied, setWalletAddressCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "processing" | "success">("input");

  const walletAddresses: Record<string, string> = {
    btc: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    eth: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    usdt: "TXu2X5SKPLZ7E3MVNTKkV6J7YJ6V6R7kZf",
  };

  const handleSubmit = () => {
    setError(null);
    const amountValue = parseFloat(amount);

    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountValue < 1) {
      setError("Minimum deposit is $1");
      return;
    }

    if (activeMethod === "mpesa" && !phoneNumber.match(/^[0-9]{10,15}$/)) {
      setError("Please enter a valid phone number");
      return;
    }

    if (activeMethod === "card") {
      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
        setError("Please enter a valid card number");
        return;
      }
      if (!cardExpiry || !cardExpiry.match(/^\d{2}\/\d{2}$/)) {
        setError("Please enter a valid expiry date (MM/YY)");
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setError("Please enter a valid CVV");
        return;
      }
    }

    setStep("processing");
    
    // Simulate processing
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    }, 3000);
  };

  const handleClose = () => {
    setAmount("");
    setPhoneNumber("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setError(null);
    setStep("input");
    onClose();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddresses[cryptoNetwork]);
    setWalletAddressCopied(true);
    setTimeout(() => setWalletAddressCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="modal-content max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Funds</h2>
              <p className="text-sm text-white/40">Current Balance: ${currentBalance.toFixed(2)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Processing State */}
        <AnimatePresence>
          {step === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg font-semibold text-white">Processing Payment...</p>
                <p className="text-sm text-white/60 mt-2">Please wait while we process your deposit</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success State */}
        <AnimatePresence>
          {step === "success" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <p className="text-lg font-semibold text-white">Deposit Successful!</p>
                <p className="text-sm text-white/60 mt-2">${parseFloat(amount || "0").toFixed(2)} has been added to your account</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Method Tabs */}
          <div className="flex gap-2">
            {[
              { id: "mpesa" as const, label: "M-Pesa", icon: Smartphone },
              { id: "card" as const, label: "Card", icon: CreditCard },
              { id: "crypto" as const, label: "Crypto", icon: Bitcoin },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setActiveMethod(method.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeMethod === method.id
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <method.icon className="w-4 h-4" />
                {method.label}
              </button>
            ))}
          </div>

          {/* M-Pesa Form */}
          {activeMethod === "mpesa" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="254712345678"
                  className="input-dark"
                />
                <p className="text-xs text-white/40 mt-1">You'll receive an M-Pesa prompt on this number</p>
              </div>

              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  className="input-dark"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      amount === quickAmount.toString()
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>

              {/* Conversion Info */}
              {amount && parseFloat(amount) > 0 && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-white/60">
                    You'll receive: <span className="font-semibold text-white">${parseFloat(amount).toFixed(2)} USD</span>
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Rate: 1 USD = 130 KES
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Card Form */}
          {activeMethod === "card" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="4444 4444 4444 4444"
                  maxLength={19}
                  className="input-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 block">Expiry Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 block">CVV</label>
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                    placeholder="•••"
                    maxLength={4}
                    className="input-dark"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  className="input-dark"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      amount === quickAmount.toString()
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Crypto Form */}
          {activeMethod === "crypto" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Network Selection */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">Select Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "btc", label: "Bitcoin", icon: "₿" },
                    { id: "eth", label: "Ethereum", icon: "Ξ" },
                    { id: "usdt", label: "USDT", icon: "₮" },
                  ].map((network) => (
                    <button
                      key={network.id}
                      onClick={() => setCryptoNetwork(network.id)}
                      className={`p-3 rounded-lg text-center transition-all ${
                        cryptoNetwork === network.id
                          ? "bg-purple-600 text-white"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      <div className="text-xl mb-1">{network.icon}</div>
                      <div className="text-xs font-medium">{network.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">Wallet Address</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-mono text-xs text-white/80 break-all">
                    {walletAddresses[cryptoNetwork]}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copyWalletAddress}
                  >
                    {walletAddressCopied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div className="flex justify-center p-6 bg-white/5 rounded-lg">
                <div className="w-32 h-32 bg-white/10 rounded-lg flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-white/40" />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  className="input-dark"
                />
              </div>

              <p className="text-xs text-white/40 text-center">
                Send only {cryptoNetwork.toUpperCase()} to this address. Sending any other asset may result in permanent loss.
              </p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 space-y-4">
          <Button
            className="w-full btn-success"
            onClick={handleSubmit}
            disabled={isProcessing || step !== "input"}
          >
            {activeMethod === "mpesa" && "Send STK Push"}
            {activeMethod === "card" && `Pay $${amount || "0.00"}`}
            {activeMethod === "crypto" && "I've Sent the Payment"}
          </Button>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-white/40">
            <Lock className="w-3 h-3" />
            <span>Secure payment • Instant credit</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}