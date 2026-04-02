import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, DollarSign, Settings, Lock, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGame: (data: CreateGameData) => void;
  userBalance: number;
  isCreating?: boolean;
}

export interface CreateGameData {
  gameType: "blackjack" | "pool" | "darts";
  stakeAmount: number;
  maxRounds: number;
  timeLimit: number;
  isPrivate: boolean;
  allowAI: boolean;
  aiDifficulty?: "easy" | "medium" | "hard";
}

const gameTypes = [
  { 
    id: "blackjack" as const, 
    label: "Blackjack", 
    icon: "🃏",
    description: "Classic card game"
  },
  { 
    id: "pool" as const, 
    label: "8-Ball Pool", 
    icon: "🎱",
    description: "Billiards showdown"
  },
  { 
    id: "darts" as const, 
    label: "Darts", 
    icon: "🎯",
    description: "Precision throwing"
  },
];

const roundOptions = [1, 3, 5, 7, 10];
const timeLimitOptions = [5, 10, 15, 30, 60];
const presetStakes = [0, 10, 25, 50, 100];

export function CreateGameModal({ isOpen, onClose, onCreateGame, userBalance, isCreating }: CreateGameModalProps) {
  const [gameType, setGameType] = useState<CreateGameData["gameType"]>("blackjack");
  const [stakeAmount, setStakeAmount] = useState(25);
  const [maxRounds, setMaxRounds] = useState(5);
  const [timeLimit, setTimeLimit] = useState(15);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowAI, setAllowAI] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Generate game code when private is enabled
  useEffect(() => {
    if (isPrivate) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setGameCode(code);
    }
  }, [isPrivate]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setGameType("blackjack");
      setStakeAmount(25);
      setMaxRounds(5);
      setTimeLimit(15);
      setIsPrivate(false);
      setShowAdvanced(false);
      setError(null);
      setCodeCopied(false);
      setAllowAI(false);
      setAiDifficulty("medium");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    setError(null);

    if (stakeAmount < 0) {
      setError("Stake amount must be non-negative");
      return;
    }

    if (stakeAmount > 0 && stakeAmount > userBalance) {
      setError("Insufficient balance");
      return;
    }

    onCreateGame({
      gameType,
      stakeAmount,
      maxRounds,
      timeLimit,
      isPrivate,
      allowAI,
      aiDifficulty: allowAI ? aiDifficulty : undefined,
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const totalPot = stakeAmount * 2;
  const platformFee = totalPot * 0.05;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Create New Game</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Game Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">Select Game Type</label>
            <div className="grid grid-cols-3 gap-3">
              {gameTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setGameType(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    gameType === type.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm font-semibold text-white">{type.label}</div>
                  <div className="text-xs text-white/40">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stake Amount */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">Stake Amount</label>
            
            {/* Preset Buttons */}
            <div className="flex gap-2">
              {presetStakes.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setStakeAmount(preset)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    stakeAmount === preset
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={Math.min(500, userBalance)}
                step="5"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #9333ea 0%, #ec4899 ${(stakeAmount / Math.min(500, userBalance)) * 100}%, rgba(255,255,255,0.1) ${(stakeAmount / Math.min(500, userBalance)) * 100}%)`
                }}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">$0</span>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Math.max(0, Math.min(Number(e.target.value), userBalance)))}
                    className="w-20 px-2 py-1 bg-white/10 border border-white/10 rounded text-white text-center"
                  />
                </div>
                <span className="text-white/40">${Math.min(500, userBalance)}</span>
              </div>
            </div>
          </div>

          {/* Advanced Rules */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              Advanced Rules
              <motion.span
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 p-4 bg-white/5 rounded-lg">
                    {/* Max Rounds */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Max Rounds</span>
                      <select
                        value={maxRounds}
                        onChange={(e) => setMaxRounds(Number(e.target.value))}
                        className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-white text-sm"
                      >
                        {roundOptions.map((round) => (
                          <option key={round} value={round}>{round} rounds</option>
                        ))}
                      </select>
                    </div>

                    {/* Time Limit */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Time Limit</span>
                      <select
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                        className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-white text-sm"
                      >
                        {timeLimitOptions.map((time) => (
                          <option key={time} value={time}>{time} min</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Opponent Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-sm font-medium text-white">Play vs AI</p>
                <p className="text-xs text-white/40">Challenge an AI opponent</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAllowAI(!allowAI)}
              className={`w-12 h-6 rounded-full transition-colors ${
                allowAI ? "bg-purple-600" : "bg-white/20"
              }`}
            >
              <motion.div
                className="w-5 h-5 rounded-full bg-white shadow-md"
                animate={{ x: allowAI ? 26 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* AI Difficulty Selection */}
          <AnimatePresence>
            {allowAI && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-xs text-white/60 mb-3">AI Difficulty Level</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "easy" as const, label: "Easy", color: "bg-green-500" },
                      { value: "medium" as const, label: "Medium", color: "bg-yellow-500" },
                      { value: "hard" as const, label: "Hard", color: "bg-red-500" },
                    ].map((difficulty) => (
                      <button
                        key={difficulty.value}
                        type="button"
                        onClick={() => setAiDifficulty(difficulty.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          aiDifficulty === difficulty.value
                            ? `${difficulty.color} text-white`
                            : "bg-white/10 text-white/60 hover:bg-white/20"
                        }`}
                      >
                        {difficulty.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Private Game Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-white/60" />
              <div>
                <p className="text-sm font-medium text-white">Private Game</p>
                <p className="text-xs text-white/40">Only players with code can join</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-12 h-6 rounded-full transition-colors ${
                isPrivate ? "bg-purple-600" : "bg-white/20"
              }`}
            >
              <motion.div
                className="w-5 h-5 rounded-full bg-white shadow-md"
                animate={{ x: isPrivate ? 26 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Game Code (if private) */}
          <AnimatePresence>
            {isPrivate && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-xs text-white/60 mb-2">Game Code</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white/10 rounded font-mono text-lg text-white tracking-widest">
                      {gameCode}
                    </code>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={copyCode}
                    >
                      {codeCopied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60">Total Pot</p>
                <p className="text-lg font-bold gradient-text-green">{stakeAmount === 0 ? 'Free' : `$${totalPot.toFixed(2)}`}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Platform Fee (5%)</p>
                <p className="text-lg font-bold text-white/80">{stakeAmount === 0 ? '$0.00' : `$${platformFee.toFixed(2)}`}</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <Button variant="secondary" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {stakeAmount === 0 ? 'Create Free Game' : `Create Game - $${stakeAmount.toFixed(2)}`}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}