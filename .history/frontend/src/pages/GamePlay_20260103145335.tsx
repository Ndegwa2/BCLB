import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import PoolGame from '../components/games/PoolGame';
import PokerGame from '../components/games/PokerGame';

// Smart GamePlay component that routes to the appropriate game type
const GamePlay: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { activeGames } = useGame();
  const navigate = useNavigate();

  // Find the current game
  const currentGame = activeGames.find(g => g.id === Number(gameId));

  if (!currentGame) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Game Not Found</h1>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-600">The game you're trying to access doesn't exist or you don't have permission to view it.</p>
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
  switch (currentGame.game_type) {
    case 'pool_8ball':
      return <PoolGame />;

    case 'card_blackjack':
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Blackjack Game</h1>
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-600">Blackjack game coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">Game ID: {currentGame.id}</p>
                <p className="text-sm text-gray-500">Status: {currentGame.status}</p>
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
                <p className="text-sm text-gray-500 mt-2">Game ID: {currentGame.id}</p>
                <p className="text-sm text-gray-500">Status: {currentGame.status}</p>
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
                <p className="text-sm text-gray-500 mt-2">Game ID: {currentGame.id}</p>
                <p className="text-sm text-gray-500">Status: {currentGame.status}</p>
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
                <p className="text-gray-600">The game type "{currentGame.game_type}" is not yet implemented.</p>
                <p className="text-sm text-gray-500 mt-2">Game ID: {currentGame.id}</p>
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