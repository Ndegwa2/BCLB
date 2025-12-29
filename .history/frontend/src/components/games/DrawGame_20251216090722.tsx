import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { GameEntry, DrawGameState } from '../../types/game';
import { User } from '../../types/auth';

const DrawGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { state: authState } = useAuth();
  const { activeGames, loading, error } = useGame();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<DrawGameState>({
    status: 'waiting',
    currentPlayer: null,
    players: [],
    gameOver: false,
    winner: null,
    drawResults: null,
    totalPot: 0,
    houseCut: 0,
    winnerPayout: 0,
    gameType: 'draw_1v1'
  });

  const [gameStarted, setGameStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Find the current game from context
  const currentGame = activeGames.find(g => g.id === Number(gameId));

  useEffect(() => {
    console.log('DrawGame useEffect triggered');
    console.log('currentGame:', currentGame);
    console.log('authState.user:', authState.user);
    console.log('activeGames:', activeGames);

    if (!currentGame) {
      console.warn('No current game found!');
      return;
    }

    // Initialize game state
    const initializeGame = () => {
      console.log('Initializing Draw Game for:', currentGame);

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

      // Calculate total pot and house cut
      const totalPot = mockEntries.reduce((sum, entry) => sum + entry.stake_amount, 0);
      const houseCut = totalPot * 0.15; // 15% house cut
      const winnerPayout = totalPot - houseCut;

      setGameState((prev: DrawGameState) => ({
        ...prev,
        status: mockEntries.length === 2 ? 'ready' : 'waiting',
        players: mockEntries.map((entry, index) => ({
          id: entry.user_id,
          username: entry.username || `Player ${index + 1}`,
          isCurrentUser: entry.user_id === authState.user?.id,
          userId: entry.user_id,
          ready: index === 0, // Creator is ready by default
          stakeAmount: entry.stake_amount
        })),
        totalPot,
        houseCut,
        winnerPayout
      }));
    };

    initializeGame();
  }, [currentGame, authState.user]);

  // Start the draw game
  const startDrawGame = () => {
    if (gameState.players.length !== 2) {
      console.error('Need exactly 2 players to start draw game');
      return;
    }

    console.log('Starting draw game...');
    setGameStarted(true);
    setGameState(prev => ({ ...prev, status: 'drawing' }));

    // Simulate draw animation and result
    setTimeout(() => {
      performDraw();
    }, 2000);
  };

  // Perform the actual draw
  const performDraw = () => {
    console.log('Performing draw...');

    // Generate random draw results (1-10 for each player)
    const player1Result = Math.floor(Math.random() * 10) + 1;
    const player2Result = Math.floor(Math.random() * 10) + 1;

    const drawResults = { player1: player1Result, player2: player2Result };

    // Determine winner (higher number wins, tie = random)
    let winner: number;
    if (player1Result > player2Result) {
      winner = gameState.players[0].userId;
    } else if (player2Result > player1Result) {
      winner = gameState.players[1].userId;
    } else {
      // Tie - randomly select winner
      winner = Math.random() < 0.5 ? gameState.players[0].userId : gameState.players[1].userId;
    }

    setGameState(prev => ({
      ...prev,
      status: 'completed',
      drawResults,
      winner,
      gameOver: true
    }));

    setShowResults(true);

    // Send game results to backend
    setTimeout(() => {
      sendGameResults(winner, drawResults);
    }, 1000);
  };

  // Handle player ready state toggle
  const toggleReady = () => {
    const currentUserPlayer = gameState.players.find(p => p.isCurrentUser);
    if (!currentUserPlayer) return;

    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.isCurrentUser ? { ...player, ready: !player.ready } : player
      )
    }));

    // Check if both players are ready
    const updatedPlayers = gameState.players.map(player =>
      player.isCurrentUser ? { ...player, ready: !player.ready } : player
    );

    const allReady = updatedPlayers.every(p => p.ready);
    if (allReady && updatedPlayers.length === 2) {
      setGameState(prev => ({ ...prev, status: 'ready' }));
    }
  };

  // Handle forfeit
  const handleForfeit = () => {
    if (window.confirm('Are you sure you want to forfeit this game?')) {
      // TODO: Implement forfeit logic
      console.log('Game forfeited');
      navigate('/games');
    }
  };

  // Send game results to backend
  const sendGameResults = async (winnerId: number, drawResults: any) => {
    try {
      console.log('Game results:', {
        winnerId,
        gameId: currentGame?.id,
        drawResults,
        totalPot: gameState.totalPot,
        winnerPayout: gameState.winnerPayout
      });

      // TODO: Implement backend API call
      // const response = await fetch(`/api/games/${currentGame?.id}/complete`, {
      //   method: 'POST',
      //   body: JSON.stringify({ 
      //     winnerId, 
      //     drawResults, 
      //     totalPot: gameState.totalPot,
      //     winnerPayout: gameState.winnerPayout
      //   })
      // });
    } catch (error) {
      console.error('Failed to send game results:', error);
    }
  };

  // Copy game code to clipboard
  const copyGameCode = () => {
    if (currentGame?.game_code) {
      navigator.clipboard.writeText(currentGame.game_code);
      // TODO: Show toast notification
      console.log('Game code copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Error: {error}</p>
          <button
            onClick={() => navigate('/games')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Game not found</p>
          <button
            onClick={() => navigate('/games')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const getStatusText = () => {
    switch (gameState.status) {
      case 'waiting':
        return 'Waiting for Opponent';
      case 'ready':
        return 'Ready to Draw';
      case 'drawing':
        return 'Drawing...';
      case 'completed':
        return 'Game Completed';
      default:
        return 'Unknown Status';
    }
  };

  const winner = gameState.winner ? gameState.players.find(p => p.userId === gameState.winner) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">GameLogic</h1>
          <div className="text-sm">
            💰 KES 1,250.00 {/* TODO: Get from wallet context */}
          </div>
        </div>
      </header>

      {/* Game Info Bar */}
      <div className="bg-blue-600 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <p className="font-semibold">
            Game: {currentGame.game_code} | Type: Draw 1v1 | Stake: KES {currentGame.stake_amount} | Status: {getStatusText()}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">🎯 DRAW 1v1</h2>
                
                {/* Game Status */}
                {gameState.status === 'drawing' && (
                  <div className="mb-6">
                    <div className="animate-pulse text-xl font-semibold text-blue-600">
                      Drawing numbers...
                    </div>
                  </div>
                )}
              </div>

              {/* Player Slots */}
              <div className="flex justify-between items-center mb-8">
                {/* Player 1 */}
                <div className="text-center">
                  <div className="relative">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                      P1
                    </div>
                    {gameState.players[0]?.ready && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800">
                    {gameState.players[0]?.username || 'Player 1'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {gameState.players[0]?.ready ? 'Ready' : 'Not Ready'}
                  </p>
                  
                  {/* Show draw result for Player 1 */}
                  {gameState.drawResults && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Draw Result:</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {gameState.drawResults.player1}
                      </p>
                    </div>
                  )}
                </div>

                {/* VS Divider */}
                <div className="text-4xl font-bold text-gray-400">VS</div>

                {/* Player 2 */}
                <div className="text-center">
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 ${
                      gameState.players.length > 1 ? 'bg-gray-600' : 'bg-gray-400'
                    }`}>
                      P2
                    </div>
                    {gameState.players[1]?.ready && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800">
                    {gameState.players[1]?.username || 'Waiting...'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {gameState.players.length > 1 ? (gameState.players[1]?.ready ? 'Ready' : 'Not Ready') : 'Waiting for player...'}
                  </p>
                  
                  {/* Show draw result for Player 2 */}
                  {gameState.drawResults && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Draw Result:</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {gameState.drawResults.player2}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Game Controls */}
              <div className="bg-gray-50 rounded-lg p-4">
                {gameState.status === 'waiting' && (
                  <p className="text-center text-gray-600 mb-4">
                    Waiting for another player to join...
                  </p>
                )}

                {gameState.status === 'ready' && !gameStarted && (
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={toggleReady}
                      className={`px-6 py-2 rounded-lg font-semibold ${
                        gameState.players.find(p => p.isCurrentUser)?.ready
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      disabled={gameState.players.find(p => p.isCurrentUser)?.ready}
                    >
                      {gameState.players.find(p => p.isCurrentUser)?.ready ? 'Ready!' : 'Ready Up'}
                    </button>
                    
                    {gameState.players.every(p => p.ready) && gameState.players.length === 2 && (
                      <button
                        onClick={startDrawGame}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Draw (2/2)
                      </button>
                    )}
                  </div>
                )}

                {gameStarted && !showResults && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Drawing results...</p>
                  </div>
                )}

                {showResults && (
                  <div className="text-center">
                    {winner && (
                      <div className="mb-4">
                        <p className="text-xl font-bold text-green-600 mb-2">
                          🎉 {winner.username} WINS!
                        </p>
                        <p className="text-gray-600">
                          Winner takes: KES {gameState.winnerPayout.toFixed(2)}
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => navigate('/games')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Back to Games
                    </button>
                  </div>
                )}

                {!showResults && (
                  <div className="flex justify-center space-x-4 mt-4">
                    <button
                      onClick={handleForfeit}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                    >
                      Cancel Game
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Game Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Game Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Game Code:</span>
                  <span className="font-semibold text-gray-800">{currentGame.game_code}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Game Type:</span>
                  <span className="font-semibold text-gray-800">Draw 1v1</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Stake Amount:</span>
                  <span className="font-semibold text-green-600">KES {currentGame.stake_amount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pot:</span>
                  <span className="font-semibold text-gray-800">KES {gameState.totalPot.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">House Cut (15%):</span>
                  <span className="font-semibold text-gray-800">KES {gameState.houseCut.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Winner Payout:</span>
                  <span className="font-semibold text-green-600">KES {gameState.winnerPayout.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold text-gray-800">2 minutes ago</span>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Players ({gameState.players.length}/2)
              </h3>
              
              <div className="space-y-3">
                {gameState.players.map((player, index) => (
                  <div
                    key={player.userId}
                    className={`p-3 rounded-lg border ${
                      player.ready ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${
                          player.ready ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-semibold text-gray-800">{player.username}</p>
                          <p className="text-sm text-gray-600">
                            {player.isCurrentUser ? 'Joined' : 'Joined'} • KES {player.stakeAmount}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${
                        player.ready ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {player.ready ? 'READY' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
                
                {gameState.players.length < 2 && (
                  <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                      <div>
                        <p className="font-semibold text-gray-600">Waiting for player...</p>
                        <p className="text-sm text-gray-500">Not joined yet</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Game Rules */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Game Rules</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Both players place their stakes</li>
                <li>• System randomly selects a winner</li>
                <li>• Winner takes 85% of total pot (15% house cut)</li>
                <li>• Each player draws a random number (1-10)</li>
                <li>• Higher number wins, tie = random selection</li>
              </ul>
            </div>

            {/* Share Game Code */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Share Game</h3>
              <div className="flex space-x-2">
                <div className="flex-1 bg-gray-100 rounded-lg p-2">
                  <span className="text-sm text-gray-600">{currentGame.game_code}</span>
                </div>
                <button
                  onClick={copyGameCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawGame;