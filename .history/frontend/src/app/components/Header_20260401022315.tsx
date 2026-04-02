import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  User, 
  Bell, 
  Menu, 
  Plus, 
  LogOut, 
  Settings,
  ChevronDown,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface HeaderProps {
  balance: number;
  username?: string;
  avatar?: string;
  onMenuClick: () => void;
  onCreateGame: () => void;
  onDeposit: () => void;
  onProfile: () => void;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const navTabs = [
  { id: "lobby", label: "Lobby" },
  { id: "tournaments", label: "Tournaments" },
  { id: "my-games", label: "My Games" },
  { id: "leaderboard", label: "Leaderboard" },
];

export function Header({ 
  balance, 
  username = "Player",
  avatar,
  onMenuClick, 
  onCreateGame, 
  onDeposit, 
  onProfile, 
  onLogout,
  activeTab = "lobby",
  onTabChange
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full h-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-purple-500/5">
        <div className="container mx-auto h-full max-w-7xl px-4 flex items-center justify-between">
          {/* Left Section - Logo */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(true)} 
              className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="text-white font-bold text-xl">G</span>
              </motion.div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold gradient-text">GameStake</h1>
                <p className="text-xs text-white/40">Bet. Play. Win.</p>
              </div>
            </div>
          </div>

          {/* Center Section - Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Wallet Balance */}
            <motion.button
              onClick={onDeposit}
              className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Wallet className="size-5 text-green-400" />
              <div className="text-left">
                <p className="text-xs text-white/40">Balance</p>
                <p className="text-lg font-bold text-white">${balance.toFixed(2)}</p>
              </div>
            </motion.button>

            {/* Deposit Button */}
            <Button
              onClick={onDeposit}
              className="hidden sm:flex bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20"
              size="sm"
            >
              <Plus className="size-4 mr-1" />
              Deposit
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-white/60 hover:text-white hover:bg-white/10"
            >
              <Bell className="size-5" />
              <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs bg-red-500 border-0">
                3
              </Badge>
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 px-2 hover:bg-white/10"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-purple-400/50">
                    {avatar ? (
                      <img src={avatar} alt={username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-sm">{getInitials(username)}</span>
                    )}
                  </div>
                  <ChevronDown className="size-4 text-white/60 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">{username}</p>
                  <p className="text-xs text-white/40">View profile</p>
                </div>
                <DropdownMenuItem onClick={onProfile} className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                  <User className="size-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                  <Settings className="size-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={onLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                  <LogOut className="size-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Wallet Banner */}
        <div className="sm:hidden border-t border-white/10 px-4 py-2 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-green-400" />
            <span className="text-sm font-semibold text-white">${balance.toFixed(2)}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDeposit}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="size-3 mr-1" />
            Deposit
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-slate-900 border-r border-white/10 z-50 lg:hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">G</span>
                  </div>
                  <span className="text-lg font-bold gradient-text">GameStake</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="size-5" />
                </Button>
              </div>
              <nav className="p-4 space-y-2">
                {navTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange?.(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                <Button 
                  onClick={onCreateGame}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="size-4 mr-2" />
                  Create Game
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}