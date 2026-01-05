import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
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

  const [gameStarted, setGameStarted] = useState(false);


  // Find the current game from context
  const currentGame = activeGames.find(g => g.id === Number(gameId));

  useEffect(() => {
    console.log('PoolGame useEffect triggered');
    console.log('currentGame:', currentGame);
    console.log('authState.user:', authState.user);
    console.log('activeGames:', activeGames);

    if (!currentGame) {
      console.warn('No current game found!');
      return;
    }

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

  // Start the Phaser game
  const startPhaserGame = () => {
    console.log('startPhaserGame called');
    console.log('gameRef.current:', gameRef.current);
    console.log('currentGame:', currentGame);

    if (!gameRef.current || !currentGame) {
      console.error('Cannot start game: missing gameRef or currentGame');
      return;
    }

    try {
      setGameStarted(true);
      setGameState(prev => ({ ...prev, status: 'in_progress' }));

      // Game configuration
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: gameRef.current.clientWidth,
        height: gameRef.current.clientHeight,
        parent: gameRef.current,
        backgroundColor: '#2e7d32',
        physics: {
          default: 'matter',
          matter: {
            gravity: { y: 0, x: 0 },
            debug: true // Show physics debug for development
          }
        },
        scene: [PoolGameScene]
      };

      console.log('Creating Phaser game with config:', config);

      // Create Phaser game instance
      phaserGameRef.current = new Phaser.Game(config);
      console.log('Phaser game created successfully');

      // Pass game data to the scene
      if (phaserGameRef.current && phaserGameRef.current.scene.scenes.length > 0) {
        const scene = phaserGameRef.current.scene.scenes[0] as any;
        scene.gameData = {
          gameId: currentGame.id,
          players: gameState.players,
          currentUserId: authState.user?.id,
          gameType: currentGame.game_type
        };
        console.log('Game data passed to scene successfully:', scene.gameData);
      } else {
        console.error('Failed to access game scene');
      }
    } catch (error) {
      console.error('Failed to start Phaser game:', error);
      setGameStarted(false);
      setGameState(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleForfeit = () => {
    if (window.confirm('Are you sure you want to forfeit this game?')) {
      // TODO: Implement forfeit logic
      console.log('Game forfeited');
      navigate('/games');
    }
  };

  const handlePause = () => {
    // TODO: Implement pause logic
    console.log('Game paused');
  };

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
    <div className="pool-game-container">
      {/* Game Header */}
      <div className="pool-game-header">
        <h2 className="pool-game-title">8 Ball Pool - {currentGame.game_code}</h2>
        <div className="pool-game-status">
          Status: {gameState.status} | Stake: ${currentGame.stake_amount}
        </div>
      </div>

      {/* Game Container */}
      <div
        ref={gameRef}
        className="w-full h-screen bg-green-700 relative"
        style={{ backgroundColor: '#2e7d32' }}
      >
        {/* Game Instructions Overlay */}
        {!gameStarted && gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 text-center max-w-md">
              <h3 className="text-xl font-bold mb-4">🎱 8-Ball Pool</h3>
              <div className="text-left space-y-2 text-sm">
                <p><strong>How to Play:</strong></p>
                <p>• Click near the white cue ball to aim</p>
                <p>• Drag back to set shot power</p>
                <p>• Release to shoot</p>
                <p>• First shot breaks the rack</p>
                <p>• Clear your group (solids/stripes), then pocket the 8-ball!</p>
              </div>
              <p className="mt-4 text-xs text-gray-600">
                💡 Tip: The cue stick appears when you click near the white ball
              </p>
            </div>
          </div>
        )}

        {/* Turn Indicator Overlay */}
        {gameStarted && gameState.status === 'in_progress' && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg z-10">
            <p className="font-bold">🎯 Your Turn</p>
            <p className="text-sm">Click near the white ball to aim</p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  // Test shot button for debugging
                  const scene = phaserGameRef.current?.scene.scenes[0] as any;
                  if (scene && scene.cueBall) {
                    scene.cueBall.setVelocity(5, 0); // Simple test shot
                    console.log('Test shot fired!');
                  }
                }}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
              >
                Test Shot
              </button>
              <button
                onClick={() => {
                  // Manual pocket test button
                  const scene = phaserGameRef.current?.scene.scenes[0] as any;
                  if (scene) {
                    console.log('=== MANUAL POCKET TEST ===');
                    console.log('Balls:', scene.balls?.length || 0);
                    console.log('Pockets:', scene.pockets?.length || 0);
                    
                    // Test if balls can be manually pocketed
                    const testBall = scene.balls?.find((ball: any) =>
                      ball.getData('type') !== 'cue' && ball.active
                    );
                    
                    if (testBall) {
                      console.log('Manually pocketing ball:', testBall.getData('number'));
                      testBall.setVelocity(0, 0);
                      testBall.setPosition(scene.scale.width * 0.5, scene.scale.height * 0.5);
                      scene.handleBallPocketed(testBall);
                    } else {
                      console.log('No active balls found to test!');
                    }
                  }
                }}
                className="px-2 py-1 bg-red-600 text-white text-xs rounded"
              >
                Manual Pocket Test
              </button>
              <button
                onClick={() => {
                  // Aggressive pocket positioning test
                  const scene = phaserGameRef.current?.scene.scenes[0] as any;
                  if (scene) {
                    console.log('=== AGGRESSIVE POCKET POSITION TEST ===');
                    
                    // Get the first non-cue ball and move it near a pocket
                    const testBall = scene.balls?.find((ball: any) =>
                      ball.getData('type') !== 'cue' && ball.active
                    );
                    
                    if (testBall) {
                      console.log('Moving ball near pocket for distance detection...');
                      // Position ball very close to top-left pocket
                      const pocketX = scene.scale.width * 0.18;
                      const pocketY = scene.scale.height * 0.22;
                      
                      testBall.setVelocity(0, 0);
                      testBall.setPosition(pocketX + 25, pocketY + 25);
                      
                      console.log(`Ball positioned at: (${pocketX + 25}, ${pocketY + 25})`);
                      console.log('This should trigger aggressive pocket detection within 30 pixels!');
                    } else {
                      console.log('No active balls found to test!');
                    }
                  }
                }}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded"
              >
                Aggressive Pocket Test
              </button>
            </div>
          </div>
        )}

        {/* Game Canvas will go here */}
        {!gameStarted && (
          <div className="pool-game-loading">
            <div className="pool-loading-content">
              <h3 className="text-2xl mb-4">8-Ball Pool Loading...</h3>
              <p>Game Type: {currentGame.game_type}</p>
              <p>Players: {gameState.players.length}/2</p>
              {gameState.players.map((player: any) => (
                <div key={player.userId} className={`mt-2 ${player.isCurrentUser ? 'pool-player-current' : 'pool-player-info'}`}>
                  {player.username} {player.isCurrentUser && '(You)'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="pool-game-controls">
        <div className="pool-control-panel">
          <div className="text-white text-center">
            {gameState.status === 'ready' && !gameStarted && (
              <button
                className="pool-control-button"
                onClick={startPhaserGame}
                disabled={gameState.players.length < 2}
              >
                Start Game
              </button>
            )}

            {gameStarted && (
              <div className="flex justify-center space-x-4">
                <button
                  className="pool-control-button-danger"
                  onClick={handleForfeit}
                >
                  Forfeit
                </button>
                <button
                  className="pool-control-button-secondary"
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

// Pool Game Scene with Phaser - Realistic Implementation
class PoolGameScene extends Phaser.Scene {
  private gameData: any;
  private cueBall: Phaser.Physics.Matter.Sprite | null = null;
  private balls: Phaser.Physics.Matter.Sprite[] = [];
  private pockets: Phaser.GameObjects.Rectangle[] = [];
  private cue: Phaser.GameObjects.Line | null = null;
  private cueStick: Phaser.GameObjects.Image | null = null;
  private powerIndicator: Phaser.GameObjects.Rectangle | null = null;
  private powerText: Phaser.GameObjects.Text | null = null;
  private isAiming = false;
  private shotPower = 0;
  private maxPower = 100;
  private currentPlayerTurn = 0;
  private gameStarted = false;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private turnText: Phaser.GameObjects.Text | null = null;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private pocketedBallsDisplay: Phaser.GameObjects.Container | null = null;
  private pocketedBalls: { number: number; type: string }[] = [];
  private gameType: 'eightball' | 'none' = 'none';
  private playerGroups: { player1: 'solid' | 'stripe' | null, player2: 'solid' | 'stripe' | null } = { player1: null, player2: null };
  private currentPlayerGroup: 'solid' | 'stripe' | null = null;
  private ballsRemaining: { solid: number, stripe: number, eight: number } = { solid: 7, stripe: 7, eight: 1 };
  private firstHitBall: Phaser.Physics.Matter.Sprite | null = null;
  private ballsPocketedThisTurn: Phaser.Physics.Matter.Sprite[] = [];
  private pocketPositions: { x: number, y: number }[] | null = null;
  
  // Performance optimization flags
  private turnSwitchScheduled = false;
  private ballsHaveMovedSinceLastTurn = false;
  private lastTurnSwitchTime = 0;

  // Table dimensions for consistent boundaries
  private tableBounds = { left: 0, right: 0, top: 0, bottom: 0, feltLeft: 0, feltRight: 0, feltTop: 0, feltBottom: 0 };

  constructor() {
    super({ key: 'PoolGameScene' });
  }

  init(data: any) {
    this.gameData = data;
  }

  preload() {
    // No external assets needed - all graphics created programmatically
  }

  create() {
    // Create realistic pool table
    this.createRealisticPoolTable();
    
    // Create 3D pockets
    this.createRealisticPockets();
    
    // Create balls with proper numbering
    this.createNumberedBalls();
    
    // Setup input
    this.setupInput();
    
    // Create UI (minimal - only essential elements)
    this.createMinimalUI();
    
    // Start game
    this.currentPlayerTurn = 0;
    this.gameStarted = true;
    
    // Setup event listeners
    this.setupEventListeners();
  }

  private createRealisticPoolTable() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Calculate table dimensions - smaller and centered
    const tableWidth = Math.min(w * 0.9, 900);
    const tableHeight = tableWidth * 0.55; // Standard pool table ratio
    const tableX = (w - tableWidth) / 2;
    const tableY = (h - tableHeight) / 2;
    
    // Store table bounds for physics
    this.tableBounds = {
      left: tableX,
      right: tableX + tableWidth,
      top: tableY,
      bottom: tableY + tableHeight,
      feltLeft: tableX + 40,
      feltRight: tableX + tableWidth - 40,
      feltTop: tableY + 40,
      feltBottom: tableY + tableHeight - 40
    };

    // Background (room floor)
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x1a1a2e, 1);
    bgGraphics.fillRect(0, 0, w, h);

    // Wood frame - realistic gradient effect with multiple layers
    const frameGraphics = this.add.graphics();
    
    // Outer dark wood
    frameGraphics.fillStyle(0x2d1f0f, 1);
    frameGraphics.fillRoundedRect(tableX - 30, tableY - 30, tableWidth + 60, tableHeight + 60, 20);
    
    // Middle wood layer
    frameGraphics.fillStyle(0x3d2a15, 1);
    frameGraphics.fillRoundedRect(tableX - 15, tableY - 15, tableWidth + 30, tableHeight + 30, 15);
    
    // Inner wood (frame face)
    frameGraphics.fillStyle(0x4a3520, 1);
    frameGraphics.fillRoundedRect(tableX, tableY, tableWidth, tableHeight, 10);

    // Rails (cushions) - green rubber with wood trim
    const railGraphics = this.add.graphics();
    
    // Top rail
    railGraphics.fillStyle(0x1e5f1e, 1); // Darker green for rail
    railGraphics.fillRect(tableX + 30, tableY + 20, tableWidth - 60, 25);
    // Top rail wood trim
    railGraphics.fillStyle(0x5a4025, 1);
    railGraphics.fillRect(tableX + 25, tableY + 15, tableWidth - 50, 8);
    
    // Bottom rail
    railGraphics.fillStyle(0x1e5f1e, 1);
    railGraphics.fillRect(tableX + 30, tableY + tableHeight - 45, tableWidth - 60, 25);
    // Bottom rail wood trim
    railGraphics.fillStyle(0x5a4025, 1);
    railGraphics.fillRect(tableX + 25, tableY + tableHeight - 23, tableWidth - 50, 8);
    
    // Left rail
    railGraphics.fillStyle(0x1e5f1e, 1);
    railGraphics.fillRect(tableX + 20, tableY + 30, 25, tableHeight - 60);
    // Left rail wood trim
    railGraphics.fillStyle(0x5a4025, 1);
    railGraphics.fillRect(tableX + 15, tableY + 25, 8, tableHeight - 50);
    
    // Right rail
    railGraphics.fillStyle(0x1e5f1e, 1);
    railGraphics.fillRect(tableX + tableWidth - 45, tableY + 30, 25, tableHeight - 60);
    // Right rail wood trim
    railGraphics.fillStyle(0x5a4025, 1);
    railGraphics.fillRect(tableX + tableWidth - 23, tableY + 25, 8, tableHeight - 50);

    // Felt playing surface
    const feltGraphics = this.add.graphics();
    
    // Base felt color
    feltGraphics.fillStyle(0x0d6b0d, 1);
    feltGraphics.fillRect(tableX + 40, tableY + 40, tableWidth - 80, tableHeight - 80);
    
    // Add subtle texture lines
    feltGraphics.lineStyle(1, 0x0a5a0a, 0.3);
    for (let i = 0; i < 20; i++) {
      const lineY = tableY + 45 + i * ((tableHeight - 90) / 20);
      feltGraphics.lineBetween(tableX + 40, lineY, tableX + tableWidth - 40, lineY);
    }

    // Diamond markers - realistic gold gems
    this.createDiamondMarkers(tableX, tableY, tableWidth, tableHeight);

    // Create physics walls - aligned with rail inner edges
    this.createRealisticWalls(tableX, tableY, tableWidth, tableHeight);
  }

  private createDiamondMarkers(tableX: number, tableY: number, tableWidth: number, tableHeight: number) {
    const markerGraphics = this.add.graphics();
    const markerColor = 0xd4af37; // Gold
    
    // Top markers
    const topY = tableY + 32;
    const topPositions = [0.15, 0.35, 0.5, 0.65, 0.85];
    topPositions.forEach(pos => {
      const x = tableX + pos * tableWidth;
      // Gold bezel
      markerGraphics.fillStyle(0x8b7355, 1);
      markerGraphics.fillCircle(x, topY, 8);
      // Gold gem
      markerGraphics.fillStyle(markerColor, 1);
      markerGraphics.fillCircle(x, topY, 5);
    });
    
    // Bottom markers
    const bottomY = tableY + tableHeight - 32;
    topPositions.forEach(pos => {
      const x = tableX + pos * tableWidth;
      // Gold bezel
      markerGraphics.fillStyle(0x8b7355, 1);
      markerGraphics.fillCircle(x, bottomY, 8);
      // Gold gem
      markerGraphics.fillStyle(markerColor, 1);
      markerGraphics.fillCircle(x, bottomY, 5);
    });
  }

  private createRealisticWalls(tableX: number, tableY: number, tableWidth: number, tableHeight: number) {
    const wallThickness = 12;
    
    // Top wall
    this.matter.add.rectangle(
      tableX + tableWidth / 2,
      tableY + 32,
      tableWidth - 80,
      wallThickness,
      { isStatic: true, restitution: 0.9, friction: 0.05, label: 'table-wall' }
    );
    
    // Bottom wall
    this.matter.add.rectangle(
      tableX + tableWidth / 2,
      tableY + tableHeight - 32,
      tableWidth - 80,
      wallThickness,
      { isStatic: true, restitution: 0.9, friction: 0.05, label: 'table-wall' }
    );
    
    // Left wall
    this.matter.add.rectangle(
      tableX + 32,
      tableY + tableHeight / 2,
      wallThickness,
      tableHeight - 80,
      { isStatic: true, restitution: 0.9, friction: 0.05, label: 'table-wall' }
    );
    
    // Right wall
    this.matter.add.rectangle(
      tableX + tableWidth - 32,
      tableY + tableHeight / 2,
      wallThickness,
      tableHeight - 80,
      { isStatic: true, restitution: 0.9, friction: 0.05, label: 'table-wall' }
    );
  }

  private createRealisticPockets() {
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    const cornerRadius = 22;
    const sideRadius = 18;
    
    // Pocket positions - 6 pockets
    const pocketPositions = [
      { x: feltLeft, y: feltTop, radius: cornerRadius },          // Top-left
      { x: (feltLeft + feltRight) / 2, y: feltTop - 5, radius: sideRadius },  // Top-center
      { x: feltRight, y: feltTop, radius: cornerRadius },         // Top-right
      { x: feltLeft, y: feltBottom, radius: cornerRadius },       // Bottom-left
      { x: (feltLeft + feltRight) / 2, y: feltBottom + 5, radius: sideRadius }, // Bottom-center
      { x: feltRight, y: feltBottom, radius: cornerRadius }       // Bottom-right
    ];

    pocketPositions.forEach((pos, index) => {
      // Create 3D pocket effect with depth
      const pocketGraphics = this.add.graphics();
      
      // Outer shadow/bezel
      pocketGraphics.fillStyle(0x1a1a1a, 1);
      pocketGraphics.fillCircle(pos.x, pos.y, pos.radius + 4);
      
      // Pocket interior (dark depth)
      pocketGraphics.fillStyle(0x0a0a0a, 1);
      pocketGraphics.fillCircle(pos.x, pos.y, pos.radius);
      
      // Inner shadow for depth effect
      pocketGraphics.fillStyle(0x000000, 1);
      pocketGraphics.fillCircle(pos.x, pos.y, pos.radius - 3);
      
      // Physics sensor - slightly smaller than visual pocket
      this.matter.add.circle(pos.x, pos.y, pos.radius * 0.8, {
        isSensor: true,
        label: `pocket-${index}`,
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001,
          group: 0
        }
      });
      
      (this.pockets as any).push(pocketGraphics);
    });
  }

  private createNumberedBalls() {
    const ballRadius = 16; // Slightly smaller balls
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    
    // Cue ball position - left side of table
    const cueBallX = feltLeft + 200;
    const cueBallY = (feltTop + feltBottom) / 2;
    
    // Create cue ball with realistic appearance
    const cueBallGraphics = this.add.graphics();
    
    // Shadow
    cueBallGraphics.fillStyle(0x000000, 0.2);
    cueBallGraphics.fillCircle(3, 3, ballRadius);
    
    // Main ball - white
    cueBallGraphics.fillStyle(0xffffff, 1);
    cueBallGraphics.fillCircle(0, 0, ballRadius);
    
    // Subtle gradient effect (concentric circles)
    cueBallGraphics.fillStyle(0xf5f5f5, 0.5);
    cueBallGraphics.fillCircle(0, 0, ballRadius - 2);
    
    // Highlight
    cueBallGraphics.fillStyle(0xffffff, 0.8);
    cueBallGraphics.fillCircle(-5, -5, ballRadius / 3);
    
    // Border
    cueBallGraphics.lineStyle(1, 0xcccccc, 1);
    cueBallGraphics.strokeCircle(0, 0, ballRadius);
    
    const cueBallTexture = cueBallGraphics.generateTexture('cueBallTex', ballRadius * 2 + 6, ballRadius * 2 + 6);
    cueBallGraphics.destroy();

    const cueBall = this.matter.add.image(cueBallX, cueBallY, 'cueBallTex') as Phaser.Physics.Matter.Sprite;
    cueBall.setCircle(ballRadius);
    cueBall.setFriction(0.02);
    cueBall.setFrictionAir(0.015);
    cueBall.setBounce(0.8);
    cueBall.setCollisionCategory(0x0001);
    cueBall.setCollidesWith(0x0001);
    cueBall.setData('type', 'cue');
    cueBall.setData('number', 0);
    cueBall.setInteractive({ useHandCursor: true });

    this.cueBall = cueBall;
    this.balls.push(cueBall);

    // Ball rack position
    const rackX = feltRight - 250;
    const rackY = (feltTop + feltBottom) / 2;

    // Standard 8-ball pool balls with proper colors and numbers
    // Solids: 1(Yellow), 2(Blue), 3(Red), 4(Purple), 5(Orange), 6(Green), 7(Maroon)
    // 8: Black
    // Stripes: 9-15 (same colors as solids but with white stripe)
    const ballConfigs = [
      { number: 1, type: 'solid', color: 0xffd700 },   // Yellow
      { number: 9, type: 'stripe', color: 0xffd700 },  // Yellow stripe
      { number: 2, type: 'solid', color: 0x0000ff },   // Blue
      { number: 10, type: 'stripe', color: 0x0000ff }, // Blue stripe
      { number: 3, type: 'solid', color: 0xff0000 },   // Red
      { number: 11, type: 'stripe', color: 0xff0000 }, // Red stripe
      { number: 4, type: 'solid', color: 0x800080 },   // Purple
      { number: 12, type: 'stripe', color: 0x800080 }, // Purple stripe
      { number: 5, type: 'solid', color: 0xff6600 },   // Orange
      { number: 13, type: 'stripe', color: 0xff6600 }, // Orange stripe
      { number: 6, type: 'solid', color: 0x008000 },   // Green
      { number: 14, type: 'stripe', color: 0x008000 }, // Green stripe
      { number: 7, type: 'solid', color: 0x800000 },   // Maroon
      { number: 15, type: 'stripe', color: 0x800000 }, // Maroon stripe
      { number: 8, type: 'eight', color: 0x000000 }    // Black 8-ball
    ];

    // Generate triangular rack positions
    const rackPositions = this.getRackPositions(rackX, rackY, ballRadius);
    
    ballConfigs.forEach((config, index) => {
      const ballGraphics = this.add.graphics();
      
      // Shadow
      ballGraphics.fillStyle(0x000000, 0.2);
      ballGraphics.fillCircle(2, 2, ballRadius);
      
      // Main ball color
      ballGraphics.fillStyle(config.color, 1);
      ballGraphics.fillCircle(0, 0, ballRadius);
      
      // Stripe for striped balls
      if (config.type === 'stripe') {
        ballGraphics.fillStyle(0xffffff, 1);
        ballGraphics.fillRect(-ballRadius + 4, -ballRadius + 6, ballRadius * 2 - 8, ballRadius * 2 - 12);
      }
      
      // 8-ball circle
      if (config.type === 'eight') {
        ballGraphics.fillStyle(0xffffff, 1);
        ballGraphics.fillCircle(0, 0, ballRadius * 0.5);
        // White circle outline
        ballGraphics.lineStyle(2, 0xffffff, 1);
        ballGraphics.strokeCircle(0, 0, ballRadius * 0.5);
      }
      
      // Number circle (white circle for number)
      if (config.type !== 'eight') {
        ballGraphics.fillStyle(0xffffff, 1);
        ballGraphics.fillCircle(0, 0, ballRadius * 0.45);
      }
      
      // Number text
      const textColor = config.type === 'eight' ? '#000000' : '#000000';
      const numberText = this.add.text(0, 0, config.number.toString(), {
        fontSize: `${Math.floor(ballRadius * 0.7)}px`,
        color: textColor,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Generate texture
      const textureKey = `ball${config.number}`;
      ballGraphics.generateTexture(textureKey, ballRadius * 2 + 4, ballRadius * 2 + 4);
      ballGraphics.destroy();
      numberText.destroy();
      
      // Position ball
      const ball = this.matter.add.image(
        rackPositions[index].x,
        rackPositions[index].y,
        textureKey
      ) as Phaser.Physics.Matter.Sprite;
      
      ball.setCircle(ballRadius);
      ball.setFriction(0.02);
      ball.setFrictionAir(0.015);
      ball.setBounce(0.75);
      ball.setMass(1);
      ball.setCollisionCategory(0x0001);
      ball.setCollidesWith(0x0001);
      ball.setData('type', config.type);
      ball.setData('number', config.number);
      
      this.balls.push(ball);
    });
  }

  private getRackPositions(centerX: number, centerY: number, ballRadius: number): {x: number, y: number}[] {
    const positions: {x: number, y: number}[] = [];
    const spacing = ballRadius * 2 + 2;
    const rowCount = 5;
    
    let ballIndex = 0;
    for (let row = 0; row < rowCount; row++) {
      const ballsInRow = row + 1;
      const rowStartX = centerX - (row * spacing / 2);
      const rowY = centerY - ((rowCount - 1) * spacing / 2) + (row * spacing);
      
      for (let col = 0; col < ballsInRow; col++) {
        const x = rowStartX + (col * spacing);
        positions.push({ x, y: rowY });
        ballIndex++;
      }
    }
    
    return positions;
  }

  private createMinimalUI() {
    // Score display - top left
    this.scoreText = this.add.text(20, 20, 'Score: 0-0', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00000060',
      padding: { x: 8, y: 4 }
    });

    // Turn indicator - top left, below score
    this.turnText = this.add.text(20, 50, 'Your Turn', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#00000060',
      padding: { x: 8, y: 4 }
    });

    // Ported balls display - top center
    this.createPortedBallsDisplay();
  }

  private createPortedBallsDisplay() {
    // Container at top center
    this.pocketedBallsDisplay = this.add.container(this.scale.width / 2, 25);
    
    // Background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x000000, 0.6);
    bgGraphics.fillRoundedRect(-85, 0, 170, 35, 8);
    this.pocketedBallsDisplay.add(bgGraphics);
    
    // Title
    const titleText = this.add.text(0, 8, 'PORTED', {
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.pocketedBallsDisplay.add(titleText);
    
    // Ball icons container
    const ballsContainer = this.add.container(0, 18);
    this.pocketedBallsDisplay.add(ballsContainer);
    
    (this.pocketedBallsDisplay as any).ballsContainer = ballsContainer;
    this.pocketedBallsDisplay.setDepth(100);
  }

  private updatePocketedBallsDisplay() {
    if (!this.pocketedBallsDisplay) return;
    
    const ballsContainer = (this.pocketedBallsDisplay as any).ballsContainer as Phaser.GameObjects.Container;
    if (!ballsContainer) return;
    
    ballsContainer.removeAll(true);
    
    if (this.pocketedBalls.length === 0) return;
    
    // Display up to 8 balls in a row
    const displayBalls = this.pocketedBalls.slice(0, 8);
    const ballRadius = 8;
    const spacing = 18;
    const startX = -((displayBalls.length - 1) * spacing) / 2;
    
    displayBalls.forEach((ball, index) => {
      const x = startX + index * spacing;
      const ballIcon = this.add.graphics();
      
      let ballColor = 0xffffff;
      if (ball.type === 'solid') ballColor = 0xffd700;
      else if (ball.type === 'stripe') ballColor = 0xff0000;
      else if (ball.type === 'eight') ballColor = 0x000000;
      
      ballIcon.fillStyle(ballColor, 1);
      ballIcon.fillCircle(x, 0, ballRadius);
      
      if (ball.type === 'stripe') {
        ballIcon.fillStyle(0xffffff, 1);
        ballIcon.fillRect(x - 3, -ballRadius, 6, ballRadius * 2);
      }
      
      ballIcon.lineStyle(1, 0xcccccc, 0.8);
      ballIcon.strokeCircle(x, 0, ballRadius);
      
      // Number for larger balls
      if (ball.number === 8 || ball.type === 'solid') {
        const numText = this.add.text(x, 0, ball.number.toString(), {
          fontSize: '8px',
          color: ball.type === 'stripe' || ball.type === 'eight' ? '#ffffff' : '#000000',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        ballsContainer.add(numText);
      }
      
      ballsContainer.add(ballIcon);
    });
  }

  private getBallRackPositions(): {x: number, y: number}[] {
    const positions: {x: number, y: number}[] = [];
    const ballRadius = 20;
    
    // Define safe boundaries for ball placement (outermost layer with padding)
    const safeLeft = 50;      // Safe left boundary (padding from wood frame)
    const safeRight = this.scale.width - 50;  // Safe right boundary
    const safeTop = 50;       // Safe top boundary
    const safeBottom = this.scale.height - 50; // Safe bottom boundary
    
    const centerX = this.scale.width * 0.25;
    const centerY = this.scale.height * 0.5;
    const ballSpacing = 30;

    // Create triangular rack formation for 8-ball pool
    // Standard 8-ball triangle rack with 15 balls
    // 8-ball in center of triangle

    const rawPositions = [
      // Row 1 (1 ball)
      { x: centerX, y: centerY - ballSpacing * 3 },
      
      // Row 2 (2 balls)
      { x: centerX - ballSpacing/2, y: centerY - ballSpacing * 2 },
      { x: centerX + ballSpacing/2, y: centerY - ballSpacing * 2 },
      
      // Row 3 (3 balls)
      { x: centerX - ballSpacing, y: centerY - ballSpacing },
      { x: centerX, y: centerY - ballSpacing },
      { x: centerX + ballSpacing, y: centerY - ballSpacing },
      
      // Row 4 (4 balls)
      { x: centerX - ballSpacing * 1.5, y: centerY },
      { x: centerX - ballSpacing * 0.5, y: centerY },
      { x: centerX + ballSpacing * 0.5, y: centerY },
      { x: centerX + ballSpacing * 1.5, y: centerY },
      
      // Row 5 (5 balls)
      { x: centerX - ballSpacing * 2, y: centerY + ballSpacing },
      { x: centerX - ballSpacing, y: centerY + ballSpacing },
      { x: centerX, y: centerY + ballSpacing },
      { x: centerX + ballSpacing, y: centerY + ballSpacing },
      { x: centerX + ballSpacing * 2, y: centerY + ballSpacing }
    ];

    // Ensure all positions are within safe boundaries
    rawPositions.forEach(pos => {
      positions.push({
        x: Math.min(Math.max(pos.x, safeLeft + ballRadius), safeRight - ballRadius),
        y: Math.min(Math.max(pos.y, safeTop + ballRadius), safeBottom - ballRadius)
      });
    });

    return positions;
  }

  private validateBallBoundaries() {
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    const ballRadius = 16;
    
    // Only check fast balls
    const fastBalls = this.balls.filter(ball => ball.active && (ball.body as any).speed > 0.5);
    
    fastBalls.forEach(ball => {
      let x = ball.x;
      let y = ball.y;
      let needsReposition = false;

      if (x < feltLeft + ballRadius || x > feltRight - ballRadius) {
        x = Math.min(Math.max(x, feltLeft + ballRadius), feltRight - ballRadius);
        needsReposition = true;
      }

      if (y < feltTop + ballRadius || y > feltBottom - ballRadius) {
        y = Math.min(Math.max(y, feltTop + ballRadius), feltBottom - ballRadius);
        needsReposition = true;
      }

      if (needsReposition) {
        ball.setPosition(x, y);
        ball.setVelocity(0, 0);
      }
    });
  }

  private setupInput() {
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
  }

  private setupEventListeners() {
    // Use minimal collision detection - only for pocket sensors
    // This dramatically reduces CPU usage
    this.matter.world.on('collisionstart', (event: any) => {
      this.handleBallPocketCollisions(event);
    }, this);
    
    // Remove collisionactive to prevent hanging
    // Distance-based detection in update() handles the rest
  }


  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall || this.isAiming || this.gameOverText) {
      return;
    }

    // Check if clicking near cue ball
    const distance = Phaser.Math.Distance.Between(
      pointer.worldX, pointer.worldY,
      this.cueBall.x, this.cueBall.y
    );

    if (distance < 200) {
      this.isAiming = true;
      this.shotPower = 0;
      this.createCue(pointer);
      this.createPowerIndicator(pointer);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isAiming || !this.cueBall) return;

    // Update cue direction and power
    this.updateCue(pointer);
    this.updatePowerIndicator(pointer);

    // Increase power based on distance from cue ball
    const distance = Phaser.Math.Distance.Between(
      pointer.worldX, pointer.worldY,
      this.cueBall.x, this.cueBall.y
    );

    // Limit power to max
    this.shotPower = Math.min(distance * 1.5, this.maxPower);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.isAiming || !this.cueBall) return;

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

    if (this.powerText) {
      this.powerText.destroy();
      this.powerText = null;
    }

    // Apply force to cue ball
    this.shootCueBall(pointer);
  }

  private createCue(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall) return;

    // Create a more visible cue stick with better colors and details
    const cueLength = 250;
    const cueWidth = 12;
    
    // Create cue stick graphics with enhanced visibility
    const cueGraphics = this.add.graphics();
    
    // Add shadow/glow effect first
    cueGraphics.fillStyle(0x000000, 0.3);
    cueGraphics.fillRect(5, 3, cueLength, cueWidth + 4);
    
    // Cue stick main body (rich brown)
    cueGraphics.fillStyle(0x8B4513, 1);
    cueGraphics.fillRect(0, 0, cueLength, cueWidth);
    
    // Add wood grain lines for realism
    cueGraphics.lineStyle(1, 0x654321, 0.5);
    cueGraphics.lineBetween(0, cueWidth * 0.3, cueLength, cueWidth * 0.3);
    cueGraphics.lineBetween(0, cueWidth * 0.7, cueLength, cueWidth * 0.7);
    
    // Cue tip (bright white) - more prominent
    cueGraphics.fillStyle(0xFFFFFF, 1);
    cueGraphics.fillRect(0, 0, 15, cueWidth);
    cueGraphics.lineStyle(1, 0xCCCCCC, 1);
    cueGraphics.strokeRect(0, 0, 15, cueWidth);
    
    // Cue handle (dark brown with grip pattern)
    cueGraphics.fillStyle(0x5D3A1A, 1);
    cueGraphics.fillRect(cueLength - 50, 0, 50, cueWidth);
    
    // Add grip texture
    cueGraphics.lineStyle(2, 0x3D2914, 0.8);
    for (let i = cueLength - 45; i < cueLength - 5; i += 5) {
      cueGraphics.lineBetween(i, 0, i, cueWidth);
    }
    
    // Generate texture
    cueGraphics.generateTexture('cueStickTexture', cueLength + 10, cueWidth + 8);
    cueGraphics.destroy();

    // Create cue stick sprite with enhanced visibility
    this.cueStick = this.add.image(this.cueBall.x, this.cueBall.y, 'cueStickTexture');
    this.cueStick.setOrigin(0, 0.5);
    this.cueStick.setTint(0xFFFFFF); // Make it stand out more

    // Create aiming line (more visible)
    this.cue = this.add.line(0, 0, 0, 0, 0xFFFF00, 1); // Yellow line for visibility
    this.cue.setLineWidth(3);
    this.cue.setOrigin(0);

    this.updateCue(pointer);
  }

  private updateCue(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall) return;

    // Calculate angle from cue ball to pointer
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );

    // Update cue stick position and rotation
    if (this.cueStick) {
      // Position cue stick behind the cue ball
      const offsetDistance = 30 + (this.shotPower * 0.5); // Pull back based on power
      this.cueStick.setPosition(
        this.cueBall.x - Math.cos(angle) * offsetDistance,
        this.cueBall.y - Math.sin(angle) * offsetDistance
      );
      this.cueStick.setRotation(angle);
    }

    // Update aiming line (shows where ball will go)
    if (this.cue) {
      const lineLength = 150;
      this.cue.setTo(
        this.cueBall.x, this.cueBall.y,
        this.cueBall.x + Math.cos(angle) * lineLength,
        this.cueBall.y + Math.sin(angle) * lineLength
      );
    }
  }

  private createPowerIndicator(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall) return;

    // Create a more prominent power indicator with better visibility
    const indicatorWidth = 15;
    const indicatorHeight = 30;
    
    this.powerIndicator = this.add.rectangle(
      this.cueBall.x, this.cueBall.y,
      indicatorWidth, indicatorHeight,
      0x00FF00 // Green color for power indicator
    );
    this.powerIndicator.setOrigin(0.5, 1);
    this.powerIndicator.setAlpha(0.8); // Semi-transparent
    this.powerIndicator.setStrokeStyle(2, 0xFFFFFF); // White outline
    this.powerIndicator.setRotation(Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    ));

    // Add text label
    this.powerText = this.add.text(this.cueBall.x, this.cueBall.y - 40, 'Power: 0%', {
      fontSize: '14px',
      color: '#FFFFFF',
      backgroundColor: '#00000080',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5);

    this.updatePowerIndicator(pointer);
  }

  private updatePowerIndicator(pointer: Phaser.Input.Pointer) {
    if (!this.powerIndicator || !this.cueBall) return;

    // Update power indicator length based on shot power
    const maxLength = 100;
    const currentLength = (this.shotPower / this.maxPower) * maxLength;

    this.powerIndicator.setSize(currentLength, 30);

    // Update position and rotation
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );

    const offsetX = Math.cos(angle) * (currentLength / 2);
    const offsetY = Math.sin(angle) * (currentLength / 2);

    this.powerIndicator.setPosition(
      this.cueBall.x - offsetX,
      this.cueBall.y - offsetY
    );
    this.powerIndicator.setRotation(angle);

    // Update power percentage text
    const powerPercentage = Math.round((this.shotPower / this.maxPower) * 100);
    if (this.powerText) {
      this.powerText.setText(`Power: ${powerPercentage}%`);
      this.powerText.setPosition(this.cueBall.x, this.cueBall.y - 50);
    }
  }

  private shootCueBall(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall) return;

    // Reset turn tracking
    this.ballsHaveMovedSinceLastTurn = true;
    this.turnSwitchScheduled = false;

    // Calculate direction vector from cue ball to pointer
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );

    // Apply force based on power
    const force = this.shotPower * 0.2;
    const forceX = Math.cos(angle) * force;
    const forceY = Math.sin(angle) * force;

    // Apply velocity directly to cue ball
    this.cueBall.setVelocity(forceX, forceY);
    
    // Add spin for more realistic physics
    this.cueBall.setAngularVelocity(forceX * 0.01);

    // Check if this is the break shot
    if (this.gameType === 'none') {
      // First shot determines who gets solids vs stripes
      setTimeout(() => {
        this.gameType = 'eightball';
        this.determinePlayerGroups();
        this.updateTurnIndicator();
      }, 2000); // Reduced from 3000ms for faster game flow
    }
  }

  private handleBallPocketCollisions(event: any) {
    // Fast collision detection - only check pocket sensor collisions
    event.pairs.forEach((pair: any) => {
      const { bodyA, bodyB } = pair;
      
      // Check if ball entered pocket
      if (bodyA.label && bodyA.label.startsWith('pocket-')) {
        const ball = bodyB.gameObject;
        if (ball && ball !== this.cueBall && ball.active && !ball.getData('pocketed')) {
          this.handleBallPocketed(ball);
        }
      } else if (bodyB.label && bodyB.label.startsWith('pocket-')) {
        const ball = bodyA.gameObject;
        if (ball && ball !== this.cueBall && ball.active && !ball.getData('pocketed')) {
          this.handleBallPocketed(ball);
        }
      }
    });
  }

  private handleBallPocketed(ball: Phaser.Physics.Matter.Sprite) {
    const ballType = ball.getData('type');
    const ballNumber = ball.getData('number');

    // Prevent double-pocket detection
    if (!ball.active || ball.getData('pocketed')) {
      return;
    }
    
    // Mark ball as pocketed to prevent duplicate handling
    ball.setData('pocketed', true);

    // Check for fouls
    if (ballType === 'cue') {
      this.handleFoul('Cue ball pocketed!');
      return;
    }

    // Add to pocketed balls display
    this.pocketedBalls.push({ number: ballNumber, type: ballType });
    this.updatePocketedBallsDisplay();

    // Handle 8-ball pocket
    if (ballType === 'eight' && ballNumber === 8) {
      this.handleEightBallPocketed(ball);
      return;
    }

    // Handle solid/stripe balls with immediate swallow effect
    if (ballType === 'solid' || ballType === 'stripe') {
      this.swallowBall(ball);
      this.handleGroupBallPocketed(ball);
    }
  }

  private swallowBall(ball: Phaser.Physics.Matter.Sprite) {
    // Immediate "swallow" effect - ball disappears into pocket
    // Simplified for performance - minimal effect, instant removal
    
    // Create minimal swallow effect
    const swallowEffect = this.add.graphics();
    swallowEffect.lineStyle(2, 0xFFFFFF, 1);
    swallowEffect.strokeCircle(ball.x, ball.y, 20);
    
    // Quick fade out
    this.tweens.add({
      targets: swallowEffect,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        swallowEffect.destroy();
      }
    });
    
    // Deactivate and hide ball immediately
    ball.setActive(false);
    ball.setVisible(false);
    ball.setVelocity(0, 0);
    ball.setAngularVelocity(0);
    
    // Remove from balls array
    const ballIndex = this.balls.indexOf(ball);
    if (ballIndex > -1) {
      this.balls.splice(ballIndex, 1);
    }
  }

  private animateBallPocket(ball: Phaser.Physics.Matter.Sprite) {
    // Simplified animation - just slide ball off table
    const closestPocket = this.findClosestPocket(ball.x, ball.y);
    if (!closestPocket) return;

    const pocketX = closestPocket.x;
    const pocketY = closestPocket.y;

    // Calculate direction
    const angleToPocket = Phaser.Math.Angle.Between(ball.x, ball.y, pocketX, pocketY);
    
    // Quick slide toward pocket
    ball.setVelocity(
      Math.cos(angleToPocket) * 2,
      Math.sin(angleToPocket) * 2
    );

    // Use Phaser timer for cleanup instead of setInterval
    this.time.delayedCall(200, () => {
      if (ball.active) {
        ball.setActive(false);
        ball.setVisible(false);
        ball.setVelocity(0, 0);
        
        // Remove from balls array
        const ballIndex = this.balls.indexOf(ball);
        if (ballIndex > -1) {
          this.balls.splice(ballIndex, 1);
        }
      }
    });
  }

  private findClosestPocket(ballX: number, ballY: number): { x: number, y: number } | null {
    if (!this.pocketPositions) {
      const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
      this.pocketPositions = [
        { x: feltLeft, y: feltTop },
        { x: (feltLeft + feltRight) / 2, y: feltTop - 5 },
        { x: feltRight, y: feltTop },
        { x: feltLeft, y: feltBottom },
        { x: (feltLeft + feltRight) / 2, y: feltBottom + 5 },
        { x: feltRight, y: feltBottom }
      ];
    }

    let closestPocket = null;
    let minDistance = Infinity;

    this.pocketPositions.forEach(pocket => {
      const dx = ballX - pocket.x;
      const dy = ballY - pocket.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistance) {
        minDistance = distSq;
        closestPocket = pocket;
      }
    });

    return closestPocket;
  }

  private createBallTrail(_ball: Phaser.Physics.Matter.Sprite, _targetX: number, _targetY: number) {
    // Trail effect disabled for performance - balls disappear instantly now
  }

  private playBallSlideSound() {
    // Sound placeholder - no-op for performance
  }

  private playPottingSound() {
    // Sound placeholder - no-op for performance
  }

  private slideBallOffTable(ball: Phaser.Physics.Matter.Sprite, pocketX: number, pocketY: number) {
    // Simplified slide off table - instant removal for performance
    const targetY = pocketY < this.scale.height * 0.5 ? -50 : this.scale.height + 50;
    
    // Quick fade and move
    this.tweens.add({
      targets: ball,
      y: targetY,
      alpha: 0,
      scale: 0.5,
      duration: 400,
      onComplete: () => {
        ball.destroy();
      }
    });
  }

  private handleEightBallPocketed(ball: Phaser.Physics.Matter.Sprite) {
    const currentPlayer = this.gameData.players[this.currentPlayerTurn];
    const currentPlayerGroup = this.currentPlayerGroup;

    // Check if 8-ball was pocketed legally
    if (currentPlayerGroup && this.ballsRemaining[currentPlayerGroup] === 0) {
      // Valid 8-ball pocket - player wins
      this.endGame(currentPlayer.userId, 'win');
    } else {
      // Invalid 8-ball pocket - foul
      ball.setActive(true);
      ball.setVisible(true);
      ball.setPosition(this.scale.width * 0.5, this.scale.height * 0.5); // Spot 8-ball

      this.handleFoul('8-ball pocketed before clearing your group!');
    }
  }

  private handleGroupBallPocketed(ball: Phaser.Physics.Matter.Sprite) {
    const ballType = ball.getData('type') as 'solid' | 'stripe';
    const currentPlayerGroup = this.currentPlayerGroup;

    // Track balls remaining
    if (currentPlayerGroup && ballType === currentPlayerGroup) {
      this.ballsRemaining[ballType]--;
      this.ballsPocketedThisTurn.push(ball);
    }
  }

  private determinePlayerGroups() {
    // After break shot, determine which player gets solids vs stripes
    const solidsPlayer = Math.random() < 0.5 ? 0 : 1;
    this.playerGroups.player1 = solidsPlayer === 0 ? 'solid' : 'stripe';
    this.playerGroups.player2 = solidsPlayer === 0 ? 'stripe' : 'solid';
    this.currentPlayerGroup = this.playerGroups.player1;
  }

  private handleFoul(message: string) {
    // Show foul message briefly
    const foulText = this.add.text(this.scale.width / 2, this.scale.height / 2, `FOUL: ${message}`, {
      fontSize: '24px',
      color: '#FF0000',
      backgroundColor: '#00000080',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);

    // Remove foul message after delay
    this.time.delayedCall(1500, () => {
      foulText.destroy();
    });

    // Ball in hand - place cue ball anywhere
    this.handleBallInHand();
  }

  private handleBallInHand() {
    // After foul, player can place cue ball anywhere within outermost layer boundaries
    const safeLeft = 50;
    const safeRight = this.scale.width - 50;
    const safeTop = 50;
    const safeBottom = this.scale.height - 50;
    
    // Place cue ball at center within safe boundaries
    this.cueBall?.setPosition(
      Math.min(Math.max(this.scale.width / 2, safeLeft + 20), safeRight - 20),
      Math.min(Math.max(this.scale.height / 2, safeTop + 20), safeBottom - 20)
    );
    this.cueBall?.setVelocity(0, 0);

    // Switch turn to other player
    this.switchTurn();
  }

  private handleCollisionStart(_event: any) {
    // Minimal collision handling - just track first hit ball
    _event.pairs.forEach((pair: any) => {
      const { bodyA, bodyB } = pair;
      if (bodyA.gameObject === this.cueBall || bodyB.gameObject === this.cueBall) {
        const otherBall = bodyA.gameObject === this.cueBall ? bodyB.gameObject : bodyA.gameObject;
        if (otherBall && !this.firstHitBall) {
          this.firstHitBall = otherBall;
        }
      }
    });
  }

  private handleCollisionActive(_event: any) {
    // No-op for performance
  }

  private handleCollisionEnd(_event: any) {
    // No-op for performance
  }

  private updateScore(_ballType: string) {
    // Update score based on ball pocketed
    if (this.scoreText) {
      // Simple score update - in real game would track actual balls
      this.scoreText.setText(`Score: 1-0`);
    }
  }

  private switchTurn() {
    // Prevent rapid turn switches
    const now = Date.now();
    if (now - this.lastTurnSwitchTime < 500) return; // 500ms minimum between switches
    this.lastTurnSwitchTime = now;
    
    // Reset turn tracking
    this.turnSwitchScheduled = false;
    this.ballsHaveMovedSinceLastTurn = false;
    this.firstHitBall = null;
    
    // Switch to next player's turn
    this.currentPlayerTurn = (this.currentPlayerTurn + 1) % this.gameData.players.length;
    this.updateTurnIndicator();
  }

  private updateTurnIndicator() {
    if (!this.turnText) return;

    const currentPlayer = this.gameData.players[this.currentPlayerTurn];
    const isCurrentUser = currentPlayer.userId === this.gameData.currentUserId;

    this.turnText.setText(`${currentPlayer.username}'s Turn`);
    this.turnText.setColor(isCurrentUser ? '#00FF00' : '#FF0000');

    // Show turn change notification briefly
    const turnChangeText = this.add.text(this.scale.width / 2, this.scale.height / 2, `${currentPlayer.username}'s Turn`, {
      fontSize: '28px',
      color: isCurrentUser ? '#00FF00' : '#FF0000',
      backgroundColor: '#00000080',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);

    // Remove after delay
    this.time.delayedCall(1500, () => {
      turnChangeText.destroy();
    });
  }

  private endGame(winnerId: number, _result: 'win' | 'loss') {
    this.gameStarted = false;

    const winner = this.gameData.players.find((p: any) => p.userId === winnerId);
    const loser = this.gameData.players.find((p: any) => p.userId !== winnerId);

    // Show game over message
    this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER', {
      fontSize: '48px',
      color: '#FFD700',
      backgroundColor: '#00000080',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, `${winner.username} WINS!`, {
      fontSize: '36px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Disable input
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);

    // Send game results to backend
    this.sendGameResults(winnerId, loser.userId);
  }

  private sendGameResults(winnerId: number, _loserId: number) {
    // Placeholder - log results
    console.log('Game completed:', { winnerId, gameId: this.gameData.gameId });
  }

  private frameCount = 0;
  private lastPocketCheck = 0;
  private lastBoundaryCheck = 0;
  private allBallsStopped = false;

  update() {
    this.frameCount++;
    
    // Reduced boundary checks - every 5 frames
    if (this.frameCount - this.lastBoundaryCheck >= 5) {
      this.validateBallBoundaries();
      this.lastBoundaryCheck = this.frameCount;
    }

    // Pocket detection - every 3 frames when balls are moving
    const ballsMoving = this.balls.some(ball => ball.active && (ball.body as any).speed > 0.2);
    if (ballsMoving && this.frameCount - this.lastPocketCheck >= 3) {
      this.checkDistanceBasedPocketDetection();
      this.lastPocketCheck = this.frameCount;
    }

    // Turn management - optimized to prevent hanging
    if (this.cueBall && (this.cueBall.body as any).speed < 0.1 && !this.isAiming) {
      if (this.gameStarted && !this.gameOverText) {
        // Check if balls are still moving
        const anyBallsMoving = this.balls.some(ball => ball.active && (ball.body as any).speed > 0.1);
        
        if (!anyBallsMoving && this.ballsHaveMovedSinceLastTurn && !this.turnSwitchScheduled) {
          // Schedule turn switch only once
          this.turnSwitchScheduled = true;
          this.time.delayedCall(500, () => {
            if (this.gameStarted && !this.isAiming && !this.gameOverText) {
              this.switchTurn();
            }
          });
        }
      }
    }

    // Update power indicator if aiming
    if (this.isAiming && this.powerIndicator && this.frameCount % 3 === 0) {
      const pulse = Math.sin(Date.now() * 0.005) * 10 + 10;
      this.powerIndicator.setSize(this.powerIndicator.width, pulse);
    }
  }

  private checkDistanceBasedPocketDetection() {
    if (!this.pocketPositions) {
      const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
      this.pocketPositions = [
        { x: feltLeft, y: feltTop },
        { x: (feltLeft + feltRight) / 2, y: feltTop - 5 },
        { x: feltRight, y: feltTop },
        { x: feltLeft, y: feltBottom },
        { x: (feltLeft + feltRight) / 2, y: feltBottom + 5 },
        { x: feltRight, y: feltBottom }
      ];
    }

    const fastBalls = this.balls.filter(ball => ball.active && (ball.body as any).speed > 0.3);
    if (fastBalls.length === 0) return;

    fastBalls.forEach(ball => {
      if (!ball || ball.getData('type') === 'cue' || ball.getData('pocketed')) return;

      const ballX = ball.x;
      const ballY = ball.y;
      const pocketRadius = 25;
      const squaredPocketRadius = pocketRadius * pocketRadius;

      for (let i = 0; i < this.pocketPositions!.length; i++) {
        const pocket = this.pocketPositions![i];
        const dx = ballX - pocket.x;
        const dy = ballY - pocket.y;
        const squaredDistance = dx * dx + dy * dy;
        
        if (squaredDistance < squaredPocketRadius) {
          this.handleBallPocketed(ball);
          break;
        }
      }
    });
  }
}

// Register the scene with Phaser
export default PoolGame;