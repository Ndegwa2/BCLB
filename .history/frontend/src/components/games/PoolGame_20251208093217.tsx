import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';

// Main Pool Game Component
const PoolGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const { games, loading, error } = useGame();
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState({
    status: 'loading',
    currentPlayer: null,
    players: [],
    score: { player1: 0, player2: 0 },
    gameOver: false,
    winner: null
  });

  // Find the current game from context
  const currentGame = games.find(g => g.id === Number(gameId));

  useEffect(() => {
    if (!currentGame) return;

    // Initialize game state
    const initializeGame = () => {
      // This will be replaced with actual Phaser game initialization
      console.log('Initializing Pool Game for:', currentGame);

      setGameState(prev => ({
        ...prev,
        status: 'ready',
        players: currentGame.entries.map(entry => ({
          id: entry.user_id,
          username: entry.username || `Player ${entry.user_id}`,
          isCurrentUser: entry.user_id === user?.id
        }))
      }));
    };

    initializeGame();

    // Cleanup
    return () => {
      console.log('Cleaning up Pool Game');
    };
  }, [currentGame, user]);

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
            {gameState.players.map(player => (
              <div key={player.id} className={`mt-2 ${player.isCurrentUser ? 'font-bold text-yellow-300' : 'text-white'}`}>
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
            {gameState.status === 'ready' && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                onClick={() => console.log('Start game clicked')}
              >
                Start Game
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolGame;