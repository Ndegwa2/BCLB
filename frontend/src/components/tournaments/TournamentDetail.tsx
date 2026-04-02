import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// TournamentBracket refactored - using placeholder
const TournamentBracket: React.FC<any> = () => <div className="text-white p-4">Bracket view refactored</div>;
import { TournamentBracketProvider, useTournamentBracket } from '../../contexts/TournamentBracketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { apiClient } from '../../services/api';

interface TournamentDetailContentProps {
  tournamentId: number;
}

const TournamentDetailContent: React.FC<TournamentDetailContentProps> = ({ tournamentId }) => {
  const { state: authState } = useAuth();
  const { balance } = useWallet();
  const {
    state,
    loadTournament,
    selectMatch,
    advanceWinner
  } = useTournamentBracket();
  
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const isAdmin = authState.user?.is_admin || false;
  const currentUserId = authState.user?.id;

  useEffect(() => {
    loadTournament(tournamentId);
  }, [tournamentId]);

  const handleJoinTournament = async () => {
    if (!authState.isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!state.currentTournament) return;

    setIsJoining(true);
    try {
      // apiClient already returns response.data, so we access directly
      const responseData = await apiClient.post(`/tournaments/${tournamentId}/join`);
      
      // Refresh tournament data
      await loadTournament(tournamentId);
      
      // Show success message if available
      if (responseData?.message) {
        console.log('Join tournament success:', responseData.message);
      }
      
    } catch (error: any) {
      console.error('Failed to join tournament:', error);
      // Handle error (show notification)
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartTournament = async () => {
    if (!state.currentTournament || !isAdmin) return;

    setIsStarting(true);
    try {
      // Note: Backend uses /advance endpoint, not /start
      // For now, we'll use the advance endpoint with the first match
      await apiClient.post(`/tournaments/${tournamentId}/advance`, {
        round: 1,
        match_index: 0,
        winner: state.currentTournament.entries?.[0]?.username || ''
      });
      await loadTournament(tournamentId);
    } catch (error) {
      console.error('Failed to start tournament:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleWinnerSelect = async (matchId: string, winnerId: number) => {
    try {
      await advanceWinner(matchId, winnerId);
    } catch (error) {
      console.error('Failed to advance winner:', error);
      // Handle error (show notification)
    }
  };

  const handleMatchClick = (match: any) => {
    selectMatch(match);
  };

  const canJoinTournament = () => {
    if (!state.currentTournament || !currentUserId) return false;
    
    const isTournamentOpen = state.currentTournament.status === 'open';
    const hasJoined = state.currentTournament.entries?.some(
      entry => entry.user_id === currentUserId
    );
    const hasSpace = (state.currentTournament.entries?.length || 0) < state.currentTournament.max_players;
    const hasEnoughBalance = balance >= state.currentTournament.entry_fee;
    
    return isTournamentOpen && !hasJoined && hasSpace && hasEnoughBalance;
  };

  const getTournamentStatusMessage = () => {
    if (!state.currentTournament) return '';

    const entriesCount = state.currentTournament.entries?.length || 0;
    const maxPlayers = state.currentTournament.max_players;
    const currentUserEntry = state.currentTournament.entries?.find(
      entry => entry.user_id === currentUserId
    );

    switch (state.currentTournament.status) {
      case 'open':
        if (currentUserEntry) {
          return `You have joined this tournament. Waiting for ${maxPlayers - entriesCount} more players.`;
        }
        if (entriesCount >= maxPlayers) {
          return 'Tournament is full. Registration closed.';
        }
        if (balance < state.currentTournament.entry_fee) {
          return `Insufficient balance. Need KES ${(state.currentTournament.entry_fee - balance).toFixed(2)} more.`;
        }
        return 'Registration is open. Join to compete!';
      
      case 'in_progress':
        if (currentUserEntry?.status === 'eliminated') {
          return 'You have been eliminated from this tournament.';
        }
        if (currentUserEntry?.status === 'winner') {
          return 'Congratulations! You are the tournament champion!';
        }
        if (currentUserEntry?.status === 'active') {
          return 'You are still in the tournament. Good luck!';
        }
        return 'Tournament is currently in progress.';
      
      case 'completed':
        if (currentUserEntry?.status === 'winner') {
          return 'Tournament completed. You are the champion!';
        }
        return 'Tournament has been completed.';
      
      case 'cancelled':
        return 'This tournament has been cancelled.';
      
      default:
        return '';
    }
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Error Loading Tournament</h2>
          <p className="text-gray-600 text-center mb-4">{state.error}</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="w-full px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  if (!state.currentTournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-gray-400 text-6xl mb-4 text-center">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Tournament Not Found</h2>
          <p className="text-gray-600 text-center mb-4">The tournament you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="w-full px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <button 
                onClick={() => navigate('/tournaments')}
                className="hover:text-gray-700 transition-colors"
              >
                Home
              </button>
              <span>›</span>
              <button 
                onClick={() => navigate('/tournaments')}
                className="hover:text-gray-700 transition-colors"
              >
                Tournaments
              </button>
              <span>›</span>
              <span className="text-gray-700 font-medium">{state.currentTournament.name}</span>
            </nav>
          </div>

          {/* Tournament Status Banner */}
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {state.currentTournament.name}
                  </h1>
                  <p className="text-gray-600 mb-2">{getTournamentStatusMessage()}</p>
                  
                  {/* Tournament Progress */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {state.currentTournament.entries?.length || 0} / {state.currentTournament.max_players} players
                    </span>
                    <span>•</span>
                    <span>Round {state.bracket?.current_round || 1}</span>
                    <span>•</span>
                    <span className="capitalize">{state.currentTournament.format.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                  {canJoinTournament() && (
                    <button
                      onClick={handleJoinTournament}
                      disabled={isJoining}
                      className="px-6 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isJoining ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                          Joining...
                        </>
                      ) : (
                        `Join Tournament (KES ${state.currentTournament.entry_fee.toFixed(2)})`
                      )}
                    </button>
                  )}

                  {isAdmin && state.currentTournament.status === 'open' && (
                    <button
                      onClick={handleStartTournament}
                      disabled={isStarting}
                      className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isStarting ? 'Starting...' : 'Start Tournament'}
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/tournaments')}
                    className="px-6 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Back to Tournaments
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Bracket */}
          <TournamentBracket
            tournament={state.currentTournament}
            bracket={state.bracket || {
              rounds: [],
              total_rounds: 0,
              current_round: 1,
              format: state.currentTournament.format
            }}
            currentUserId={currentUserId}
            onMatchClick={handleMatchClick}
            onWinnerSelect={handleWinnerSelect}
            isAdmin={isAdmin}
            showAdminControls={isAdmin}
          />

          {/* Tournament Information Panel */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prize Pool */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Prize Pool</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                KES {((state.currentTournament.entries?.length || 0) * state.currentTournament.entry_fee * 0.85).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">
                85% of total pot goes to winner
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Pot:</span>
                  <span className="font-medium">
                    KES {((state.currentTournament.entries?.length || 0) * state.currentTournament.entry_fee).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">House Cut (15%):</span>
                  <span className="font-medium">
                    KES {((state.currentTournament.entries?.length || 0) * state.currentTournament.entry_fee * 0.15).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tournament Rules */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Tournament Rules</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Single/Double elimination format</li>
                <li>• Winner takes 85% of total prize pool</li>
                <li>• Matches are played using tournament game type</li>
                <li>• Admin controls match progression</li>
                <li>• No refunds after tournament starts</li>
                <li>• Fair play and sportsmanship required</li>
              </ul>
            </div>

            {/* Tournament Stats */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Rounds:</span>
                  <span className="font-medium">{state.bracket?.total_rounds || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Round:</span>
                  <span className="font-medium">{state.bracket?.current_round || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Matches:</span>
                  <span className="font-medium">
                    {state.bracket?.rounds
                      .find(r => r.round === (state.bracket?.current_round || 1))?.matches.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants Remaining:</span>
                  <span className="font-medium">
                    {state.bracket?.rounds.reduce((total, round) => {
                      return total + round.matches.filter(match => 
                        match.status === 'active' || match.status === 'pending'
                      ).length * 2;
                    }, 0) || (state.currentTournament.entries?.length || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TournamentDetailProps {
  tournamentId?: number;
}

export const TournamentDetail: React.FC<TournamentDetailProps> = ({ tournamentId: propTournamentId }) => {
  const params = useParams();
  const tournamentId = propTournamentId || parseInt(params.id || '0');

  return (
    <TournamentBracketProvider>
      <TournamentDetailContent tournamentId={tournamentId} />
    </TournamentBracketProvider>
  );
};

export default TournamentDetail;