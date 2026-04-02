import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { apiClient } from '../../services/api';
import { GameEntry, PoolGameState } from '../../types/game';
import { User } from '../../types/auth';
import * as Phaser from 'phaser';

/**
 * Hyper-Realistic 8-Ball Pool Game
 * Features:
 * - Photorealistic ball rendering with 3D sphere effects, specular highlights
 * - Realistic cue stick with tapered wood, leather tip, ferrule
 * - Detailed pool table with wood grain, felt texture, diamond markers
 * - Physics-accurate ball movement and collisions
 * - Particle effects for pocketing, break shot, celebrations
 * - Sound effects integration
 */

// Sound effects library
const SOUNDS = {
  ballCollision: '/sounds/ball_collision.mp3',
  cushionHit: '/sounds/cushion_bounce.mp3',
  ballPocketed: '/sounds/ball_pocket.mp3',
  cueScratch: '/sounds/cue_scratch.mp3',
  cueHit: '/sounds/cue_strike.mp3',
  gameWin: '/sounds/victory.mp3',
  foul: '/sounds/foul_buzzer.mp3',
  applause: '/sounds/crowd_applause.mp3'
};

// Physics constants - tuned for realistic 8-ball pool behavior
const PHYSICS_CONFIG = {
  ballFriction: 0.012,        // Rolling resistance on felt
  ballFrictionAir: 0.005,     // Air resistance (minimal)
  ballBounce: 0.92,           // Ball-to-ball restitution
  ballMass: 1,                // Relative mass (standard pool ball ~170g)
  wallRestitution: 0.78,      // Cushion bounce (realistic damping)
  wallFriction: 0.015,        // Cushion friction
  stopThreshold: 0.08,        // Velocity threshold for stopping
  velocityMultiplier: 0.38,   // Shot power to velocity conversion
  angularDamping: 0.02,       // Spin decay
  linearDamping: 0.015        // Velocity decay
};

// Table configuration - 9-foot professional pool table proportions
const TABLE_CONFIG = {
  cushionWidth: 50,
  pocketRadii: [26, 22, 26, 26, 22, 26],  // Corner pockets slightly larger
  feltColor: 0x0a5f38,         // Simonis 860 green
  feltGradientTop: 0x0d7043,   // Lighter at top (lighting effect)
  feltGradientBottom: 0x08502f, // Darker at bottom
  railColor: 0x654321,         // Rich wood brown
  railTrim: 0x8b6f47,          // Lighter wood trim
  woodFrame: 0x2d1810,         // Dark mahogany
  woodGrain: 0x3d2817,         // Wood grain accent
  diamondColor: 0xd4af37,      // Gold diamond markers
  diamondBezel: 0x8b7355       // Diamond bezel
};

// Sound Manager for pool game
class SoundManager {
  // private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private enabled: boolean = true;

  constructor() {
    // No scene needed - using HTML5 Audio API directly
  }

  preload() {
    // Sounds will be loaded dynamically
  }

  play(soundName: string, volume: number = 1.0) {
    if (!this.enabled) return;
    
    try {
      // Create audio element for sound playback
      const audio = new Audio(SOUNDS[soundName as keyof typeof SOUNDS] || '');
      audio.volume = Math.min(Math.max(volume, 0), 1);
      audio.play().catch(() => {
        // Ignore audio play errors (browser restrictions)
      });
    } catch (e) {
      // Ignore sound errors
    }
  }

  playCollision(velocity: number) {
    const volume = Math.min(velocity / 50, 1);
    this.play('ballCollision', volume);
  }

  playCushion() {
    this.play('cushionHit', 0.6);
  }

  playPocket() {
    this.play('ballPocketed', 0.8);
  }

  playShot(power: number) {
    const volume = 0.3 + (power / 250) * 0.7;
    this.play('cueHit', volume);
  }

  playFoul() {
    this.play('foul', 0.7);
  }

  playVictory() {
    this.play('gameWin', 1.0);
    this.play('applause', 0.5);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// Particle system for effects
class ParticleSystem {
  private scene: Phaser.Scene;
  private particles: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createPocketEffect(x: number, y: number) {
    const particleCount = 15;
    const colors = [0xffd700, 0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0x00ffff];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 60 + Math.random() * 60;
      const life = 400 + Math.random() * 300;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 2 + Math.random() * 3;
      
      const particle = this.scene.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(x, y, size);
      particle.setDepth(150);
      
      this.particles.push(particle);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: life,
        ease: 'Power2',
        onComplete: () => {
          if (particle && particle.active) {
            particle.destroy();
            const idx = this.particles.indexOf(particle);
            if (idx > -1) this.particles.splice(idx, 1);
          }
        }
      });
    }
  }

  createBreakEffect(x: number, y: number) {
    const particleCount = 25;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 100;
      const life = 500 + Math.random() * 400;
      const hue = Math.random() * 60;
      const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5).color;
      const size = 3 + Math.random() * 4;
      
      const particle = this.scene.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(x, y, size);
      particle.setDepth(150);
      
      this.particles.push(particle);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: life,
        ease: 'Power3',
        onComplete: () => {
          if (particle && particle.active) {
            particle.destroy();
            const idx = this.particles.indexOf(particle);
            if (idx > -1) this.particles.splice(idx, 1);
          }
        }
      });
    }
  }

  createCollisionSpark(x: number, y: number, intensity: number) {
    const sparkCount = Math.floor(3 + intensity * 5);
    
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 30 * intensity;
      const life = 150 + Math.random() * 150;
      
      const spark = this.scene.add.graphics();
      spark.fillStyle(0xffff00, 1);
      spark.fillCircle(x, y, 1.5);
      spark.setDepth(140);
      
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: life,
        onComplete: () => {
          if (spark && spark.active) spark.destroy();
        }
      });
    }
  }

  destroy() {
    this.particles.forEach(p => {
      if (p && p.active) p.destroy();
    });
    this.particles = [];
  }
}

// Realistic 8-Ball Pool Game Scene
class PoolGameScene extends Phaser.Scene {
  private gameData: any;
  private cueBall: Phaser.Physics.Matter.Sprite | null = null;
  private balls: Phaser.Physics.Matter.Sprite[] = [];
  private cue: Phaser.GameObjects.Line | null = null;
  private cueStick: Phaser.GameObjects.Image | null = null;
  private powerIndicator: Phaser.GameObjects.Graphics | null = null;
  private aimingGuide: Phaser.GameObjects.Graphics | null = null;
  private ghostBall: Phaser.GameObjects.Graphics | null = null;
  private isAiming = false;
  private shotPower = 0;
  private maxPower = 250;
  private soundManager: SoundManager | null = null;
  private particleSystem: ParticleSystem | null = null;
  private shotTimer: number = 30;
  private shotTimerText: Phaser.GameObjects.Text | null = null;
  private shotTimerEvent: Phaser.Time.TimerEvent | null = null;
  private currentPlayerTurn = 0;
  private gameStarted = false;
  private gameOver = false;
  private turnText: Phaser.GameObjects.Text | null = null;
  private messageText: Phaser.GameObjects.Text | null = null;
  private pocketedBallsDisplay: Phaser.GameObjects.Container | null = null;
  private turnIndicator: Phaser.GameObjects.Container | null = null;
  private playerPanels: { player0: Phaser.GameObjects.Container | null, player1: Phaser.GameObjects.Container | null } = { player0: null, player1: null };
  private turnTransitionOverlay: Phaser.GameObjects.Graphics | null = null;
  private turnHistory: { player: number; action: string; timestamp: number }[] = [];
  private ballInHandIndicator: Phaser.GameObjects.Graphics | null = null;
  private turnArrow: Phaser.GameObjects.Graphics | null = null;
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
  private STOP_THRESHOLD = 0.15;
  private inputListenersRegistered = false;
  private canShoot = true;
  private isAIPlayer = false;
  private aiThinking = false;
  private aiDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  
  // Static flag to prevent duplicate texture generation across all scene instances
  private static texturesGenerated: boolean = false;

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
    console.log('[Scene Debug] create() called, scene key:', this.scene.key);
    
    // Initialize systems
    this.soundManager = new SoundManager();
    this.particleSystem = new ParticleSystem(this);
    
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
    this.startShotTimer();
    
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
    
    console.log('[Pool Game] Scene created successfully');
  }

  shutdown() {
    console.log('[Pool Game] Shutting down scene...');
    
    // Clean up particle system
    if (this.particleSystem) {
      this.particleSystem.destroy();
    }
    
    // Stop shot timer
    if (this.shotTimerEvent) {
      this.shotTimerEvent.destroy();
    }
    
    // DO NOT delete textures here - they are shared across scene instances
    // and will be reused when new scenes are created. The static flag
    // prevents redundant regeneration.
    
    console.log('[Pool Game] Scene shutdown complete, textures preserved for reuse');
  }

  /**
   * Create hyper-realistic pool table with wood grain, felt texture, and diamond markers
   * Based on professional 9-foot tournament tables (Diamond, Brunswick)
   */
  private createRealisticPoolTable() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Table dimensions (9-foot pool table ratio: 100" x 50" playing surface)
    const tableWidth = Math.min(w * 0.88, 1100);
    const tableHeight = tableWidth * 0.5;
    const tableX = (w - tableWidth) / 2;
    const tableY = (h - tableHeight) / 2;
    
    this.tableBounds = {
      left: tableX,
      right: tableX + tableWidth,
      top: tableY,
      bottom: tableY + tableHeight,
      feltLeft: tableX + 55,
      feltRight: tableX + tableWidth - 55,
      feltTop: tableY + 55,
      feltBottom: tableY + tableHeight - 55
    };

    // === LAYER 1: Room background with ambient lighting ===
    const roomBg = this.add.graphics();
    // Dark room background
    roomBg.fillStyle(0x1a1a2e, 1);
    roomBg.fillRect(0, 0, w, h);
    
    // Simulate gradient with layered rectangles (Phaser.Graphics doesn't support gradients directly)
    const gradientSteps = 20;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const y = h * 0.3 + t * h * 0.4;
      const height = h * 0.4 / gradientSteps;
      const alpha = 0.05 + t * 0.08;
      roomBg.fillStyle(0x0f0f1a, alpha);
      roomBg.fillRect(0, y, w, height);
    }
    
    // Subtle overhead light effect (simulating pool table lamp)
    roomBg.fillStyle(0xffffff, 0.06);
    roomBg.fillEllipse(w / 2, h / 2, tableWidth * 0.8, tableHeight * 1.5);

    // === LAYER 2: Table outer frame (wooden skirt) ===
    const frame = this.add.graphics();
    
    // Main frame with rounded corners
    frame.fillStyle(TABLE_CONFIG.woodFrame, 1);
    frame.fillRoundedRect(tableX - 45, tableY - 45, tableWidth + 90, tableHeight + 90, 28);
    
    // Wood grain effect - multiple layers for depth
    this.createWoodGrainEffect(frame, tableX, tableY, tableWidth, tableHeight);
    
    // Frame edge highlight (3D effect)
    frame.lineStyle(2, 0x5a4025, 0.5);
    frame.strokeRoundedRect(tableX - 45, tableY - 45, tableWidth + 90, tableHeight + 90, 28);
    
    // Inner frame shadow
    frame.fillStyle(0x000000, 0.3);
    frame.fillRoundedRect(tableX - 15, tableY - 15, tableWidth + 30, tableHeight + 30, 18);

    // === LAYER 3: Rails (cushions) with realistic 3D effect ===
    const rails = this.add.graphics();
    const railInset = 55;
    const railWidth = 35;
    
    // Top rail
    this.createRailWithHighlight(rails,
      tableX + railInset, tableY + 15,
      tableWidth - railInset * 2, railWidth, 'horizontal');
    
    // Bottom rail
    this.createRailWithHighlight(rails,
      tableX + railInset, tableY + tableHeight - 15 - railWidth,
      tableWidth - railInset * 2, railWidth, 'horizontal');
    
    // Left rail
    this.createRailWithHighlight(rails,
      tableX + 15, tableY + railInset,
      railWidth, tableHeight - railInset * 2, 'vertical');
    
    // Right rail
    this.createRailWithHighlight(rails,
      tableX + tableWidth - 15 - railWidth, tableY + railInset,
      railWidth, tableHeight - railInset * 2, 'vertical');

    // === LAYER 4: Felt surface with realistic texture ===
    const felt = this.add.graphics();
    
    // Main felt base color
    felt.fillStyle(TABLE_CONFIG.feltColor, 1);
    felt.fillRect(
      tableX + railInset + railWidth,
      tableY + railInset + railWidth,
      tableWidth - (railInset + railWidth) * 2,
      tableHeight - (railInset + railWidth) * 2
    );
    
    // Simulate gradient lighting with layered rectangles
    const feltLeft = tableX + railInset + railWidth;
    const feltTop = tableY + railInset + railWidth;
    const feltWidth = tableWidth - (railInset + railWidth) * 2;
    const feltHeight = tableHeight - (railInset + railWidth) * 2;
    
    // Top lighting (lighter)
    felt.fillStyle(TABLE_CONFIG.feltGradientTop, 0.3);
    felt.fillRect(feltLeft, feltTop, feltWidth, feltHeight * 0.3);
    
    // Bottom lighting (darker)
    felt.fillStyle(TABLE_CONFIG.feltGradientBottom, 0.3);
    felt.fillRect(feltLeft, feltTop + feltHeight * 0.7, feltWidth, feltHeight * 0.3);
    
    // Felt texture overlay (simulating wool fibers)
    this.createFeltTexture(felt,
      tableX + railInset + railWidth,
      tableY + railInset + railWidth,
      tableWidth - (railInset + railWidth) * 2,
      tableHeight - (railInset + railWidth) * 2
    );
    
    // Felt edge shadow (where felt meets cushion)
    felt.fillStyle(0x000000, 0.2);
    felt.fillRect(
      tableX + railInset + railWidth,
      tableY + railInset + railWidth,
      tableWidth - (railInset + railWidth) * 2,
      3
    );
    felt.fillRect(
      tableX + railInset + railWidth,
      tableY + tableHeight - railInset - railWidth - 3,
      tableWidth - (railInset + railWidth) * 2,
      3
    );

    // === LAYER 5: Table markings ===
    this.createTableMarkings(felt);

    // === LAYER 6: Diamond markers ===
    this.createDiamondMarkers(tableX, tableY, tableWidth, tableHeight);

    // === LAYER 7: Physics walls (invisible) ===
    this.createPhysicsWalls();
  }

  /**
   * Create realistic wood grain effect with multiple layers
   */
  private createWoodGrainEffect(graphics: Phaser.GameObjects.Graphics,
    tableX: number, tableY: number, tableWidth: number, tableHeight: number) {
    
    // Base wood color
    graphics.fillStyle(TABLE_CONFIG.woodFrame, 1);
    
    // Wood grain lines (horizontal)
    graphics.lineStyle(1, TABLE_CONFIG.woodGrain, 0.4);
    const grainSpacing = 8;
    for (let i = 0; i < (tableHeight + 90) / grainSpacing; i++) {
      const y = tableY - 45 + i * grainSpacing;
      const offset = Math.sin(i * 0.5) * 3;
      graphics.lineBetween(
        tableX - 45 + offset, y,
        tableX + tableWidth + 45 + offset, y + (i % 3 === 0 ? 2 : -1)
      );
    }
    
    // Wood grain lines (vertical)
    for (let i = 0; i < (tableWidth + 90) / grainSpacing; i++) {
      const x = tableX - 45 + i * grainSpacing;
      const offset = Math.cos(i * 0.3) * 2;
      graphics.lineBetween(
        x, tableY - 45 + offset,
        x + (i % 4 === 0 ? 2 : -1), tableY + tableHeight + 45 + offset
      );
    }
    
    // Knots in wood (occasional darker spots)
    graphics.fillStyle(0x1a0f08, 0.3);
    const knotPositions = [
      { x: tableX + tableWidth * 0.15, y: tableY - 20 },
      { x: tableX + tableWidth * 0.75, y: tableY + tableHeight + 15 },
      { x: tableX - 20, y: tableY + tableHeight * 0.4 },
      { x: tableX + tableWidth + 15, y: tableY + tableHeight * 0.7 }
    ];
    knotPositions.forEach(knot => {
      graphics.fillEllipse(knot.x, knot.y, 12, 8);
    });
  }

  /**
   * Create rail (cushion) with 3D highlight effect
   */
  private createRailWithHighlight(graphics: Phaser.GameObjects.Graphics,
    x: number, y: number, width: number, height: number, orientation: string) {
    
    // Rail base color
    graphics.fillStyle(TABLE_CONFIG.railColor, 1);
    graphics.fillRect(x, y, width, height);
    
    // Top highlight (light reflection)
    graphics.fillStyle(TABLE_CONFIG.railTrim, 0.6);
    if (orientation === 'horizontal') {
      graphics.fillRect(x, y, width, 4);
    } else {
      graphics.fillRect(x, y, 4, height);
    }
    
    // Bottom shadow
    graphics.fillStyle(0x000000, 0.3);
    if (orientation === 'horizontal') {
      graphics.fillRect(x, y + height - 4, width, 4);
    } else {
      graphics.fillRect(x + width - 4, y, 4, height);
    }
    
    // Rail edge bevel
    graphics.lineStyle(1, 0x8b6f47, 0.4);
    graphics.strokeRect(x, y, width, height);
  }

  /**
   * Create felt texture overlay (simulating wool fibers)
   */
  private createFeltTexture(graphics: Phaser.GameObjects.Graphics,
    x: number, y: number, width: number, height: number) {
    
    // Fine horizontal lines (felt weave)
    graphics.lineStyle(0.5, 0x0a4a0a, 0.08);
    const lineSpacing = 4;
    for (let i = 0; i < height / lineSpacing; i++) {
      const lineY = y + i * lineSpacing;
      graphics.lineBetween(x, lineY, x + width, lineY);
    }
    
    // Subtle noise pattern (felt irregularities)
    graphics.fillStyle(0x000000, 0.02);
    for (let i = 0; i < 200; i++) {
      const noiseX = x + Math.random() * width;
      const noiseY = y + Math.random() * height;
      graphics.fillCircle(noiseX, noiseY, 1);
    }
  }

  /**
   * Create table markings (head string, foot spot, head spot, center lines)
   */
  private createTableMarkings(graphics: Phaser.GameObjects.Graphics) {
    
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    const centerY = (feltTop + feltBottom) / 2;
    
    // Head string (break line) - positioned at 1/4 of table length
    const headStringX = feltLeft + (feltRight - feltLeft) * 0.25;
    graphics.lineStyle(2, 0xffffff, 0.25);
    graphics.lineBetween(headStringX, feltTop, headStringX, feltBottom);
    
    // Head spot (where cue ball is placed for break)
    graphics.fillStyle(0xffffff, 0.5);
    graphics.fillCircle(headStringX, centerY, 5);
    graphics.lineStyle(1, 0x000000, 0.3);
    graphics.strokeCircle(headStringX, centerY, 5);
    
    // Foot spot (where apex ball of rack is placed)
    const footSpotX = feltLeft + (feltRight - feltLeft) * 0.75;
    graphics.fillStyle(0xffffff, 0.5);
    graphics.fillCircle(footSpotX, centerY, 5);
    graphics.lineStyle(1, 0x000000, 0.3);
    graphics.strokeCircle(footSpotX, centerY, 5);
    
    // Center line (optional, for reference)
    graphics.lineStyle(1, 0xffffff, 0.1);
    graphics.lineBetween(feltLeft, centerY, feltRight, centerY);
    
    // Baulk area marking (area behind head string)
    graphics.lineStyle(1, 0xffffff, 0.15);
    graphics.strokeRect(feltLeft, feltTop, headStringX - feltLeft, feltBottom - feltTop);
  }

  /**
   * Create diamond markers on rails (professional tournament table feature)
   * Diamonds are used for aiming reference and are spaced at specific intervals
   */
  private createDiamondMarkers(tableX: number, tableY: number, tableWidth: number, tableHeight: number) {
    const markers = this.add.graphics();
    const goldColor = TABLE_CONFIG.diamondColor;
    const bezelColor = TABLE_CONFIG.diamondBezel;
    const railInset = 55;
    const railWidth = 35;
    
    // Diamond positions (standard spacing: 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8 of rail length)
    // Skip corners and center side pockets
    const longRailPositions = [0.125, 0.25, 0.375, 0.625, 0.75, 0.875];
    const shortRailPositions = [0.5];  // Only center diamond on short rails
    
    // Top rail diamonds
    longRailPositions.forEach(pos => {
      const x = tableX + railInset + railWidth + pos * (tableWidth - (railInset + railWidth) * 2);
      const y = tableY + railInset / 2;
      this.createDiamondShape(markers, x, y, goldColor, bezelColor);
    });
    
    // Bottom rail diamonds
    longRailPositions.forEach(pos => {
      const x = tableX + railInset + railWidth + pos * (tableWidth - (railInset + railWidth) * 2);
      const y = tableY + tableHeight - railInset / 2;
      this.createDiamondShape(markers, x, y, goldColor, bezelColor);
    });
    
    // Left rail diamond (center only)
    shortRailPositions.forEach(pos => {
      const x = tableX + railInset / 2;
      const y = tableY + railInset + railWidth + pos * (tableHeight - (railInset + railWidth) * 2);
      this.createDiamondShape(markers, x, y, goldColor, bezelColor);
    });
    
    // Right rail diamond (center only)
    shortRailPositions.forEach(pos => {
      const x = tableX + tableWidth - railInset / 2;
      const y = tableY + railInset + railWidth + pos * (tableHeight - (railInset + railWidth) * 2);
      this.createDiamondShape(markers, x, y, goldColor, bezelColor);
    });
  }

  /**
   * Create individual diamond shape with 3D effect
   */
  private createDiamondShape(graphics: Phaser.GameObjects.Graphics,
    x: number, y: number, goldColor: number, bezelColor: number) {
    
    const size = 5;
    
    // Diamond shadow/bezel
    graphics.fillStyle(bezelColor, 1);
    graphics.beginPath();
    graphics.moveTo(x, y - size - 1);
    graphics.lineTo(x + size + 1, y);
    graphics.lineTo(x, y + size + 1);
    graphics.lineTo(x - size - 1, y);
    graphics.closePath();
    graphics.fillPath();
    
    // Diamond face (gold/brass)
    graphics.fillStyle(goldColor, 1);
    graphics.beginPath();
    graphics.moveTo(x, y - size);
    graphics.lineTo(x + size, y);
    graphics.lineTo(x, y + size);
    graphics.lineTo(x - size, y);
    graphics.closePath();
    graphics.fillPath();
    
    // Diamond highlight (top-left)
    graphics.fillStyle(0xffffff, 0.4);
    graphics.beginPath();
    graphics.moveTo(x, y - size + 1);
    graphics.lineTo(x + size - 2, y);
    graphics.lineTo(x, y + 1);
    graphics.lineTo(x - size + 2, y);
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * Create physics walls (cushions) with proper positioning
   * Walls are positioned just inside the felt edge to simulate cushion bounce
   */
  private createPhysicsWalls() {
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    const { wallRestitution, wallFriction } = PHYSICS_CONFIG;
    const wallThickness = 15;
    
    // Top wall (with gap for corner pockets)
    const pocketOffset = 60;
    
    // Top-left section
    this.matter.add.rectangle(feltLeft + pocketOffset / 2, feltTop - 5, pocketOffset, wallThickness, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    // Top-center section
    const centerX = (feltLeft + feltRight) / 2;
    const centerGapStart = centerX - 40;
    const centerGapEnd = centerX + 40;
    
    this.matter.add.rectangle(feltLeft + pocketOffset + (centerGapStart - feltLeft - pocketOffset) / 2, feltTop - 5,
      centerGapStart - feltLeft - pocketOffset, wallThickness, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    this.matter.add.rectangle(centerGapEnd + (feltRight - centerGapEnd - pocketOffset) / 2, feltTop - 5,
      feltRight - centerGapEnd - pocketOffset, wallThickness, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    // Top-right section
    this.matter.add.rectangle(feltRight - pocketOffset / 2, feltTop - 5, pocketOffset, wallThickness, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    // Bottom walls (same pattern)
    this.matter.add.rectangle(feltLeft + pocketOffset / 2, feltBottom + 5, pocketOffset, wallThickness, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    this.matter.add.rectangle(feltLeft + pocketOffset + (centerGapStart - feltLeft - pocketOffset) / 2, feltBottom + 5,
      centerGapStart - feltLeft - pocketOffset, wallThickness, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    this.matter.add.rectangle(centerGapEnd + (feltRight - centerGapEnd - pocketOffset) / 2, feltBottom + 5,
      feltRight - centerGapEnd - pocketOffset, wallThickness, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    this.matter.add.rectangle(feltRight - pocketOffset / 2, feltBottom + 5, pocketOffset, wallThickness, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    // Left wall (with gap for corner pockets)
    const centerY = (feltTop + feltBottom) / 2;
    
    this.matter.add.rectangle(feltLeft - 5, feltTop + pocketOffset + (centerY - 40 - feltTop - pocketOffset) / 2,
      wallThickness, centerY - 40 - feltTop - pocketOffset, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    this.matter.add.rectangle(feltLeft - 5, centerY + 40 + (feltBottom - centerY - 40 - pocketOffset) / 2,
      wallThickness, feltBottom - centerY - 40 - pocketOffset, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    // Right wall (with gap for corner pockets)
    this.matter.add.rectangle(feltRight + 5, feltTop + pocketOffset + (centerY - 40 - feltTop - pocketOffset) / 2,
      wallThickness, centerY - 40 - feltTop - pocketOffset, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
    });
    
    this.matter.add.rectangle(feltRight + 5, centerY + 40 + (feltBottom - centerY - 40 - pocketOffset) / 2,
      wallThickness, feltBottom - centerY - 40 - pocketOffset, {
      isStatic: true, restitution: wallRestitution, friction: wallFriction, label: 'wall'
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

  /**
   * Create all pool balls with proper colors and textures
   * Uses pre-generated textures from pregenerateBallTextures()
   */
  private createBalls() {
    // Use consistent ball radius matching texture generation (20px)
    const ballRadius = 20;
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    
    // Cue ball position
    const cueBallX = feltLeft + 200;
    const cueBallY = (feltTop + feltBottom) / 2;
    
    // Create cue ball using pre-generated texture
    const cueBall = this.createBallWithTexture(cueBallX, cueBallY, 0, true) as Phaser.Physics.Matter.Sprite;
    cueBall.setData('type', 'cue');
    cueBall.setData('number', 0);
    cueBall.setInteractive({ useHandCursor: true });
    this.cueBall = cueBall;
    this.balls.push(cueBall);

    // Rack position (foot spot at 75% of table length)
    const rackX = feltLeft + (feltRight - feltLeft) * 0.73;
    const rackY = (feltTop + feltBottom) / 2;
    
    // Standard 8-ball rack order (8-ball in center, corners alternate solid/stripe)
    const rackOrder = [1, 9, 2, 10, 8, 11, 3, 12, 4, 13, 5, 14, 6, 15, 7];
    
    const rackPositions = this.getRackPositions(rackX, rackY, ballRadius);
    
    rackOrder.forEach((number, idx) => {
      const ball = this.createBallWithTexture(
        rackPositions[idx].x,
        rackPositions[idx].y,
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

  /**
   * Create a single ball using pre-generated texture
   */
  private createBallWithTexture(x: number, y: number, number: number, isCue: boolean): Phaser.Physics.Matter.Sprite {
    const ballRadius = 20;  // Match texture generation size
    const textureKey = `ball_${number}_${isCue ? 'cue' : 'regular'}`;
    
    // Verify texture exists before creating
    if (!this.textures.exists(textureKey)) {
      console.warn(`[Ball] Texture ${textureKey} not found!`);
    }
    
    const ball = this.matter.add.image(x, y, textureKey) as Phaser.Physics.Matter.Sprite;
    ball.setCircle(ballRadius);
    ball.setFriction(PHYSICS_CONFIG.ballFriction);
    ball.setFrictionAir(PHYSICS_CONFIG.ballFrictionAir);
    ball.setBounce(PHYSICS_CONFIG.ballBounce);
    ball.setMass(PHYSICS_CONFIG.ballMass);
    ball.setCollisionCategory(0x0001);
    ball.setCollidesWith(0x0001);
    
    return ball;
  }

  /**
   * Pre-generate hyper-realistic ball textures with 3D sphere effects
   * Uses multiple layers of gradients, specular highlights, and proper stripe patterns
   */
  private pregenerateBallTextures(): void {
    // 🔒 GUARD: Skip if textures already generated (use static flag for all instances)
    if (PoolGameScene.texturesGenerated) {
      console.log('[Texture Debug] Textures already generated, skipping');
      return;
    }
    
    const ballRadius = 20;  // Slightly larger for better detail
    const textureWidth = ballRadius * 2 + 8;
    const textureHeight = ballRadius * 2 + 8;
    const centerX = ballRadius + 4;
    const centerY = ballRadius + 4;

    // Define all ball configurations with standard pool ball colors
    const ballConfigs = [
      { number: 0, color: 0xffffff, isStripe: false, isCue: true },  // Cue ball - pristine white
      { number: 1, color: 0xffd700 }, // Yellow (Gold) - Solid
      { number: 2, color: 0x0000cd }, // Blue - Solid
      { number: 3, color: 0xdc143c }, // Red - Solid
      { number: 4, color: 0x9400d3 }, // Purple - Solid
      { number: 5, color: 0xff8c00 }, // Orange - Solid
      { number: 6, color: 0x228b22 }, // Green - Solid
      { number: 7, color: 0x8b0000 }, // Maroon - Solid
      { number: 8, color: 0x000000, isStripe: false }, // Black 8-ball
      { number: 9, color: 0xffd700, isStripe: true },  // Yellow stripe
      { number: 10, color: 0x0000cd, isStripe: true }, // Blue stripe
      { number: 11, color: 0xdc143c, isStripe: true }, // Red stripe
      { number: 12, color: 0x9400d3, isStripe: true }, // Purple stripe
      { number: 13, color: 0xff8c00, isStripe: true }, // Orange stripe
      { number: 14, color: 0x228b22, isStripe: true }, // Green stripe
      { number: 15, color: 0x8b0000, isStripe: true }  // Maroon stripe
    ];

    ballConfigs.forEach(config => {
      const textureKey = `ball_${config.number}_${config.isCue ? 'cue' : 'regular'}`;
      
      // Skip if texture already exists
      if (this.textures.exists(textureKey)) {
        return;
      }

      const graphics = this.add.graphics();
      
      // === LAYER 1: Drop shadow for depth ===
      graphics.fillStyle(0x000000, 0.35);
      graphics.fillEllipse(centerX + 3, centerY + 4, ballRadius * 1.8, ballRadius * 1.2);
      
      // === LAYER 2: Base ball color ===
      graphics.fillStyle(config.color, 1);
      graphics.fillCircle(centerX, centerY, ballRadius);
      
      // === LAYER 3: 3D sphere gradient effect ===
      // Simulate radial gradient with multiple concentric circles
      const baseColor = Phaser.Display.Color.ValueToColor(config.color);
      
      // Outer shadow (darker edge)
      const darkColor = baseColor.darken(30);
      graphics.fillStyle(darkColor.color, 0.5);
      graphics.fillCircle(centerX, centerY, ballRadius);
      
      // Mid-tone layer
      const midColor = baseColor.lighten(10);
      graphics.fillStyle(midColor.color, 0.4);
      graphics.fillCircle(centerX - 2, centerY - 2, ballRadius * 0.85);
      
      // Highlight area (lighter)
      const lightColor = baseColor.lighten(35);
      graphics.fillStyle(lightColor.color, 0.35);
      graphics.fillCircle(centerX - 4, centerY - 4, ballRadius * 0.6);
      
      // Core highlight
      const coreColor = baseColor.lighten(50);
      graphics.fillStyle(coreColor.color, 0.25);
      graphics.fillCircle(centerX - 5, centerY - 5, ballRadius * 0.35);
      
      // === LAYER 4: Specular highlight (glossy finish) ===
      // Main specular highlight - bright white spot
      graphics.fillStyle(0xffffff, 0.7);
      graphics.fillCircle(centerX - 6, centerY - 6, ballRadius * 0.35);
      
      // Secondary smaller highlight
      graphics.fillStyle(0xffffff, 0.4);
      graphics.fillCircle(centerX - 4, centerY - 4, ballRadius * 0.2);
      
      // === LAYER 5: Stripe pattern (for striped balls) ===
      if (config.isStripe) {
        // Save the gradient effect by clipping to circle first
        graphics.save();
        graphics.beginPath();
        graphics.fillCircle(centerX, centerY, ballRadius);
        graphics.closePath();
        
        // White stripe band (horizontal)
        const stripeHeight = ballRadius * 0.7;
        const stripeY = centerY - stripeHeight / 2;
        
        // Stripe shadow
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillRect(centerX - ballRadius, stripeY + 2, ballRadius * 2, stripeHeight);
        
        // Main white stripe
        graphics.fillStyle(0xf5f5f5, 1);
        graphics.fillRect(centerX - ballRadius, stripeY, ballRadius * 2, stripeHeight);
        
        // Stripe highlight (top edge)
        graphics.fillStyle(0xffffff, 0.6);
        graphics.fillRect(centerX - ballRadius, stripeY, ballRadius * 2, 3);
        
        // Stripe shadow (bottom edge)
        graphics.fillStyle(0x000000, 0.15);
        graphics.fillRect(centerX - ballRadius, stripeY + stripeHeight - 3, ballRadius * 2, 3);
        
        graphics.restore();
        
        // Re-apply gradient overlay on top of stripe
        graphics.fillStyle(darkColor.color, 0.25);
        graphics.fillCircle(centerX, centerY, ballRadius);
        
        graphics.fillStyle(lightColor.color, 0.2);
        graphics.fillCircle(centerX - 4, centerY - 4, ballRadius * 0.55);
      }
      
      // === LAYER 6: Number circle (white circle with number) ===
      if (config.number !== 0) {
        const numCircleRadius = ballRadius * 0.55;
        
        // Number circle shadow
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillCircle(centerX + 1, centerY + 1, numCircleRadius + 1);
        
        // Number circle background
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(centerX, centerY, numCircleRadius);
        
        // Number circle border
        graphics.lineStyle(1.5, 0x333333, 1);
        graphics.strokeCircle(centerX, centerY, numCircleRadius);
        
        // Number text
        const textColor = config.number === 8 ? 0xffffff : 0x000000;
        this.drawNumberOnBallImproved(graphics, centerX, config.number, config.isStripe ?? false, textColor);
      }
      
      // === LAYER 7: Edge definition ===
      // Darker edge for ball definition
      graphics.lineStyle(1.5, 0x000000, 0.4);
      graphics.strokeCircle(centerX, centerY, ballRadius);
      
      // Subtle inner highlight
      graphics.lineStyle(1, 0xffffff, 0.15);
      graphics.strokeCircle(centerX, centerY, ballRadius - 1);
      
      // Generate texture
      graphics.generateTexture(textureKey, textureWidth, textureHeight);
      graphics.destroy();
    });
    
    // Mark textures as generated to prevent redundant generation across all instances
    PoolGameScene.texturesGenerated = true;
  }

  // Legacy method removed - use createBallWithTexture() instead

  // Legacy method removed - use createBallWithTexture() instead

  private drawNumberOnBallImproved(graphics: Phaser.GameObjects.Graphics, centerX: number, number: number, _isStripe: boolean, textColorOverride?: number) {
    // Use override color if provided (for 8-ball white text), otherwise use black
    const textColor = textColorOverride !== undefined ? textColorOverride : 0x000000;
    const digitScale = 7;  // Smaller scale to fit in white circle
    const offsetX = centerX;
    const offsetY = centerX;

    const digits = number.toString().split('').map(d => parseInt(d));
    let startX = offsetX - ((digits.length - 1) * digitScale) / 2;

    digits.forEach((digit, index) => {
      const x = startX + index * digitScale * 1.8;
      this.drawDigit(graphics, x, offsetY, digit, textColor, digitScale);
    });
  }

  private drawDigit(graphics: Phaser.GameObjects.Graphics, x: number, y: number, digit: number, color: number, scale: number) {
    const segments = this.getDigitSegments(digit);
    
    segments.forEach(([sx, sy, r]) => {
      graphics.fillStyle(color, 1);
      // Smaller dots for better text appearance
      const dotSize = Math.max(1.5, r * 0.8);
      graphics.fillCircle(x + sx * scale * 0.5, y + sy * scale * 0.5, dotSize);
    });
  }

  private getDigitSegments(digit: number): [number, number, number][] {
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
    // Create enhanced turn indicator with player panels
    this.createTurnIndicatorPanel();
    this.createPlayerSidePanels();

    this.messageText = this.add.text(this.scale.width / 2, 100, '', {
      fontSize: '28px',
      color: '#ffff00',
      fontStyle: 'bold',
      backgroundColor: '#00000070',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setDepth(200);

    this.createPortedBallsDisplay();
    this.createPowerMeter();
    this.createTurnTransitionOverlay();
    this.createBallInHandIndicator();
  }

  /**
   * Create enhanced turn indicator panel at top center
   */
  private createTurnIndicatorPanel() {
    const panelWidth = 280;
    const panelHeight = 70;
    const panelX = (this.scale.width - panelWidth) / 2;
    const panelY = 5;

    // Main panel background with gradient effect
    this.turnIndicator = this.add.container(panelX, panelY);
    this.turnIndicator.setDepth(60);

    // Background with rounded corners and shadow
    const panelBg = this.add.graphics();
    // Shadow
    panelBg.fillStyle(0x000000, 0.5);
    panelBg.fillRoundedRect(2, 2, panelWidth, panelHeight, 12);
    // Main background
    panelBg.fillStyle(0x1a1a2e, 0.95);
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 12);
    // Border
    panelBg.lineStyle(2, 0x4a4a6a, 0.8);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 12);
    // Top highlight
    panelBg.fillStyle(0xffffff, 0.1);
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight / 2, 12);
    
    this.turnIndicator.add(panelBg);

    // Turn label text
    this.turnText = this.add.text(panelWidth / 2, 22, "PLAYER 1'S TURN", {
      fontSize: '14px',
      color: '#00ff00',
      fontStyle: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(61);
    this.turnIndicator.add(this.turnText);

    // Timer ring background
    const timerRingBg = this.add.graphics();
    timerRingBg.fillStyle(0x333333, 1);
    timerRingBg.fillCircle(panelWidth / 2, 50, 16);
    this.turnIndicator.add(timerRingBg);

    // Timer ring (will be updated with time remaining)
    const timerRing = this.add.graphics();
    timerRing.lineStyle(3, 0x00ff00, 1);
    timerRing.strokeCircle(panelWidth / 2, 50, 14);
    this.turnIndicator.add(timerRing);
    (this.turnIndicator as any).timerRing = timerRing;

    // Timer text inside ring
    this.shotTimerText = this.add.text(panelWidth / 2, 50, '30', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(62);
    this.turnIndicator.add(this.shotTimerText);

    // Active player indicator (glowing dot)
    const activeIndicator = this.add.graphics();
    activeIndicator.fillStyle(0x00ff00, 1);
    activeIndicator.fillCircle(15, 22, 6);
    activeIndicator.lineStyle(2, 0xffffff, 0.5);
    activeIndicator.strokeCircle(15, 22, 6);
    this.turnIndicator.add(activeIndicator);
    (this.turnIndicator as any).activeIndicator = activeIndicator;
  }

  /**
   * Create player side panels showing ball assignments and status
   */
  private createPlayerSidePanels() {
    const panelWidth = 100;
    const panelHeight = 180;
    const { feltLeft, feltRight, feltTop } = this.tableBounds;

    // Player 1 panel (left side)
    this.playerPanels.player0 = this.createPlayerPanel(
      feltLeft - panelWidth - 15,
      feltTop + 20,
      panelWidth,
      panelHeight,
      'PLAYER 1',
      0,
      0x00ff00
    );

    // Player 2 panel (right side)
    this.playerPanels.player1 = this.createPlayerPanel(
      feltRight + 15,
      feltTop + 20,
      panelWidth,
      panelHeight,
      'PLAYER 2',
      1,
      0xff6600
    );
  }

  /**
   * Create individual player panel
   */
  private createPlayerPanel(x: number, y: number, width: number, height: number, title: string, playerIndex: number, activeColor: number): Phaser.GameObjects.Container {
    const panel = this.add.container(x, y);
    panel.setDepth(55);

    // Panel background
    const bg = this.add.graphics();
    // Shadow
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(2, 2, width, height, 10);
    // Main background
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(0, 0, width, height, 10);
    // Border
    bg.lineStyle(2, 0x4a4a6a, 0.6);
    bg.strokeRoundedRect(0, 0, width, height, 10);
    
    panel.add(bg);

    // Player name
    const nameText = this.add.text(width / 2, 18, title, {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    panel.add(nameText);

    // Player avatar circle
    const avatarBg = this.add.graphics();
    avatarBg.fillStyle(0x333333, 1);
    avatarBg.fillCircle(width / 2, 45, 18);
    avatarBg.lineStyle(2, activeColor, 0.8);
    avatarBg.strokeCircle(width / 2, 45, 18);
    panel.add(avatarBg);

    // Player icon (P1 or P2)
    const iconText = this.add.text(width / 2, 45, `P${playerIndex + 1}`, {
      fontSize: '12px',
      color: activeColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    panel.add(iconText);

    // Ball type indicator area
    const ballTypeBg = this.add.graphics();
    ballTypeBg.fillStyle(0x2a2a3e, 1);
    ballTypeBg.fillRoundedRect(10, 70, width - 20, 30, 6);
    panel.add(ballTypeBg);

    const ballTypeText = this.add.text(width / 2, 85, 'Waiting...', {
      fontSize: '10px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    panel.add(ballTypeText);
    (panel as any).ballTypeText = ballTypeText;

    // Balls remaining area
    const ballsRemainingBg = this.add.graphics();
    ballsRemainingBg.fillStyle(0x2a2a3e, 1);
    ballsRemainingBg.fillRoundedRect(10, 105, width - 20, 65, 6);
    panel.add(ballsRemainingBg);

    const ballsLabel = this.add.text(width / 2, 118, 'BALLS LEFT', {
      fontSize: '9px',
      color: '#888888'
    }).setOrigin(0.5);
    panel.add(ballsLabel);

    // Ball icons container
    const ballsContainer = this.add.container(width / 2, 145);
    panel.add(ballsContainer);
    (panel as any).ballsContainer = ballsContainer;

    // Status indicator
    const statusText = this.add.text(width / 2, height - 10, 'WAITING', {
      fontSize: '10px',
      color: '#888888',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    panel.add(statusText);
    (panel as any).statusText = statusText;

    // Active player glow (hidden by default)
    const glow = this.add.graphics();
    glow.fillStyle(activeColor, 0.3);
    glow.fillRoundedRect(-3, -3, width + 6, height + 6, 12);
    glow.setVisible(false);
    panel.add(glow);
    (panel as any).glow = glow;
    (panel as any).activeColor = activeColor;

    return panel;
  }

  /**
   * Create turn transition overlay effect
   */
  private createTurnTransitionOverlay() {
    this.turnTransitionOverlay = this.add.graphics();
    this.turnTransitionOverlay.setDepth(180);
    this.turnTransitionOverlay.setVisible(false);
  }

  /**
   * Create ball-in-hand indicator
   */
  private createBallInHandIndicator() {
    this.ballInHandIndicator = this.add.graphics();
    this.ballInHandIndicator.setDepth(170);
    this.ballInHandIndicator.setVisible(false);
  }

  private createPowerMeter() {
    const meterX = 50;
    const meterY = 300;
    const meterWidth = 30;
    const meterHeight = 200;

    // Meter background
    const meterBg = this.add.graphics();
    meterBg.fillStyle(0x000000, 0.7);
    meterBg.fillRect(meterX, meterY, meterWidth, meterHeight);
    meterBg.lineStyle(2, 0xffffff, 0.8);
    meterBg.strokeRect(meterX, meterY, meterWidth, meterHeight);
    meterBg.setDepth(80);

    // Power label
    this.add.text(meterX + meterWidth / 2, meterY - 15, 'POWER', {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(81);

    // Percentage text
    const percentText = this.add.text(meterX + meterWidth / 2, meterY + meterHeight + 15, '0%', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(81);

    // Store references for updating
    (this as any).powerMeterBg = meterBg;
    (this as any).powerMeterX = meterX;
    (this as any).powerMeterY = meterY;
    (this as any).powerMeterWidth = meterWidth;
    (this as any).powerMeterHeight = meterHeight;
    (this as any).powerPercentText = percentText;
  }

  private startShotTimer() {
    this.shotTimer = 30;
    
    if (this.shotTimerEvent) {
      this.shotTimerEvent.destroy();
    }

    this.shotTimerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.gameOver || !this.gameStarted) return;
        
        this.shotTimer--;
        this.updateTimerDisplay();

        if (this.shotTimer <= 0) {
          this.handleShotTimeout();
        }
      },
      loop: true
    });
    
    this.updateTimerDisplay();
  }

  /**
   * Update timer display with visual ring effect
   */
  private updateTimerDisplay() {
    if (this.shotTimerText) {
      this.shotTimerText.setText(this.shotTimer.toString());
      
      // Color changes based on time remaining
      let timerColor: string;
      if (this.shotTimer > 15) {
        timerColor = '#00ff00';
      } else if (this.shotTimer > 8) {
        timerColor = '#aaff00';
      } else if (this.shotTimer > 4) {
        timerColor = '#ffaa00';
      } else {
        timerColor = '#ff0000';
      }
      
      this.shotTimerText.setColor(timerColor);
      
      // Update timer ring
      if (this.turnIndicator) {
        const timerRing = (this.turnIndicator as any).timerRing;
        if (timerRing) {
          timerRing.clear();
          const progress = this.shotTimer / 30;
          const ringColor = timerColor;
          timerRing.lineStyle(3, ringColor, 1);
          
          // Draw partial circle based on time remaining
          // Center of timer ring relative to turn indicator container
          const centerX = 140;  // panelWidth / 2 = 280 / 2
          const centerY = 50;
          const radius = 14;
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + (Math.PI * 2 * progress);
          
          timerRing.beginPath();
          timerRing.arc(centerX, centerY, radius, startAngle, endAngle, false);
          timerRing.strokePath();
        }
      }
    }
  }

  private handleShotTimeout() {
    this.updateMessage('Time\'s up! Turn switched.');
    this.recordTurnHistory('timeout');
    this.animateTurnTransition(() => {
      this.switchTurn();
      this.startShotTimer();
    });
  }

  private resetShotTimer() {
    this.shotTimer = 30;
    this.updateTimerDisplay();
  }

  private createPortedBallsDisplay() {
    this.pocketedBallsDisplay = this.add.container(this.scale.width / 2, 25);

    const bg = this.add.graphics();
    bg.fillStyle(0x2d1f0f, 1);
    bg.fillRoundedRect(-120, -10, 240, 60, 12);

    bg.lineStyle(1, 0x3d2a15, 0.8);
    for (let i = 0; i < 8; i++) {
      const y = -8 + i * 7;
      bg.lineBetween(-115, y, 115, y + (i % 2 === 0 ? 2 : -2));
    }

    this.pocketedBallsDisplay.add(bg);

    const title = this.add.text(0, -20, 'POCKETED BALLS', {
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.pocketedBallsDisplay.add(title);

    const ballsContainer = this.add.container(0, 0);
    this.pocketedBallsDisplay.add(ballsContainer);

    const ballRadius = 8;
    const spacing = 16;
    const startX = -((15 - 1) * spacing) / 2;

    for (let i = 1; i <= 15; i++) {
      const x = startX + (i - 1) * spacing;
      const slot = this.add.graphics();
      slot.lineStyle(1, 0x8b7355, 0.5);
      slot.strokeCircle(x, 0, ballRadius + 1);
      slot.lineStyle(1, 0x5a4025, 0.3);
      slot.strokeCircle(x, 0, ballRadius + 3);
      ballsContainer.add(slot);
    }

    (this.pocketedBallsDisplay as any).ballsContainer = ballsContainer;
    this.pocketedBallsDisplay.setDepth(100);
  }

  private setupEventListeners() {
    this.matter.world.on('collisionstart', (event: any) => {
      this.handleCollisionStart(event);
      this.handleBallCollisions(event);
      this.handleCollisionSounds(event);
    }, this);
  }

  private handleCollisionSounds(event: any) {
    event.pairs.forEach((pair: any) => {
      const { bodyA, bodyB } = pair;
      
      // Ball-ball collision
      if (bodyA.label === 'wall' || bodyB.label === 'wall') {
        if (this.soundManager) {
          this.soundManager.playCushion();
        }
      } else {
        // Ball-ball collision - calculate intensity
        const relVelX = (bodyA.velocity?.x || 0) - (bodyB.velocity?.x || 0);
        const relVelY = (bodyA.velocity?.y || 0) - (bodyB.velocity?.y || 0);
        const intensity = Math.sqrt(relVelX * relVelX + relVelY * relVelY);
        
        if (this.soundManager && intensity > 1) {
          this.soundManager.playCollision(intensity);
        }
        
        // Create collision spark effect
        if (this.particleSystem && intensity > 3) {
          const sparkX = ((bodyA.position?.x || 0) + (bodyB.position?.x || 0)) / 2;
          const sparkY = ((bodyA.position?.y || 0) + (bodyB.position?.y || 0)) / 2;
          this.particleSystem.createCollisionSpark(sparkX, sparkY, Math.min(intensity / 20, 1));
        }
      }
    });
  }

  private handleCollisionStart(event: any) {
    event.pairs.forEach((pair: any) => {
      const { bodyA, bodyB } = pair;
      
      if (bodyA.label?.startsWith('pocket-')) {
        this.handlePocketCollision(bodyB);
      } else if (bodyB.label?.startsWith('pocket-')) {
        this.handlePocketCollision(bodyA);
      }
    });
  }

  private handleBallCollisions(event: any) {
    if (this.gameType === 'break' || this.gameOver) return;
    
    event.pairs.forEach((pair: any) => {
      const { bodyA, bodyB } = pair;
      const ballA = bodyA.gameObject;
      const ballB = bodyB.gameObject;
      
      if (ballA && ballB && ballA !== ballB) {
        const cueBall = ballA.getData('type') === 'cue' ? ballA : (ballB.getData('type') === 'cue' ? ballB : null);
        const otherBall = cueBall === ballA ? ballB : ballA;
        
        if (cueBall && otherBall && !this.firstBallHit) {
          this.firstBallHit = otherBall;
          this.checkFouls(otherBall);
        }
        
        // Track if any ball hits a rail (wall)
        if (bodyA.label === 'wall' || bodyB.label === 'wall') {
          this.ballsHaveMoved = true;
        }
      }
    });
  }

  private checkFouls(hitBall: Phaser.Physics.Matter.Sprite) {
    if (this.gameType === 'break' || !this.currentPlayerGroup || this.gameOver) return;
    
    const ballType = hitBall.getData('type');
    const ballNumber = hitBall.getData('number');
    
    const fouls: string[] = [];
    
    if (ballType !== 'cue' && ballType !== 'eight') {
      const isOpponentBall = (this.currentPlayerGroup === 'solid' && ballType === 'stripe') ||
                            (this.currentPlayerGroup === 'stripe' && ballType === 'solid');
      
      if (isOpponentBall) {
        fouls.push('opponent_ball_first');
      }
    }
    
    if (ballNumber === 8) {
      const myBallsRemaining = this.currentPlayerGroup === 'solid' ? this.ballsRemaining.solid : this.ballsRemaining.stripe;
      if (myBallsRemaining > 0) {
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
      'opponent_ball_first': "FOUL! Hit opponent's ball first!",
      'hit_8ball_early': 'FOUL! Hit 8-ball too early!',
      'no_ball_hit': 'FOUL! No ball hit!',
      'cue_pocketed': 'SCRATCH! Ball in Hand',
      'no_rail_after_contact': 'FOUL! No ball hit rail after contact!'
    };
    
    fouls.forEach(foul => {
      this.updateMessage(foulMessages[foul] || 'FOUL!');
    });
    
    // For cue ball pocketed, the player gets ball in hand (extra shot opportunity)
    // For other fouls, the turn switches but opponent gets ball in hand
    if (fouls.includes('cue_pocketed')) {
      this.extraShotsRemaining = 1;
    } else {
      this.extraShotsRemaining = 1; // Opponent gets ball in hand
    }
    
    this.updateTurnIndicator();
    this.updatePlayerBallRacks();
  }

  private createPlayerBallRacks() {
    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    
    const leftRack = this.add.container(feltLeft - 80, (feltTop + feltBottom) / 2);
    this.createIndividualBallRack(leftRack, 'PLAYER 1', 0);
    
    const rightRack = this.add.container(feltRight + 80, (feltTop + feltBottom) / 2);
    this.createIndividualBallRack(rightRack, 'PLAYER 2', 1);
    
    this.playerBallRacks = {
      player0: leftRack,
      player1: rightRack
    };
  }

  private createIndividualBallRack(container: Phaser.GameObjects.Container, title: string, playerIndex: number) {
    const bg = this.add.graphics();
    bg.fillStyle(0x2d1f0f, 1);
    bg.fillRoundedRect(-40, -80, 80, 160, 10);
    
    bg.lineStyle(1, 0x3d2a15, 0.8);
    for (let i = 0; i < 12; i++) {
      const y = -75 + i * 12;
      bg.lineBetween(-35, y, 35, y + (i % 2 === 0 ? 2 : -2));
    }
    
    container.add(bg);
    
    const titleText = this.add.text(0, -90, title, {
      fontSize: '10px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(titleText);
    
    const playerLight = this.add.graphics();
    playerLight.fillStyle(playerIndex === 0 ? 0x00ff00 : 0xff6600, 1);
    playerLight.fillCircle(0, -70, 6);
    playerLight.lineStyle(2, 0x000000, 1);
    playerLight.strokeCircle(0, -70, 6);
    container.add(playerLight);
    
    const ballRadius = 8;
    const startY = -50;
    const spacing = 20;
    
    for (let i = 0; i < 7; i++) {
      const y = startY + i * spacing;
      const slot = this.add.graphics();
      slot.lineStyle(1, 0x8b7355, 0.5);
      slot.strokeCircle(0, y, ballRadius + 1);
      slot.lineStyle(1, 0x5a4025, 0.3);
      slot.strokeCircle(0, y, ballRadius + 3);
      container.add(slot);
    }
    
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
    
    [0, 1].forEach(playerIndex => {
      const rack = playerIndex === 0 ? this.playerBallRacks!.player0 : this.playerBallRacks!.player1;
      const container = rack as Phaser.GameObjects.Container;
      
      const children = container.getAll();
      children.forEach(child => {
        if (child.getData && child.getData('isPlayerBallIcon')) {
          child.destroy();
        }
      });
      
      const playerBalls = this.pocketedBalls.filter(b => b.player === playerIndex);
      
      const shotsText = (container as any).shotsText;
      const isCurrentPlayer = this.currentPlayerTurn === playerIndex;
      const shotsRemaining = isCurrentPlayer && this.extraShotsRemaining > 0 ? this.extraShotsRemaining : 1;
      
      shotsText.setText(`SHOTS: ${shotsRemaining}`);
      shotsText.setColor(isCurrentPlayer ? '#00ff00' : '#ffffff');
      
      playerBalls.forEach((ball, index) => {
        if (index < 7) {
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

    if (ballType === 'cue') {
      this.handleCueBallPocketed(ball);
      return;
    }

    ball.setData('pocketed', true);
    ball.setActive(false);
    ball.setVisible(false);
    ball.setVelocity(0, 0);

    this.ballsPocketedThisTurn.push({ number: ballNumber, type: ballType });
    this.pocketedBalls.push({ number: ballNumber, type: ballType, player: this.currentPlayerTurn });
    
    if (ballType === 'solid') this.ballsRemaining.solid--;
    if (ballType === 'stripe') this.ballsRemaining.stripe--;

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
    this.updateMessage('FOUL! Cue ball pocketed - Ball in Hand');
    
    // Record foul
    this.foulsThisTurn.push('cue_pocketed');
    
    // Disable shooting until cue ball is placed
    this.canShoot = false;
    
    // Add foul notification with penalty
    const foulText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'SCRATCH!', {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
      backgroundColor: '#00000080',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(300);
    
    this.time.delayedCall(2000, () => {
      if (foulText) foulText.destroy();
      this.placeCueBallInHand();
    });
    
    // Extra shot for opponent (ball-in-hand)
    this.extraShotsRemaining = 1;
  }

  private handleEightBallPocketed() {
    const currentGroup = this.currentPlayerGroup;
    const canPocketEight = currentGroup && (
      (currentGroup === 'solid' && this.ballsRemaining.solid === 0) ||
      (currentGroup === 'stripe' && this.ballsRemaining.stripe === 0)
    );
    
    if (canPocketEight) {
      if (this.firstBallHit) {
        const firstBallType = this.firstBallHit.getData('type');
        if (firstBallType === currentGroup) {
          this.endGame(this.currentPlayerTurn, 'win');
          return;
        }
      }
    }
    
    this.endGame(this.currentPlayerTurn, 'lose');
  }

  private placeCueBallInHand() {
    if (!this.cueBall) return;
    
    this.cueBall.setActive(true);
    this.cueBall.setVisible(true);
    this.cueBall.setVelocity(0, 0);
    
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
      
      this.createCueGraphics(pointer);
    }
  }

  private pregenerateCueTexture(): void {
    const textureKey = 'cue_stick_static';
    
    if (this.textures.exists(textureKey)) {
      return;
    }

    const cueGraphics = this.add.graphics();
    const cueLength = 300;
    const cueWidth = 6;
    
    cueGraphics.fillStyle(0x8B4513, 1);
    cueGraphics.fillRoundedRect(0, -cueWidth / 2, cueLength, cueWidth, 3);
    
    cueGraphics.fillStyle(0xFFFFFF, 1);
    cueGraphics.fillRect(0, -cueWidth / 2, 8, cueWidth);
    
    cueGraphics.generateTexture(textureKey, cueLength, cueWidth);
    cueGraphics.destroy();
  }

  /**
   * Create realistic cue stick graphics with aiming line and power indicator
   */
  private createCueGraphics(pointer: Phaser.Input.Pointer) {
    if (!this.cueBall) return;
    
    this.pregenerateCueTexture();
    
    // Aiming line (dotted guide)
    this.cue = this.add.line(0, 0, 0, 0, 0, 0, 0xffffff, 0.6);
    this.cue.setLineWidth(2);
    
    const cueTextureKey = 'cue_stick_static';
    
    // Cue stick image with realistic tapered design
    this.cueStick = this.add.image(this.cueBall.x, this.cueBall.y, cueTextureKey);
    this.cueStick.setOrigin(0.95, 0.5);  // Origin near tip
    this.cueStick.setDepth(10);
    
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );
    
    // Position cue stick behind ball with offset based on power
    const baseOffset = 35;
    this.cueStick.x = this.cueBall.x - Math.cos(angle) * baseOffset;
    this.cueStick.y = this.cueBall.y - Math.sin(angle) * baseOffset;
    this.cueStick.rotation = angle;
    
    // Power indicator (will be updated on pointer move)
    this.powerIndicator = this.add.graphics();
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isAiming || !this.cueBall || !this.cueBall.visible) return;
    
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      pointer.worldX, pointer.worldY
    );
    
    if (this.cue) {
      this.cue.setTo(
        this.cueBall.x, this.cueBall.y,
        this.cueBall.x + Math.cos(angle) * 200,
        this.cueBall.y + Math.sin(angle) * 200
      );
    }
    
    if (this.cueStick) {
      const cueOffset = 40 + (this.shotPower / this.maxPower) * 30;
      this.cueStick.x = this.cueBall.x - Math.cos(angle) * cueOffset;
      this.cueStick.y = this.cueBall.y - Math.sin(angle) * cueOffset;
      this.cueStick.rotation = angle;
    }
    
    const distance = Phaser.Math.Distance.Between(
      pointer.worldX, pointer.worldY,
      this.cueBall.x, this.cueBall.y
    );
    this.shotPower = Math.min(distance * 1.2, this.maxPower);
    
    // Update power indicator
    this.updatePowerIndicator();
    
    // Update aiming guide with ghost ball prediction
    this.updateAimingGuide(angle);
  }

  private updatePowerIndicator() {
    if (!this.powerIndicator || !this.cueBall) return;
    
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
    
    // Power fill with gradient colors
    const powerColor = powerPercent < 0.33 ? 0x00ff00 :
                       powerPercent < 0.66 ? 0xffff00 : 0xff0000;
    this.powerIndicator.fillStyle(powerColor, 1);
    this.powerIndicator.fillRect(
      this.cueBall.x - barWidth / 2,
      this.cueBall.y - 50,
      barWidth * powerPercent,
      barHeight
    );
    
    // Border
    this.powerIndicator.lineStyle(1, 0xffffff, 0.8);
    this.powerIndicator.strokeRect(
      this.cueBall.x - barWidth / 2,
      this.cueBall.y - 50,
      barWidth,
      barHeight
    );

    // Update power meter on side
    const meterX = (this as any).powerMeterX;
    const meterY = (this as any).powerMeterY;
    const meterWidth = (this as any).powerMeterWidth;
    const meterHeight = (this as any).powerMeterHeight;
    const percentText = (this as any).powerPercentText;

    if (meterX !== undefined && percentText) {
      // Clear and redraw meter fill
      const meterGraphics = this.add.graphics();
      meterGraphics.setDepth(81);
      
      const fillHeight = meterHeight * powerPercent;
      meterGraphics.fillStyle(0x00ff00, 1);
      meterGraphics.fillRect(meterX, meterY + meterHeight - fillHeight, meterWidth, fillHeight);
      
      percentText.setText(`${Math.round(powerPercent * 100)}%`);
    }
  }

  private updateAimingGuide(angle: number) {
    if (!this.cueBall) return;
    
    // Clear previous aiming guide
    if (this.aimingGuide) {
      this.aimingGuide.destroy();
    }
    if (this.ghostBall) {
      this.ghostBall.destroy();
    }
    
    this.aimingGuide = this.add.graphics();
    this.aimingGuide.setDepth(5);
    
    // Dashed aiming line
    const lineLength = 300 * (this.shotPower / this.maxPower);
    const endX = this.cueBall.x + Math.cos(angle) * lineLength;
    const endY = this.cueBall.y + Math.sin(angle) * lineLength;
    
    this.aimingGuide.lineStyle(2, 0xffffff, 0.5);
    const dashLength = 10;
    const gapLength = 5;
    const totalLength = Math.sqrt(Math.pow(endX - this.cueBall.x, 2) + Math.pow(endY - this.cueBall.y, 2));
    const steps = Math.floor(totalLength / (dashLength + gapLength));
    
    for (let i = 0; i < steps; i++) {
      const startDist = i * (dashLength + gapLength);
      const endDist = startDist + dashLength;
      const startX = this.cueBall.x + Math.cos(angle) * startDist;
      const startY = this.cueBall.y + Math.sin(angle) * startDist;
      const dashEndX = this.cueBall.x + Math.cos(angle) * endDist;
      const dashEndY = this.cueBall.y + Math.sin(angle) * endDist;
      
      this.aimingGuide.lineBetween(startX, startY, dashEndX, dashEndY);
    }
    
    // Predict collision and show ghost ball
    const targetBall = this.predictCollision(angle);
    if (targetBall) {
      const collisionPoint = this.calculateCollisionPoint(targetBall);
      
      // Ghost ball at collision point
      this.ghostBall = this.add.graphics();
      this.ghostBall.setDepth(6);
      this.ghostBall.fillStyle(0xffffff, 0.3);
      this.ghostBall.fillCircle(collisionPoint.x, collisionPoint.y, 18);
      this.ghostBall.lineStyle(2, 0xffffff, 0.5);
      this.ghostBall.strokeCircle(collisionPoint.x, collisionPoint.y, 18);
      
      // Predicted target ball path
      const targetAngle = Math.atan2(
        targetBall.y - collisionPoint.y,
        targetBall.x - collisionPoint.x
      );
      
      this.aimingGuide.lineStyle(2, 0xffd700, 0.4);
      this.aimingGuide.lineBetween(
        targetBall.x, targetBall.y,
        targetBall.x + Math.cos(targetAngle) * 150,
        targetBall.y + Math.sin(targetAngle) * 150
      );
    }
  }

  private predictCollision(angle: number): Phaser.Physics.Matter.Sprite | null {
    if (!this.cueBall) return null;
    
    const step = 5;
    const maxDistance = 800;
    
    for (let d = 40; d < maxDistance; d += step) {
      const testX = this.cueBall.x + Math.cos(angle) * d;
      const testY = this.cueBall.y + Math.sin(angle) * d;
      
      for (const ball of this.balls) {
        if (ball === this.cueBall || !ball.active || ball.getData('pocketed')) continue;
        
        const dx = testX - ball.x;
        const dy = testY - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= 36) { // 2 * ball radius
          return ball;
        }
      }
    }
    
    return null;
  }

  private calculateCollisionPoint(targetBall: Phaser.Physics.Matter.Sprite): { x: number; y: number } {
    if (!this.cueBall) return { x: targetBall.x, y: targetBall.y };
    
    // Calculate the point where cue ball center will be when touching target ball
    const dx = targetBall.x - this.cueBall.x;
    const dy = targetBall.y - this.cueBall.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const touchDistance = 36; // 2 * ball radius
    
    const ratio = (distance - touchDistance) / distance;
    return {
      x: this.cueBall.x + dx * ratio,
      y: this.cueBall.y + dy * ratio
    };
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.isAiming || !this.cueBall || !this.cueBall.visible) return;
    
    this.isAiming = false;
    
    // Clean up aiming visuals
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
    
    if (this.aimingGuide) {
      this.aimingGuide.destroy();
      this.aimingGuide = null;
    }
    
    if (this.ghostBall) {
      this.ghostBall.destroy();
      this.ghostBall = null;
    }
    
    if (this.canShoot && this.shotPower > 5) {
      const angle = Phaser.Math.Angle.Between(
        this.cueBall.x, this.cueBall.y,
        pointer.worldX, pointer.worldY
      );
      
      // Apply shot with physics-accurate velocity
      const velocityMultiplier = PHYSICS_CONFIG.velocityMultiplier;
      this.cueBall.setVelocity(
        Math.cos(angle) * this.shotPower * velocityMultiplier,
        Math.sin(angle) * this.shotPower * velocityMultiplier
      );
      
      // Play shot sound
      if (this.soundManager) {
        this.soundManager.playShot(this.shotPower);
      }
      
      // Create break particles on first shot (break shot)
      if (this.gameType === 'break' && this.particleSystem) {
        const firstBall = this.balls.find(b => b !== this.cueBall && b.active);
        if (firstBall) {
          this.particleSystem.createBreakEffect(firstBall.x, firstBall.y);
        }
      }
      
      this.canShoot = false;
      this.ballsHaveMoved = true;
      this.resetShotTimer();
    } else {
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
    if (!this.gameData || !this.gameData.players) return;

    const now = Date.now();
    if (now - this.lastTurnSwitchTime < 500) {
      return;
    }
    this.lastTurnSwitchTime = now;

    if (this.foulsThisTurn.length > 0) {
      this.foulsThisTurn = [];
    }

    this.turnSwitchScheduled = false;
    this.ballsHaveMoved = false;
    this.firstBallHit = null;
    this.ballsPocketedThisTurn = [];
    this.foulsThisTurn = [];
    
    this.canShoot = true;

    if (this.extraShotsRemaining > 0) {
      this.extraShotsRemaining--;
      this.updatePlayerBallRacks();
      this.updatePlayerPanels();
      const playerName = this.gameData.players[this.currentPlayerTurn]?.username || `Player ${this.currentPlayerTurn + 1}`;
      this.updateMessage(`${playerName} has ball-in-hand!`);
      this.recordTurnHistory('ball-in-hand');
      this.showBallInHandIndicator();
      this.checkIfCurrentPlayerIsAI();
      return;
    }

    let continueTurn = false;
    let turnEndReason = 'switched';
    
    if (this.ballsPocketedThisTurn.length > 0) {
      const pocketedBall = this.ballsPocketedThisTurn[0];

      if (this.gameType === 'break') {
        if (pocketedBall.type !== 'cue') {
          this.gameType = 'eightball';
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
          continueTurn = true;
          turnEndReason = 'continued (break)';
          this.recordTurnHistory(`assigned ${groupName}`);
        }
      } else if (this.gameType === 'eightball') {
        if (this.currentPlayerGroup && pocketedBall.type === this.currentPlayerGroup) {
          continueTurn = true;
          turnEndReason = 'continued (legal ball)';
          this.recordTurnHistory('potted own ball');
        } else {
          turnEndReason = 'switched (wrong ball)';
          this.recordTurnHistory('wrong ball');
        }
      }
    } else if (!this.firstBallHit && this.gameType === 'eightball') {
      turnEndReason = 'switched (no hit)';
      this.recordTurnHistory('no hit');
    } else if (this.firstBallHit && this.ballsPocketedThisTurn.length === 0 && !this.ballsHaveMoved) {
      // No rail after contact foul - ball was hit but no ball reached a rail and nothing was pocketed
      this.foulsThisTurn.push('no_rail_after_contact');
      this.handleFoul(['no_rail_after_contact']);
      turnEndReason = 'switched (no rail)';
      this.recordTurnHistory('no rail');
    } else {
      this.recordTurnHistory('no pot');
    }

    if (!continueTurn) {
      const previousPlayer = this.currentPlayerTurn;
      this.currentPlayerTurn = (this.currentPlayerTurn + 1) % 2;
      this.currentPlayerGroup = this.playerGroups[`player${this.currentPlayerTurn}` as keyof typeof this.playerGroups] || null;
      this.extraShotsRemaining = 0;
      
      // Animate turn transition
      this.animateTurnTransition(() => {
        this.updateTurnIndicator();
        this.updatePlayerPanels();
        this.checkIfCurrentPlayerIsAI();
      }, previousPlayer);
    } else {
      this.updateTurnIndicator();
      this.updatePlayerPanels();
      this.checkIfCurrentPlayerIsAI();
    }
  }

  /**
   * Animate turn transition with visual effect
   */
  private animateTurnTransition(callback: () => void, previousPlayer?: number) {
    if (this.turnTransitionOverlay) {
      this.turnTransitionOverlay.clear();
      this.turnTransitionOverlay.setVisible(true);
      this.turnTransitionOverlay.fillStyle(0x000000, 0.4);
      this.turnTransitionOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
      
      // Flash effect
      this.tweens.add({
        targets: this.turnTransitionOverlay,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          if (this.turnTransitionOverlay) {
            this.turnTransitionOverlay.setVisible(false);
          }
          callback();
        }
      });
    } else {
      callback();
    }
  }

  /**
   * Record turn history for debugging and display
   */
  private recordTurnHistory(action: string) {
    this.turnHistory.push({
      player: this.currentPlayerTurn,
      action,
      timestamp: Date.now()
    });
    
    // Keep only last 20 entries
    if (this.turnHistory.length > 20) {
      this.turnHistory.shift();
    }
    
    console.log(`[Turn History] Player ${this.currentPlayerTurn + 1}: ${action}`);
  }

  /**
   * Show ball-in-hand indicator on table
   */
  private showBallInHandIndicator() {
    if (this.ballInHandIndicator) {
      this.ballInHandIndicator.clear();
      this.ballInHandIndicator.setVisible(true);
      
      // Pulsing hand icon area
      const centerX = this.scale.width / 2;
      const centerY = this.scale.height / 2;
      
      this.ballInHandIndicator.fillStyle(0x00aaff, 0.3);
      this.ballInHandIndicator.fillEllipse(centerX, centerY, 200, 150);
      this.ballInHandIndicator.lineStyle(3, 0x00aaff, 0.8);
      this.ballInHandIndicator.strokeEllipse(centerX, centerY, 200, 150);
      
      // Fade out after delay
      this.time.delayedCall(2000, () => {
        if (this.ballInHandIndicator) {
          this.ballInHandIndicator.setVisible(false);
        }
      });
    }
  }

  /**
   * Update player side panels with current state
   */
  private updatePlayerPanels() {
    [0, 1].forEach(playerIndex => {
      const panel = this.playerPanels[`player${playerIndex}` as keyof typeof this.playerPanels];
      if (!panel) return;
      
      const isActive = this.currentPlayerTurn === playerIndex;
      const glow = (panel as any).glow;
      const statusText = (panel as any).statusText;
      const ballTypeText = (panel as any).ballTypeText;
      const activeColor = (panel as any).activeColor;
      
      // Update glow for active player
      if (glow) {
        glow.setVisible(isActive);
        if (isActive) {
          this.tweens.add({
            targets: glow,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
          });
        }
      }
      
      // Update status text
      if (statusText) {
        if (this.gameOver) {
          statusText.setText('GAME OVER');
          statusText.setColor('#888888');
        } else if (isActive) {
          if (this.isAIPlayer && playerIndex === this.currentPlayerTurn) {
            statusText.setText('THINKING...');
            statusText.setColor('#ffaa00');
          } else if (this.ballInHand) {
            statusText.setText('BALL IN HAND');
            statusText.setColor('#00aaff');
          } else {
            statusText.setText('YOUR TURN');
            statusText.setColor('#00ff00');
          }
        } else {
          statusText.setText('WAITING');
          statusText.setColor('#888888');
        }
      }
      
      // Update ball type assignment
      if (ballTypeText) {
        const group = this.playerGroups[`player${playerIndex}` as keyof typeof this.playerGroups];
        if (group === 'solid') {
          ballTypeText.setText('SOLIDS (1-7)');
          ballTypeText.setColor('#ffd700');
        } else if (group === 'stripe') {
          ballTypeText.setText('STRIPES (9-15)');
          ballTypeText.setColor('#ff6600');
        } else {
          ballTypeText.setText('Waiting...');
          ballTypeText.setColor('#aaaaaa');
        }
      }
      
      // Update balls remaining
      this.updateBallsRemaining(panel, playerIndex);
    });
  }

  /**
   * Update balls remaining display in player panel
   */
  private updateBallsRemaining(panel: Phaser.GameObjects.Container, playerIndex: number) {
    const container = (panel as any).ballsContainer;
    if (!container) return;
    
    // Clear existing balls
    const children = (container as any).list?.slice() || [];
    children.forEach((child: any) => {
      if (child.destroy) child.destroy();
    });
    
    const group = this.playerGroups[`player${playerIndex}` as keyof typeof this.playerGroups];
    if (!group) return;
    
    const isSolid = group === 'solid';
    const remaining = isSolid ? this.ballsRemaining.solid : this.ballsRemaining.stripe;
    const totalBalls = 7;
    
    const ballSize = 8;
    const spacing = 14;
    const startX = -((totalBalls - 1) * spacing) / 2;
    
    for (let i = 0; i < totalBalls; i++) {
      const ball = this.add.graphics();
      const isPocketed = i >= remaining;
      
      if (isPocketed) {
        ball.fillStyle(0x333333, 0.5);
        ball.fillCircle(startX + i * spacing, 0, ballSize);
      } else {
        ball.fillStyle(isSolid ? 0xffd700 : 0xff6600, 1);
        ball.fillCircle(startX + i * spacing, 0, ballSize);
        ball.lineStyle(1, 0xffffff, 0.5);
        ball.strokeCircle(startX + i * spacing, 0, ballSize);
      }
      
      container.add(ball);
    }
  }

  private updateTurnIndicator() {
    if (!this.turnText || !this.gameData || !this.gameData.players) return;

    const currentPlayer = this.gameData.players[this.currentPlayerTurn];
    if (!currentPlayer) return;

    const isCurrentUser = currentPlayer.userId === this.gameData.currentUserId;
    const extraShotsText = this.extraShotsRemaining > 0 ? ` (Extra: ${this.extraShotsRemaining})` : '';
    const playerName = currentPlayer.username || `Player ${this.currentPlayerTurn + 1}`;
    
    // Update main turn indicator
    this.turnText.setText(`${playerName.toUpperCase()}'S TURN${extraShotsText}`);
    this.turnText.setColor(isCurrentUser ? '#00ff00' : '#ffaa00');
    
    // Update active indicator color
    if (this.turnIndicator) {
      const activeIndicator = (this.turnIndicator as any).activeIndicator;
      if (activeIndicator) {
        activeIndicator.clear();
        const color = isCurrentUser ? 0x00ff00 : 0xffaa00;
        activeIndicator.fillStyle(color, 1);
        activeIndicator.fillCircle(15, 22, 6);
        activeIndicator.lineStyle(2, 0xffffff, 0.5);
        activeIndicator.strokeCircle(15, 22, 6);
        
        // Pulse animation
        this.tweens.add({
          targets: activeIndicator,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 400,
          yoyo: true,
          repeat: 2
        });
      }
      
      // Update panel border color
      const panelBg = this.turnIndicator?.list?.[0] as Phaser.GameObjects.Graphics;
      if (panelBg) {
        panelBg.clear();
        const borderColor = isCurrentUser ? 0x00ff00 : 0xffaa00;
        // Shadow
        panelBg.fillStyle(0x000000, 0.5);
        panelBg.fillRoundedRect(2, 2, 280, 70, 12);
        // Main background
        panelBg.fillStyle(0x1a1a2e, 0.95);
        panelBg.fillRoundedRect(0, 0, 280, 70, 12);
        // Border with active color
        panelBg.lineStyle(2, borderColor, 0.8);
        panelBg.strokeRoundedRect(0, 0, 280, 70, 12);
        // Top highlight
        panelBg.fillStyle(0xffffff, 0.1);
        panelBg.fillRoundedRect(0, 0, 280, 35, 12);
      }
    }
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
    this.cameras.main.zoomTo(1.2, 500, 'Linear');
    this.updateMessage('Your turn! Aim and shoot.');
  }

  private handleAITurn() {
    if (this.aiThinking) return;

    this.aiThinking = true;
    this.updateMessage('AI is thinking...');

    this.cameras.main.zoomTo(0.8, 500, 'Linear');

    this.time.delayedCall(2000, () => {
      this.executeAIShot();
    });
  }

  private executeAIShot() {
    if (!this.cueBall || !this.cueBall.active || this.gameOver) {
      this.aiThinking = false;
      return;
    }

    const bestShot = this.findBestAIShot();
    if (!bestShot) {
      if (!this.executeDefensiveShot()) {
        this.executeRandomShot();
      }
      return;
    }

    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      bestShot.targetX, bestShot.targetY
    );

    let angleVariation = 0.3;
    let powerVariation = 0.4;
    let basePower = 0.8;

    switch (this.aiDifficulty) {
      case 'easy':
        angleVariation = 0.6;
        powerVariation = 0.6;
        basePower = 0.6;
        break;
      case 'hard':
        angleVariation = 0.08;
        powerVariation = 0.15;
        basePower = 0.95;
        break;
    }

    const randomAngle = angle + (Math.random() - 0.5) * angleVariation;
    const power = Math.min(basePower + Math.random() * powerVariation, 1.0);
    const aiVelocityMultiplier = 0.35;

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

    for (const ball of targetBalls) {
      const bestPocket = this.findBestPocketForBall(ball);
      if (!bestPocket) continue;

      const shotQuality = this.calculateShotQuality(cueBall, ball, bestPocket);
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
      const distance = Phaser.Math.Distance.Between(ball.x, ball.y, pocket.x, pocket.y);
      const isPathClear = this.isPathClear(ball, pocket);
      
      if (!isPathClear) continue;

      const score = 1000 / distance + (isPathClear ? 50 : 0);

      if (score > bestScore) {
        bestScore = score;
        bestPocket = pocket;
      }
    }

    return bestPocket;
  }

  private isPathClear(ball: Phaser.Physics.Matter.Sprite, target: { x: number; y: number }): boolean {
    const pathLine = new Phaser.Geom.Line(ball.x, ball.y, target.x, target.y);
    const blockageThreshold = 40;

    for (const otherBall of this.balls) {
      if (otherBall === ball || !otherBall.active || otherBall.getData('pocketed')) continue;
      
      if (Phaser.Geom.Intersects.LineToCircle(pathLine,
        new Phaser.Geom.Circle(otherBall.x, otherBall.y, blockageThreshold / 2))) {
        return false;
      }
    }

    return true;
  }

  private calculateShotQuality(cueBall: Phaser.Physics.Matter.Sprite, targetBall: Phaser.Physics.Matter.Sprite, pocket: { x: number; y: number }): { score: number; isSafe: boolean } {
    const cueToTargetDist = Phaser.Math.Distance.Between(cueBall.x, cueBall.y, targetBall.x, targetBall.y);
    const targetToPocketDist = Phaser.Math.Distance.Between(targetBall.x, targetBall.y, pocket.x, pocket.y);
    const cueToPocketDist = Phaser.Math.Distance.Between(cueBall.x, cueBall.y, pocket.x, pocket.y);
    const isRiskyShot = cueToPocketDist < cueToTargetDist * 1.5;
    
    const angleToTarget = Phaser.Math.Angle.Between(cueBall.x, cueBall.y, targetBall.x, targetBall.y);
    const angleToPocket = Phaser.Math.Angle.Between(targetBall.x, targetBall.y, pocket.x, pocket.y);
    const cutAngle = Phaser.Math.Angle.Wrap(angleToPocket - angleToTarget + Math.PI);
    const cutAngleDegrees = Phaser.Math.RadToDeg(cutAngle);
    const isEasierShot = cutAngleDegrees < 30;

    let score = 0;
    score += (10 - cueToTargetDist / 50) * 10;
    score += (10 - targetToPocketDist / 50) * 10;
    score += isEasierShot ? 30 : 0;
    score += !isRiskyShot ? 20 : -20;
    score += Math.random() * 10;

    return {
      score: Math.max(0, score),
      isSafe: !isRiskyShot && isEasierShot
    };
  }

  private getDifficultyShotModifier(): number {
    switch (this.aiDifficulty) {
      case 'easy':
        return 0.7 + Math.random() * 0.6;
      case 'hard':
        return 0.95 + Math.random() * 0.1;
      default:
        return 0.85 + Math.random() * 0.3;
    }
  }

  private executeDefensiveShot(): boolean {
    if (!this.cueBall) return false;

    const { feltLeft, feltRight, feltTop, feltBottom } = this.tableBounds;
    const centerX = (feltLeft + feltRight) / 2;
    const centerY = (feltTop + feltBottom) / 2;
    
    const angle = Phaser.Math.Angle.Between(
      this.cueBall.x, this.cueBall.y,
      centerX, centerY
    );

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
    if (!this.gameData || !this.gameData.players) {
      console.log('[Pool Game] endGame called but gameData is missing');
      return;
    }
    
    this.gameOver = true;
    this.gameStarted = false;
    
    // Stop shot timer
    if (this.shotTimerEvent) {
      this.shotTimerEvent.destroy();
    }
    
    const winner = this.gameData.players[winnerTurn];
    // const loser = this.gameData.players[(winnerTurn + 1) % 2];
    
    const winnerName = winner?.username || `Player ${winnerTurn + 1}`;
    // const loserName = loser?.username || `Player ${(winnerTurn + 1) % 2 + 1}`;
    
    const resultText = result === 'win' ? 'WINS!' : 'LOSES';
    const reasonText = result === 'lose' ? '(8-ball pocketed early)' : '';
    
    this.turnText?.setText('');
    
    // Play victory sound
    if (this.soundManager) {
      this.soundManager.playVictory();
    }
    
    // Create confetti celebration
    this.createVictoryCelebration();
    
    // Victory overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setDepth(250);
    
    // Trophy emoji
    const trophy = this.add.text(this.scale.width / 2, this.scale.height / 2 - 120, '🏆', {
      fontSize: '64px'
    }).setOrigin(0.5).setDepth(251);
    
    // Animate trophy
    this.tweens.add({
      targets: trophy,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'GAME OVER', {
      fontSize: '48px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: '#00000080',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(251);
    
    this.add.text(this.scale.width / 2, this.scale.height / 2 + 10, `${winnerName} ${resultText}`, {
      fontSize: '32px',
      color: result === 'win' ? '#00ff00' : '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(251);
    
    if (reasonText) {
      this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, reasonText, {
        fontSize: '18px',
        color: '#aaaaaa'
      }).setOrigin(0.5).setDepth(251);
    }
    
    // Play again button
    const playAgainBtn = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, '▶ Play Again', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#22c55e',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(251).setInteractive({ useHandCursor: true });
    
    playAgainBtn.on('pointerover', () => playAgainBtn.setScale(1.1));
    playAgainBtn.on('pointerout', () => playAgainBtn.setScale(1));
    playAgainBtn.on('pointerdown', () => {
      // Restart scene
      this.scene.restart();
    });
  }

  private createVictoryCelebration() {
    const colors = [0xffd700, 0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0x00ffff, 0xffffff];
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * this.scale.width;
      const startY = -20;
      const endY = this.scale.height + 20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 5;
      const duration = 2000 + Math.random() * 2000;
      const delay = Math.random() * 1000;
      
      const confetti = this.add.graphics();
      confetti.fillStyle(color, 1);
      
      // Random shapes for confetti
      if (Math.random() > 0.5) {
        confetti.fillCircle(x, startY, size);
      } else {
        confetti.fillRect(x - size / 2, startY - size / 2, size, size * 1.5);
      }
      
      confetti.setDepth(260);
      
      this.tweens.add({
        targets: confetti,
        y: endY,
        x: x + (Math.random() - 0.5) * 200,
        rotation: Math.random() * Math.PI * 4,
        alpha: 0.3,
        duration: duration,
        delay: delay,
        ease: 'Power1',
        onComplete: () => {
          if (confetti && confetti.active) confetti.destroy();
        }
      });
    }
  }

  update() {
    this.frameCount++;
    
    if (this.frameCount % 5 === 0) {
      this.validateBoundaries();
    }
    
    if (this.frameCount % 3 === 0) {
      this.checkPockets();
    }
    
    if (this.cueBall && this.cueBall.active && this.ballsHaveMoved && !this.turnSwitchScheduled) {
      const allBallsStopped = this.checkAllBallsStopped();
      
      if (allBallsStopped) {
        if (!this.firstBallHit && this.gameType === 'eightball') {
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

    const pocketRadius = 25;
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

        if (distanceSq < pocketRadiusSq) {
          if (ball.getData('type') === 'cue') {
            this.handleCueBallPocketed(ball);
            break;
          }

          this.createPocketingEffect(pocket.x, pocket.y);
          
          // Play pocket sound
          if (this.soundManager) {
            this.soundManager.playPocket();
          }
          
          // Create particle effect
          if (this.particleSystem) {
            this.particleSystem.createPocketEffect(pocket.x, pocket.y);
          }

          ball.setData('pocketed', true);
          ball.setActive(false);
          ball.setVisible(false);
          ball.setVelocity(0, 0);

          const ballNumber = ball.getData('number');

          this.ballsPocketedThisTurn.push({ number: ballNumber, type: ballType });
          this.pocketedBalls.push({ number: ballNumber, type: ballType, player: this.currentPlayerTurn });

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

// Main Pool Game Component
const PoolGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { state: authState } = useAuth();
  const { activeGames, loading, error } = useGame();
  const gameRef = useRef<HTMLDivElement>(null);
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
  const [fetchedGame, setFetchedGame] = useState<any>(null);
  
  // Initialize playerCount to 2 if user is the game creator, otherwise 1
  const [playerCount] = useState(() => {
    const game = activeGames.find(g => g.id === Number(gameId));
    return (game && game.creator_id === authState.user?.id) ? 2 : 1;
  });

  // Try to find game in activeGames first, then use fetched game
  const currentGame = activeGames.find(g => g.id === Number(gameId)) || fetchedGame;

  // Fetch game directly from API if not found in activeGames
  useEffect(() => {
    if (!currentGame && gameId && !loading) {
      const fetchGame = async () => {
        try {
          const response = await apiClient.get(`/games/${gameId}`);
          if (response.data && response.data.game) {
            setFetchedGame(response.data.game);
          }
        } catch (err) {
          console.error('Failed to fetch game:', err);
        }
      };
      fetchGame();
    }
  }, [gameId, currentGame, loading]);
  const hasAIOpponent = currentGame?.entries?.some((entry: any) =>
    entry.user_id === 999 || entry.username?.startsWith('AI ')
  ) || currentGame?.opponent_type === 'ai' || currentGame?.allow_ai;

  // Single Phaser game creation with proper cleanup
  useEffect(() => {
    if (!gameRef.current || !currentGame) return;

    const container = gameRef.current;
    
    // Check if game already exists
    const existingGame = (window as any).__phaserGame;
    if (existingGame) {
      console.log('[Phaser Debug] Game already exists, using existing instance');
      return;
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      parent: container,
      backgroundColor: '#1a1a2e',
      audio: {
        noAudio: true  // Disable audio to avoid AudioContext errors
      },
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0, x: 0 },
          debug: false
        }
      },
      scene: [PoolGameScene]
    };

    console.log('[Phaser Debug] Creating new Phaser game');
    const game = new Phaser.Game(config);
    (window as any).__phaserGame = game;

    // Pass game data to scene when it starts
    game.events.on('ready', () => {
      const scene = game.scene.scenes[0] as any;
      if (scene) {
        scene.gameData = {
          gameId: currentGame.id,
          players: gameState.players,
          currentUserId: authState.user?.id,
          gameType: currentGame.game_type,
          aiDifficulty: opponentSelection.difficulty
        };
      }
    });

    // Cleanup on unmount - proper shutdown to avoid AudioContext errors
    return () => {
      console.log('[Phaser Debug] Destroying Phaser game');
      if ((window as any).__phaserGame === game) {
        // Stop all scenes first
        game.scene.scenes.forEach((scene: Phaser.Scene) => {
          scene.scene.stop();
        });
        
        // Close audio context if it exists
        const gameCanvas = container.querySelector('canvas');
        if (gameCanvas) {
          try {
            // Force garbage collection of audio resources
            const audioContext = (game as any).sys?.audio?.context;
            if (audioContext && audioContext.state !== 'closed') {
              audioContext.suspend().catch(() => {});
            }
          } catch (e) {
            // Ignore audio cleanup errors
          }
        }
        
        // Destroy the game
        game.destroy(true, false);
        (window as any).__phaserGame = undefined;
      }
    };
  }, [currentGame?.id]);

  // Auto-start game if AI opponent was already assigned
  useEffect(() => {
    if (!currentGame || gameStarted) return;
    if (!hasAIOpponent) return;

    const aiDifficulty = currentGame.ai_difficulty || currentGame?.ai_difficulty || 'medium';
    
    setOpponentSelection({
      show: false,
      opponentType: 'ai',
      difficulty: aiDifficulty
    });

    const mockEntries: GameEntry[] = currentGame.entries || [
      {
        id: 1,
        user_id: currentGame.creator_id || authState.user?.id,
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

    setGameStarted(true);
  }, [currentGame, hasAIOpponent, authState.user]);

  // Initialize game state
  useEffect(() => {
    if (!currentGame) return;

    if (!opponentSelection.opponentType && !hasAIOpponent) {
      const mockEntries: GameEntry[] = currentGame.entries || [
        {
          id: 1,
          user_id: currentGame.creator_id || authState.user?.id,
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
  }, [currentGame, authState.user, opponentSelection.opponentType, hasAIOpponent]);

  const handleOpponentSelection = (opponentType: 'human' | 'ai', difficulty: 'easy' | 'medium' | 'hard' | null = null) => {
    if (!currentGame) return;

    setOpponentSelection({
      show: false,
      opponentType,
      difficulty
    });

    const mockEntries: GameEntry[] = currentGame.entries || [
      {
        id: 1,
        user_id: currentGame.creator_id || authState.user?.id,
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

    setGameStarted(true);
  };

  const handleForfeit = () => {
    if (window.confirm('Are you sure you want to forfeit this game?')) {
      navigate('/games');
    }
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
    <div className="pool-game-container flex flex-col h-screen">
      <div className="pool-game-header bg-gradient-to-r from-gray-900 to-gray-800 p-3 flex justify-between items-center border-b border-gray-700">
        <h2 className="pool-game-title text-white text-lg md:text-xl font-bold">🎱 8-Ball Pool - {currentGame.game_code}</h2>
        <div className="pool-game-status text-white text-xs md:text-sm flex items-center gap-3">
          <span className="bg-yellow-500 text-black px-2 py-1 rounded font-semibold">Stake: ${currentGame.stake_amount}</span>
          <span className={`px-2 py-1 rounded ${gameState.status === 'in_progress' ? 'bg-green-500' : 'bg-gray-500'}`}>
            {gameState.status}
          </span>
        </div>
      </div>

      <div
        ref={gameRef}
        className="flex-1 w-full relative touch-none"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        {/* Opponent Selection Overlay */}
        {opponentSelection.show && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-8 text-center max-w-md border-2 border-yellow-500 shadow-2xl">
              <h3 className="text-3xl font-bold text-yellow-400 mb-2">🎱 Choose Your Opponent</h3>
              
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-gray-300 text-xs">Game Code</p>
                <p className="text-2xl font-mono font-bold text-yellow-400">{currentGame?.game_code}</p>
              </div>

              <div className="space-y-4">
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
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-xl font-semibold text-white mb-3">👥 Play vs Human</h4>
                  {playerCount < 2 ? (
                    <>
                      <p className="text-gray-300 text-sm mb-3">Waiting for another player...</p>
                      <button
                        className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-all disabled:opacity-50"
                        disabled={true}
                      >
                        Waiting for opponent...
                      </button>
                    </>
                  ) : (
                    <button
                      className="w-full px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-all"
                      onClick={() => handleOpponentSelection('human', null)}
                    >
                      Start Game vs Human
                    </button>
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
                onClick={() => setOpponentSelection(prev => ({ ...prev, show: true }))}
                disabled={gameState.players.length < 2 && playerCount < 2}
              >
                {gameState.players.length < 2 && playerCount < 2 ? 'Waiting for opponent...' : 'Start Game'}
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

      {/* Mobile Controls Overlay */}
      <div className="pool-game-controls bg-gradient-to-t from-gray-900 to-transparent p-4 md:hidden">
        <div className="pool-control-panel text-center">
          <div className="flex justify-center items-center gap-4">
            {/* Mobile Power Indicator */}
            <div className="flex flex-col items-center">
              <div className="text-white text-xs mb-1 font-semibold">POWER</div>
              <div className="w-20 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                  style={{ width: '0%' }}
                  id="mobile-power-bar"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-lg transition-all text-sm shadow-lg"
                onClick={handleForfeit}
              >
                Forfeit
              </button>
            </div>
          </div>

          {/* Mobile Instructions */}
          <div className="mt-3 text-gray-400 text-xs">
            <p>🎯 Drag from cue ball to aim • Pull back for power</p>
          </div>
        </div>
      </div>

      {/* Desktop Controls */}
      <div className="pool-game-controls hidden md:block absolute bottom-4 left-0 right-0">
        <div className="pool-control-panel text-center">
          <div className="flex justify-center space-x-4">
            <button
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all shadow-lg"
              onClick={handleForfeit}
            >
              Forfeit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolGame;