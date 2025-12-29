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
        (phaserGameRef.current.scene.scenes[0] as any).gameData = {
          gameId: currentGame.id,
          players: gameState.players,
          currentUserId: authState.user?.id,
          gameType: currentGame.game_type
        };
        console.log('Game data passed to scene successfully');
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

// Pool Game Scene with Phaser - Complete Implementation
class PoolGameScene extends Phaser.Scene {
  private gameData: any;
  private cueBall: Phaser.Physics.Matter.Sprite | null = null;
  private balls: Phaser.Physics.Matter.Sprite[] = [];
  private pockets: Phaser.GameObjects.Rectangle[] = [];
  private cue: Phaser.GameObjects.Line | null = null;
  private powerIndicator: Phaser.GameObjects.Rectangle | null = null;
  private isAiming = false;
  private shotPower = 0;
  private maxPower = 100;
  private currentPlayerTurn = 0;
  private gameStarted = false;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private turnText: Phaser.GameObjects.Text | null = null;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private player1Balls: string[] = [];
  private player2Balls: string[] = [];
  private gameType: 'solids' | 'stripes' | 'none' = 'none';
  private eightBallPocketed = false;
  private foulCommitted = false;

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

      // Load ball assets with fallbacks
      const ballAssets = [
        { key: 'solid1', path: '/assets/pool/solid-1.png' },
        { key: 'solid2', path: '/assets/pool/solid-2.png' },
        { key: 'solid3', path: '/assets/pool/solid-3.png' },
        { key: 'solid4', path: '/assets/pool/solid-4.png' },
        { key: 'solid5', path: '/assets/pool/solid-5.png' },
        { key: 'solid6', path: '/assets/pool/solid-6.png' },
        { key: 'solid7', path: '/assets/pool/solid-7.png' },
        { key: 'stripe9', path: '/assets/pool/stripe-9.png' },
        { key: 'stripe10', path: '/assets/pool/stripe-10.png' },
        { key: 'stripe11', path: '/assets/pool/stripe-11.png' },
        { key: 'stripe12', path: '/assets/pool/stripe-12.png' },
        { key: 'stripe13', path: '/assets/pool/stripe-13.png' },
        { key: 'stripe14', path: '/assets/pool/stripe-14.png' },
        { key: 'stripe15', path: '/assets/pool/stripe-15.png' },
        { key: 'eightBall', path: '/assets/pool/8-ball.png' }
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
    const felt = this.add.rectangle(
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
  }

  private createPockets() {
    const pocketSize = 40;
    const pocketColor = 0x000000;

    // Create 6 pockets (standard pool table layout)
    const pocketPositions = [
      { x: this.scale.width * 0.1, y: this.scale.height * 0.15 }, // Top left
      { x: this.scale.width * 0.5, y: this.scale.height * 0.15 }, // Top center
      { x: this.scale.width * 0.9, y: this.scale.height * 0.15 }, // Top right
      { x: this.scale.width * 0.1, y: this.scale.height * 0.85 }, // Bottom left
      { x: this.scale.width * 0.5, y: this.scale.height * 0.85 }, // Bottom center
      { x: this.scale.width * 0.9, y: this.scale.height * 0.85 }  // Bottom right
    ];

    pocketPositions.forEach((pos, index) => {
      const pocket = this.add.circle(pos.x, pos.y, pocketSize, pocketColor);
      (this.pockets as any).push(pocket);

      // Add physics sensor for ball detection
      const sensor = this.matter.add.circle(pos.x, pos.y, pocketSize * 0.8, {
        isSensor: true,
        label: `pocket-${index}`,
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001
        }
      });
    });
  }

  private createBalls() {
    const ballRadius = 20;
    const ballPositions = this.getBallRackPositions();

    // Create cue ball (white) with fallback
    let cueBall: Phaser.Physics.Matter.Sprite;
    try {
      cueBall = this.matter.add.image(
        this.scale.width * 0.75,
        this.scale.height * 0.5,
        'cueBall'
      ) as Phaser.Physics.Matter.Sprite;
    } catch (e) {
      console.warn('Using fallback for cue ball');
      // Create a white circle as fallback
      cueBall = this.matter.add.circle(
        this.scale.width * 0.75,
        this.scale.height * 0.5,
        ballRadius,
        { label: 'cueBall' }
      ) as any;
      // Set color manually
      (cueBall as any).setFillStyle(0xFFFFFF);
    }

    cueBall.setCircle(ballRadius);
    cueBall.setFriction(0.02);
    (cueBall.body as any).restitution = 0.8;
    cueBall.setMass(1);
    cueBall.setCollisionCategory(0x0001);
    cueBall.setCollidesWith(0x0001);
    cueBall.setData('type', 'cue');
    cueBall.setData('number', 0);

    this.cueBall = cueBall;
    this.balls.push(cueBall);

    // Create 15 colored balls (7 solids, 7 stripes, 1 eight-ball)
    const ballTypes = [
      { key: 'solid1', type: 'solid', number: 1, color: 0xFF0000 }, // Red
      { key: 'solid2', type: 'solid', number: 2, color: 0x00FF00 }, // Green
      { key: 'solid3', type: 'solid', number: 3, color: 0x0000FF }, // Blue
      { key: 'solid4', type: 'solid', number: 4, color: 0xFFFF00 }, // Yellow
      { key: 'solid5', type: 'solid', number: 5, color: 0xFF00FF }, // Purple
      { key: 'solid6', type: 'solid', number: 6, color: 0x00FFFF }, // Cyan
      { key: 'solid7', type: 'solid', number: 7, color: 0xFF8800 }, // Orange
      { key: 'stripe9', type: 'stripe', number: 9, color: 0xFF0000 }, // Red stripe
      { key: 'stripe10', type: 'stripe', number: 10, color: 0x00FF00 }, // Green stripe
      { key: 'stripe11', type: 'stripe', number: 11, color: 0x0000FF }, // Blue stripe
      { key: 'stripe12', type: 'stripe', number: 12, color: 0xFFFF00 }, // Yellow stripe
      { key: 'stripe13', type: 'stripe', number: 13, color: 0xFF00FF }, // Purple stripe
      { key: 'stripe14', type: 'stripe', number: 14, color: 0x00FFFF }, // Cyan stripe
      { key: 'stripe15', type: 'stripe', number: 15, color: 0xFF8800 }, // Orange stripe
      { key: 'eightBall', type: 'eight', number: 8, color: 0x000000 }  // Black
    ];

    ballTypes.forEach((ballConfig, index) => {
      let ball: Phaser.Physics.Matter.Sprite;
      try {
        ball = this.matter.add.image(
          ballPositions[index].x,
          ballPositions[index].y,
          ballConfig.key
        ) as Phaser.Physics.Matter.Sprite;
      } catch (e) {
        console.warn(`Using fallback for ball ${ballConfig.key}`);
        // Create colored circle as fallback
        ball = this.matter.add.circle(
          ballPositions[index].x,
          ballPositions[index].y,
          ballRadius,
          { label: `ball-${ballConfig.number}` }
        ) as any;
        // Set color manually
        ball.setFillStyle(ballConfig.color);
      }

      ball.setCircle(ballRadius);
      ball.setFriction(0.02);
      (ball.body as any).restitution = 0.8;
      ball.setMass(1);
      ball.setCollisionCategory(0x0001);
      ball.setCollidesWith(0x0001);
      ball.setData('type', ballConfig.type);
      ball.setData('number', ballConfig.number);

      this.balls.push(ball);
    });
  }

  private getBallRackPositions(): {x: number, y: number}[] {
    const positions: {x: number, y: number}[] = [];
    const centerX = this.scale.width * 0.25;
    const centerY = this.scale.height * 0.5;
    const ballSpacing = 30;

    // Create triangle rack formation
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        positions.push({
          x: centerX + (col - row/2) * ballSpacing,
          y: centerY + row * ballSpacing * Math.sqrt(3)/2
        });
      }
    }

    return positions;
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
    this.add.text(this.scale.width / 2, this.scale.height - 50, 'Click and drag to aim, release to shoot', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
  }

  private setupEventListeners() {
    // Collision events
    this.matter.world.on('collisionstart', this.handleCollisionStart, this);
    this.matter.world.on('collisionactive', this.handleCollisionActive, this);
    this.matter.world.on('collisionend', this.handleCollisionEnd, this);

    // Ball vs pocket collisions
    this.matter.world.on('collisionstart', (event: any) => {
      this.handleBallPocketCollisions(event);
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall || this.isAiming || this.gameOverText) return;

    // Check if clicking near cue ball (only on current player's turn)
    const currentPlayer = this.gameData.players[this.currentPlayerTurn];
    if (currentPlayer.userId !== this.gameData.currentUserId) {
      console.log('Not your turn!');
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      pointer.worldX, pointer.worldY,
      this.cueBall.x, this.cueBall.y
    );

    if (distance < 150) { // Within reasonable distance to cue ball
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

    if (this.powerIndicator) {
      this.powerIndicator.destroy();
      this.powerIndicator = null;
    }

    // Apply force to cue ball
    this.shootCueBall(pointer);
  }

  private createCue(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall) return;

    // Create cue line from cue ball to mouse position
    this.cue = this.add.line(
      0, 0,
      0, 0,
      0xFFFFFF, 1
    );
    this.cue.setLineWidth(3);
    this.cue.setOrigin(0);

    this.updateCue(pointer);
  }

  private updateCue(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall || !this.cue) return;

    // Update cue line
    this.cue.setTo(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );
  }

  private createPowerIndicator(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall) return;

    // Create power indicator
    this.powerIndicator = this.add.rectangle(
      this.cueBall.x, this.cueBall.y,
      10, 20,
      0xFF0000
    );
    this.powerIndicator.setOrigin(0.5, 1);
    this.powerIndicator.setRotation(Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    ));

    this.updatePowerIndicator(pointer);
  }

  private updatePowerIndicator(pointer: Phaser.Input.Pointer) {
    if (!this.powerIndicator || !this.cueBall) return;

    // Update power indicator length based on shot power
    const maxLength = 100;
    const currentLength = (this.shotPower / this.maxPower) * maxLength;

    this.powerIndicator.setSize(currentLength, 20);

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
  }

  private shootCueBall(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall) return;

    // Calculate direction vector
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );

    // Apply force based on power
    const force = this.shotPower * 0.03;
    const forceX = Math.cos(angle) * force;
    const forceY = Math.sin(angle) * force;

    // Apply impulse to cue ball
    this.cueBall.setVelocity(forceX, forceY);

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
    // After break shot, determine which player gets which ball type
    setTimeout(() => {
      let solidsPotted = 0;
      let stripesPotted = 0;

      // Check which balls were pocketed
      this.balls.forEach(ball => {
        if (ball.active && ball.getData('type') === 'solid') solidsPotted++;
        if (ball.active && ball.getData('type') === 'stripe') stripesPotted++;
      });

      // Determine game type based on break shot results
      if (solidsPotted > stripesPotted) {
        this.gameType = 'solids';
        this.player1Balls = ['solid'];
        this.player2Balls = ['stripe'];
      } else if (stripesPotted > solidsPotted) {
        this.gameType = 'stripes';
        this.player1Balls = ['stripe'];
        this.player2Balls = ['solid'];
      } else {
        // If no balls pocketed or equal, current player continues with their choice
        this.gameType = 'solids'; // Default to solids for current player
        this.player1Balls = ['solid'];
        this.player2Balls = ['stripe'];
      }

      this.updateTurnIndicator();
    }, 3000); // Wait for balls to settle
  }

  private handleBallPocketCollisions(event: any) {
    event.pairs.forEach((pair: any) => {
      const { bodyA, bodyB } = pair;

      // Check if ball entered pocket
      if (bodyA.label && bodyA.label.startsWith('pocket-')) {
        const ball = bodyB.gameObject;
        if (ball && ball !== this.cueBall && ball.active) {
          this.handleBallPocketed(ball);
        }
      } else if (bodyB.label && bodyB.label.startsWith('pocket-')) {
        const ball = bodyA.gameObject;
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

    if (ballType === 'eight' && !this.eightBallPocketed) {
      this.eightBallPocketed = true;
      this.handleEightBallPocketed(ball);
      return;
    }

    // Check if ball belongs to current player
    const currentPlayerBalls = this.currentPlayerTurn === 0 ? this.player1Balls : this.player2Balls;

    if (currentPlayerBalls.includes(ballType) || this.gameType === 'none') {
      // Valid pocket - continue turn
      ball.setActive(false);
      ball.setVisible(false);

      // Update score
      this.updateScore(ballType);

      // Check if all player's balls are pocketed
      if (this.checkAllBallsPocketed()) {
        // Player can now pocket the 8-ball
        (this as any).gameType = 'eightBall';
      }
    } else {
      // Foul - wrong ball pocketed
      this.handleFoul(`Wrong ball type pocketed! Should pocket ${currentPlayerBalls.join(' or ')} balls.`);
    }
  }

  private handleEightBallPocketed(ball: Phaser.Physics.Matter.Sprite) {
    const currentPlayer = this.gameData.players[this.currentPlayerTurn];

    if (this.checkValidEightBallPocket()) {
      // Valid 8-ball pocket - player wins
      this.endGame(currentPlayer.userId, 'win');
    } else {
      // Invalid 8-ball pocket - player loses
      this.endGame(
        this.currentPlayerTurn === 0 ? this.gameData.players[1].userId : this.gameData.players[0].userId,
        'win'
      );
    }
  }

  private checkValidEightBallPocket(): boolean {
    // Check if all of current player's balls are pocketed
    const currentPlayerBalls = this.currentPlayerTurn === 0 ? this.player1Balls : this.player2Balls;
    const ballTypeToCheck = currentPlayerBalls[0]; // 'solid' or 'stripe'

    let allBallsPocketed = true;

    this.balls.forEach(ball => {
      if (ball.active && ball.getData('type') === ballTypeToCheck && ball.getData('number') !== 8) {
        allBallsPocketed = false;
      }
    });

    return allBallsPocketed;
  }

  private checkAllBallsPocketed(): boolean {
    const currentPlayerBalls = this.currentPlayerTurn === 0 ? this.player1Balls : this.player2Balls;
    const ballTypeToCheck = currentPlayerBalls[0]; // 'solid' or 'stripe'

    let allBallsPocketed = true;

    this.balls.forEach(ball => {
      if (ball.active && ball.getData('type') === ballTypeToCheck && ball.getData('number') !== 8) {
        allBallsPocketed = false;
      }
    });

    return allBallsPocketed;
  }

  private handleFoul(message: string) {
    this.foulCommitted = true;
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

  private handleCollisionStart(event: any) {
    // Handle ball-to-ball collisions
    event.pairs.forEach((pair: any) => {
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

  private handleCollisionActive(event: any) {
    // Handle active collisions
  }

  private handleCollisionEnd(event: any) {
    // Handle collision end
  }

  private updateScore(ballType: string) {
    // Update score based on ball pocketed
    const currentPlayerScore = this.currentPlayerTurn === 0 ? 'player1' : 'player2';

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

  private endGame(winnerId: number, result: 'win' | 'loss') {
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

    const winnerText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, `${winner.username} WINS!`, {
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

  private sendGameResults(winnerId: number, loserId: number) {
    // TODO: Implement backend API call to send game results
    console.log('Game results:', {
      winnerId,
      loserId,
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