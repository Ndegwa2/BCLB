import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { GameEntry, PoolGameState } from '../../types/game';
import { User } from '../../types/auth';
import * as Phaser from 'phaser';
import * as Matter from 'matter-js';

// Main Pool Game Component
const PoolGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { state: authState } = useAuth();
  const { activeGames, loading, error } = useGame();
  const gameRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<PoolGameState>({
    status: 'loading',
    currentPlayer: null,
    players: [],
    score: { player1: 0, player2: 0 },
    gameOver: false,
    winner: null,
    currentTurn: null,
    ballsPotted: { solids: 0, stripes: 0 },
    gameType: 'pool_8ball'
  });

  // Find the current game from context
  const currentGame = activeGames.find(g => g.id === Number(gameId));

  useEffect(() => {
    if (!currentGame) return;

    // Initialize game state
    const initializeGame = () => {
      // This will be replaced with actual Phaser game initialization
      console.log('Initializing Pool Game for:', currentGame);

      // Get game entries - use mock data for now, will fetch from backend later
      const mockEntries: GameEntry[] = currentGame.entries || [
        {
          id: 1,
          user_id: currentGame.creator_id,
          game_id: currentGame.id,
          stake_amount: currentGame.stake_amount,
          joined_at: new Date().toISOString(),
          result: null,
          payout_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: authState.user?.username || 'Player 1',
          user: authState.user
        }
      ];

      // If only one player (creator), add a mock opponent
      if (mockEntries.length === 1 && authState.user) {
        mockEntries.push({
          id: 2,
          user_id: 999, // Mock opponent ID
          game_id: currentGame.id,
          stake_amount: currentGame.stake_amount,
          joined_at: new Date().toISOString(),
          result: null,
          payout_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: 'Opponent',
          user: {
            id: 999,
            username: 'Opponent',
            phone_number: '0000000000',
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as User
        });
      }

      setGameState((prev: PoolGameState) => ({
        ...prev,
        status: 'ready',
        players: mockEntries.map(entry => ({
          id: entry.user_id,
          username: entry.username || `Player ${entry.user_id}`,
          isCurrentUser: entry.user_id === authState.user?.id,
          userId: entry.user_id
        }))
      }));
    };

    initializeGame();

    // Cleanup
    return () => {
      console.log('Cleaning up Pool Game');
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [currentGame, authState.user]);
    };

    initializeGame();

    // Cleanup
    return () => {
      console.log('Cleaning up Pool Game');
    };
  }, [currentGame, authState.user]);

  if (loading) {
    return <div className="text-center py-8">Loading game...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (!currentGame) {
    return <div className="text-center py-8">Game not found</div>;
  }

  return (
    <div className="min-h-screen bg-green-800 relative overflow-hidden">
      {/* Game Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-green-900 bg-opacity-90 p-4">
        <h2 className="text-white text-xl font-bold">8 Ball Pool - {currentGame.game_code}</h2>
        <div className="text-white text-sm">
          Status: {gameState.status} | Stake: ${currentGame.stake_amount}
        </div>
      </div>

      {/* Game Container */}
      <div
        ref={gameRef}
        className="w-full h-screen bg-green-700 relative"
        style={{ backgroundColor: '#2e7d32' }}
      >
        {/* Game Canvas will go here */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <h3 className="text-2xl mb-4">Pool Game Loading...</h3>
            <p>Game Type: {currentGame.game_type}</p>
            <p>Players: {gameState.players.length}/2</p>
            {gameState.players.map((player: any) => (
              <div key={player.userId} className={`mt-2 ${player.isCurrentUser ? 'font-bold text-yellow-300' : 'text-white'}`}>
                {player.username} {player.isCurrentUser && '(You)'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Controls - will be implemented later */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-black bg-opacity-70 p-4 rounded-lg">
          <div className="text-white text-center">
            {gameState.status === 'ready' && !gameStarted && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                onClick={startPhaserGame}
                disabled={gameState.players.length < 2}
              >
                Start Game
              </button>
            )}
  
            {gameStarted && (
              <div className="flex justify-center space-x-4">
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  onClick={handleForfeit}
                >
                  Forfeit
                </button>
                <button
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                  onClick={handlePause}
                >
                  Pause
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolGame;