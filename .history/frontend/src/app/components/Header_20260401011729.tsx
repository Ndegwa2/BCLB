import { Wallet, User, Bell, Menu, Plus, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

interface HeaderProps {
  balance: number;
  onMenuClick: () => void;
  onCreateGame: () => void;
  onDeposit: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

export function Header({ balance, onMenuClick, onCreateGame, onDeposit, onProfile, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-xl">GameStake</h1>
              <p className="text-xs text-muted-foreground">Bet. Play. Win.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <Wallet className="size-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="font-bold text-green-600">${balance.toFixed(2)}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onDeposit}
            className="hidden sm:flex"
          >
            Deposit
          </Button>
          <Button
            onClick={onCreateGame}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="sm"
          >
            <Plus className="size-4 mr-1" />
            <span className="hidden sm:inline">Create Game</span>
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs bg-red-600">
              2
            </Badge>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onProfile}>
                <User className="size-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="size-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile wallet banner */}
      <div className="sm:hidden border-t px-4 py-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-green-600" />
          <span className="text-sm font-semibold text-green-600">${balance.toFixed(2)}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onDeposit}>
          Deposit
        </Button>
      </div>
    </header>
  );
}