import { User } from './auth';

// Tournament status types
export type TournamentStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'paused';

// Tournament format types
export type TournamentFormat = 'single_elimination' | 'double_elimination';

// Game types supported in tournaments
export type TournamentGameType = 'draw_1v1' | 'pool_8ball' | 'card_blackjack';

// Match result types
export type MatchResult = 'pending' | 'completed' | 'cancelled';

// Entry status in tournament
export type EntryStatus = 'active' | 'eliminated' | 'winner' | 'bye';

// Tournament participant entry
export interface TournamentEntry {
  id: number;
  tournament_id: number;
  user_id: number;
  joined_at: string;
  status: EntryStatus;
  created_at: string;
  updated_at: string;
  username?: string;
  user?: User;
}

// Main tournament interface
export interface Tournament {
  id: number;
  name: string;
  game_type: TournamentGameType;
  entry_fee: number;
  max_players: number;
  status: TournamentStatus;
  format: TournamentFormat;
  winner_id?: number;
  game_id?: number;
  created_at: string;
  updated_at: string;
  current_round?: number;
  total_rounds?: number;
  current_matches?: TournamentMatch[];
  entries?: TournamentEntry[];
  bracket?: TournamentBracket;
}

// Individual match in tournament
export interface TournamentMatch {
  id: string; // Unique match ID (round_matchIndex)
  round: number;
  match_index: number;
  player1_id?: number;
  player2_id?: number;
  player1_username?: string;
  player2_username?: string;
  winner_id?: number;
  winner_username?: string;
  result?: MatchResult;
  status: 'pending' | 'active' | 'completed';
  game_id?: number;
  scheduled_at?: string;
  completed_at?: string;
  next_match_id?: string; // ID of the match this winner advances to
  next_match_slot?: 1 | 2; // Position in next match
}

// Tournament round
export interface TournamentRound {
  round: number;
  matches: TournamentMatch[];
  name: string;
  is_completed: boolean;
}

// Complete tournament bracket
export interface TournamentBracket {
  rounds: TournamentRound[];
  total_rounds: number;
  current_round: number;
  format: TournamentFormat;
  winner?: {
    user_id: number;
    username: string;
  };
  champion_match?: TournamentMatch; // For double elimination format
}

// Tournament creation data
export interface CreateTournamentData {
  name: string;
  game_type: TournamentGameType;
  entry_fee: number;
  max_players: number;
  format: TournamentFormat;
}

// Tournament join response
export interface TournamentJoinResponse {
  tournament: Tournament;
  entry: TournamentEntry;
  message: string;
}

// Tournament advance winner request
export interface AdvanceWinnerRequest {
  tournament_id: number;
  match_id: string;
  winner_user_id: number;
  round: number;
  match_index: number;
}

// Tournament details response
export interface TournamentDetailsResponse {
  tournament: Tournament;
  entries: TournamentEntry[];
  bracket: TournamentBracket;
  current_user_entry?: TournamentEntry;
}

// Tournament bracket visualization props
export interface BracketVisualizationProps {
  tournament: Tournament;
  bracket: TournamentBracket;
  currentUserId?: number;
  onMatchClick?: (match: TournamentMatch) => void;
  onWinnerSelect?: (matchId: string, winnerId: number) => void;
  isAdmin?: boolean;
  showAdminControls?: boolean;
}

// Admin tournament management actions
export interface TournamentManagementActions {
  startTournament: (tournamentId: number) => Promise<void>;
  advanceWinner: (request: AdvanceWinnerRequest) => Promise<void>;
  pauseTournament: (tournamentId: number) => Promise<void>;
  cancelTournament: (tournamentId: number) => Promise<void>;
  resetTournament: (tournamentId: number) => Promise<void>;
}

// Tournament statistics
export interface TournamentStats {
  total_tournaments: number;
  active_tournaments: number;
  completed_tournaments: number;
  total_prize_distributed: number;
  average_participants: number;
  most_popular_game: TournamentGameType;
}

// Tournament filter options
export interface TournamentFilters {
  status?: TournamentStatus[];
  game_type?: TournamentGameType[];
  format?: TournamentFormat[];
  entry_fee_min?: number;
  entry_fee_max?: number;
  max_players?: number;
  search?: string;
}

// Tournament list pagination
export interface TournamentPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Bracket connection lines for visualization
export interface BracketConnection {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'winner' | 'loser'; // For double elimination
}

// Match position in bracket grid
export interface MatchPosition {
  matchId: string;
  round: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Bracket layout configuration
export interface BracketLayout {
  matchWidth: number;
  matchHeight: number;
  matchSpacingX: number;
  matchSpacingY: number;
  roundSpacing: number;
  connectorThickness: number;
}

// Tournament bracket context state
export interface TournamentBracketState {
  currentTournament: Tournament | null;
  bracket: TournamentBracket | null;
  isLoading: boolean;
  error: string | null;
  selectedMatch: TournamentMatch | null;
  adminMode: boolean;
}

// Tournament bracket context actions
export interface TournamentBracketActions {
  loadTournament: (tournamentId: number) => Promise<void>;
  refreshBracket: (tournamentId: number) => Promise<void>;
  selectMatch: (match: TournamentMatch | null) => void;
  toggleAdminMode: () => void;
  advanceWinner: (matchId: string, winnerId: number) => Promise<void>;
  resetTournament: (tournamentId: number) => Promise<void>;
}