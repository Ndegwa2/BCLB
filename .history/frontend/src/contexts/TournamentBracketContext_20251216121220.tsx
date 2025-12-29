import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  Tournament,
  TournamentBracket as TournamentBracketType,
  TournamentMatch,
  TournamentBracketState,
  TournamentBracketActions,
  AdvanceWinnerRequest,
  TournamentEntry
} from '../types/tournament';
import { api } from '../services/api';

// State interface
interface TournamentBracketContextState extends TournamentBracketState {
  // Additional context-specific state
  isJoining: boolean;
  isStarting: boolean;
  tournamentStats?: {
    totalPrizePool: number;
    currentRoundMatches: number;
    participantsRemaining: number;
  };
}

// Actions
type TournamentBracketAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOURNAMENT'; payload: Tournament | null }
  | { type: 'SET_BRACKET'; payload: TournamentBracketType | null }
  | { type: 'SELECT_MATCH'; payload: TournamentMatch | null }
  | { type: 'TOGGLE_ADMIN_MODE' }
  | { type: 'SET_IS_JOINING'; payload: boolean }
  | { type: 'SET_IS_STARTING'; payload: boolean }
  | { type: 'UPDATE_MATCH'; payload: { matchId: string; updates: Partial<TournamentMatch> } }
  | { type: 'UPDATE_TOURNAMENT'; payload: Partial<Tournament> }
  | { type: 'SET_TOURNAMENT_STATS'; payload: any }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: TournamentBracketContextState = {
  currentTournament: null,
  bracket: null,
  isLoading: false,
  error: null,
  selectedMatch: null,
  adminMode: false,
  isJoining: false,
  isStarting: false,
  tournamentStats: undefined
};

// Reducer
function tournamentBracketReducer(
  state: TournamentBracketContextState,
  action: TournamentBracketAction
): TournamentBracketContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_TOURNAMENT':
      return { 
        ...state, 
        currentTournament: action.payload,
        error: null 
      };

    case 'SET_BRACKET':
      return { 
        ...state, 
        bracket: action.payload,
        error: null 
      };

    case 'SELECT_MATCH':
      return { ...state, selectedMatch: action.payload };

    case 'TOGGLE_ADMIN_MODE':
      return { ...state, adminMode: !state.adminMode };

    case 'SET_IS_JOINING':
      return { ...state, isJoining: action.payload };

    case 'SET_IS_STARTING':
      return { ...state, isStarting: action.payload };

    case 'UPDATE_MATCH':
      if (!state.bracket) return state;
      
      const updatedBracket = {
        ...state.bracket,
        rounds: state.bracket.rounds.map(round => ({
          ...round,
          matches: round.matches.map(match =>
            match.id === action.payload.matchId
              ? { ...match, ...action.payload.updates }
              : match
          )
        }))
      };

      return { ...state, bracket: updatedBracket };

    case 'UPDATE_TOURNAMENT':
      return {
        ...state,
        currentTournament: state.currentTournament
          ? { ...state.currentTournament, ...action.payload }
          : null
      };

    case 'SET_TOURNAMENT_STATS':
      return {
        ...state,
        tournamentStats: action.payload
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context
interface TournamentBracketContextType extends TournamentBracketActions {
  state: TournamentBracketContextState;
}

// Create context
const TournamentBracketContext = createContext<TournamentBracketContextType | undefined>(undefined);

// Hook to use context
export const useTournamentBracket = (): TournamentBracketContextType => {
  const context = useContext(TournamentBracketContext);
  if (!context) {
    throw new Error('useTournamentBracket must be used within a TournamentBracketProvider');
  }
  return context;
};

// Provider props
interface TournamentBracketProviderProps {
  children: ReactNode;
}

// Provider component
export const TournamentBracketProvider: React.FC<TournamentBracketProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tournamentBracketReducer, initialState);

  // Load tournament details and bracket
  const loadTournament = async (tournamentId: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await api.get(`/tournaments/${tournamentId}`);
      const { tournament, entries, bracket } = response.data;

      // Process tournament data
      const processedTournament = {
        ...tournament,
        entries,
        current_round: bracket?.current_round || 1,
        total_rounds: bracket?.total_rounds || Math.ceil(Math.log2(tournament.max_players))
      };

      dispatch({ type: 'SET_TOURNAMENT', payload: processedTournament });
      dispatch({ type: 'SET_BRACKET', payload: bracket });

      // Calculate tournament stats
      calculateTournamentStats(processedTournament, bracket);

    } catch (error) {
      console.error('Failed to load tournament:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load tournament' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Refresh bracket data
  const refreshBracket = async (tournamentId: number): Promise<void> => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}`);
      const { tournament, bracket } = response.data;

      dispatch({ type: 'SET_TOURNAMENT', payload: tournament });
      dispatch({ type: 'SET_BRACKET', payload: bracket });

      // Update tournament stats
      calculateTournamentStats(tournament, bracket);

    } catch (error) {
      console.error('Failed to refresh bracket:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to refresh bracket' 
      });
    }
  };

  // Select a match for detailed view
  const selectMatch = (match: TournamentMatch | null): void => {
    dispatch({ type: 'SELECT_MATCH', payload: match });
  };

  // Toggle admin mode
  const toggleAdminMode = (): void => {
    dispatch({ type: 'TOGGLE_ADMIN_MODE' });
  };

  // Advance winner in a match
  const advanceWinner = async (matchId: string, winnerId: number): Promise<void> => {
    if (!state.currentTournament) {
      throw new Error('No tournament loaded');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Find the match details
      const match = findMatchById(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      const advanceRequest: AdvanceWinnerRequest = {
        tournament_id: state.currentTournament.id,
        match_id: matchId,
        winner_user_id: winnerId,
        round: match.round,
        match_index: match.match_index
      };

      const response = await api.post(`/tournaments/${state.currentTournament.id}/advance`, advanceRequest);

      // Update local state with response data
      if (response.data.tournament) {
        dispatch({ type: 'UPDATE_TOURNAMENT', payload: response.data.tournament });
      }

      // Refresh bracket to get updated state
      await refreshBracket(state.currentTournament.id);

    } catch (error) {
      console.error('Failed to advance winner:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to advance winner' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Reset tournament
  const resetTournament = async (tournamentId: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      await api.post(`/tournaments/${tournamentId}/reset`);
      
      // Reset local state
      dispatch({ type: 'RESET_STATE' });
      
      // Reload tournament
      await loadTournament(tournamentId);

    } catch (error) {
      console.error('Failed to reset tournament:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to reset tournament' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Helper function to find match by ID
  const findMatchById = (matchId: string): TournamentMatch | null => {
    if (!state.bracket) return null;
    
    for (const round of state.bracket.rounds) {
      const match = round.matches.find(m => m.id === matchId);
      if (match) return match;
    }
    return null;
  };

  // Calculate tournament statistics
  const calculateTournamentStats = (tournament: Tournament, bracket: TournamentBracketType | null): void => {
    const totalPrizePool = (tournament.entries?.length || 0) * tournament.entry_fee;
    
    const currentRoundMatches = bracket?.rounds
      .find(r => r.round === (bracket.current_round || 1))?.matches.length || 0;
    
    const participantsRemaining = bracket?.rounds
      .reduce((total, round) => {
        return total + round.matches.filter(match => 
          match.status === 'active' || match.status === 'pending'
        ).length * 2; // Each match has up to 2 players
      }, 0) || 0;

    dispatch({
      type: 'SET_TOURNAMENT_STATS',
      payload: {
        totalPrizePool,
        currentRoundMatches,
        participantsRemaining
      }
    });
  };

  // Auto-refresh bracket data when tournament is in progress
  useEffect(() => {
    if (state.currentTournament?.status === 'in_progress' && state.bracket) {
      const interval = setInterval(() => {
        refreshBracket(state.currentTournament!.id);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [state.currentTournament?.status, state.bracket]);

  // Context value
  const contextValue: TournamentBracketContextType = {
    state,
    loadTournament,
    refreshBracket,
    selectMatch,
    toggleAdminMode,
    advanceWinner,
    resetTournament
  };

  return (
    <TournamentBracketContext.Provider value={contextValue}>
      {children}
    </TournamentBracketContext.Provider>
  );
};

export default TournamentBracketContext;