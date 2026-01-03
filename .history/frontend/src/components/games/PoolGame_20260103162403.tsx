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
            <button
              onClick={() => {
                // Test shot button for debugging
                const scene = phaserGameRef.current?.scene.scenes[0] as any;
                if (scene && scene.cueBall) {
                  scene.cueBall.setVelocity(5, 0); // Simple test shot
                  console.log('Test shot fired!');
                }
              }}
              className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded"
            >
              Test Shot
            </button>
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

// Pool Game Scene with Phaser - Complete Implementation
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
  private gameType: 'eightball' | 'none' = 'none';
  private playerGroups: { player1: 'solid' | 'stripe' | null, player2: 'solid' | 'stripe' | null } = { player1: null, player2: null };
  private currentPlayerGroup: 'solid' | 'stripe' | null = null;
  private ballsRemaining: { solid: number, stripe: number, eight: number } = { solid: 7, stripe: 7, eight: 1 };
  private firstHitBall: Phaser.Physics.Matter.Sprite | null = null;
  private ballsPocketedThisTurn: Phaser.Physics.Matter.Sprite[] = [];

  constructor() {
    super({ key: 'PoolGameScene' });
  }

  init(data: any) {
    this.gameData = data;
    console.log('PoolGameScene initialized with data:', this.gameData);
  }

  preload() {
    console.log('PoolGameScene.preload() called');
    // Load pool table assets with fallback handling
    try {
      // Try to load main assets
      try {
        this.load.image('poolTable', '/assets/pool/pool-table.png');
      } catch (e) {
        console.warn('Pool table asset not found, using fallback');
        // Create a simple pool table using code instead
      }

      try {
        this.load.image('cueBall', '/assets/pool/cue-ball.png');
      } catch (e) {
        console.warn('Cue ball asset not found, using fallback');
        // Will use a simple white circle as fallback
      }

      // Load ball assets with fallbacks for 8-ball pool (1-15 balls)
      const ballAssets = [
        { key: 'ball1', path: '/assets/pool/ball-1.png' },
        { key: 'ball2', path: '/assets/pool/ball-2.png' },
        { key: 'ball3', path: '/assets/pool/ball-3.png' },
        { key: 'ball4', path: '/assets/pool/ball-4.png' },
        { key: 'ball5', path: '/assets/pool/ball-5.png' },
        { key: 'ball6', path: '/assets/pool/ball-6.png' },
        { key: 'ball7', path: '/assets/pool/ball-7.png' },
        { key: 'ball8', path: '/assets/pool/ball-8.png' },
        { key: 'ball9', path: '/assets/pool/ball-9.png' },
        { key: 'ball10', path: '/assets/pool/ball-10.png' },
        { key: 'ball11', path: '/assets/pool/ball-11.png' },
        { key: 'ball12', path: '/assets/pool/ball-12.png' },
        { key: 'ball13', path: '/assets/pool/ball-13.png' },
        { key: 'ball14', path: '/assets/pool/ball-14.png' },
        { key: 'ball15', path: '/assets/pool/ball-15.png' }
      ];

      ballAssets.forEach(asset => {
        try {
          this.load.image(asset.key, asset.path);
        } catch (e) {
          console.warn(`Asset ${asset.key} not found, will use fallback`);
        }
      });

      // Load fallback ball asset
      try {
        this.load.image('fallbackBall', '/assets/pool/ball.png');
      } catch (e) {
        console.warn('Fallback ball asset not found');
      }

      console.log('Asset loading complete');
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  }

  create() {
    console.log('PoolGameScene.create() called');
    console.log('gameData:', this.gameData);

    try {
      // Create pool table background
      this.createPoolTable();
      console.log('Pool table created');

      // Create pockets
      this.createPockets();
      console.log('Pockets created');

      // Create balls
      this.createBalls();
      console.log('Balls created');

      // Setup input for cue controls
      this.setupInput();
      console.log('Input setup complete');

      // Create UI elements
      this.createUI();
      console.log('UI created');

      // Start with first player's turn
      this.currentPlayerTurn = 0;
      this.updateTurnIndicator();

      // Set game as started
      this.gameStarted = true;
      console.log('Game started successfully');

      // Add event listeners
      this.setupEventListeners();
      console.log('Event listeners setup complete');
    } catch (error) {
      console.error('Error during PoolGameScene creation:', error);
    }
  }

  private createPoolTable() {
    // Create pool table background
    const table = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width * 0.9,
      this.scale.height * 0.8,
      0x2e7d32
    );
    table.setStrokeStyle(4, 0x1b5e20);

    // Add table felt
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width * 0.85,
      this.scale.height * 0.75,
      0x4caf50
    );

    // Add table borders
    const borderWidth = 20;
    const borderColor = 0x8d6e63;

    // Top and bottom borders
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height * 0.1,
      this.scale.width * 0.85,
      borderWidth,
      borderColor
    );
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height * 0.9,
      this.scale.width * 0.85,
      borderWidth,
      borderColor
    );

    // Left and right borders
    this.add.rectangle(
      this.scale.width * 0.1,
      this.scale.height / 2,
      borderWidth,
      this.scale.height * 0.75,
      borderColor
    );
    this.add.rectangle(
      this.scale.width * 0.9,
      this.scale.height / 2,
      borderWidth,
      this.scale.height * 0.75,
      borderColor
    );

    // Add physics walls to keep balls within table boundaries
    this.createTableWalls();
  }

  private createTableWalls() {
    // Define table boundaries (playable area)
    const tableLeft = this.scale.width * 0.15;   // Left boundary
    const tableRight = this.scale.width * 0.85;  // Right boundary
    const tableTop = this.scale.height * 0.2;    // Top boundary
    const tableBottom = this.scale.height * 0.8; // Bottom boundary
    const wallThickness = 10;

    // Top wall
    this.matter.add.rectangle(
      (tableLeft + tableRight) / 2,
      tableTop - wallThickness / 2,
      tableRight - tableLeft,
      wallThickness,
      {
        isStatic: true,
        label: 'table-wall',
        restitution: 0.8,
        friction: 0.1
      }
    );

    // Bottom wall
    this.matter.add.rectangle(
      (tableLeft + tableRight) / 2,
      tableBottom + wallThickness / 2,
      tableRight - tableLeft,
      wallThickness,
      {
        isStatic: true,
        label: 'table-wall',
        restitution: 0.8,
        friction: 0.1
      }
    );

    // Left wall
    this.matter.add.rectangle(
      tableLeft - wallThickness / 2,
      (tableTop + tableBottom) / 2,
      wallThickness,
      tableBottom - tableTop,
      {
        isStatic: true,
        label: 'table-wall',
        restitution: 0.8,
        friction: 0.1
      }
    );

    // Right wall
    this.matter.add.rectangle(
      tableRight + wallThickness / 2,
      (tableTop + tableBottom) / 2,
      wallThickness,
      tableBottom - tableTop,
      {
        isStatic: true,
        label: 'table-wall',
        restitution: 0.8,
        friction: 0.1
      }
    );

    console.log('Table walls created for boundary validation');
  }

  private createPockets() {
    const pocketSize = 60; // Increased pocket size for better detection
    const pocketColor = 0x000000;

    // Define safe boundaries (same as ball boundaries)
    const safeLeft = this.scale.width * 0.18;
    const safeRight = this.scale.width * 0.82;
    const safeTop = this.scale.height * 0.22;
    const safeBottom = this.scale.height * 0.78;

    // Create 6 pockets positioned INSIDE the table boundaries for realistic potting
    const pocketPositions = [
      { x: safeLeft, y: safeTop }, // Top left - inside boundary
      { x: this.scale.width * 0.5, y: safeTop - 10 }, // Top center - slightly inside
      { x: safeRight, y: safeTop }, // Top right - inside boundary
      { x: safeLeft, y: safeBottom }, // Bottom left - inside boundary
      { x: this.scale.width * 0.5, y: safeBottom + 10 }, // Bottom center - slightly inside
      { x: safeRight, y: safeBottom }  // Bottom right - inside boundary
    ];

    pocketPositions.forEach((pos, index) => {
      // Create visible pocket (dark circle)
      const pocket = this.add.circle(pos.x, pos.y, pocketSize, pocketColor);
      pocket.setDepth(-1); // Put pockets behind balls
      (this.pockets as any).push(pocket);

      // Add physics sensor for ball detection - larger detection area
      const pocketSensor = this.matter.add.circle(pos.x, pos.y, pocketSize * 0.8, {
        isSensor: true,
        label: `pocket-${index}`,
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001
        }
      });

      // Add debug visual for sensor area (temporary)
      const debugSensor = this.add.circle(pos.x, pos.y, pocketSize * 0.8, 0xFF0000, 0.2);
      debugSensor.setDepth(-2);
      
      // Remove debug visual after 3 seconds
      setTimeout(() => {
        debugSensor.destroy();
      }, 3000);

      console.log(`Pocket ${index} created at:`, {
        x: pos.x,
        y: pos.y,
        sensorRadius: pocketSize * 0.8,
        ballCategory: '0x0001',
        pocketCategory: '0x0002'
      });
    });

    console.log('Pockets created inside table boundaries for realistic potting');
  }

  private createBalls() {
    const ballRadius = 20;
    const ballPositions = this.getBallRackPositions();
    
    // Define safe boundary for ball placement (matching wall boundaries)
    const safeLeft = this.scale.width * 0.18;   // Safe left boundary
    const safeRight = this.scale.width * 0.82;  // Safe right boundary
    const safeTop = this.scale.height * 0.22;   // Safe top boundary
    const safeBottom = this.scale.height * 0.78; // Safe bottom boundary

    // Create cue ball (white) - enhanced visibility with glow effect
    const cueBallGraphics = this.add.graphics();
    
    // Add glow effect
    cueBallGraphics.fillStyle(0xFFFFFF, 0.3);
    cueBallGraphics.fillCircle(0, 0, ballRadius + 5);
    
    // Main ball
    cueBallGraphics.fillStyle(0xFFFFFF, 1);
    cueBallGraphics.fillCircle(0, 0, ballRadius);
    
    // Border
    cueBallGraphics.lineStyle(3, 0xCCCCCC, 1);
    cueBallGraphics.strokeCircle(0, 0, ballRadius);
    
    // Add subtle shadow
    cueBallGraphics.lineStyle(1, 0x999999, 0.5);
    cueBallGraphics.strokeCircle(2, 2, ballRadius - 2);
    
    const cueBallTexture = cueBallGraphics.generateTexture('cueBallTexture', ballRadius * 2, ballRadius * 2);
    cueBallGraphics.destroy();

    // Position cue ball within safe boundaries
    const cueBallX = Math.min(Math.max(this.scale.width * 0.75, safeLeft + ballRadius), safeRight - ballRadius);
    const cueBallY = Math.min(Math.max(this.scale.height * 0.5, safeTop + ballRadius), safeBottom - ballRadius);

    const cueBall = this.matter.add.image(
      cueBallX,
      cueBallY,
      'cueBallTexture'
    ) as Phaser.Physics.Matter.Sprite;

    // Better physics settings for better ball movement
    cueBall.setCircle(ballRadius);
    cueBall.setFriction(0.01); // Lower friction for smoother movement
    cueBall.setFrictionAir(0.02); // Air resistance
    (cueBall.body as any).restitution = 0.9; // Higher bounce
    cueBall.setMass(1);
    cueBall.setBounce(0.9);
    cueBall.setCollisionCategory(0x0001);
    cueBall.setCollidesWith(0x0001 | 0x0002); // Collide with balls and pockets
    cueBall.setData('type', 'cue');
    cueBall.setData('number', 0);
    
    console.log('Cue ball created with collision category 0x0001, collides with 0x0001 | 0x0002');
    
    // Make sure the cue ball is interactive
    cueBall.setInteractive({ useHandCursor: true });

    this.cueBall = cueBall;
    this.balls.push(cueBall);

    // Create 15 balls for 8-ball pool
    // Solids (1-7): Yellow, Stripes (9-15): Red, 8-ball: Black
    const ballTypes = [
      { type: 'solid', number: 1, color: 0xFFD700 },   // Yellow (solid)
      { type: 'solid', number: 2, color: 0xFFD700 },   // Yellow (solid)
      { type: 'solid', number: 3, color: 0xFFD700 },   // Yellow (solid)
      { type: 'solid', number: 4, color: 0xFFD700 },   // Yellow (solid)
      { type: 'solid', number: 5, color: 0xFFD700 },   // Yellow (solid)
      { type: 'solid', number: 6, color: 0xFFD700 },   // Yellow (solid)
      { type: 'solid', number: 7, color: 0xFFD700 },   // Yellow (solid)
      { type: 'eight', number: 8, color: 0x000000 },   // Black (8-ball)
      { type: 'stripe', number: 9, color: 0xFF0000 },  // Red (stripe)
      { type: 'stripe', number: 10, color: 0xFF0000 }, // Red (stripe)
      { type: 'stripe', number: 11, color: 0xFF0000 }, // Red (stripe)
      { type: 'stripe', number: 12, color: 0xFF0000 }, // Red (stripe)
      { type: 'stripe', number: 13, color: 0xFF0000 }, // Red (stripe)
      { type: 'stripe', number: 14, color: 0xFF0000 }, // Red (stripe)
      { type: 'stripe', number: 15, color: 0xFF0000 }, // Red (stripe)
    ];

    ballTypes.forEach((ballConfig, index) => {
      // Create ball texture using graphics
      const ballGraphics = this.add.graphics();
      ballGraphics.fillStyle(ballConfig.color, 1);
      ballGraphics.fillCircle(ballRadius, ballRadius, ballRadius);
      
      // Add stripe pattern for stripe balls
      if (ballConfig.type === 'stripe') {
        ballGraphics.fillStyle(0xFFFFFF, 1);
        ballGraphics.fillRect(ballRadius - 8, ballRadius - ballRadius, 16, ballRadius * 2);
      }
      
      // Add number text
      const textStyle = { fontSize: '12px', color: ballConfig.type === 'eight' ? '#FFFFFF' : '#000000' };
      const numberText = this.add.text(ballRadius, ballRadius, ballConfig.number.toString(), textStyle).setOrigin(0.5);
      
      // Generate texture
      const textureKey = `ball${ballConfig.number}Texture`;
      ballGraphics.generateTexture(textureKey, ballRadius * 2, ballRadius * 2);
      ballGraphics.destroy();
      numberText.destroy();

      const ball = this.matter.add.image(
        ballPositions[index].x,
        ballPositions[index].y,
        textureKey
      ) as Phaser.Physics.Matter.Sprite;

      ball.setCircle(ballRadius);
      ball.setFriction(0.02);
      (ball.body as any).restitution = 0.8;
      ball.setMass(1);
      ball.setCollisionCategory(0x0001);
      ball.setCollidesWith(0x0001 | 0x0002); // Collide with balls (0x0001) and pockets (0x0002)
      ball.setData('type', ballConfig.type);
      ball.setData('number', ballConfig.number);

      console.log(`Ball ${ballConfig.number} (${ballConfig.type}) created with collision category 0x0001`);

      this.balls.push(ball);
    });
  }

  private getBallRackPositions(): {x: number, y: number}[] {
    const positions: {x: number, y: number}[] = [];
    const ballRadius = 20;
    
    // Define safe boundaries for ball placement
    const safeLeft = this.scale.width * 0.18;   // Safe left boundary
    const safeRight = this.scale.width * 0.82;  // Safe right boundary
    const safeTop = this.scale.height * 0.22;   // Safe top boundary
    const safeBottom = this.scale.height * 0.78; // Safe bottom boundary
    
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
    // Check if any ball has escaped the boundaries and reposition if necessary
    const safeLeft = this.scale.width * 0.18;
    const safeRight = this.scale.width * 0.82;
    const safeTop = this.scale.height * 0.22;
    const safeBottom = this.scale.height * 0.78;
    const ballRadius = 20;

    this.balls.forEach(ball => {
      if (ball && ball.active) {
        let x = ball.x;
        let y = ball.y;
        let needsReposition = false;

        // Check boundaries and correct position
        if (x < safeLeft + ballRadius) {
          x = safeLeft + ballRadius;
          needsReposition = true;
        } else if (x > safeRight - ballRadius) {
          x = safeRight - ballRadius;
          needsReposition = true;
        }

        if (y < safeTop + ballRadius) {
          y = safeTop + ballRadius;
          needsReposition = true;
        } else if (y > safeBottom - ballRadius) {
          y = safeBottom - ballRadius;
          needsReposition = true;
        }

        if (needsReposition) {
          console.log(`Repositioning ball to keep within boundaries:`, { x, y });
          ball.setPosition(x, y);
          ball.setVelocity(0, 0); // Stop the ball
        }
      }
    });
  }

  private setupInput() {
    // Mouse input for cue controls
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
  }

  private createUI() {
    // Score display
    this.scoreText = this.add.text(100, 50, 'Score: 0-0', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    });

    // Turn indicator
    this.turnText = this.add.text(this.scale.width - 200, 50, 'Your Turn', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    });

    // Game instructions
    this.add.text(this.scale.width / 2, this.scale.height - 50, '8-Ball Pool: Clear your group (solids/stripes), then pocket the 8-ball!', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
  }

  private setupEventListeners() {
    console.log('Setting up collision event listeners...');
    
    // Collision events for all types of collisions
    this.matter.world.on('collisionstart', (event: any) => {
      console.log('General collisionstart event fired:', event.pairs.length);
      this.handleCollisionStart(event);
    }, this);
    
    this.matter.world.on('collisionactive', (event: any) => {
      console.log('General collisionactive event fired:', event.pairs.length);
      this.handleCollisionActive(event);
    }, this);
    
    this.matter.world.on('collisionend', (event: any) => {
      console.log('General collisionend event fired:', event.pairs.length);
      this.handleCollisionEnd(event);
    }, this);

    // Specific ball vs pocket collisions - separate handler with detailed logging
    this.matter.world.on('collisionstart', (event: any) => {
      console.log('Ball-Pocket collision event fired!', event.pairs.length);
      this.handleBallPocketCollisions(event);
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    console.log('handlePointerDown called', {
      cueBall: !!this.cueBall,
      isAiming: this.isAiming,
      gameOverText: !!this.gameOverText
    });

    if (!this.cueBall || this.isAiming || this.gameOverText) {
      console.log('Cannot aim: missing cue ball or already aiming or game over');
      return;
    }

    // Check if clicking near cue ball (temporarily allow all shots for testing)
    const distance = Phaser.Math.Distance.Between(
      pointer.worldX, pointer.worldY,
      this.cueBall.x, this.cueBall.y
    );

    console.log('Distance to cue ball:', distance);

    // Temporarily increase click radius for easier testing
    if (distance < 200) { // Increased from 150 to 200
      console.log('Starting aim mode');
      this.isAiming = true;
      this.shotPower = 0;
      this.createCue(pointer);
      this.createPowerIndicator(pointer);
    } else {
      console.log('Click too far from cue ball');
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

    console.log('shootCueBall called', {
      shotPower: this.shotPower,
      pointerX: pointer.worldX,
      pointerY: pointer.worldY,
      cueBallX: this.cueBall.x,
      cueBallY: this.cueBall.y
    });

    // Calculate direction vector from cue ball to pointer
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );

    console.log('Shot angle:', angle, 'degrees:', Phaser.Math.RadToDeg(angle));

    // Apply force based on power - increased multiplier for better movement
    const force = this.shotPower * 0.1; // Increased from 0.03 to 0.1
    const forceX = Math.cos(angle) * force;
    const forceY = Math.sin(angle) * force;

    console.log('Applying force:', { forceX, forceY, force });

    // Apply velocity directly to cue ball
    this.cueBall.setVelocity(forceX, forceY);
    
    // Add spin for more realistic physics
    this.cueBall.setAngularVelocity(forceX * 0.01);

    console.log('Cue ball velocity set to:', this.cueBall.body?.velocity);

    // Play sound effect (if available)
    if (this.sound) {
      this.sound.play('cueHit');
    }

    // Check if this is the break shot
    if (this.gameType === 'none') {
      // First shot determines who gets solids vs stripes
      this.handleBreakShot();
    }
  }

  private handleBreakShot() {
    // For 8-ball, determine ball groups after break
    setTimeout(() => {
      this.gameType = 'eightball';
      this.determinePlayerGroups();
      this.updateTurnIndicator();
    }, 3000); // Wait for balls to settle
  }

  private handleBallPocketCollisions(event: any) {
    console.log('Collision event triggered!', {
      pairs: event.pairs.length,
      event: event
    });

    event.pairs.forEach((pair: any, index: number) => {
      const { bodyA, bodyB } = pair;
      
      console.log(`Collision pair ${index}:`, {
        bodyA: {
          label: bodyA.label,
          gameObject: !!bodyA.gameObject,
          position: bodyA.position,
          isSensor: bodyA.isSensor
        },
        bodyB: {
          label: bodyB.label,
          gameObject: !!bodyB.gameObject,
          position: bodyB.position,
          isSensor: bodyB.isSensor
        }
      });

      // Check if ball entered pocket
      if (bodyA.label && bodyA.label.startsWith('pocket-')) {
        const ball = bodyB.gameObject;
        console.log('Ball pocketed via bodyA:', {
          ball: !!ball,
          ballType: ball?.getData('type'),
          ballNumber: ball?.getData('number'),
          isCueBall: ball === this.cueBall,
          isActive: ball?.active
        });
        if (ball && ball !== this.cueBall && ball.active) {
          this.handleBallPocketed(ball);
        }
      } else if (bodyB.label && bodyB.label.startsWith('pocket-')) {
        const ball = bodyA.gameObject;
        console.log('Ball pocketed via bodyB:', {
          ball: !!ball,
          ballType: ball?.getData('type'),
          ballNumber: ball?.getData('number'),
          isCueBall: ball === this.cueBall,
          isActive: ball?.active
        });
        if (ball && ball !== this.cueBall && ball.active) {
          this.handleBallPocketed(ball);
        }
      }
    });
  }

  private handleBallPocketed(ball: Phaser.Physics.Matter.Sprite) {
    const ballType = ball.getData('type');
    const ballNumber = ball.getData('number');

    console.log(`Ball ${ballNumber} (${ballType}) pocketed!`);

    // Check for fouls
    if (ballType === 'cue') {
      this.handleFoul('Cue ball pocketed!');
      return;
    }

    // Handle 8-ball pocket
    if (ballType === 'eight' && ballNumber === 8) {
      this.handleEightBallPocketed(ball);
      return;
    }

    // Handle solid/stripe balls with sliding animation
    if (ballType === 'solid' || ballType === 'stripe') {
      this.animateBallPocket(ball);
      this.handleGroupBallPocketed(ball);
    }
  }

  private animateBallPocket(ball: Phaser.Physics.Matter.Sprite) {
    // Find the closest pocket to the ball
    const closestPocket = this.findClosestPocket(ball.x, ball.y);

    if (!closestPocket) return;

    // Create realistic sliding animation with physics
    const pocketX = closestPocket.x;
    const pocketY = closestPocket.y;
    const ballRadius = 20;

    console.log(`Animating ball slide to pocket at:`, { pocketX, pocketY });

    // Calculate direction and distance to pocket
    const distanceToPocket = Phaser.Math.Distance.Between(ball.x, ball.y, pocketX, pocketY);
    const angleToPocket = Phaser.Math.Angle.Between(ball.x, ball.y, pocketX, pocketY);

    // Add rolling/spinning effect during slide
    const spinSpeed = 0.3; // Radians per frame
    const rollDirection = angleToPocket + Math.PI/2; // Perpendicular to movement direction

    // Create particle trail effect
    this.createBallTrail(ball, pocketX, pocketY);

    // Use physics-based sliding with realistic deceleration
    const slideForce = 0.15; // Initial force toward pocket
    const friction = 0.98; // Friction coefficient for realistic deceleration

    // Apply initial force toward pocket with more realistic physics
    const initialVelocity = slideForce * Math.sqrt(distanceToPocket) * 0.02;
    ball.setVelocity(
      Math.cos(angleToPocket) * initialVelocity,
      Math.sin(angleToPocket) * initialVelocity
    );

    // Add angular velocity for rolling effect with realistic spin
    const initialSpin = spinSpeed * (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 0.5);
    ball.setAngularVelocity(initialSpin);

    // Animate with physics and visual effects
    let slideProgress = 0;
    const totalSlideTime = 1200; // milliseconds
    const startTime = Date.now();

    const slideUpdate = () => {
      const elapsed = Date.now() - startTime;
      slideProgress = Math.min(elapsed / totalSlideTime, 1);

      // Apply friction for realistic deceleration
      const currentVelocity = ball.body?.velocity;
      if (currentVelocity) {
        ball.setVelocity(
          currentVelocity.x * friction,
          currentVelocity.y * friction
        );
      }

      // Add slight random movement for realism (only if body exists)
      if (Math.random() < 0.3 && ball.body?.velocity) {
        const currentVel = ball.body.velocity;
        ball.setVelocity(
          currentVel.x + (Math.random() - 0.5) * 0.02,
          currentVel.y + (Math.random() - 0.5) * 0.02
        );
      }

      // Gradually reduce angular velocity for realistic spin decay
      const body = ball.body as any;
      if (body?.angularVelocity !== undefined) {
        ball.setAngularVelocity(body.angularVelocity * 0.98);
      }

      // Check if ball is close enough to pocket or has stopped moving
      const currentDistance = Phaser.Math.Distance.Between(ball.x, ball.y, pocketX, pocketY);
      const ballSpeed = body?.speed || 0;

      if (currentDistance < ballRadius * 1.5 || slideProgress >= 1 || ballSpeed < 0.01) {
        // Ball reached pocket, slide off table
        this.slideBallOffTable(ball, pocketX, pocketY);
        this.events.off('update', slideUpdate);
      }
    };

    // Start the physics-based slide animation
    this.events.on('update', slideUpdate);

    // Add sound effect for ball sliding
    this.playBallSlideSound();
  }

  private findClosestPocket(ballX: number, ballY: number): { x: number, y: number } | null {
    const pocketPositions = [
      { x: this.scale.width * 0.18, y: this.scale.height * 0.22 }, // Top left
      { x: this.scale.width * 0.5, y: this.scale.height * 0.22 - 10 }, // Top center
      { x: this.scale.width * 0.82, y: this.scale.height * 0.22 }, // Top right
      { x: this.scale.width * 0.18, y: this.scale.height * 0.78 }, // Bottom left
      { x: this.scale.width * 0.5, y: this.scale.height * 0.78 + 10 }, // Bottom center
      { x: this.scale.width * 0.82, y: this.scale.height * 0.78 }  // Bottom right
    ];

    let closestPocket = null;
    let minDistance = Infinity;

    pocketPositions.forEach(pocket => {
      const distance = Phaser.Math.Distance.Between(ballX, ballY, pocket.x, pocket.y);
      if (distance < minDistance) {
        minDistance = distance;
        closestPocket = pocket;
      }
    });

    return closestPocket;
  }

  private createBallTrail(ball: Phaser.Physics.Matter.Sprite, targetX: number, targetY: number) {
    // Create enhanced particle trail effect with realistic physics
    const trailParticles: any[] = [];
    const trailLength = 10;

    for (let i = 0; i < trailLength; i++) {
      const particle = this.add.circle(ball.x, ball.y, 6 - i * 0.3, 0xFFFFFF, 0.8 - i * 0.06);
      particle.setDepth(-2);
      
      // Add glow effect to each particle
      const glowParticle = this.add.circle(ball.x, ball.y, (6 - i * 0.3) + 2, 0xFFFFFF, 0.2 - i * 0.02);
      glowParticle.setDepth(-3);
      
      trailParticles.push(particle);

      // Enhanced fade out with bounce effect
      this.tweens.add({
        targets: [particle, glowParticle],
        alpha: 0,
        scale: 0.1,
        duration: 400 + i * 30,
        ease: 'Sine.easeOut',
        onComplete: () => {
          particle.destroy();
          glowParticle.destroy();
        }
      });
    }

    // Update trail positions with realistic trailing effect
    let trailIndex = 0;
    const trailUpdate = () => {
      if (trailIndex < trailLength && ball.active) {
        const particle = trailParticles[trailIndex];
        if (particle) {
          // Add some randomness to trail position for realism
          const jitterX = (Math.random() - 0.5) * 8;
          const jitterY = (Math.random() - 0.5) * 8;
          particle.setPosition(ball.x + jitterX, ball.y + jitterY);
        }
        trailIndex++;
      } else {
        this.events.off('update', trailUpdate);
      }
    };

    // Update trail every frame with slight delay for natural trailing
    const trailInterval = setInterval(() => {
      if (!ball.active) {
        clearInterval(trailInterval);
        return;
      }
      trailUpdate();
    }, 16); // ~60fps

    // Clean up interval after animation completes
    setTimeout(() => {
      clearInterval(trailInterval);
    }, 1500);
  }

  private playBallSlideSound() {
    // Add sound effect for ball sliding (placeholder for actual sound implementation)
    console.log('Playing ball slide sound effect');

    // In a real implementation, you would play an audio file:
    // if (this.sound && this.sound.get('ballSlide')) {
    //   this.sound.play('ballSlide', { volume: 0.3 });
    // }
  }

  private playPottingSound() {
    // Add sound effect for successful ball potting
    console.log('Playing potting sound effect');

    // In a real implementation, you would play an audio file:
    // if (this.sound && this.sound.get('ballPocketed')) {
    //   this.sound.play('ballPocketed', { volume: 0.4 });
    // }
  }

  private slideBallOffTable(ball: Phaser.Physics.Matter.Sprite, pocketX: number, pocketY: number) {
    // Determine direction to slide off table based on pocket position
    let targetX = pocketX;
    let targetY = pocketY;

    // Slide direction based on pocket location
    if (pocketY < this.scale.height * 0.4) {
      // Top pocket - slide off top
      targetY = -50; // Slide above table
      targetX = pocketX + (Math.random() - 0.5) * 100; // Random horizontal offset
    } else if (pocketY > this.scale.height * 0.6) {
      // Bottom pocket - slide off bottom
      targetY = this.scale.height + 50; // Slide below table
      targetX = pocketX + (Math.random() - 0.5) * 100; // Random horizontal offset
    } else if (pocketX < this.scale.width * 0.4) {
      // Left pocket - slide off left
      targetX = -50; // Slide left of table
      targetY = pocketY + (Math.random() - 0.5) * 100; // Random vertical offset
    } else {
      // Right pocket - slide off right
      targetX = this.scale.width + 50; // Slide right of table
      targetY = pocketY + (Math.random() - 0.5) * 100; // Random vertical offset
    }

    console.log(`Sliding ball off table to:`, { targetX, targetY });

    // Add final glow effect before disappearing
    const glowEffect = this.add.circle(ball.x, ball.y, 25, 0xFFFFFF, 0.3);
    glowEffect.setDepth(-1);

    // Slide ball off table with enhanced fade out and effects
    this.tweens.add({
      targets: ball,
      x: targetX,
      y: targetY,
      alpha: 0,
      scale: 0.3,
      duration: 1200,
      ease: 'Power2',
      onUpdate: (tween, target) => {
        // Update glow position and fade it out
        glowEffect.setPosition(target.x, target.y);
        glowEffect.setAlpha(target.alpha * 0.5);

        // Add subtle bounce effect as ball falls off table
        const progress = tween.progress;
        if (progress > 0.3) {
          const bounceOffset = Math.sin(progress * Math.PI * 4) * 2;
          target.y += bounceOffset;
        }
      },
      onComplete: () => {
        // Remove ball and glow from game
        ball.destroy();
        glowEffect.destroy();
        console.log('Ball removed from table after enhanced sliding animation');

        // Play potting sound effect
        this.playPottingSound();
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

    // Remove ball from table
    ball.setActive(false);
    ball.setVisible(false);

    // Track balls remaining
    if (currentPlayerGroup && ballType === currentPlayerGroup) {
      this.ballsRemaining[ballType]--;
      this.ballsPocketedThisTurn.push(ball);
      console.log(`Group ball pocketed! ${currentPlayerGroup} remaining: ${this.ballsRemaining[ballType]}`);
    }

    // Check if first ball of correct group was hit
    if (this.firstHitBall && this.firstHitBall.getData('type') === ballType) {
      // Valid shot - continue turn
      this.updateScore(ballType);
    } else {
      // Foul - wrong group
      this.handleFoul(`Must hit your group balls first!`);
    }
  }

  private determinePlayerGroups() {
    // After break shot, determine which player gets solids vs stripes
    // Simple random assignment for now
    const solidsPlayer = Math.random() < 0.5 ? 0 : 1;
    this.playerGroups.player1 = solidsPlayer === 0 ? 'solid' : 'stripe';
    this.playerGroups.player2 = solidsPlayer === 0 ? 'stripe' : 'solid';
    this.currentPlayerGroup = this.playerGroups.player1;

    console.log(`Player 1 gets: ${this.playerGroups.player1}, Player 2 gets: ${this.playerGroups.player2}`);
  }

  private handleFoul(message: string) {
    console.log('Foul committed:', message);

    // Show foul message
    const foulText = this.add.text(this.scale.width / 2, this.scale.height / 2, `FOUL: ${message}`, {
      fontSize: '32px',
      color: '#FF0000',
      backgroundColor: '#00000080',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    // Remove foul message after delay
    setTimeout(() => {
      foulText.destroy();
    }, 2000);

    // Ball in hand - place cue ball anywhere
    this.handleBallInHand();
  }

  private handleBallInHand() {
    // After foul, player can place cue ball anywhere
    this.cueBall?.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.cueBall?.setVelocity(0, 0);

    // Switch turn to other player
    this.switchTurn();
  }

  private handleCollisionStart(_event: any) {
    // Handle ball-to-ball collisions
    _event.pairs.forEach((pair: any) => {
      const { bodyA, bodyB } = pair;

      // Check if cue ball hit any ball
      if (bodyA.gameObject === this.cueBall || bodyB.gameObject === this.cueBall) {
        const otherBall = bodyA.gameObject === this.cueBall ? bodyB.gameObject : bodyA.gameObject;

        if (otherBall && otherBall.getData('type') !== 'cue') {
          console.log('Cue ball hit', otherBall.getData('type'), 'ball #', otherBall.getData('number'));
        }
      }
    });
  }

  private handleCollisionActive(_event: any) {
    // Handle active collisions
  }

  private handleCollisionEnd(_event: any) {
    // Handle collision end
  }

  private updateScore(_ballType: string) {
    // Update score based on ball pocketed
    if (this.scoreText) {
      // Simple score update - in real game would track actual balls
      this.scoreText.setText(`Score: 1-0`);
    }
  }

  private switchTurn() {
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

    // Show turn change notification
    const turnChangeText = this.add.text(this.scale.width / 2, this.scale.height / 2, `${currentPlayer.username}'s Turn`, {
      fontSize: '32px',
      color: isCurrentUser ? '#00FF00' : '#FF0000',
      backgroundColor: '#00000080',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    // Remove after delay
    setTimeout(() => {
      turnChangeText.destroy();
    }, 2000);
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
    // TODO: Implement backend API call to send game results
    console.log('Game results:', {
      winnerId,
      gameId: this.gameData.gameId,
      score: 'Player 1: 5, Player 2: 2' // Example score
    });

    // In real implementation, this would call:
    // fetch(`/api/games/${this.gameData.gameId}/complete`, {
    //   method: 'POST',
    //   body: JSON.stringify({ winnerId, loserId, score })
    // });
  }

  update() {
    // Continuously validate ball boundaries to prevent balls from escaping
    this.validateBallBoundaries();

    // Update game logic each frame
    if (this.cueBall && (this.cueBall.body as any).speed < 0.1 && !this.isAiming) {
      // All balls have stopped, check if we should switch turns
      if (this.gameStarted && !this.gameOverText) {
        // Check if any balls were pocketed during this turn
        const ballsMoving = this.balls.some(ball => (ball.body as any).speed > 0.1);

        if (!ballsMoving) {
          // Delay turn switch slightly to allow for any late pocket detections
          setTimeout(() => {
            if (this.gameStarted && !this.isAiming && !this.gameOverText) {
              this.switchTurn();
            }
          }, 1000);
        }
      }
    }

    // Update power indicator if aiming
    if (this.isAiming && this.powerIndicator) {
      // Make power indicator pulse
      const pulse = Math.sin(Date.now() * 0.005) * 10 + 10;
      this.powerIndicator.setSize(this.powerIndicator.width, pulse);
    }
  }
}

// Register the scene with Phaser
export default PoolGame;