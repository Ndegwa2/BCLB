import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Tournament, TournamentMatch, TournamentBracket } from '../../types/tournament';
import { apiClient } from '../../services/api';

interface AdminTournamentControlsProps {
  tournament: Tournament;
  bracket: TournamentBracket;
  onTournamentUpdate: () => void;
}

export const AdminTournamentControls: React.FC<AdminTournamentControlsProps> = ({
  tournament,
  bracket,
  onTournamentUpdate
}) => {
  const { state: authState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = authState.user?.is_admin;
  if (!isAdmin) return null;

  const handleStartTournament = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post(`/tournaments/${tournament.id}/start`);
      setSuccess('Tournament started successfully!');
      onTournamentUpdate();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to start tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseTournament = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post(`/tournaments/${tournament.id}/pause`);
      setSuccess('Tournament paused successfully!');
      onTournamentUpdate();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to pause tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeTournament = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post(`/tournaments/${tournament.id}/resume`);
      setSuccess('Tournament resumed successfully!');
      onTournamentUpdate();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to resume tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTournament = async () => {
    if (!confirm('Are you sure you want to cancel this tournament? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post(`/tournaments/${tournament.id}/cancel`);
      setSuccess('Tournament cancelled successfully!');
      onTournamentUpdate();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to cancel tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceWinner = async (match: TournamentMatch, winnerUserId: number) => {
    if (!winnerUserId || !match.player1_id || !match.player2_id) {
      setError('Invalid winner selection');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const request = {
        tournament_id: tournament.id,
        match_id: match.id,
        winner_user_id: winnerUserId,
        round: match.round,
        match_index: match.match_index
      };

      await apiClient.post(`/tournaments/${tournament.id}/advance`, request);
      setSuccess(`Winner advanced successfully!`);
      setSelectedMatch(null);
      onTournamentUpdate();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to advance winner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetTournament = async () => {
    if (!confirm('Are you sure you want to reset this tournament? All progress will be lost.')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post(`/tournaments/${tournament.id}/reset`);
      setSuccess('Tournament reset successfully!');
      onTournamentUpdate();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to reset tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveMatches = () => {
    if (!bracket.rounds) return [];
    
    return bracket.rounds
      .flatMap(round => round.matches)
      .filter(match => 
        match.status === 'active' && 
        match.player1_id && 
        match.player2_id &&
        !match.winner_id
      );
  };

  const getCompletedMatches = () => {
    if (!bracket.rounds) return [];
    
    return bracket.rounds
      .flatMap(round => round.matches)
      .filter(match => match.status === 'completed' || match.winner_id);
  };

  const getPendingMatches = () => {
    if (!bracket.rounds) return [];
    
    return bracket.rounds
      .flatMap(round => round.matches)
      .filter(match => match.status === 'pending');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🔧 Admin Tournament Controls</h3>
        <div className="text-sm text-gray-500">
          Tournament ID: {tournament.id}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Tournament Status & Actions */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium text-gray-900">Tournament Status</h4>
            <p className="text-sm text-gray-600">Current status: <span className="capitalize font-medium">{tournament.status}</span></p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Participants</div>
            <div className="text-lg font-bold text-blue-600">
              {tournament.entries?.length || 0}/{tournament.max_players}
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap gap-2">
          {tournament.status === 'open' && (
            <button
              onClick={handleStartTournament}
              disabled={isLoading || (tournament.entries?.length || 0) < 2}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Start Tournament'}
            </button>
          )}

          {tournament.status === 'in_progress' && (
            <button
              onClick={handlePauseTournament}
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Pausing...' : 'Pause Tournament'}
            </button>
          )}

          {tournament.status === 'paused' && (
            <button
              onClick={handleResumeTournament}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Resuming...' : 'Resume Tournament'}
            </button>
          )}

          {(tournament.status === 'open' || tournament.status === 'in_progress') && (
            <button
              onClick={handleCancelTournament}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Cancelling...' : 'Cancel Tournament'}
            </button>
          )}

          <button
            onClick={handleResetTournament}
            disabled={isLoading || tournament.status === 'completed'}
            className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Resetting...' : 'Reset Tournament'}
          </button>
        </div>
      </div>

      {/* Match Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Matches */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">🎯 Active Matches</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {getActiveMatches().map((match) => (
              <div
                key={match.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedMatch?.id === match.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMatch(match)}
              >
                <div className="text-sm font-medium text-gray-900">
                  Round {match.round} - Match {match.match_index + 1}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {match.player1_username} vs {match.player2_username}
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Click to select winner
                </div>
              </div>
            ))}

            {getActiveMatches().length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No active matches requiring winner selection
              </div>
            )}
          </div>
        </div>

        {/* Match Winner Selection */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">🏆 Winner Selection</h4>
          
          {selectedMatch ? (
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-900">
                  Round {selectedMatch.round} - Match {selectedMatch.match_index + 1}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedMatch.player1_username} vs {selectedMatch.player2_username}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleAdvanceWinner(selectedMatch, selectedMatch.player1_id!)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Advancing...' : `Advance ${selectedMatch.player1_username}`}
                </button>
                
                <button
                  onClick={() => handleAdvanceWinner(selectedMatch, selectedMatch.player2_id!)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Advancing...' : `Advance ${selectedMatch.player2_username}`}
                </button>

                <button
                  onClick={() => setSelectedMatch(null)}
                  className="w-full px-3 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel Selection
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <div className="text-sm text-gray-500">
                Select an active match to advance a winner
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tournament Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">📊 Tournament Statistics</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{bracket.rounds?.length || 0}</div>
            <div className="text-xs text-gray-600">Total Rounds</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{getCompletedMatches().length}</div>
            <div className="text-xs text-gray-600">Completed Matches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{getActiveMatches().length}</div>
            <div className="text-xs text-gray-600">Active Matches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{getPendingMatches().length}</div>
            <div className="text-xs text-gray-600">Pending Matches</div>
          </div>
        </div>
      </div>

      {/* Prize Pool Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">💰 Prize Pool</h4>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Pot:</span>
              <div className="font-bold text-green-600">
                KES {((tournament.entries?.length || 0) * tournament.entry_fee).toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Winner Prize (85%):</span>
              <div className="font-bold text-green-600">
                KES {((tournament.entries?.length || 0) * tournament.entry_fee * 0.85).toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">House Cut (15%):</span>
              <div className="font-bold text-gray-600">
                KES {((tournament.entries?.length || 0) * tournament.entry_fee * 0.15).toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Participants:</span>
              <div className="font-bold text-blue-600">
                {tournament.entries?.length || 0} players
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTournamentControls;