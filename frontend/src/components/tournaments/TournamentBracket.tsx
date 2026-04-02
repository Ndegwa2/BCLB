import React, { useState, useMemo } from 'react';

/**
 * PoolTournamentBracket Component
 * Displays single/double elimination tournament brackets with match details
 * Specifically designed for 8-ball pool tournaments
 * This is a standalone component with its own types
 */

interface TournamentPlayer {
  id: string;
  username: string;
  avatar?: string;
  seed?: number;
  isWinner?: boolean;
}

interface Match {
  id: string;
  round: number;
  match: number;
  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;
  winner: TournamentPlayer | null;
  score?: { player1: number; player2: number };
  status: 'pending' | 'in_progress' | 'completed';
  tableNumber?: number;
}

interface TournamentBracketProps {
  tournamentName: string;
  format: 'single_elimination' | 'double_elimination';
  rounds: Match[][];
  currentRound: number;
  prizePool: number;
  entryFee: number;
  onMatchClick?: (match: Match) => void;
}

const PoolTournamentBracket: React.FC<TournamentBracketProps> = ({
  tournamentName,
  format,
  rounds,
  currentRound,
  prizePool,
  entryFee,
  onMatchClick
}) => {
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);

  // Calculate bracket dimensions
  const bracketWidth = useMemo(() => {
    return Math.max(rounds.length * 280, 800);
  }, [rounds.length]);

  const bracketHeight = useMemo(() => {
    const maxMatchesInRound = Math.max(...rounds.map(r => r.length));
    return Math.max(maxMatchesInRound * 100, 400);
  }, [rounds]);

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl p-6 border border-white/10">
      {/* Tournament Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
              🏆
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{tournamentName}</h2>
              <p className="text-sm text-white/60">
                {format === 'single_elimination' ? 'Single Elimination' : 'Double Elimination'} • Round {currentRound}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-white/50">Prize Pool</p>
              <p className="text-lg font-bold text-green-400">${prizePool.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/50">Entry Fee</p>
              <p className="text-lg font-bold text-white">${entryFee}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bracket Container */}
      <div 
        className="overflow-x-auto pb-4"
        style={{ minWidth: `${bracketWidth}px` }}
      >
        <div className="relative" style={{ width: `${bracketWidth}px`, height: `${bracketHeight}px` }}>
          {/* Render each round */}
          {rounds.map((round, roundIndex) => (
            <div
              key={roundIndex}
              className="absolute top-0"
              style={{ left: `${roundIndex * 280}px` }}
            >
              {/* Round Header */}
              <div className="mb-4 px-4">
                <h3 className="text-sm font-semibold text-white/80 text-center">
                  {roundIndex === rounds.length - 1 ? '🏆 Finals' : 
                   roundIndex === rounds.length - 2 ? 'Semi-Finals' :
                   roundIndex === rounds.length - 3 ? 'Quarter-Finals' :
                   `Round ${roundIndex + 1}`}
                </h3>
                {roundIndex === currentRound - 1 && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                    Current
                  </span>
                )}
              </div>

              {/* Matches in this round */}
              <div className="flex flex-col gap-4">
                {round.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isHovered={hoveredMatch === match.id}
                    onHover={(id) => setHoveredMatch(id)}
                    onClick={() => onMatchClick?.(match)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Connector lines (SVG overlay) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: `${bracketWidth}px`, height: `${bracketHeight}px` }}
          >
            {renderConnectors(rounds)}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/5 border border-white/20"></div>
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual Match Card Component
 */
interface MatchCardProps {
  match: Match;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isHovered,
  onHover,
  onClick
}) => {
  const getStatusColors = () => {
    switch (match.status) {
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'in_progress':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  const getStatusIndicator = () => {
    switch (match.status) {
      case 'completed':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      case 'in_progress':
        return (
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
        );
      default:
        return <div className="w-2 h-2 rounded-full bg-white/20"></div>;
    }
  };

  return (
    <div
      className={`
        relative w-64 rounded-lg border transition-all duration-200 cursor-pointer
        ${getStatusColors()}
        ${isHovered ? 'border-purple-500/50 shadow-lg shadow-purple-500/10 scale-105' : ''}
      `}
      onMouseEnter={() => onHover(match.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        {getStatusIndicator()}
      </div>

      {/* Table number (if applicable) */}
      {match.tableNumber && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white/60">
          Table {match.tableNumber}
        </div>
      )}

      {/* Player 1 */}
      <PlayerSlot
        player={match.player1}
        isWinner={match.winner?.id === match.player1?.id}
        score={match.score?.player1}
      />

      {/* VS Divider */}
      <div className="flex items-center justify-center py-1">
        <div className="w-full h-px bg-white/10"></div>
        <span className="px-2 text-[10px] text-white/30 font-medium">VS</span>
        <div className="w-full h-px bg-white/10"></div>
      </div>

      {/* Player 2 */}
      <PlayerSlot
        player={match.player2}
        isWinner={match.winner?.id === match.player2?.id}
        score={match.score?.player2}
      />
    </div>
  );
};

/**
 * Player Slot Component
 */
interface PlayerSlotProps {
  player: TournamentPlayer | null;
  isWinner: boolean;
  score?: number;
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({
  player,
  isWinner,
  score
}) => {
  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 transition-colors
      ${isWinner ? 'bg-yellow-500/10' : ''}
      ${!player ? 'opacity-50' : ''}
    `}>
      {/* Seed number */}
      <div className={`
        w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium
        ${isWinner ? 'bg-yellow-500/30 text-yellow-400' : 'bg-white/10 text-white/40'}
      `}>
        {player?.seed || '-'}
      </div>

      {/* Avatar placeholder */}
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs
        ${isWinner 
          ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
          : 'bg-gradient-to-br from-purple-500 to-pink-500'}
      `}>
        {player ? player.username.charAt(0).toUpperCase() : '?'}
      </div>

      {/* Username */}
      <span className={`
        flex-1 text-sm truncate font-medium
        ${isWinner ? 'text-yellow-400' : player ? 'text-white' : 'text-white/30'}
      `}>
        {player?.username || 'TBD'}
      </span>

      {/* Score (if available) */}
      {score !== undefined && (
        <span className={`
          text-sm font-bold px-2 py-0.5 rounded
          ${isWinner ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/60'}
        `}>
          {score}
        </span>
      )}
    </div>
  );
};

/**
 * Render SVG connector lines between rounds
 */
function renderConnectors(rounds: Match[][]): React.ReactNode {
  const connectors: React.ReactNode[] = [];
  
  for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex++) {
    const currentRound = rounds[roundIndex];
    const nextRound = rounds[roundIndex + 1];
    
    for (let matchIndex = 0; matchIndex < nextRound.length; matchIndex++) {
      const match1 = currentRound[matchIndex * 2];
      const match2 = currentRound[matchIndex * 2 + 1];
      const nextMatch = nextRound[matchIndex];
      
      if (!match1 || !match2 || !nextMatch) continue;
      
      const x1 = roundIndex * 280 + 256; // Right edge of current round
      const x2 = (roundIndex + 1) * 280; // Left edge of next round
      const midX = (x1 + x2) / 2;
      
      // Calculate Y positions (approximate based on match index)
      const y1 = matchIndex * 100 + 60; // Top match center
      const y2 = (matchIndex + 1) * 100 - 20; // Bottom match center
      const midY = (y1 + y2) / 2;
      
      connectors.push(
        <g key={`connector-${roundIndex}-${matchIndex}`}>
          {/* Top match to middle */}
          <path
            d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${midY}`}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          {/* Bottom match to middle */}
          <path
            d={`M ${x1} ${y2} L ${midX} ${y2} L ${midX} ${midY}`}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          {/* Middle to next match */}
          <path
            d={`M ${midX} ${midY} L ${x2} ${midY}`}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        </g>
      );
    }
  }
  
  return connectors;
}

/**
 * Generate mock tournament data for demonstration
 */
export const generateMockTournament = (): TournamentBracketProps => {
  const players: TournamentPlayer[] = [
    { id: '1', username: 'ProPlayer123', seed: 1 },
    { id: '2', username: 'PoolShark99', seed: 8 },
    { id: '3', username: 'CueMaster', seed: 4 },
    { id: '4', username: 'BreakKing', seed: 5 },
    { id: '5', username: 'EightBallPro', seed: 2 },
    { id: '6', username: 'TableRunner', seed: 7 },
    { id: '7', username: 'SpinDoctor', seed: 3 },
    { id: '8', username: 'PocketAce', seed: 6 },
  ];

  // Round 1 (Quarter-Finals)
  const round1: Match[] = [
    {
      id: 'r1m1',
      round: 1,
      match: 1,
      player1: players[0],
      player2: players[1],
      winner: players[0],
      score: { player1: 7, player2: 3 },
      status: 'completed',
      tableNumber: 1
    },
    {
      id: 'r1m2',
      round: 1,
      match: 2,
      player1: players[2],
      player2: players[3],
      winner: players[2],
      score: { player1: 7, player2: 5 },
      status: 'completed',
      tableNumber: 2
    },
    {
      id: 'r1m3',
      round: 1,
      match: 3,
      player1: players[4],
      player2: players[5],
      winner: players[4],
      score: { player1: 7, player2: 2 },
      status: 'completed',
      tableNumber: 1
    },
    {
      id: 'r1m4',
      round: 1,
      match: 4,
      player1: players[6],
      player2: players[7],
      winner: players[6],
      score: { player1: 7, player2: 4 },
      status: 'completed',
      tableNumber: 2
    }
  ];

  // Round 2 (Semi-Finals)
  const round2: Match[] = [
    {
      id: 'r2m1',
      round: 2,
      match: 1,
      player1: players[0],
      player2: players[2],
      winner: null,
      status: 'in_progress',
      tableNumber: 1
    },
    {
      id: 'r2m2',
      round: 2,
      match: 2,
      player1: players[4],
      player2: players[6],
      winner: null,
      status: 'pending',
      tableNumber: 2
    }
  ];

  // Round 3 (Finals)
  const round3: Match[] = [
    {
      id: 'r3m1',
      round: 3,
      match: 1,
      player1: null,
      player2: null,
      winner: null,
      status: 'pending'
    }
  ];

  return {
    tournamentName: 'Weekend 8-Ball Championship',
    format: 'single_elimination',
    rounds: [round1, round2, round3],
    currentRound: 2,
    prizePool: 5000,
    entryFee: 50
  };
};

export default PoolTournamentBracket;