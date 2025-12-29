import React, { useState, useEffect } from 'react';
import {
  Tournament,
  TournamentMatch,
  TournamentBracket as TournamentBracketType,
  TournamentRound,
  BracketVisualizationProps,
  AdvanceWinnerRequest,
  TournamentEntry
} from '../../types/tournament';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';

interface MatchCardProps {
  match: TournamentMatch;
  round: number;
  onWinnerSelect?: (matchId: string, winnerId: number) => void;
  isAdmin?: boolean;
  currentUserId?: number;
  isSelected?: boolean;
  onMatchClick?: (match: TournamentMatch) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  round,
  onWinnerSelect,
  isAdmin,
  currentUserId,
  isSelected,
  onMatchClick
}) => {
  const getPlayerStatus = (playerId?: number, username?: string) => {
    if (!playerId || !username) return { text: 'TBD', color: 'text-gray-400', bgColor: 'bg-gray-100' };
    
    const isCurrentUser = currentUserId === playerId;
    const isWinner = match.winner_id === playerId;
    
    if (isWinner) {
      return { 
        text: `${username} ✓`, 
        color: 'text-green-700', 
        bgColor: 'bg-green-50 border-green-200' 
      };
    }
    
    if (isCurrentUser) {
      return { 
        text: `${username} (You)`, 
        color: 'text-blue-700', 
        bgColor: 'bg-blue-50 border-blue-200' 
      };
    }
    
    return { 
      text: username, 
      color: 'text-gray-700', 
      bgColor: 'bg-white border-gray-200' 
    };
  };

  const player1Status = getPlayerStatus(match.player1_id, match.player1_username);
  const player2Status = getPlayerStatus(match.player2_id, match.player2_username);

  const handleWinnerSelect = (playerId: number) => {
    if (isAdmin && match.status === 'active' && onWinnerSelect) {
      onWinnerSelect(match.id, playerId);
    }
  };

  const getRoundName = (roundNum: number, totalRounds: number) => {
    if (roundNum === totalRounds) return 'Final';
    if (roundNum === totalRounds - 1) return 'Semi-Final';
    if (roundNum === 1) return 'Round 1';
    return `Round ${roundNum}`;
  };

  return (
    <div 
      className={`bg-white border-2 rounded-lg p-3 shadow-sm transition-all duration-200 ${
        isSelected ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
      } ${match.status === 'completed' ? 'opacity-75' : ''}`}
      onClick={() => onMatchClick && onMatchClick(match)}
    >
      {/* Match Header */}
      <div className="text-xs text-gray-500 font-medium mb-2 text-center">
        {getRoundName(round, 4)}
      </div>

      {/* Players */}
      <div className="space-y-2">
        {/* Player 1 */}
        <div 
          className={`p-2 rounded border text-sm font-medium cursor-pointer transition-colors ${
            player1Status.bgColor
          } ${player1Status.color} ${
            isAdmin && match.status === 'active' && match.player1_id ? 'hover:bg-green-100' : ''
          }`}
          onClick={() => handleWinnerSelect(match.player1_id!)}
        >
          <div className="flex items-center justify-between">
            <span>{player1Status.text}</span>
            {match.winner_id === match.player1_id && (
              <span className="text-green-500 font-bold">★</span>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="text-xs text-gray-400 text-center">VS</div>

        {/* Player 2 */}
        <div 
          className={`p-2 rounded border text-sm font-medium cursor-pointer transition-colors ${
            player2Status.bgColor
          } ${player2Status.color} ${
            isAdmin && match.status === 'active' && match.player2_id ? 'hover:bg-green-100' : ''
          }`}
          onClick={() => handleWinnerSelect(match.player2_id!)}
        >
          <div className="flex items-center justify-between">
            <span>{player2Status.text}</span>
            {match.winner_id === match.player2_id && (
              <span className="text-green-500 font-bold">★</span>
            )}
          </div>
        </div>
      </div>

      {/* Match Status */}
      <div className="mt-2 text-xs text-center">
        <span className={`px-2 py-1 rounded-full font-medium ${
          match.status === 'completed' ? 'bg-green-100 text-green-700' :
          match.status === 'active' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {match.status === 'completed' ? 'Completed' :
           match.status === 'active' ? 'Live' : 'Pending'}
        </span>
      </div>

      {/* Admin Controls */}
      {isAdmin && match.status === 'active' && match.player1_id && match.player2_id && (
        <div className="mt-2 text-xs text-center">
          <span className="text-yellow-600">Click winner to advance</span>
        </div>
      )}
    </div>
  );
};

interface BracketConnectionProps {
  from: { x: number; y: number; width: number; height: number };
  to: { x: number; y: number; width: number; height: number };
  isActive?: boolean;
}

const BracketConnection: React.FC<BracketConnectionProps> = ({ from, to, isActive = false }) => {
  const startX = from.x + from.width;
  const startY = from.y + from.height / 2;
  const endX = to.x;
  const endY = to.y + to.height / 2;
  const midX = startX + (endX - startX) / 2;

  return (
    <svg
      className="absolute pointer-events-none z-0"
      style={{
        left: 0,
        top: 0,
        width: '100%',
        height: '100%'
      }}
    >
      <path
        d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
        stroke={isActive ? '#3b82f6' : '#d1d5db'}
        strokeWidth={isActive ? 3 : 2}
        fill="none"
        strokeDasharray={isActive ? 'none' : '5,5'}
      />
    </svg>
  );
};

interface RoundColumnProps {
  round: TournamentRound;
  roundIndex: number;
  totalRounds: number;
  matchWidth: number;
  matchHeight: number;
  matchSpacingY: number;
  onWinnerSelect?: (matchId: string, winnerId: number) => void;
  isAdmin?: boolean;
  currentUserId?: number;
  selectedMatch?: TournamentMatch | null;
  onMatchClick?: (match: TournamentMatch) => void;
  connections?: Array<{ from: any; to: any }>;
}

const RoundColumn: React.FC<RoundColumnProps> = ({
  round,
  roundIndex,
  totalRounds,
  matchWidth,
  matchHeight,
  matchSpacingY,
  onWinnerSelect,
  isAdmin,
  currentUserId,
  selectedMatch,
  onMatchClick,
  connections = []
}) => {
  const getRoundTitle = (roundNum: number, total: number) => {
    if (roundNum === total) return 'Final';
    if (roundNum === total - 1) return 'Semi-Finals';
    if (roundNum === 1) return 'Round 1';
    return `Round ${roundNum}`;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Round Title */}
      <div className="mb-4 text-center">
        <h3 className="text-sm font-bold text-gray-700 mb-1">
          {getRoundTitle(round.round, totalRounds)}
        </h3>
        <div className="text-xs text-gray-500">
          {round.matches.length} {round.matches.length === 1 ? 'match' : 'matches'}
        </div>
      </div>

      {/* Matches */}
      <div className="space-y-4 relative">
        {round.matches.map((match, matchIndex) => {
          const matchTop = matchIndex * (matchHeight + matchSpacingY);
          const matchPosition = {
            x: 0,
            y: matchTop,
            width: matchWidth,
            height: matchHeight
          };

          return (
            <div key={match.id} style={{ position: 'relative' }}>
              <MatchCard
                match={match}
                round={round.round}
                onWinnerSelect={onWinnerSelect}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                isSelected={selectedMatch?.id === match.id}
                onMatchClick={onMatchClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TournamentBracket: React.FC<BracketVisualizationProps> = ({
  tournament,
  bracket,
  currentUserId,
  onMatchClick,
  onWinnerSelect,
  isAdmin = false,
  showAdminControls = false
}) => {
  const { state: authState } = useAuth();
  const { balance } = useWallet();
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [isAdvancing, setIsAdvancing] = useState<string | null>(null);

  // Calculate bracket layout dimensions
  const matchWidth = 280;
  const matchHeight = 120;
  const matchSpacingY = 40;
  const roundSpacing = 120;
  const bracketWidth = bracket.rounds.length * (matchWidth + roundSpacing);
  const bracketHeight = Math.max(...bracket.rounds.map(r => r.matches.length)) * (matchHeight + matchSpacingY);

  const handleMatchClick = (match: TournamentMatch) => {
    setSelectedMatch(match);
    onMatchClick && onMatchClick(match);
  };

  const handleWinnerSelect = async (matchId: string, winnerId: number) => {
    if (!isAdmin || !onWinnerSelect) return;

    setIsAdvancing(matchId);
    try {
      await onWinnerSelect(matchId, winnerId);
    } catch (error) {
      console.error('Failed to advance winner:', error);
    } finally {
      setIsAdvancing(null);
    }
  };

  const getStatusInfo = () => {
    switch (tournament.status) {
      case 'open':
        return { text: 'Registration Open', color: 'bg-green-100 text-green-800', icon: '📝' };
      case 'in_progress':
        return { text: 'Tournament Live', color: 'bg-blue-100 text-blue-800', icon: '🔥' };
      case 'completed':
        return { text: 'Completed', color: 'bg-gray-100 text-gray-800', icon: '🏆' };
      case 'cancelled':
        return { text: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' };
    }
  };

  const statusInfo = getStatusInfo();
  const currentUserEntry = tournament.entries?.find(entry => entry.user_id === currentUserId);
  const userStatus = currentUserEntry?.status || 'not_joined';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Tournament Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{tournament.name}</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                <span className="mr-1">{statusInfo.icon}</span>
                {statusInfo.text}
              </span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Game Type:</span>
                <div className="capitalize">{tournament.game_type.replace('_', ' ')}</div>
              </div>
              <div>
                <span className="font-medium">Format:</span>
                <div className="capitalize">{tournament.format.replace('_', ' ')}</div>
              </div>
              <div>
                <span className="font-medium">Entry Fee:</span>
                <div className="text-green-600 font-semibold">KES {tournament.entry_fee.toFixed(2)}</div>
              </div>
              <div>
                <span className="font-medium">Players:</span>
                <div>{tournament.entries?.length || 0}/{tournament.max_players}</div>
              </div>
            </div>
          </div>

          {/* User Status & Actions */}
          <div className="mt-4 lg:mt-0 lg:ml-6">
            {currentUserEntry ? (
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Your Status:</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  userStatus === 'winner' ? 'bg-yellow-100 text-yellow-800' :
                  userStatus === 'eliminated' ? 'bg-red-100 text-red-800' :
                  userStatus === 'active' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {userStatus === 'winner' ? '🏆 Champion' :
                   userStatus === 'eliminated' ? '❌ Eliminated' :
                   userStatus === 'active' ? '🎮 Active' :
                   '👤 Registered'}
                </div>
              </div>
            ) : tournament.status === 'open' ? (
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Entry Fee:</div>
                <div className="text-green-600 font-bold text-lg">KES {tournament.entry_fee.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Your Balance: KES {balance.toFixed(2)}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Admin Controls */}
        {showAdminControls && isAdmin && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {tournament.status === 'open' && (
                <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                  Start Tournament
                </button>
              )}
              {tournament.status === 'in_progress' && (
                <button className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors">
                  Pause Tournament
                </button>
              )}
              <button className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors">
                Cancel Tournament
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tournament Bracket */}
      <div className="p-6">
        {bracket && bracket.rounds.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-max pb-4" style={{ width: bracketWidth }}>
              <div className="flex space-x-8">
                {bracket.rounds.map((round, roundIndex) => (
                  <RoundColumn
                    key={round.round}
                    round={round}
                    roundIndex={roundIndex}
                    totalRounds={bracket.rounds.length}
                    matchWidth={matchWidth}
                    matchHeight={matchHeight}
                    matchSpacingY={matchSpacingY}
                    onWinnerSelect={handleWinnerSelect}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                    selectedMatch={selectedMatch}
                    onMatchClick={handleMatchClick}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Tournament Bracket</h3>
            <p className="text-sm">
              {tournament.status === 'open' 
                ? 'Tournament bracket will be generated when tournament starts'
                : 'No bracket data available'
              }
            </p>
          </div>
        )}
      </div>

      {/* Match Details Panel */}
      {selectedMatch && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Match Details</h3>
            <button
              onClick={() => setSelectedMatch(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Match Info */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Match Information</h4>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Round:</span>
                      <div className="font-medium">Round {selectedMatch.round}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="font-medium capitalize">{selectedMatch.status}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Match ID:</span>
                      <div className="font-mono text-xs">{selectedMatch.id}</div>
                    </div>
                    {selectedMatch.completed_at && (
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <div className="font-medium">
                          {new Date(selectedMatch.completed_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Players */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Players</h4>
                <div className="space-y-2">
                  {selectedMatch.player1_username && (
                    <div className={`p-3 rounded-lg border ${
                      selectedMatch.winner_id === selectedMatch.player1_id 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{selectedMatch.player1_username}</span>
                        {selectedMatch.winner_id === selectedMatch.player1_id && (
                          <span className="text-green-500">🏆 Winner</span>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedMatch.player2_username && (
                    <div className={`p-3 rounded-lg border ${
                      selectedMatch.winner_id === selectedMatch.player2_id 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{selectedMatch.player2_username}</span>
                        {selectedMatch.winner_id === selectedMatch.player2_id && (
                          <span className="text-green-500">🏆 Winner</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Actions</h4>
              <div className="bg-white p-4 rounded-lg border space-y-3">
                {isAdmin && selectedMatch.status === 'active' && selectedMatch.player1_id && selectedMatch.player2_id && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Select match winner:</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleWinnerSelect(selectedMatch.id, selectedMatch.player1_id!)}
                        disabled={isAdvancing === selectedMatch.id}
                        className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {isAdvancing === selectedMatch.id ? 'Advancing...' : `Advance ${selectedMatch.player1_username}`}
                      </button>
                      <button
                        onClick={() => handleWinnerSelect(selectedMatch.id, selectedMatch.player2_id!)}
                        disabled={isAdvancing === selectedMatch.id}
                        className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {isAdvancing === selectedMatch.id ? 'Advancing...' : `Advance ${selectedMatch.player2_username}`}
                      </button>
                    </div>
                  </div>
                )}

                {selectedMatch.game_id && (
                  <button className="w-full px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors">
                    View Game Details
                  </button>
                )}

                <button 
                  onClick={() => setSelectedMatch(null)}
                  className="w-full px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAdvancing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-sm font-medium">Advancing winner...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};