import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { apiClient } from '../../services/api';
import { GameEntry, PoolGameState } from '../../types/game';
import { User } from '../../types/auth';
import * as Phaser from 'phaser';

// Main Pool Game Component
const PoolGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { state: authState } = useAuth();
  const { activeGames, loading, error } = useGame();
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const navigate = useNavigate();

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

  const [opponentSelection, setOpponentSelection] = useState<{
    show: boolean;
    opponentType: 'human' | 'ai' | null;
    difficulty: 'easy' | 'medium' | 'hard' | null;
  }>({
    show: false,
    opponentType: null,
    difficulty: null
  });

  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);

  // Find the current game from context
  const currentGame = activeGames.find(g => g.id === Number(gameId));

  // Check if game already has AI opponent assigned (from game creation)
  const hasAIOpponent = currentGame?.entries?.some((entry: any) =>
    entry.user_id === 999 || entry.username?.startsWith('AI ')
  ) || currentGame?.opponent_type === 'ai';

  // Auto-start game if AI opponent was already assigned during game creation
  useEffect(() => {
    if (!currentGame || gameStarted) return;

    // If game already has AI opponent, start immediately
    if (hasAIOpponent) {
      const aiDifficulty = currentGame.ai_difficulty || 'medium';
      
      // Set opponent selection to AI
      setOpponentSelection({
        show: false,
        opponentType: 'ai',
        difficulty: aiDifficulty
      });

      // Initialize game state with AI player
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
        },
        {
          id: 2,
          user_id: 999,
          game_id: currentGame.id,
          stake_amount: currentGame.stake_amount,
          joined_at: new Date().toISOString(),
          result: null,
          payout_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: `AI ${aiDifficulty.charAt(0).toUpperCase()}${aiDifficulty.slice(1)}`,
          user: {
            id: 999,
            username: `AI ${aiDifficulty.charAt(0).toUpperCase()}${aiDifficulty.slice(1)}`,
            phone_number: '0000000000',
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as User
        }
      ];

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

      // Start the game
      setTimeout(() => startGameWithOpponent(), 500);
    }
  }, [currentGame, hasAIOpponent, authState.user]);

  // Poll for player updates when waiting for opponent
  useEffect(() => {
    if (!currentGame || gameStarted || opponentSelection.opponentType === 'ai' || hasAIOpponent) return;

    const fetchPlayerCount = async () => {
      try {
        const response = await apiClient.get(`/games/${currentGame.id}`);
        const newCount = response.data.game?.player_count || 1;
        setPlayerCount(newCount);
        
        // If second player joined, update game state with new entries
        if (newCount >= 2 && gameState.players.length < 2) {
          const gameData = response.data.game;
          if (gameData.entries && gameData.entries.length > 1) {
            setGameState(prev => ({
              ...prev,
              players: gameData.entries.map((entry: any) => ({
                id: entry.user_id,
                username: entry.username || `Player ${entry.user_id}`,
                isCurrentUser: entry.user_id === authState.user?.id,
                userId: entry.user_id
              }))
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch player count:', error);
      }
    };

    // Initial fetch
    fetchPlayerCount();

    // Poll every 3 seconds
    const interval = setInterval(fetchPlayerCount, 3000);

    return () => clearInterval(interval);
  }, [currentGame, gameStarted, opponentSelection.opponentType, authState.user?.id, gameState.players.length]);

  useEffect(() => {
    if (!currentGame) return;

    const initializeGame = () => {
      // Only initialize with default opponent if no selection has been made
      if (!opponentSelection.opponentType) {
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
      }
    };

    initializeGame();

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [currentGame, authState.user, opponentSelection.opponentType]);

  // Start the Phaser game
  const startPhaserGame = () => {
    if (!gameRef.current || !currentGame) return;

    // Show opponent selection screen first
    setOpponentSelection(prev => ({ ...prev, show: true }));
  };

  // Actually start the game after opponent selection
  const startGameWithOpponent = () => {
    if (!gameRef.current || !currentGame) return;

    setGameStarted(true);
    setGameState(prev => ({ ...prev, status: 'in_progress' }));

    // WebGL context validation before game creation
    console.log('[WebGL Debug] Checking WebGL support...');
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      console.error('[WebGL Debug] WebGL not supported in browser');
      alert('WebGL is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      return;
    }
    console.log('[WebGL Debug] WebGL supported:', gl.constructor.name);

    // Check for context restoration issues
    const gameContainer = gameRef.current;
    if (!gameContainer) {
      console.error('[WebGL Debug] Game container not found');
      return;
    }
    console.log('[WebGL Debug] Game container dimensions:', gameContainer.clientWidth, 'x', gameContainer.clientHeight);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: gameContainer.clientWidth,
      height: gameContainer.clientHeight,
      parent: gameContainer,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0, x: 0 },
          debug: false
        }
      },
      scene: [PoolGameScene]
    };

    console.log('[WebGL Debug] Creating Phaser game with config:', {
      type: Phaser.AUTO,
      width: config.width,
      height: config.height
    });

    phaserGameRef.current = new Phaser.Game(config);

    // Add WebGL context loss/restoration handlers
    const canvasElement = gameContainer.querySelector('canvas');
    if (canvasElement) {
      canvasElement.addEventListener('webglcontextlost', (event) => {
        console.error('[WebGL Debug] Context lost event detected');
        event.preventDefault();
      });

      canvasElement.addEventListener('webglcontextrestored', () => {
        console.log('[WebGL Debug] Context restored event detected');
      });
    }

    if (phaserGameRef.current && phaserGameRef.current.scene.scenes.length > 0) {
      const scene = phaserGameRef.current.scene.scenes[0] as any;
      scene.gameData = {
        gameId: currentGame.id,
        players: gameState.players,
        currentUserId: authState.user?.id,
        gameType: currentGame.game_type,
        aiDifficulty: opponentSelection.difficulty
      };
    }
  };

  const handleForfeit = () => {
    if (window.confirm('Are you sure you want to forfeit this game?')) {
      navigate('/games');
    }
  };

  const handlePause = () => {
    console.log('Game paused');
  };

  const handleOpponentSelection = (opponentType: 'human' | 'ai', difficulty: 'easy' | 'medium' | 'hard' | null = null) => {
    if (!currentGame) return;

    setOpponentSelection({
      show: false,
      opponentType,
      difficulty
    });

    // Initialize game with selected opponent
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

    if (opponentType === 'ai') {
      mockEntries.push({
        id: 2,
        user_id: 999,
        game_id: currentGame.id,
        stake_amount: currentGame.stake_amount,
        joined_at: new Date().toISOString(),
        result: null,
        payout_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        username: `AI ${difficulty?.charAt(0).toUpperCase()}${difficulty?.slice(1)}`,
        user: {
          id: 999,
          username: `AI ${difficulty?.charAt(0).toUpperCase()}${difficulty?.slice(1)}`,
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

    // Start the game after opponent selection
    setTimeout(() => startGameWithOpponent(), 100);
  };

  if (loading) {
    return <div className="text-center py-8 text-white">Loading game...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (!currentGame) {
    return <div className="text-center py-8 text-white">Game not found</div>;
  }

  return (
    <div className="pool-game-container">
      {/* Game Header */}
      <div className="pool-game-header">
        <h2 className="pool-game-title text-white">🎱 8-Ball Pool - {currentGame.game_code}</h2>
        <div className="pool-game-status text-white">
          Status: {gameState.status} | Stake: ${currentGame.stake_amount}
        </div>
      </div>

      {/* Game Container */}
      <div
        ref={gameRef}
        className="w-full h-screen relative"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        {/* Opponent Selection Overlay */}
        {opponentSelection.show && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-8 text-center max-w-md border-2 border-yellow-500 shadow-2xl">
              <h3 className="text-3xl font-bold text-yellow-400 mb-2">🎱 Choose Your Opponent</h3>
              
              {/* Game Code Display */}
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-gray-300 text-xs">Game Code</p>
                <p className="text-2xl font-mono font-bold text-yellow-400">{currentGame?.game_code}</p>
                <p className="text-gray-400 text-xs mt-1">Share this code for others to join</p>
              </div>

              <div className="space-y-4">
                {/* AI Opponent Selection */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-xl font-semibold text-white mb-3">🤖 Play vs AI</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-all text-sm"
                      onClick={() => handleOpponentSelection('ai', 'easy')}
                    >
                      Easy
                    </button>
                    <button
                      className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded transition-all text-sm"
                      onClick={() => handleOpponentSelection('ai', 'medium')}
                    >
                      Medium
                    </button>
                    <button
                      className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-all text-sm"
                      onClick={() => handleOpponentSelection('ai', 'hard')}
                    >
                      Hard
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">Play immediately against the computer</p>
                </div>

                {/* Human Opponent Option */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-xl font-semibold text-white mb-3">👥 Play vs Human</h4>
                  {playerCount < 2 ? (
                    <>
                      <p className="text-gray-300 text-sm mb-3">
                        Waiting for another player to join...
                      </p>
                      <div className="bg-purple-900/50 rounded-lg p-3 mb-3">
                        <p className="text-purple-300 text-xs mb-1">Players joined:</p>
                        <p className="text-white font-medium">
                          {playerCount}/2
                        </p>
                      </div>
                      <button
                        className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-all disabled:opacity-50"
                        disabled={true}
                      >
                        Waiting for opponent...
                      </button>
                      
                      {/* Quick Join by Code */}
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-gray-400 text-xs mb-2">Have a game code? Enter it to join:</p>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            id="join-game-code"
                            placeholder="Enter code"
                            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:outline-none focus:border-purple-500"
                          />
                          <button
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-all text-sm"
                            onClick={() => {
                              const codeInput = document.getElementById('join-game-code') as HTMLInputElement;
                              const code = codeInput?.value.trim();
                              if (code) {
                                // Try to find and join game by code
                                apiClient.get(`/games/${code}`)
                                  .then(response => {
                                    const game = response.data.game;
                                    if (game && game.status === 'waiting') {
                                      navigate(`/games/${game.id}/play`);
                                    } else {
                                      alert('Game not found or already in progress');
                                    }
                                  })
                                  .catch(() => alert('Game not found'));
                              }
                            }}
                          >
                            Join
                          </button>
                        </div>
                      </div>
                      
                      <button
                        className="w-full mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-all"
                        onClick={() => {
                          if (window.confirm('Cancel this game and return to lobby?')) {
                            navigate('/games');
                          }
                        }}
                      >
                        Cancel Game
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-green-400 text-sm mb-3">✓ Opponent joined! Ready to play!</p>
                      <button
                        className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-all"
                        onClick={() => handleOpponentSelection('human', null)}
                      >
                        Start Game vs Human
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button
                className="mt-6 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-all"
                onClick={() => setOpponentSelection(prev => ({ ...prev, show: false }))}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Game Instructions Overlay */}
        {!gameStarted && gameState.status === 'ready' && !opponentSelection.show && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-xl p-8 text-center max-w-lg border-2 border-yellow-500 shadow-2xl">
              <h3 className="text-3xl font-bold text-yellow-400 mb-4">🎱 8-Ball Pool</h3>
              <div className="text-left space-y-3 text-white text-sm">
                <p className="text-lg font-semibold text-yellow-300">How to Play:</p>
                <p>• <strong>Break:</strong> Hit the racked balls to start</p>
                <p>• <strong>Groups:</strong> Solids (1-7) or Stripes (9-15)</p>
                <p>• <strong>Goal:</strong> Pocket all your balls, then the 8-ball</p>
                <p>• <strong>8-Ball:</strong> Win by pocketing 8-ball after your group is clear</p>
                <p>• <strong>Fouls:</strong> Cue ball pocketed = ball in hand</p>
              </div>
              <p className="mt-4 text-yellow-200 text-sm">
                💡 Click and drag from the white cue ball to shoot
              </p>
              <button
                className="mt-6 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all shadow-lg"
                onClick={startPhaserGame}
                disabled={gameState.players.length < 2}
              >
                {gameState.players.length < 2 ? 'Waiting for opponent...' : 'Start Game'}
              </button>
            </div>
          </div>
        )}

        {/* Game Canvas */}
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🎱</div>
              <h3 className="text-2xl mb-4">8-Ball Pool Loading...</h3>
              <p>Game Type: {currentGame.game_type}</p>
              <p>Players: {gameState.players.length}/2</p>
              {gameState.players.map((player: any) => (
                <div key={player.userId} className="mt-2 text-yellow-400">
                  {player.username} {player.isCurrentUser && '(You)'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="pool-game-controls absolute bottom-4 left-0 right-0">
        <div className="pool-control-panel text-center">
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-all"
              onClick={handleForfeit}
            >
              Forfeit
            </button>
            <button
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-all"
              onClick={handlePause}
            >
              Pause
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Realistic 8-Ball Pool Game Scene
class PoolGameScene extends Phaser.Scene {
  private gameData: any;
  private cueBall: Phaser.Physics.Matter.Sprite | null = null;
  private balls: Phaser.Physics.Matter.Sprite[] = [];
  private cue: Phaser.GameObjects.Line | null = null;
  private cueStick: Phaser.GameObjects.Image | null = null;
  private powerIndicator: Phaser.GameObjects.Graphics | null = null;
  private isAiming = false;
  private shotPower = 0;
  private maxPower = 250; // Increased from 150 for more power
  private currentPlayerTurn = 0;
  private gameStarted = false;
  private gameOver = false;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private turnText: Phaser.GameObjects.Text | null = null;
  private messageText: Phaser.GameObjects.Text | null = null;
  private pocketedBallsDisplay: Phaser.GameObjects.Container | null = null;
  private pocketedBalls: { number: number; type: string; player: number }[] = [];
  private gameType: 'eightball' | 'break' = 'break';
  private playerGroups: { player0: 'solid' | 'stripe' | null, player1: 'solid' | 'stripe' | null } = { player0: null, player1: null };
  private currentPlayerGroup: 'solid' | 'stripe' | null = null;
  private ballsRemaining: { solid: number, stripe: number } = { solid: 7, stripe: 7 };
  private firstBallHit: Phaser.Physics.Matter.Sprite | null = null;
  private ballsPocketedThisTurn: { number: number; type: string }[] = [];
  private foulsThisTurn: string[] = [];
  private extraShotsRemaining: number = 0;
  private playerBallRacks: { player0: Phaser.GameObjects.Container, player1: Phaser.GameObjects.Container } | null = null;
  private pocketPositions: { x: number; y: number }[] = [];
  private tableBounds = { left: 0, right: 0, top: 0, bottom: 0, feltLeft: 0, feltRight: 0, feltTop: 0, feltBottom: 0 };
  private ballInHand = false;
  private canPlaceCueBall = false;
  private turnSwitchScheduled = false;
  private ballsHaveMoved = false;
  private lastTurnSwitchTime = 0;
  private frameCount = 0;
  private STOP_THRESHOLD = 0.05;
  private inputListenersRegistered = false;
  private canShoot = true;
  private isAIPlayer = false;
  private aiThinking = false;
  private aiDifficulty: 'easy' | 'medium' | 'hard' = 'medium';

  constructor() {
    super({ key: 'PoolGameScene' });
  }

  init(data: any) {
    this.gameData = data;
  }

  preload() {
    // All graphics created programmatically
  }

  create() {
    // Pre-generate all textures before creating game objects
    this.pregenerateBallTextures();
    
    this.createRealisticPoolTable();
    this.createRealisticPockets();
    this.createBalls();
    this.createCueStick();
    this.setupInput();
    this.createUI();
    this.createPlayerBallRacks();
    this.setupEventListeners();
    
    // Disable Matter.js sleeping to prevent input issues
    this.matter.world.engine.enableSleeping = false;
    
    // Disable sleeping on all balls
    this.balls.forEach(ball => {
      if (ball.body) {
        (ball.body as any).isSleeping = false;
        (ball.body as any).sleepThreshold = Infinity;
      }
    });
    
    this.gameStarted = true;
    this.gameType = 'break';
    this.updateMessage('Break Shot!');
    
    console.log('[Pool Game] Scene created, textures pre-generated');
  }

  shutdown() {
    // Clean up all textures to prevent memory leaks
    console.log('[Pool Game] Cleaning up textures...');
    
    const textureKeys = [
      'ball_0_cue', 'ball_1_regular', 'ball_2_regular', 'ball_3_regular',
      'ball_4_regular', 'ball_5_regular', 'ball_6_regular', 'ball_7_regular',
      'ball_8_regular', 'ball_9_regular', 'ball_10_regular', 'ball_11_regular',
      'ball_12_regular', 'ball_13_regular', 'ball_14_regular', 'ball_15_regular',
      'cue_stick_static'
    ];
    
    textureKeys.forEach(key => {
      if (this.textures.exists(key)) {
        this.textures.remove(key);
        console.log(`[Texture Cleanup] Removed: ${key}`);
      }
    });
  }

  private createRealisticPoolTable() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Table dimensions (9-foot pool table ratio)
    const tableWidth = Math.min(w * 0.85, 1000);
    const tableHeight = tableWidth * 0.5;
    const tableX = (w - tableWidth) / 2;
    const tableY = (h - tableHeight) / 2;
    
    this.tableBounds = {
      left: tableX,
      right: tableX + tableWidth,
      top: tableY,
      bottom: tableY + tableHeight,
      feltLeft: tableX + 50,
      feltRight: tableX + tableWidth - 50,
      feltTop: tableY + 50,
      feltBottom: tableY + tableHeight - 50
    };

    // Room background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, w, h);

    // Table skirt (wood frame)
    const skirt = this.add.graphics();
    skirt.fillStyle(0x2d1f0f, 1);
    skirt.fillRoundedRect(tableX - 40, tableY - 40, tableWidth + 80, tableHeight + 80, 25);
    
    // Wood grain effect
    skirt.fillStyle(0x3d2a15, 1);
    skirt.fillRoundedRect(tableX - 25, tableY - 25, tableWidth + 50, tableHeight + 50, 20);
    skirt.fillStyle(0x4a3520, 1);
    skirt.fillRoundedRect(tableX - 10, tableY - 10, tableWidth + 20, tableHeight + 20, 15);

    // Rails (cushions)
    const rails = this.add.graphics();
    const railColor = 0x1e5f1e;
    const railTrim = 0x5a4025;
    
    // Top rail
    rails.fillStyle(railColor, 1);
    rails.fillRect(tableX + 45, tableY + 25, tableWidth - 90, 30);
    rails.fillStyle(railTrim, 1);
    rails.fillRect(tableX + 40, tableY + 20, tableWidth - 80, 8);
    
    // Bottom rail
    rails.fillStyle(railColor, 1);
    rails.fillRect(tableX + 45, tableY + tableHeight - 55, tableWidth - 90, 30);
    rails.fillStyle(railTrim, 1);
    rails.fillRect(tableX + 40, tableY + tableHeight - 28, tableWidth - 80, 8);
    
    // Left rail
    rails.fillStyle(railColor, 1);
    rails.fillRect(tableX + 25, tableY + 45, 30, tableHeight - 90);
    rails.fillStyle(railTrim, 1);
    rails.fillRect(tableX + 20, tableY + 40, 8, tableHeight - 80);
    
    // Right rail
    rails.fillStyle(railColor, 1);
    rails.fillRect(tableX + tableWidth - 55, tableY + 45, 30, tableHeight - 90);
    rails.fillStyle(railTrim, 1);
    rails.fillRect(tableX + tableWidth - 28, tableY + 40, 8, tableHeight - 80);

    // Felt surface
    const felt = this.add.graphics();
    felt.fillStyle(0x0d6b0d, 1);
    felt.fillRect(tableX + 50, tableY + 50, tableWidth - 100, tableHeight - 100);
    
    // Felt texture
    felt.lineStyle(1, 0x0a5a0a, 0.2);
    for (let i = 0; i < 30; i++) {
      const lineY = tableY + 55 + i * ((tableHeight - 110) / 30);
      felt.lineBetween(tableX + 50, lineY, tableX + tableWidth - 50, lineY);
    }

    // Head string (break line)
    felt.lineStyle(2, 0xffffff, 0.15);
    felt.lineBetween(tableX + 200, tableY + 50, tableX + 200, tableY + tableHeight - 50);

    // Diamond markers
    this.createDiamondMarkers(tableX, tableY, tableWidth, tableHeight);

    // Physics walls
    this.createPhysicsWalls(tableX, tableY, tableWidth, tableHeight);
  }

  private createDiamondMarkers(tableX: number, tableY: number, tableWidth: number, tableHeight: number) {
    const markers = this.add.graphics();
    const goldColor = 0xd4af37;
    const bezelColor = 0x8b7355;
    
    const positions = [0.15, 0.35, 0.5, 0.65, 0.85];
    
    // Top markers
    positions.forEach(pos => {
      const x = tableX + pos * tableWidth;
      markers.fillStyle(bezelColor, 1);
      markers.fillCircle(x, tableY + 38, 7);
      markers.fillStyle(goldColor, 1);
      markers.fillCircle(x, tableY + 38, 4);
    });
    
    // Bottom markers
    positions.forEach(pos => {
      const x = tableX + pos * tableWidth;
      markers.fillStyle(bezelColor, 1);
      markers.fillCircle(x, tableY + tableHeight - 38, 7);
      markers.fillStyle(goldColor, 1);
      markers.fillCircle(x, tableY + tableHeight - 38, 4);
    });
  }

  private createPhysicsWalls(tableX: number, tableY: number, tableWidth: number, tableHeight: number) {
    const wallThickness = 10;
    const friction = 0.02;
    const restitution = 0.85;
    
    // Top wall
    this.matter.add.rectangle(tableX + tableWidth / 2, tableY + 40, tableWidth - 100, wallThickness, {
      isStatic: true, restitution, friction, label: 'wall'
    });
    
    // Bottom wall
    this.matter.add.rectangle(tableX + tableWidth / 2, tableY + tableHeight - 40, tableWidth - 100, wallThickness, {
      isStatic: true, restitution, friction, label: 'wall'
    });
    
    // Left wall
    this.matter.add.rectangle(tableX + 40, tableY + tableHeight / 2, wallThickness, tableHeight - 100, {
      isStatic: true, restitution, friction, label: 'wall'
    });
    
    // Right wall
    this.matter.add.rectangle(tableX + tableWidth - 40, tableY + tableHeight / 2, wallThickness, tableHeight - 100, {
      isStatic: true, restitution, friction, label: 'wall'
    });
  }

  private createRealisticPockets() {
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;

    // 6 pocket positions with realistic dimensions
    this.pocketPositions = [
      { x: feltLeft + 15, y: feltTop + 15 },      // Top-left corner
      { x: (feltLeft + feltRight) / 2, y: feltTop + 10 },  // Top-center
      { x: feltRight - 15, y: feltTop + 15 },     // Top-right corner
      { x: feltLeft + 15, y: feltBottom - 15 },   // Bottom-left corner
      { x: (feltLeft + feltRight) / 2, y: feltBottom - 10 }, // Bottom-center
      { x: feltRight - 15, y: feltBottom - 15 }   // Bottom-right corner
    ];

    const pocketRadii = [24, 20, 24, 24, 20, 24];

    this.pocketPositions.forEach((pos, index) => {
      const pocket = this.add.graphics();
      const radius = pocketRadii[index];

      // Pocket shadow/bezel with 3D effect
      pocket.fillStyle(0x1a1a1a, 1);
      pocket.fillCircle(pos.x, pos.y, radius + 6);

      // Pocket interior with depth
      pocket.fillStyle(0x0a0a0a, 1);
      pocket.fillCircle(pos.x, pos.y, radius + 2);

      // Inner depth/shadow
      pocket.fillStyle(0x000000, 1);
      pocket.fillCircle(pos.x, pos.y, radius - 2);

      // Pocket lining
      pocket.lineStyle(2, 0x333333, 1);
      pocket.strokeCircle(pos.x, pos.y, radius + 2);

      // Physics sensor with larger radius for more reliable pocketing
      this.matter.add.circle(pos.x, pos.y, radius * 0.8, {
        isSensor: true,
        label: `pocket-${index}`,
        collisionFilter: { category: 0x0002, mask: 0x0001 }
      });
    });
  }

  private createBalls() {
    const ballRadius = 18;
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    
    // Cue ball position
    const cueBallX = feltLeft + 200;
    const cueBallY = (feltTop + feltBottom) / 2;
    
    // Create cue ball
    const cueBall = this.createBallTexture(cueBallX, cueBallY, 0xffffff, false, 0, true) as Phaser.Physics.Matter.Sprite;
    cueBall.setData('type', 'cue');
    cueBall.setData('number', 0);
    cueBall.setInteractive({ useHandCursor: true });
    this.cueBall = cueBall;
    this.balls.push(cueBall);

    // Rack position
    const rackX = feltRight - 250;
    const rackY = (feltTop + feltBottom) / 2;
    
    // Standard 8-ball rack order
    const rackOrder = [1, 9, 2, 10, 8, 11, 3, 12, 4, 13, 5, 14, 6, 15, 7];
    const ballColors: Record<number, number> = {
      1: 0xffd700, 2: 0x0000ff, 3: 0xff0000, 4: 0x800080, 5: 0xff6600, 6: 0x008000, 7: 0x800000,
      8: 0x000000, 9: 0xffd700, 10: 0x0000ff, 11: 0xff0000, 12: 0x800080, 13: 0xff6600, 14: 0x008000, 15: 0x800000
    };
    
    const rackPositions = this.getRackPositions(rackX, rackY, ballRadius);
    
    rackOrder.forEach((number, idx) => {
      const ball = this.createBallTexture(
        rackPositions[idx].x,
        rackPositions[idx].y,
        ballColors[number],
        number > 8,
        number,
        false
      ) as Phaser.Physics.Matter.Sprite;
      
      if (ball) {
        const type = number === 8 ? 'eight' : (number <= 7 ? 'solid' : 'stripe');
        ball.setData('type', type);
        ball.setData('number', number);
        this.balls.push(ball);
      }
    });
  }

  // Pre-generate ball textures to avoid WebGL memory leaks
  private pregenerateBallTextures(): void {
    const ballRadius = 18;
    const textureWidth = ballRadius * 2 + 4;
    const textureHeight = ballRadius * 2 + 4;

    // Define all ball configurations
    const ballConfigs = [
      { number: 0, color: 0xffffff, isStripe: false, isCue: true },
      { number: 1, color: 0xffd700, isStripe: false, isCue: false },
      { number: 2, color: 0x0000ff, isStripe: false, isCue: false },
      { number: 3, color: 0xff0000, isStripe: false, isCue: false },
      { number: 4, color: 0x800080, isStripe: false, isCue: false },
      { number: 5, color: 0xff6600, isStripe: false, isCue: false },
      { number: 6, color: 0x008000, isStripe: false, isCue: false },
      { number: 7, color: 0x800000, isStripe: false, isCue: false },
      { number: 8, color: 0x000000, isStripe: false, isCue: false },
      { number: 9, color: 0xffd700, isStripe: true, isCue: false },
      { number: 10, color: 0x0000ff, isStripe: true, isCue: false },
      { number: 11, color: 0xff0000, isStripe: true, isCue: false },
      { number: 12, color: 0x800080, isStripe: true, isCue: false },
      { number: 13, color: 0xff6600, isStripe: true, isCue: false },
      { number: 14, color: 0x008000, isStripe: true, isCue: false },
      { number: 15, color: 0x800000, isStripe: true, isCue: false }
    ];

    ballConfigs.forEach(config => {
      const textureKey = `ball_${config.number}_${config.isCue ? 'cue' : 'regular'}`;
      
      // Skip if texture already exists
      if (this.textures.exists(textureKey)) {
        console.log(`[Texture Debug] Texture ${textureKey} already exists, skipping`);
        return;
      }

      const graphics = this.add.graphics();
      
      // Shadow under ball
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillCircle(ballRadius + 1, ballRadius + 1, ballRadius);
      
      // Ball base color
      graphics.fillStyle(config.color, 1);
      graphics.fillCircle(ballRadius, ballRadius, ballRadius);
      
      // Add subtle gradient effect with concentric circles
      for (let i = 5; i > 0; i--) {
        const ratio = i / 5;
        const stepColor = Phaser.Display.Color.ValueToColor(config.color).lighten(ratio * 12).color;
        graphics.fillStyle(stepColor, 0.3);
        graphics.fillCircle(ballRadius - 2, ballRadius - 2, ballRadius * ratio);
      }
      
      // Stripe for striped balls (wide white band)
      if (config.isStripe) {
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(ballRadius - ballRadius + 2, ballRadius - 10, ballRadius * 2 - 4, 20);
      }
      
      // 8-ball special design - white circle
      if (config.number === 8) {
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(ballRadius, ballRadius, ballRadius * 0.48);
        graphics.lineStyle(1.5, 0xdddddd, 1);
        graphics.strokeCircle(ballRadius, ballRadius, ballRadius * 0.48);
      }
      
      // White circle for number (except cue ball)
      if (config.number !== 0) {
        graphics.fillStyle(0xffffff, 0.95);
        graphics.fillCircle(ballRadius, ballRadius, ballRadius * 0.4);
      }
      
      // Add number using graphics circles to create digits
      if (config.number !== 0) {
        this.drawNumberOnBallImproved(graphics, ballRadius, config.number, config.isStripe);
      }
      
      // Add 3D highlight effect (shiny reflection)
      graphics.fillStyle(0xffffff, 0.8);
      graphics.fillCircle(ballRadius - 7, ballRadius - 7, ballRadius * 0.25);
      graphics.fillStyle(0xffffff, 0.4);
      graphics.fillCircle(ballRadius - 7, ballRadius - 7, ballRadius * 0.4);
      
      // Darker edge for definition
      graphics.lineStyle(1, 0x000000, 0.25);
      graphics.strokeCircle(ballRadius, ballRadius, ballRadius);
      
      // Generate texture with static key
      graphics.generateTexture(textureKey, textureWidth, textureHeight);
      graphics.destroy();
      
      console.log(`[Texture Debug] Created texture: ${textureKey}`);
    });
  }

  private createBallTexture(x: number, y: number, color: number, isStripe: boolean, number: number, isCue: boolean): Phaser.Physics.Matter.Sprite {
    const ballRadius = 18;
    
    // Use pre-generated texture with static key
    const textureKey = `ball_${number}_${isCue ? 'cue' : 'regular'}`;
    
    const ball = this.matter.add.image(x, y, textureKey) as Phaser.Physics.Matter.Sprite;
    ball.setCircle(ballRadius);
    ball.setFriction(0.01); // Reduced from 0.02 for less drag
    ball.setFrictionAir(0.008); // Reduced from 0.015 for balls that travel further
    ball.setBounce(0.85); // Increased from 0.75 for more energetic collisions
    ball.setMass(1);
    ball.setCollisionCategory(0x0001);
    ball.setCollidesWith(0x0001);
    
    // Add special visual indicator for cue ball
    if (isCue) {
      // Cue ball gets a slightly different highlight
      ball.setData('isCue', true);
    }
    
    return ball;
  }

  private drawNumberOnBallImproved(graphics: Phaser.GameObjects.Graphics, centerX: number, number: number, isStripe: boolean) {
    const textColor = isStripe ? 0x000000 : 0x000000;
    const digitScale = 10;
    const offsetX = centerX;
    const offsetY = centerX;

    // Draw each digit using circles
    const digits = number.toString().split('').map(d => parseInt(d));
    let startX = offsetX - ((digits.length - 1) * digitScale) / 2;

    digits.forEach((digit, index) => {
      const x = startX + index * digitScale * 2;
      this.drawDigit(graphics, x, offsetY, digit, textColor, digitScale);
    });
  }

  private drawDigit(graphics: Phaser.GameObjects.Graphics, x: number, y: number, digit: number, color: number, scale: number) {
    // Standard 7-segment style using circles
    const segments = this.getDigitSegments(digit);
    
    segments.forEach(([sx, sy, r]) => {
      graphics.fillStyle(color, 0.9);
      graphics.fillCircle(x + sx * scale/2, y + sy * scale/2, r);
    });
  }

  private getDigitSegments(digit: number): [number, number, number][] {
    // Define segments for each digit (relative positions and radius)
    switch(digit) {
      case 0:
        return [[-1, -1, 2.5], [1, -1, 2.5], [-1, 1, 2.5], [1, 1, 2.5]];
      case 1:
        return [[1, -1, 2], [1, 1, 2]];
      case 2:
        return [[-1, -1, 2.5], [0, -1, 2.5], [1, -1, 2.5], [1, 0, 2], [0, 0, 2.5], [-1, 1, 2.5], [1, 1, 2.5]];
      case 3:
        return [[-1, -1, 2.5], [0, -1, 2.5], [1, -1, 2.5], [1, 0, 2], [0, 0, 2.5], [0, 1, 2.5], [1, 1, 2.5]];
      case 4:
        return [[-1, -1, 2], [1, -1, 2.5], [-1, 0, 2], [1, 0, 2], [1, 1, 2.5]];
      case 5:
        return [[-1, -1, 2.5], [-1, -1, 2.5], [0, -1, 2.5], [1, -1, 2], [-1, 0, 2.5], [-1, 1, 2.5], [0, 1, 2.5], [1, 1, 2.5]];
      case 6:
        return [[-1, -1, 2.5], [-1, 0, 2.5], [0, -1, 2.5], [1, -1, 2], [-1, 1, 2.5], [0, 1, 2.5], [1, 1, 2.5]];
      case 7:
        return [[-1, -1, 2.5], [0, -1, 2.5], [1, -1, 2.5], [1, 0, 2], [1, 1, 2.5]];
      case 8:
        return [[-1, -1, 2.5], [0, -1, 2.5], [1, -1, 2.5], [-1, 0, 2.5], [1, 0, 2.5], [-1, 1, 2.5], [0, 1, 2.5], [1, 1, 2.5]];
      case 9:
        return [[-1, -1, 2.5], [0, -1, 2.5], [1, -1, 2.5], [-1, 0, 2.5], [1, 0, 2.5], [1, 1, 2.5]];
      default:
        return [];
    }
  }

  private drawSmallNumberOnBall(graphics: Phaser.GameObjects.Graphics, centerX: number, centerY: number, number: number, radius: number) {
    const textColor = 0xffffff;
    // Use the radius parameter to scale the digit size appropriately
    const digitScale = Math.max(2, radius * 0.8);
    const offsetX = centerX;
    const offsetY = centerY;
    
    // Draw each digit using circles
    const digits = number.toString().split('').map(d => parseInt(d));
    let startX = offsetX - ((digits.length - 1) * digitScale) / 2;
    
    digits.forEach((digit, index) => {
      const x = startX + index * digitScale * 2;
      this.drawSmallDigit(graphics, x, offsetY, digit, textColor, digitScale);
    });
  }

  private drawSmallDigit(graphics: Phaser.GameObjects.Graphics, x: number, y: number, digit: number, color: number, scale: number) {
    const segments = this.getDigitSegments(digit);
    
    segments.forEach(([sx, sy, r]) => {
      graphics.fillStyle(color, 0.9);
      graphics.fillCircle(x + sx * scale/2, y + sy * scale/2, r * 0.3);
    });
  }

  private getRackPositions(centerX: number, centerY: number, ballRadius: number): {x: number; y: number}[] {
    const positions: {x: number; y: number}[] = [];
    const spacing = ballRadius * 2 + 1;
    const rows = 5;
    
    for (let row = 0; row < rows; row++) {
      const ballsInRow = row + 1;
      const rowStartX = centerX - (row * spacing / 2);
      const rowY = centerY - ((rows - 1) * spacing / 2) + (row * spacing);
      
      for (let col = 0; col < ballsInRow; col++) {
        positions.push({
          x: rowStartX + (col * spacing),
          y: rowY
        });
      }
    }
    
    return positions;
  }

  private createCueStick() {
    // Cue stick created dynamically when aiming
  }

  private setupInput() {
    // Prevent event listener stacking - remove existing listeners first
    if (this.inputListenersRegistered) {
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.off('pointerup', this.handlePointerUp, this);
    }
    
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    
    this.inputListenersRegistered = true;
  }

  private createUI() {
    // Score display
    this.scoreText = this.add.text(30, 30, 'P1: 0  P2: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#00000060',
      padding: { x: 10, y: 5 }
    });

    // Turn indicator
    this.turnText = this.add.text(30, 60, 'Player 1\'s Turn', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#00000060',
      padding: { x: 8, y: 4 }
    });

    // Message text (for game announcements)
    this.messageText = this.add.text(this.scale.width / 2, 100, '', {
      fontSize: '28px',
      color: '#ffff00',
      fontStyle: 'bold',
      backgroundColor: '#00000070',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setDepth(200);

    // Ported balls display
    this.createPortedBallsDisplay();
  }

  private createPortedBallsDisplay() {
    this.pocketedBallsDisplay = this.add.container(this.scale.width / 2, 25);

    // Create a realistic ball rack display
    const bg = this.add.graphics();
    bg.fillStyle(0x2d1f0f, 1); // Wood color
    bg.fillRoundedRect(-120, -10, 240, 60, 12);

    // Wood grain effect
    bg.lineStyle(1, 0x3d2a15, 0.8);
    for (let i = 0; i < 8; i++) {
      const y = -8 + i * 7;
      bg.lineBetween(-115, y, 115, y + (i % 2 === 0 ? 2 : -2));
    }

    this.pocketedBallsDisplay.add(bg);

    // Title
    const title = this.add.text(0, -20, 'POCKETED BALLS', {
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.pocketedBallsDisplay.add(title);

    // Create placeholder slots for all balls
    const ballsContainer = this.add.container(0, 0);
    this.pocketedBallsDisplay.add(ballsContainer);

    // Create 15 placeholder slots (1-15)
    const ballRadius = 8;
    const spacing = 16;
    const startX = -((15 - 1) * spacing) / 2;

    for (let i = 1; i <= 15; i++) {
      const x = startX + (i - 1) * spacing;

      // Placeholder slot
      const slot = this.add.graphics();
      slot.lineStyle(1, 0x8b7355, 0.5); // Bronze color
      slot.strokeCircle(x, 0, ballRadius + 1);
      slot.lineStyle(1, 0x5a4025, 0.3);
      slot.strokeCircle(x, 0, ballRadius + 3);

      ballsContainer.add(slot);
    }

    (this.pocketedBallsDisplay as any).ballsContainer = ballsContainer;
    this.pocketedBallsDisplay.setDepth(100);
  }

  private updatePortedBallsDisplay() {
    if (!this.pocketedBallsDisplay) return;
    
    const container = (this.pocketedBallsDisplay as any).ballsContainer as Phaser.GameObjects.Container;
    
    // Clear existing ball icons but keep placeholders
    const children = container.getAll();
    children.forEach(child => {
      if (child.getData && child.getData('isBallIcon')) {
        child.destroy();
      }
    });
    
    // Add pocketed balls to their correct positions
    this.pocketedBalls.forEach((ball) => {
      const ballNumber = ball.number;
      const ballRadius = 8;
      const spacing = 16;
      const startX = -((15 - 1) * spacing) / 2;
      
      // Calculate position based on ball number (1-15)
      const x = startX + (ballNumber - 1) * spacing;
      
      // Create ball icon
      const icon = this.add.graphics();
      icon.setData('isBallIcon', true);
      
      let color = 0xffffff;
      if (ball.type === 'solid') color = 0xffd700;
      else if (ball.type === 'stripe') color = 0xff0000;
      else if (ball.type === 'eight') color = 0x000000;
      
      // Ball body
      icon.fillStyle(color, 1);
      icon.fillCircle(x, 0, ballRadius);
      
      // Stripe pattern for striped balls
      if (ball.type === 'stripe') {
        icon.fillStyle(0xffffff, 1);
        icon.fillRect(x - 3, -ballRadius, 6, ballRadius * 2);
      }
      
      // 8-ball special design
      if (ball.type === 'eight') {
        icon.fillStyle(0xffffff, 1);
        icon.fillCircle(x, 0, ballRadius * 0.6);
        icon.lineStyle(1, 0xdddddd, 1);
        icon.strokeCircle(x, 0, ballRadius * 0.6);
      }
      
      // Number on ball
      if (ballNumber !== 8) {
        icon.fillStyle(0x000000, 0.9);
        icon.fillCircle(x, 0, ballRadius * 0.4);
        
        // Draw number using graphics circles
        this.drawSmallNumberOnBall(icon, x, 0, ballNumber, ballRadius * 0.4);
      }
      
      // Border
      icon.lineStyle(1, 0xcccccc, 0.8);
      icon.strokeCircle(x, 0, ballRadius);
      
      container.add(icon);
    });
  }

  private setupEventListeners() {
    this.matter.world.on('collisionstart', (event: any) => {
      this.handleCollisionStart(event);
    }, this);
    
    // Track ball collisions for foul detection
    this.matter.world.on('collisionstart', (event: any) => {
      this.handleBallCollisions(event);
    }, this);
  }

  private handleCollisionStart(event: any) {
    event.pairs.forEach((pair: any) => {
      const { bodyA, bodyB } = pair;
      
      // Pocket detection
      if (bodyA.label?.startsWith('pocket-')) {
        this.handlePocketCollision(bodyB);
      } else if (bodyB.label?.startsWith('pocket-')) {
        this.handlePocketCollision(bodyA);
      }
    });
  }

  private handleBallCollisions(event: any) {
    // During break shot, no foul detection for first ball hit
    if (this.gameType === 'break' || this.gameOver) return;
    
    event.pairs.forEach((pair: any) => {
      const { bodyA, bodyB } = pair;
      const ballA = bodyA.gameObject;
      const ballB = bodyB.gameObject;
      
      // Check if cue ball hit something
      if (ballA && ballB && ballA !== ballB) {
        const cueBall = ballA.getData('type') === 'cue' ? ballA : (ballB.getData('type') === 'cue' ? ballB : null);
        const otherBall = cueBall === ballA ? ballB : ballA;
        
        if (cueBall && otherBall && !this.firstBallHit) {
          this.firstBallHit = otherBall;
          this.checkFouls(otherBall);
        }
      }
    });
  }

  private checkFouls(hitBall: Phaser.Physics.Matter.Sprite) {
    // No foul checking during break or if no group assigned yet
    if (this.gameType === 'break' || !this.currentPlayerGroup || this.gameOver) return;
    
    const ballType = hitBall.getData('type');
    const ballNumber = hitBall.getData('number');
    
    // Check for fouls
    const fouls: string[] = [];
    
    // 1. Hitting opponent's ball first (not on 8-ball)
    if (ballType !== 'cue' && ballType !== 'eight') {
      const isOpponentBall = (this.currentPlayerGroup === 'solid' && ballType === 'stripe') ||
                            (this.currentPlayerGroup === 'stripe' && ballType === 'solid');
      
      if (isOpponentBall) {
        console.log(`[FOUL DETECTION] Player ${this.currentPlayerTurn + 1} hit opponent's ${ballType} ball first`);
        fouls.push('opponent_ball_first');
      }
    }
    
    // 2. Hitting 8-ball first before clearing group (unless it's the only ball left)
    if (ballNumber === 8) {
      const myBallsRemaining = this.currentPlayerGroup === 'solid' ? this.ballsRemaining.solid : this.ballsRemaining.stripe;
      if (myBallsRemaining > 0) {
        console.log(`[FOUL DETECTION] Player ${this.currentPlayerTurn + 1} hit 8-ball before clearing group (${myBallsRemaining} balls remaining)`);
        fouls.push('hit_8ball_early');
      }
    }
    
    if (fouls.length > 0) {
      this.foulsThisTurn.push(...fouls);
      this.handleFoul(fouls);
    }
  }

  private handleFoul(fouls: string[]) {
    const foulMessages: Record<string, string> = {
      'opponent_ball_first': 'FOUL! Hit opponent\'s ball first!',
      'hit_8ball_early': 'FOUL! Hit 8-ball too early!',
      'no_ball_hit': 'FOUL! No ball hit!',
      'cue_pocketed': 'FOUL! Scratch!'
    };
    
    console.log(`[FOUL HANDLING] Processing ${fouls.length} foul(s) for player ${this.currentPlayerTurn + 1}`);
    
    fouls.forEach(foul => {
      this.updateMessage(foulMessages[foul] || 'FOUL!');
      console.log(`[FOUL] ${foulMessages[foul] || foul}`);
    });
    
    // Give opponent ball-in-hand (extra shot)
    this.extraShotsRemaining = 1;
    this.updateTurnIndicator();
    this.updatePlayerBallRacks();
  }

  private createPlayerBallRacks() {
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    
    // Create left player rack (Player 1)
    const leftRack = this.add.container(feltLeft - 80, (feltTop + feltBottom) / 2);
    this.createIndividualBallRack(leftRack, 'PLAYER 1', 0);
    
    // Create right player rack (Player 2)
    const rightRack = this.add.container(feltRight + 80, (feltTop + feltBottom) / 2);
    this.createIndividualBallRack(rightRack, 'PLAYER 2', 1);
    
    this.playerBallRacks = {
      player0: leftRack,
      player1: rightRack
    };
  }

  private createIndividualBallRack(container: Phaser.GameObjects.Container, title: string, playerIndex: number) {
    // Rack background
    const bg = this.add.graphics();
    bg.fillStyle(0x2d1f0f, 1); // Wood color
    bg.fillRoundedRect(-40, -80, 80, 160, 10);
    
    // Wood grain
    bg.lineStyle(1, 0x3d2a15, 0.8);
    for (let i = 0; i < 12; i++) {
      const y = -75 + i * 12;
      bg.lineBetween(-35, y, 35, y + (i % 2 === 0 ? 2 : -2));
    }
    
    container.add(bg);
    
    // Title
    const titleText = this.add.text(0, -90, title, {
      fontSize: '10px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(titleText);
    
    // Player indicator light
    const playerLight = this.add.graphics();
    playerLight.fillStyle(playerIndex === 0 ? 0x00ff00 : 0xff6600, 1);
    playerLight.fillCircle(0, -70, 6);
    playerLight.lineStyle(2, 0x000000, 1);
    playerLight.strokeCircle(0, -70, 6);
    container.add(playerLight);
    
    // Ball slots (7 slots for solids/stripes)
    const ballRadius = 8;
    const startY = -50;
    const spacing = 20;
    
    for (let i = 0; i < 7; i++) {
      const y = startY + i * spacing;
      
      // Placeholder slot
      const slot = this.add.graphics();
      slot.lineStyle(1, 0x8b7355, 0.5); // Bronze color
      slot.strokeCircle(0, y, ballRadius + 1);
      slot.lineStyle(1, 0x5a4025, 0.3);
      slot.strokeCircle(0, y, ballRadius + 3);
      
      container.add(slot);
    }
    
    // Extra shots indicator
    const shotsText = this.add.text(0, 70, 'SHOTS: 1', {
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(shotsText);
    
    (container as any).shotsText = shotsText;
    (container as any).playerIndex = playerIndex;
  }

  private updatePlayerBallRacks() {
    if (!this.playerBallRacks) return;
    
    // Update both player racks
    [0, 1].forEach(playerIndex => {
      const rack = playerIndex === 0 ? this.playerBallRacks!.player0 : this.playerBallRacks!.player1;
      const container = rack as Phaser.GameObjects.Container;
      
      // Clear existing ball icons
      const children = container.getAll();
      children.forEach(child => {
        if (child.getData && child.getData('isPlayerBallIcon')) {
          child.destroy();
        }
      });
      
      // Get balls for this player
      const playerBalls = this.pocketedBalls.filter(b => b.player === playerIndex);
      
      // Update shots indicator
      const shotsText = (container as any).shotsText;
      const isCurrentPlayer = this.currentPlayerTurn === playerIndex;
      const shotsRemaining = isCurrentPlayer && this.extraShotsRemaining > 0 ? this.extraShotsRemaining : 1;
      
      shotsText.setText(`SHOTS: ${shotsRemaining}`);
      shotsText.setColor(isCurrentPlayer ? '#00ff00' : '#ffffff');
      
      // Add ball icons
      playerBalls.forEach((ball, index) => {
        if (index < 7) { // Only show first 7 balls
          const y = -50 + index * 20;
          
          const icon = this.add.graphics();
          icon.setData('isPlayerBallIcon', true);
          
          let color = 0xffffff;
          if (ball.type === 'solid') color = 0xffd700;
          else if (ball.type === 'stripe') color = 0xff0000;
          
          icon.fillStyle(color, 1);
          icon.fillCircle(0, y, 8);
          
          if (ball.type === 'stripe') {
            icon.fillStyle(0xffffff, 1);
            icon.fillRect(-3, y - 8, 6, 16);
          }
          
          icon.lineStyle(1, 0xcccccc, 0.8);
          icon.strokeCircle(0, y, 8);
          
          container.add(icon);
        }
      });
    });
  }

  private handlePocketCollision(body: any) {
    const ball = body.gameObject;
    if (!ball || !ball.active) return;

    const ballType = ball.getData('type');
    const ballNumber = ball.getData('number');

    // Cue ball pocketed
    if (ballType === 'cue') {
      this.handleCueBallPocketed(ball);
      return;
    }

    // Mark ball as pocketed
    ball.setData('pocketed', true);
    ball.setActive(false);
    ball.setVisible(false);
    ball.setVelocity(0, 0);

    // Track pocketed ball
    this.ballsPocketedThisTurn.push({ number: ballNumber, type: ballType });
    this.pocketedBalls.push({ number: ballNumber, type: ballType, player: this.currentPlayerTurn });
    this.updatePortedBallsDisplay();
    this.updatePlayerBallRacks();

    // Update remaining balls
    if (ballType === 'solid') this.ballsRemaining.solid--;
    if (ballType === 'stripe') this.ballsRemaining.stripe--;

    // 8-ball pocketed
    if (ballType === 'eight') {
      this.handleEightBallPocketed();
    }
  }

  private handleCueBallPocketed(ball: Phaser.Physics.Matter.Sprite) {
    ball.setData('pocketed', true);
    ball.setActive(false);
    ball.setVisible(false);
    
    this.ballInHand = true;
    this.canPlaceCueBall = true;
    this.updateMessage('Foul! Ball in Hand');
    
    // Schedule cue ball reset
    this.time.delayedCall(1500, () => {
      this.placeCueBallInHand();
    });
  }

  private handleEightBallPocketed() {
    // Check if this was a valid 8-ball shot
    const currentGroup = this.currentPlayerGroup;
    const canPocketEight = currentGroup && (
      (currentGroup === 'solid' && this.ballsRemaining.solid === 0) ||
      (currentGroup === 'stripe' && this.ballsRemaining.stripe === 0)
    );
    
    console.log(`[8-BALL] Player ${this.currentPlayerTurn + 1} pocketed 8-ball`);
    console.log(`[8-BALL] Current group: ${currentGroup}, Can pocket: ${canPocketEight}`);
    console.log(`[8-BALL] Balls remaining - solids: ${this.ballsRemaining.solid}, stripes: ${this.ballsRemaining.stripe}`);
    
    if (canPocketEight) {
      // Win! - Only if player hit their ball first (checked via firstBallHit)
      if (this.firstBallHit) {
        const firstBallType = this.firstBallHit.getData('type');
        if (firstBallType === currentGroup) {
          console.log(`[8-BALL] VALID WIN - Player ${this.currentPlayerTurn + 1} wins!`);
          this.endGame(this.currentPlayerTurn, 'win');
          return;
        }
      }
      // If no first ball hit or wrong ball hit, it's a foul and loss
      console.log(`[8-BALL] FOUL - No legal ball hit first or wrong ball hit`);
    }
    
    // Lose! - Early 8-ball or foul on 8-ball
    console.log(`[8-BALL] LOSS - Player ${this.currentPlayerTurn + 1} loses!`);
    this.endGame(this.currentPlayerTurn, 'lose');
  }

  private placeCueBallInHand() {
    if (!this.cueBall) return;
    
    this.cueBall.setActive(true);
    this.cueBall.setVisible(true);
    this.cueBall.setVelocity(0, 0);
    
    // Position at center initially
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    this.cueBall.setPosition(
      (feltLeft + feltRight) / 2,
      (feltTop + feltBottom) / 2
    );
    
    this.ballInHand = false;
    this.canPlaceCueBall = true;
    this.updateMessage('Place Cue Ball');
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    // Ball in hand placement
    if (this.canPlaceCueBall && this.ballInHand && this.cueBall) {
      const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
      if (pointer.worldX >= feltLeft && pointer.worldX <= feltRight &&
          pointer.worldY >= feltTop && pointer.worldY <= feltBottom) {
        this.cueBall.setPosition(pointer.worldX, pointer.worldY);
        this.cueBall.setVelocity(0, 0);
        this.canPlaceCueBall = false;
        this.ballInHand = false;
        this.updateMessage('');
        return;
      }
    }
    
    // Aiming
    if (!this.cueBall || this.isAiming || this.gameOver || !this.cueBall.active || !this.cueBall.visible) return;
    
    const distance = Phaser.Math.Distance.Between(
      pointer.worldX, pointer.worldY,
      this.cueBall.x, this.cueBall.y
    );
    
    if (distance < 150) {
      this.isAiming = true;
      this.shotPower = 0;
      this.firstBallHit = null;
      this.ballsPocketedThisTurn = [];
      this.ballsHaveMoved = true;
      this.turnSwitchScheduled = false;
      
      // Create cue stick
      this.createCueGraphics(pointer);
    }
  }

  // Pre-generate cue stick texture once
  private pregenerateCueTexture(): void {
    const textureKey = 'cue_stick_static';
    
    if (this.textures.exists(textureKey)) {
      return;
    }

    const cueGraphics = this.add.graphics();
    const cueLength = 300;
    const cueWidth = 6;
    
    // Cue stick shaft (wood color gradient)
    cueGraphics.fillStyle(0x8B4513, 1);
    cueGraphics.fillRoundedRect(0, -cueWidth / 2, cueLength, cueWidth, 3);
    
    // Cue stick tip (white)
    cueGraphics.fillStyle(0xFFFFFF, 1);
    cueGraphics.fillRect(0, -cueWidth / 2, 8, cueWidth);
    
    // Generate texture with static key
    cueGraphics.generateTexture(textureKey, cueLength, cueWidth);
    cueGraphics.destroy();
    
    console.log('[Texture Debug] Created cue stick texture');
  }

  private createCueGraphics(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall) return;
    
    // Pre-generate cue texture once
    this.pregenerateCueTexture();
    
    // Aiming line
    this.cue = this.add.line(0, 0, 0, 0, 0, 0, 0xffff00, 1);
    this.cue.setLineWidth(2);
    
    // Use pre-generated texture with static key
    const cueTextureKey = 'cue_stick_static';
    
    // Create sprite for cue stick
    this.cueStick = this.add.image(this.cueBall.x, this.cueBall.y, cueTextureKey);
    this.cueStick.setOrigin(1, 0.5);
    this.cueStick.setDepth(10);
    
    // Position cue stick behind cue ball based on current angle
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );
    
    // Position cue stick opposite to aim direction (behind the ball)
    const cueOffset = 40;
    this.cueStick.x = this.cueBall.x - Math.cos(angle) * cueOffset;
    this.cueStick.y = this.cueBall.y - Math.sin(angle) * cueOffset;
    this.cueStick.rotation = angle;
    
    // Power indicator
    this.powerIndicator = this.add.graphics();
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isAiming || !this.cueBall || !this.cueBall.visible) return;
    
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );
    
    // Update aiming line
    if (this.cue) {
      this.cue.setTo(
        this.cueBall.x, this.cueBall.y,
        this.cueBall.x + Math.cos(angle) * 200,
        this.cueBall.y + Math.sin(angle) * 200
      );
    }
    
    // Update cue stick position and rotation
    if (this.cueStick) {
      const cueOffset = 40 + (this.shotPower / this.maxPower) * 30; // Cue moves back as power increases
      this.cueStick.x = this.cueBall.x - Math.cos(angle) * cueOffset;
      this.cueStick.y = this.cueBall.y - Math.sin(angle) * cueOffset;
      this.cueStick.rotation = angle;
    }
    
    // Update power
    const distance = Phaser.Math.Distance.Between(
      pointer.worldX, pointer.worldY,
      this.cueBall.x, this.cueBall.y
    );
    this.shotPower = Math.min(distance * 1.2, this.maxPower);
    
    // Draw power bar
    if (this.powerIndicator) {
      this.powerIndicator.clear();
      const barWidth = 100;
      const barHeight = 8;
      const powerPercent = this.shotPower / this.maxPower;
      
      // Background
      this.powerIndicator.fillStyle(0x333333, 1);
      this.powerIndicator.fillRect(
        this.cueBall.x - barWidth / 2,
        this.cueBall.y - 50,
        barWidth,
        barHeight
      );
      
      // Power level
      const powerColor = powerPercent < 0.5 ? 0x00ff00 : (powerPercent < 0.8 ? 0xffff00 : 0xff0000);
      this.powerIndicator.fillStyle(powerColor, 1);
      this.powerIndicator.fillRect(
        this.cueBall.x - barWidth / 2,
        this.cueBall.y - 50,
        barWidth * powerPercent,
        barHeight
      );
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.isAiming || !this.cueBall || !this.cueBall.visible) return;
    
    this.isAiming = false;
    
    if (this.cue) {
      this.cue.destroy();
      this.cue = null;
    }
    
    if (this.cueStick) {
      this.cueStick.destroy();
      this.cueStick = null;
    }
    
    if (this.powerIndicator) {
      this.powerIndicator.destroy();
      this.powerIndicator = null;
    }
    
    // Shoot (only if canShoot is true)
    if (this.canShoot && this.shotPower > 5) {
      const angle = Phaser.Math.Angle.Between(
        this.cueBall.x, this.cueBall.y,
        pointer.worldX, pointer.worldY
      );
      
      const velocityMultiplier = 0.35;
      console.log(`[SHOT] Player ${this.currentPlayerTurn + 1} shot: Power=${this.shotPower.toFixed(1)}, Angle=${(Phaser.Math.RadToDeg(angle)).toFixed(1)}°`);
      this.cueBall.setVelocity(
        Math.cos(angle) * this.shotPower * velocityMultiplier,
        Math.sin(angle) * this.shotPower * velocityMultiplier
      );
      
      // Prevent shooting until balls stop
      this.canShoot = false;
    } else if (!this.canShoot) {
      console.log(`[SHOT] Blocked - balls are still moving`);
    } else {
      // Shot too weak, cancel it
      this.ballsHaveMoved = false;
    }
  }

  private updateMessage(text: string) {
    if (this.messageText) {
      this.messageText.setText(text);
      this.messageText.setVisible(!!text);
      
      if (text) {
        this.time.delayedCall(2000, () => {
          if (this.messageText?.text === text) {
            this.messageText.setVisible(false);
          }
        });
      }
    }
  }

  private switchTurn() {
    // Guard against uninitialized gameData
    if (!this.gameData || !this.gameData.players) {
      return;
    }

    const now = Date.now();
    if (now - this.lastTurnSwitchTime < 500) return;
    this.lastTurnSwitchTime = now;

    // Check for fouls first
    if (this.foulsThisTurn.length > 0) {
      console.log(`[TURN SWITCH] Fouls detected, switching turn`);
      // Fouls are already handled in handleFoul, just clean up
      this.foulsThisTurn = [];
    }

    // End turn cleanup - always reset state
    this.turnSwitchScheduled = false;
    this.ballsHaveMoved = false;
    this.firstBallHit = null;
    this.ballsPocketedThisTurn = [];
    this.foulsThisTurn = [];
    
    // Allow shooting for next turn
    this.canShoot = true;

    // Handle extra shots from fouls (ball-in-hand)
    if (this.extraShotsRemaining > 0) {
      this.extraShotsRemaining--;
      this.updatePlayerBallRacks();
      const playerName = this.gameData.players[this.currentPlayerTurn]?.username || `Player ${this.currentPlayerTurn + 1}`;
      this.updateMessage(`${playerName} has ball-in-hand!`);
      this.checkIfCurrentPlayerIsAI();
      return; // Continue current player's turn
    }

    // Determine if turn continues (pocketed legal ball)
    let continueTurn = false;
    let turnEndReason = 'switched';
    
    if (this.ballsPocketedThisTurn.length > 0) {
      const pocketedBall = this.ballsPocketedThisTurn[0];
      console.log(`[TURN LOGIC] Pocketed ball type: ${pocketedBall.type}, number: ${pocketedBall.number}`);

      // After break, determine groups
      if (this.gameType === 'break') {
        if (pocketedBall.type !== 'cue') {
          this.gameType = 'eightball';
          // Determine groups based on first ball pocketed
          const solidsPocketed = this.pocketedBalls.filter(b => b.type === 'solid').length;
          const stripesPocketed = this.pocketedBalls.filter(b => b.type === 'stripe').length;

          if (solidsPocketed > stripesPocketed) {
            this.playerGroups.player0 = 'solid';
            this.playerGroups.player1 = 'stripe';
            this.currentPlayerGroup = this.currentPlayerTurn === 0 ? 'solid' : 'stripe';
          } else {
            this.playerGroups.player0 = 'stripe';
            this.playerGroups.player1 = 'solid';
            this.currentPlayerGroup = this.currentPlayerTurn === 0 ? 'stripe' : 'solid';
          }

          const currentPlayer = this.gameData.players[this.currentPlayerTurn];
          const groupName = this.currentPlayerGroup === 'solid' ? 'Solids (1-7)' : 'Stripes (9-15)';
          this.updateMessage(`${currentPlayer.username} gets ${groupName}`);
          continueTurn = true; // Continue after break if any ball pocketed
          turnEndReason = 'continued (break)';
        }
      } else if (this.gameType === 'eightball') {
        // In 8-ball, must hit your ball first and pocket it to continue
        if (this.currentPlayerGroup && pocketedBall.type === this.currentPlayerGroup) {
          // 8-ball handling is done in handleEightBallPocketed, so this is a legal ball
          continueTurn = true;
          turnEndReason = 'continued (legal ball)';
        } else {
          turnEndReason = 'switched (wrong ball)';
        }
      }
    } else if (!this.firstBallHit && this.gameType === 'eightball') {
      // No balls pocketed AND no ball hit = foul (handled in update)
      turnEndReason = 'switched (no hit)';
    }

    console.log(`[TURN SWITCH] Player ${this.currentPlayerTurn + 1} turn ${turnEndReason}`);

    if (!continueTurn) {
      this.currentPlayerTurn = (this.currentPlayerTurn + 1) % 2;
      this.currentPlayerGroup = this.playerGroups[`player${this.currentPlayerTurn}` as keyof typeof this.playerGroups] || null;
      this.extraShotsRemaining = 0; // Reset extra shots when turn changes
    }

    this.updateTurnIndicator();
    this.updatePlayerBallRacks();
    this.checkIfCurrentPlayerIsAI();
  }

  private updateTurnIndicator() {
    if (!this.turnText || !this.gameData || !this.gameData.players) return;

    const currentPlayer = this.gameData.players[this.currentPlayerTurn];
    if (!currentPlayer) return;

    const isCurrentUser = currentPlayer.userId === this.gameData.currentUserId;
    const extraShotsText = this.extraShotsRemaining > 0 ? ` (Extra Shots: ${this.extraShotsRemaining})` : '';

    this.turnText.setText(`${currentPlayer.username}'s Turn${extraShotsText}`);
    this.turnText.setColor(isCurrentUser ? '#00ff00' : '#ff6600');
  }

  private checkIfCurrentPlayerIsAI() {
    if (!this.gameData || !this.gameData.players) return;

    const currentPlayer = this.gameData.players[this.currentPlayerTurn];
    if (!currentPlayer) return;

    const isCurrentUser = currentPlayer.userId === this.gameData.currentUserId;
    this.isAIPlayer = !isCurrentUser;

    if (this.isAIPlayer && !this.gameOver && this.gameStarted) {
      this.handleAITurn();
    } else if (!this.isAIPlayer) {
      this.handleHumanTurn();
    }
  }

  private handleHumanTurn() {
    // Zoom in closer for human player
    this.cameras.main.zoomTo(1.2, 500, 'Linear');
    this.updateMessage('Your turn! Aim and shoot.');
  }

  private handleAITurn() {
    if (this.aiThinking) return;

    this.aiThinking = true;
    this.updateMessage('AI is thinking...');

    // Zoom out for AI turn
    this.cameras.main.zoomTo(0.8, 500, 'Linear');

    // Delay AI shot for realism
    this.time.delayedCall(2000, () => {
      this.executeAIShot();
    });
  }

  private executeAIShot() {
    if (!this.cueBall || !this.cueBall.active || this.gameOver) {
      this.aiThinking = false;
      return;
    }

    // Enhanced AI logic: aim at best pocket with strategic shot selection
    const bestShot = this.findBestAIShot();
    if (!bestShot) {
      // If no good shot, try defensive shot, otherwise random shot
      if (!this.executeDefensiveShot()) {
        this.executeRandomShot();
      }
      return;
    }

    // Calculate shot direction with cut angle consideration
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      bestShot.targetX, bestShot.targetY
    );

    // Adjust randomness and accuracy based on difficulty
    let angleVariation = 0.3; // Default medium
    let powerVariation = 0.4;
    let basePower = 0.8;

    switch (this.aiDifficulty) {
      case 'easy':
        angleVariation = 0.6; // More random
        powerVariation = 0.6;
        basePower = 0.6;
        break;
      case 'hard':
        angleVariation = 0.08; // More accurate
        powerVariation = 0.15;
        basePower = 0.95;
        break;
      case 'medium':
      default:
        // Keep default values
        break;
    }

    // Add randomness based on difficulty
    const randomAngle = angle + (Math.random() - 0.5) * angleVariation;
    const power = Math.min(basePower + Math.random() * powerVariation, 1.0);
    const aiVelocityMultiplier = 0.35; // Increased from 0.15 for more power

    // Execute the shot
    console.log(`[AI SHOT DEBUG] Difficulty: ${this.aiDifficulty}, Power: ${power.toFixed(2)}, Velocity: ${(power * aiVelocityMultiplier * 150).toFixed(1)}`);
    this.cueBall.setVelocity(
      Math.cos(randomAngle) * power * aiVelocityMultiplier * 150,
      Math.sin(randomAngle) * power * aiVelocityMultiplier * 150
    );

    this.updateMessage(`AI (${this.aiDifficulty}) ${bestShot.isSafe ? 'plays safe' : 'shoots!'}`);
    this.aiThinking = false;
    this.ballsHaveMoved = true;
  }

  private findBestAIShot(): { targetX: number; targetY: number; isSafe: boolean } | null {
    if (!this.currentPlayerGroup || !this.cueBall) return null;

    const cueBall = this.cueBall;
    const targetBalls = this.balls.filter(ball => {
      const ballType = ball.getData('type');
      return ball.active && !ball.getData('pocketed') && ballType === this.currentPlayerGroup;
    });

    if (targetBalls.length === 0) return null;

    let bestShot: { targetX: number; targetY: number; score: number; isSafe: boolean } | null = null;

    // Evaluate each target ball and pocket combination
    for (const ball of targetBalls) {
      // Find best pocket for this ball
      const bestPocket = this.findBestPocketForBall(ball);
      if (!bestPocket) continue;

      // Calculate shot quality
      const shotQuality = this.calculateShotQuality(cueBall, ball, bestPocket);
      
      // Add some randomness to shot selection based on difficulty
      const difficultyModifier = this.getDifficultyShotModifier();
      const adjustedScore = shotQuality.score * difficultyModifier;

      if (!bestShot || adjustedScore > bestShot.score) {
        bestShot = {
          targetX: ball.x,
          targetY: ball.y,
          score: adjustedScore,
          isSafe: shotQuality.isSafe
        };
      }
    }

    return bestShot;
  }

  private findBestPocketForBall(ball: Phaser.Physics.Matter.Sprite): { x: number; y: number } | null {
    let bestPocket: { x: number; y: number } | null = null;
    let bestScore = -Infinity;

    for (const pocket of this.pocketPositions) {
      // Calculate distance from ball to pocket
      const distance = Phaser.Math.Distance.Between(ball.x, ball.y, pocket.x, pocket.y);
      
      // Check if path is clear (simplified line of sight)
      const isPathClear = this.isPathClear(ball, pocket);
      
      if (!isPathClear) continue;

      // Score based on proximity (closer is better) and angle
      const score = 1000 / distance + (isPathClear ? 50 : 0);

      if (score > bestScore) {
        bestScore = score;
        bestPocket = pocket;
      }
    }

    return bestPocket;
  }

  private isPathClear(ball: Phaser.Physics.Matter.Sprite, target: { x: number; y: number }): boolean {
    // Simplified path checking - check if any ball is blocking the path
    const pathLine = new Phaser.Geom.Line(ball.x, ball.y, target.x, target.y);
    const blockageThreshold = 40;

    for (const otherBall of this.balls) {
      if (otherBall === ball || !otherBall.active || otherBall.getData('pocketed')) continue;
      
      // Use blockageThreshold for the blocking ball's radius check
      if (Phaser.Geom.Intersects.LineToCircle(pathLine,
        new Phaser.Geom.Circle(otherBall.x, otherBall.y, blockageThreshold / 2))) {
        return false;
      }
    }

    return true;
  }

  private calculateShotQuality(cueBall: Phaser.Physics.Matter.Sprite, targetBall: Phaser.Physics.Matter.Sprite, pocket: { x: number; y: number }): { score: number; isSafe: boolean } {
    // Calculate if the shot is safe (no chance of scratching)
    const cueToTargetDist = Phaser.Math.Distance.Between(cueBall.x, cueBall.y, targetBall.x, targetBall.y);
    const targetToPocketDist = Phaser.Math.Distance.Between(targetBall.x, targetBall.y, pocket.x, pocket.y);
    
    // Check if cue ball could easily go into pocket
    const cueToPocketDist = Phaser.Math.Distance.Between(cueBall.x, cueBall.y, pocket.x, pocket.y);
    const isRiskyShot = cueToPocketDist < cueToTargetDist * 1.5;
    
    // Calculate cut angle (how straight the shot is)
    const angleToTarget = Phaser.Math.Angle.Between(cueBall.x, cueBall.y, targetBall.x, targetBall.y);
    const angleToPocket = Phaser.Math.Angle.Between(targetBall.x, targetBall.y, pocket.x, pocket.y);
    const cutAngle = Phaser.Math.Angle.Wrap(angleToPocket - angleToTarget + Math.PI);
    
    // Lower cut angle means easier shot
    const cutAngleDegrees = Phaser.Math.RadToDeg(cutAngle);
    const isEasierShot = cutAngleDegrees < 30;

    // Score based on multiple factors
    let score = 0;
    score += (10 - cueToTargetDist / 50) * 10; // Prefer closer balls
    score += (10 - targetToPocketDist / 50) * 10; // Prefer balls closer to pockets
    score += isEasierShot ? 30 : 0; // Bonus for easier cut angles
    score += !isRiskyShot ? 20 : -20; // Penalty for risky shots
    score += Math.random() * 10; // Add some randomness

    return {
      score: Math.max(0, score),
      isSafe: !isRiskyShot && isEasierShot
    };
  }

  private getDifficultyShotModifier(): number {
    // Add variation to shot selection based on difficulty
    switch (this.aiDifficulty) {
      case 'easy':
        return 0.7 + Math.random() * 0.6; // 0.7 - 1.3
      case 'hard':
        return 0.95 + Math.random() * 0.1; // 0.95 - 1.05
      case 'medium':
      default:
        return 0.85 + Math.random() * 0.3; // 0.85 - 1.15
    }
  }

  private executeDefensiveShot(): boolean {
    if (!this.cueBall) return false;

    // Defensive shot: hit the cue ball away from opponent's balls and towards center
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    
    // Aim towards center of table
    const centerX = (feltLeft + feltRight) / 2;
    const centerY = (feltTop + feltBottom) / 2;
    
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      centerX, centerY
    );

    // Add some randomness
    const randomAngle = angle + (Math.random() - 0.5) * 0.5;
    const power = 0.4 + Math.random() * 0.4;

    this.cueBall.setVelocity(
      Math.cos(randomAngle) * power * 150,
      Math.sin(randomAngle) * power * 150
    );

    this.updateMessage('AI plays defensive!');
    this.aiThinking = false;
    this.ballsHaveMoved = true;
    return true;
  }

  private executeRandomShot() {
    if (!this.cueBall) return;

    // Random direction and power
    const randomAngle = Math.random() * Math.PI * 2;
    const power = 0.5 + Math.random() * 0.5;

    this.cueBall.setVelocity(
      Math.cos(randomAngle) * power * 150,
      Math.sin(randomAngle) * power * 150
    );

    this.updateMessage('AI shoots randomly!');
    this.aiThinking = false;
    this.ballsHaveMoved = true;
  }

  private endGame(winnerTurn: number, result: 'win' | 'lose') {
    if (!this.gameData || !this.gameData.players) return;
    
    this.gameOver = true;
    this.gameStarted = false;
    
    const winner = this.gameData.players[winnerTurn];
    const loser = this.gameData.players[(winnerTurn + 1) % 2];
    
    const resultText = result === 'win' ? 'WINS!' : 'LOSES';
    const reasonText = result === 'lose' ? '(8-ball pocketed early)' : '';
    
    this.turnText?.setText('');
    
    // Game over message
    this.add.text(this.scale.width / 2, this.scale.height / 2 - 80, 'GAME OVER', {
      fontSize: '48px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: '#00000080',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, `${winner.username} ${resultText}`, {
      fontSize: '32px',
      color: result === 'win' ? '#00ff00' : '#ff0000'
    }).setOrigin(0.5);
    
    // Display loser information
    this.add.text(this.scale.width / 2, this.scale.height / 2 + 30, `${loser.username} ${reasonText}`, {
      fontSize: '20px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    
    this.updateScore();
  }

  private updateScore() {
    // Count balls pocketed by each player
    const p0Solids = this.pocketedBalls.filter(b => b.player === 0 && b.type === 'solid').length;
    const p0Stripes = this.pocketedBalls.filter(b => b.player === 0 && b.type === 'stripe').length;
    
    if (this.scoreText) {
      this.scoreText.setText(`P1: ${p0Solids + p0Stripes}  P2: ${7 - p0Solids + 7 - p0Stripes}`);
    }
  }

  update() {
    this.frameCount++;
    
    // Boundary validation every 5 frames
    if (this.frameCount % 5 === 0) {
      this.validateBoundaries();
    }
    
    // Pocket detection every 3 frames
    if (this.frameCount % 3 === 0) {
      this.checkPockets();
    }
    
    // Turn management - improved velocity threshold logic
    if (this.cueBall && this.cueBall.active && this.ballsHaveMoved && !this.turnSwitchScheduled) {
      const allBallsStopped = this.checkAllBallsStopped();
      
      if (allBallsStopped) {
        // Check for foul if no ball was hit (only in 8-ball mode after break)
        if (!this.firstBallHit && this.gameType === 'eightball') {
          console.log(`[FOUL] Player ${this.currentPlayerTurn + 1} committed FOUL - no ball hit`);
          this.foulsThisTurn.push('no_ball_hit');
          this.handleFoul(['no_ball_hit']);
        }
        
        this.turnSwitchScheduled = true;
        this.time.delayedCall(1000, () => {
          if (this.gameStarted && !this.gameOver) {
            this.switchTurn();
          } else {
            this.turnSwitchScheduled = false;
          }
        });
      }
    }
  }

  private checkAllBallsStopped(): boolean {
    // Check if all active balls have stopped moving (using velocity threshold)
    const activeBalls = this.balls.filter(ball => ball.active && !ball.getData('pocketed'));
    
    return activeBalls.every(ball => {
      if (!ball.body || !ball.body.velocity) return true;
      
      const vx = Math.abs(ball.body.velocity.x);
      const vy = Math.abs(ball.body.velocity.y);
      
      return vx < this.STOP_THRESHOLD && vy < this.STOP_THRESHOLD;
    });
  }

  private validateBoundaries() {
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    const ballRadius = 18;
    
    this.balls.forEach(ball => {
      if (!ball.active || ball.getData('pocketed')) return;
      
      let x = ball.x;
      let y = ball.y;
      let reposition = false;
      
      if (x < feltLeft + ballRadius) {
        x = feltLeft + ballRadius;
        reposition = true;
      }
      if (x > feltRight - ballRadius) {
        x = feltRight - ballRadius;
        reposition = true;
      }
      if (y < feltTop + ballRadius) {
        y = feltTop + ballRadius;
        reposition = true;
      }
      if (y > feltBottom - ballRadius) {
        y = feltBottom - ballRadius;
        reposition = true;
      }
      
      if (reposition) {
        ball.setPosition(x, y);
        ball.setVelocity(0, 0);
      }
    });
  }

  private checkPockets() {
    if (this.gameOver) return;

    const pocketRadius = 25; // Increased radius for more reliable pocketing
    const pocketRadiusSq = pocketRadius ** 2;

    this.balls.forEach(ball => {
      if (!ball.active || ball.getData('pocketed')) return;

      const ballX = ball.x;
      const ballY = ball.y;
      const ballType = ball.getData('type');

      for (const pocket of this.pocketPositions) {
        const dx = ballX - pocket.x;
        const dy = ballY - pocket.y;
        const distanceSq = dx * dx + dy * dy;

        // Check if ball is close enough to pocket (removed speed restriction for more reliable pocketing)
        if (distanceSq < pocketRadiusSq) {
          // Handle cue ball pocketing (foul)
          if (ball.getData('type') === 'cue') {
            this.handleCueBallPocketed(ball);
            break;
          }

          // Ball pocketed - add visual effect
          this.createPocketingEffect(pocket.x, pocket.y);

          ball.setData('pocketed', true);
          ball.setActive(false);
          ball.setVisible(false);
          ball.setVelocity(0, 0);

          const ballNumber = ball.getData('number');

          this.ballsPocketedThisTurn.push({ number: ballNumber, type: ballType });
          this.pocketedBalls.push({ number: ballNumber, type: ballType, player: this.currentPlayerTurn });
          this.updatePortedBallsDisplay();

          // Update message
          const currentPlayer = this.gameData?.players?.[this.currentPlayerTurn];
          if (currentPlayer) {
            this.updateMessage(`${currentPlayer.username} pocketed ${ballType === 'solid' ? 'a solid' : ballType === 'stripe' ? 'a stripe' : 'the 8-ball'}!`);
          }

          if (ball.getData('type') === 'solid') this.ballsRemaining.solid--;
          if (ball.getData('type') === 'stripe') this.ballsRemaining.stripe--;

          if (ball.getData('type') === 'eight') {
            this.handleEightBallPocketed();
          }
          break;
        }
      }
    });
  }

  private createPocketingEffect(x: number, y: number) {
    // Create a small explosion/particle effect using graphics
    const particleCount = 12;
    const colors = [0xffd700, 0xff0000, 0x00ff00, 0x0000ff, 0xff00ff];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 50 + Math.random() * 50;
      const life = 300 + Math.random() * 200;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(x, y, 3);
      
      // Animate particle
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: life,
        onComplete: () => {
          if (particle && particle.active) {
            particle.destroy();
          }
        }
      });
    }
  }
}

export default PoolGame;