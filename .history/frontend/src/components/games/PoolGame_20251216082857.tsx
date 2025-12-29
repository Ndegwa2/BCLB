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
    <div className="pool-game-container">
      {/* Game Header */}
      <div className="pool-game-header">
        <h2 className="pool-game-title">9 Ball Pool - {currentGame.game_code}</h2>
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
        {/* Game Canvas will go here */}
        <div className="pool-game-loading">
          <div className="pool-loading-content">
            <h3 className="text-2xl mb-4">9-Ball Pool Loading...</h3>
            <p>Game Type: {currentGame.game_type}</p>
            <p>Players: {gameState.players.length}/2</p>
            {gameState.players.map((player: any) => (
              <div key={player.userId} className={`mt-2 ${player.isCurrentUser ? 'pool-player-current' : 'pool-player-info'}`}>
                {player.username} {player.isCurrentUser && '(You)'}
              </div>
            ))}
          </div>
        </div>
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
  private powerIndicator: Phaser.GameObjects.Rectangle | null = null;
  private isAiming = false;
  private shotPower = 0;
  private maxPower = 100;
  private currentPlayerTurn = 0;
  private gameStarted = false;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private turnText: Phaser.GameObjects.Text | null = null;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private gameType: 'nineball' | 'none' = 'none';
  private nineBallPocketed = false;
  private lowestBallOnTable = 1;

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

      // Load ball assets with fallbacks for 9-ball
      const ballAssets = [
        { key: 'ball1', path: '/assets/pool/ball-1.png' },
        { key: 'ball2', path: '/assets/pool/ball-2.png' },
        { key: 'ball3', path: '/assets/pool/ball-3.png' },
        { key: 'ball4', path: '/assets/pool/ball-4.png' },
        { key: 'ball5', path: '/assets/pool/ball-5.png' },
        { key: 'ball6', path: '/assets/pool/ball-6.png' },
        { key: 'ball7', path: '/assets/pool/ball-7.png' },
        { key: 'ball8', path: '/assets/pool/ball-8.png' },
        { key: 'ball9', path: '/assets/pool/ball-9.png' }
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
      this.matter.add.circle(pos.x, pos.y, pocketSize * 0.8, {
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

    // Create 9 balls for 9-ball pool (1-9) plus cue ball
    // Using a color scheme with blue solids and green stripes concept
    const ballTypes = [
      { key: 'ball1', type: 'nineball', number: 1, color: 0x0000FF }, // Blue (solid concept)
      { key: 'ball2', type: 'nineball', number: 2, color: 0x0000FF }, // Blue (solid concept)
      { key: 'ball3', type: 'nineball', number: 3, color: 0x0000FF }, // Blue (solid concept)
      { key: 'ball4', type: 'nineball', number: 4, color: 0x0000FF }, // Blue (solid concept)
      { key: 'ball5', type: 'nineball', number: 5, color: 0x00FF00 }, // Green (stripe concept)
      { key: 'ball6', type: 'nineball', number: 6, color: 0x00FF00 }, // Green (stripe concept)
      { key: 'ball7', type: 'nineball', number: 7, color: 0x00FF00 }, // Green (stripe concept)
      { key: 'ball8', type: 'nineball', number: 8, color: 0x00FF00 }, // Green (stripe concept)
      { key: 'ball9', type: 'nineball', number: 9, color: 0xFFFF00 }, // Yellow (9-ball - special)
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
        (ball as any).setFillStyle(ballConfig.color);
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

    // Create diamond rack formation for 9-ball
    // 9-ball rack: 1 ball at top, 2 in middle, 3 at bottom, 2 in middle, 1 at top
    // Position: 1 at top, then 2-3-4, then 5-6-7-8-9

    // Top ball (1-ball)
    positions.push({
      x: centerX,
      y: centerY - ballSpacing * 2
    });

    // Second row (2 balls)
    positions.push({
      x: centerX - ballSpacing/2,
      y: centerY - ballSpacing
    });
    positions.push({
      x: centerX + ballSpacing/2,
      y: centerY - ballSpacing
    });

    // Third row (3 balls)
    positions.push({
      x: centerX - ballSpacing,
      y: centerY
    });
    positions.push({
      x: centerX,
      y: centerY
    });
    positions.push({
      x: centerX + ballSpacing,
      y: centerY
    });

    // Fourth row (2 balls)
    positions.push({
      x: centerX - ballSpacing/2,
      y: centerY + ballSpacing
    });
    positions.push({
      x: centerX + ballSpacing/2,
      y: centerY + ballSpacing
    });

    // Fifth row (1 ball - 9-ball in center)
    positions.push({
      x: centerX,
      y: centerY + ballSpacing * 2
    });

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
    this.add.text(this.scale.width / 2, this.scale.height - 50, '9-Ball Pool: Hit lowest ball first. Pocket 9-ball to win!', {
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
    // For 9-ball, no need to determine ball types
    // Just set game type to nineball
    setTimeout(() => {
      this.gameType = 'nineball';
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

    if (ballType === 'nineball' && ballNumber === 9 && !this.nineBallPocketed) {
      this.nineBallPocketed = true;
      this.handleNineBallPocketed(ball);
      return;
    }

    // For 9-ball, check if the lowest ball was hit first
    if (ballNumber === this.lowestBallOnTable) {
      // Valid pocket - continue turn
      ball.setActive(false);
      ball.setVisible(false);

      // Update lowest ball on table
      this.updateLowestBallOnTable();

      // Update score
      this.updateScore(ballType);
    } else {
      // Foul - wrong ball pocketed (not the lowest)
      this.handleFoul(`Must hit ball ${this.lowestBallOnTable} first!`);
    }
  }

  private handleNineBallPocketed(ball: Phaser.Physics.Matter.Sprite) {
    const currentPlayer = this.gameData.players[this.currentPlayerTurn];

    // Check if 9-ball was pocketed legally (lowest ball was hit first)
    if (this.lowestBallOnTable === 9 || this.checkValidNineBallPocket()) {
      // Valid 9-ball pocket - player wins
      this.endGame(currentPlayer.userId, 'win');
    } else {
      // Invalid 9-ball pocket - spot 9-ball and continue game
      ball.setActive(true);
      ball.setVisible(true);
      ball.setPosition(this.scale.width * 0.5, this.scale.height * 0.5); // Spot 9-ball

      // Foul committed
      this.handleFoul('9-ball pocketed out of order!');
    }
  }


  private updateLowestBallOnTable() {
    // Find the lowest numbered ball still on the table
    let newLowest = 10; // Start higher than any ball

    this.balls.forEach(ball => {
      if (ball.active && ball.getData('number') < newLowest && ball.getData('number') !== 0) {
        newLowest = ball.getData('number');
      }
    });

    this.lowestBallOnTable = newLowest;
    console.log(`Lowest ball on table updated to: ${this.lowestBallOnTable}`);
  }

  private checkValidNineBallPocket(): boolean {
    // For 9-ball, check if the 9-ball was the lowest ball or if all lower balls are pocketed
    return this.lowestBallOnTable === 9;
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