import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { motion } from "motion/react";

interface CreateGameModalProps {
  open: boolean;
  onClose: () => void;
  onCreateGame: (gameType: string, stakeAmount: number) => void;
  balance: number;
}

const gameTypes = [
  { id: "blackjack", name: "Blackjack", icon: "🃏", description: "Classic card game" },
  { id: "pool", name: "8-Ball Pool", icon: "🎱", description: "Pocket all your balls first" },
  { id: "darts", name: "Darts", icon: "🎯", description: "Hit the bullseye" },
];

const quickStakes = [5, 10, 25, 50, 100];

export function CreateGameModal({ open, onClose, onCreateGame, balance }: CreateGameModalProps) {
  const [selectedGame, setSelectedGame] = useState("blackjack");
  const [stakeAmount, setStakeAmount] = useState(10);

  const handleCreate = () => {
    if (stakeAmount > balance) {
      alert("Insufficient balance");
      return;
    }
    if (stakeAmount <= 0) {
      alert("Please enter a valid stake amount");
      return;
    }
    onCreateGame(selectedGame, stakeAmount);
    onClose();
    setStakeAmount(10);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
          <DialogDescription>
            Choose a game type and set your stake amount
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Select Game</Label>
            <RadioGroup value={selectedGame} onValueChange={setSelectedGame}>
              <div className="grid gap-3">
                {gameTypes.map((game) => (
                  <motion.div
                    key={game.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <label
                      htmlFor={game.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedGame === game.id
                          ? "border-purple-600 bg-purple-500/10"
                          : "border-border hover:border-purple-300"
                      }`}
                    >
                      <RadioGroupItem value={game.id} id={game.id} />
                      <span className="text-2xl">{game.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{game.name}</p>
                        <p className="text-xs text-muted-foreground">{game.description}</p>
                      </div>
                    </label>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="stake">Stake Amount</Label>
            <div className="flex gap-2">
              {quickStakes.map((amount) => (
                <Button
                  key={amount}
                  variant={stakeAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStakeAmount(amount)}
                  className="flex-1"
                >
                  ${amount}
                </Button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="stake"
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(parseFloat(e.target.value) || 0)}
                className="pl-7"
                min="1"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Available balance: <span className="font-semibold text-green-600">${balance.toFixed(2)}</span>
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Stake:</span>
              <span className="font-semibold">${stakeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potential Pot:</span>
              <span className="font-bold text-green-600">${(stakeAmount * 2).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={stakeAmount > balance || stakeAmount <= 0}
          >
            Create Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
