import { User } from './auth';

export interface GameEntry {
  id: number;
  user_id: number;
  game_id: number;
  stake_amount: number;
  joined_at: string;
  result: 'win' | 'loss' | 'draw' | null;
  payout_amount: number;
  created_at: string;
  updated_at: string;
  username?: string;
  user?: User | null;
}

export interface Game {
  id: number;
  game_code: string;
  game_type: string;
  stake_amount: number;
  total_pot: number;
  status: string;
  allow_ai: boolean;
  ai_opponent_id?: number;
  opponent_type?: 'human' | 'ai';
  ai_difficulty?: 'easy' | 'medium' | 'hard';
  created_at: string;
  creator_id: number;
  entries?: GameEntry[];
}

export interface GameEntryWithUser extends GameEntry {
  user: User;
}

export interface PoolGameState {
  status: 'loading' | 'ready' | 'in_progress' | 'completed' | 'error';
  currentPlayer: number | null;
  players: Array<{
    id: number;
    username: string;
    isCurrentUser: boolean;
    userId: number;
  }>;
  score: {
    player1: number;
    player2: number;
  };
  gameOver: boolean;
  winner: number | null;
  currentTurn: number | null;
  ballsPotted: {
    solids: number;
    stripes: number;
  };
  gameType: 'pool_8ball' | 'draw_1v1' | 'card_blackjack' | 'poker_texas_holdem' | 'tournament_single_elimination';
}

export interface DrawGameState {
  status: 'loading' | 'waiting' | 'ready' | 'drawing' | 'completed' | 'error';
  currentPlayer: number | null;
  players: Array<{
    id: number;
    username: string;
    isCurrentUser: boolean;
    userId: number;
    ready: boolean;
    stakeAmount: number;
  }>;
  gameOver: boolean;
  winner: number | null;
  drawResults: {
    player1: number;
    player2: number;
  } | null;
  totalPot: number;
  houseCut: number;
  winnerPayout: number;
  gameType: 'draw_1v1';
}

export interface PoolBall {
  id: number;
  type: 'cue' | 'solid' | 'stripe' | 'eight';
  number: number;
  x: number;
  y: number;
  pocketed: boolean;
  physicsBody: any;
}

export interface PoolGameConfig {
  tableWidth: number;
  tableHeight: number;
  ballRadius: number;
  pocketRadius: number;
  cuePower: number;
  maxPower: number;
}