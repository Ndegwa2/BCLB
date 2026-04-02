import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { apiClient } from '../services/api';
import PoolGame from '../components/games/PoolGame';
import PokerGame from '../components/games/PokerGame';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Smart GamePlay component that routes to the appropriate game type
const GamePlay: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { activeGames, refreshGameData } = useGame();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const gameLoadedRef = useRef(false);

  const loadGame = useCallback(async () => {
    if (!gameId || gameLoadedRef.current) return;
    
    // First try to find in active games
    const foundGame = activeGames.find(g => g.id === Number(gameId));
    
    if (foundGame) {
      setGame(foundGame);
      gameLoadedRef.current = true;
      setLoading(false);
      return;
    }
    
    // If not found, fetch it directly from API
    try {
      // apiClient already returns response.data, so we access directly
      const responseData = await apiClient.get(`/games/${gameId}`);
      if (responseData && responseData.game) {
        setGame(responseData.game);
        gameLoadedRef.current = true;
      } else {
        // Refresh game data and try again
        await refreshGameData();
        gameLoadedRef.current = true;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load game');
      gameLoadedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [gameId, activeGames, refreshGameData]);

  // Run loadGame when gameId changes or when activeGames is updated
  useEffect(() => {
    if (!gameLoadedRef.current) {
      loadGame();
    }
  }, [gameId, activeGames, loadGame]);

  // Also try to find game in activeGames when it updates
  useEffect(() => {
    if (!game && gameId && activeGames.length > 0) {
      const foundGame = activeGames.find(g => g.id === Number(gameId));
      if (foundGame) {
        setGame(foundGame);
        setLoading(false);
      }
    }
  }, [activeGames, gameId, game]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Game Not Found</h1>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-600">{error || "The game you're trying to access doesn't exist or you don't have permission to view it."}</p>
              <button
                onClick={() => navigate('/games')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Back to Games
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Route to the appropriate game component based on game type
  switch (game.game_type) {
    case 'pool_8ball':
      return <PoolGame />;

    case 'poker_texas_holdem':
      return <PokerGame />;

    case 'card_blackjack':
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Blackjack Game</h1>
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-600">Blackjack game coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">Game ID: {game.id}</p>
                <p className="text-sm text-gray-500">Status: {game.status}</p>
              </div>
            </div>
          </div>
        </div>
      );

    case 'draw_1v1':
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Draw 1v1 Game</h1>
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-600">Draw 1v1 game coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">Game ID: {game.id}</p>
                <p className="text-sm text-gray-500">Status: {game.status}</p>
              </div>
            </div>
          </div>
        </div>
      );

    case 'tournament_single_elimination':
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Tournament</h1>
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-600">Tournament game coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">Game ID: {game.id}</p>
                <p className="text-sm text-gray-500">Status: {game.status}</p>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Game Type Not Supported</h1>
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-600">The game type "{game.game_type}" is not yet implemented.</p>
                <p className="text-sm text-gray-500 mt-2">Game ID: {game.id}</p>
                <button
                  onClick={() => navigate('/games')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Back to Games
                </button>
              </div>
            </div>
          </div>
        </div>
      );
  }
};

export default GamePlay;