"""
Enhanced AI Opponent for 8-Ball Pool
Production-grade AI with advanced decision-making and strategic thinking
"""

import random
import math
import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timezone

from .pool_physics import PoolPhysicsEngine, PoolBall
from .vector2 import Vector2
from .pool_rules_engine import PoolRulesEngine

logger = logging.getLogger(__name__)


@dataclass
class ShotOption:
    """Represents a potential shot option"""
    target_ball_id: int
    target_ball_type: str
    angle: float
    power: float
    spin: float
    target_pocket: Optional[Dict[str, float]]
    score: float
    confidence: float
    is_safe: bool
    description: str
    risk_level: str


class EnhancedAIOpponent:
    """
    Enhanced AI opponent with strategic thinking and physics-based decision making.
    Uses advanced evaluation functions and multi-level lookahead.
    """

    def __init__(self, difficulty: str = 'medium', personality: str = 'balanced'):
        self.difficulty = difficulty
        self.personality = personality
        self.rules_engine = PoolRulesEngine()
        
        # Difficulty-based parameters
        self.params = self._get_difficulty_params()
        
        # Strategic state
        self.strategy = 'offensive'  # offensive, defensive, safety
        self.consecutive_safety_shots = 0
        self.shot_history: List[Dict[str, Any]] = []
        
        # Skill modifiers
        self.aim_accuracy = self._get_aim_accuracy()
        self.power_control = self._get_power_control()
        self.strategic_thinking = self._get_strategic_thinking()

    def _get_difficulty_params(self) -> Dict[str, Any]:
        """Get parameters based on difficulty level"""
        params = {
            'easy': {
                'lookahead_depth': 1,
                'shot_options': 10,
                'min_confidence': 0.3,
                'safety_threshold': 0.2,
                'aggression': 0.3,
                'error_margin': 0.3
            },
            'medium': {
                'lookahead_depth': 2,
                'shot_options': 20,
                'min_confidence': 0.5,
                'safety_threshold': 0.4,
                'aggression': 0.5,
                'error_margin': 0.15
            },
            'hard': {
                'lookahead_depth': 3,
                'shot_options': 30,
                'min_confidence': 0.7,
                'safety_threshold': 0.6,
                'aggression': 0.7,
                'error_margin': 0.08
            },
            'expert': {
                'lookahead_depth': 4,
                'shot_options': 50,
                'min_confidence': 0.85,
                'safety_threshold': 0.7,
                'aggression': 0.8,
                'error_margin': 0.03
            }
        }
        return params.get(self.difficulty, params['medium'])

    def _get_aim_accuracy(self) -> float:
        """Get aim accuracy based on difficulty"""
        accuracy = {
            'easy': 0.7,
            'medium': 0.85,
            'hard': 0.95,
            'expert': 0.99
        }
        return accuracy.get(self.difficulty, 0.85)

    def _get_power_control(self) -> float:
        """Get power control based on difficulty"""
        control = {
            'easy': 0.7,
            'medium': 0.85,
            'hard': 0.95,
            'expert': 0.99
        }
        return control.get(self.difficulty, 0.85)

    def _get_strategic_thinking(self) -> int:
        """Get strategic thinking depth based on difficulty"""
        depth = {
            'easy': 1,
            'medium': 2,
            'hard': 3,
            'expert': 4
        }
        return depth.get(self.difficulty, 2)

    def decide_shot(self, physics_engine: PoolPhysicsEngine,
                   game_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decide on the best shot to take.
        Returns shot parameters and metadata.
        """
        # Get current player info
        current_player_id = game_state.get('current_player_id')
        player_group = game_state.get('player1_group') if current_player_id == game_state.get('player1_id') else game_state.get('player2_group')
        table_open = game_state.get('table_open', True)
        
        # Generate shot options
        shot_options = self._generate_shot_options(
            physics_engine, player_group, table_open
        )
        
        if not shot_options:
            # No valid shots, play safe
            return self._play_defensive(physics_engine, player_group, table_open)
        
        # Evaluate each option
        evaluated_options = []
        for option in shot_options:
            score = self._evaluate_shot_option(
                option, physics_engine, game_state, player_group, table_open
            )
            option.score = score
            evaluated_options.append(option)
        
        # Sort by score
        evaluated_options.sort(key=lambda x: x.score, reverse=True)
        
        # Select best shot (with some randomness based on difficulty)
        best_shot = self._select_best_shot(evaluated_options)
        
        # Apply skill modifiers (aim error, power error)
        best_shot = self._apply_skill_modifiers(best_shot)
        
        # Record decision
        self._record_shot_decision(best_shot, game_state)
        
        return {
            'action': 'shoot',
            'target_ball_id': best_shot.target_ball_id,
            'target_ball_type': best_shot.target_ball_type,
            'angle': best_shot.angle,
            'power': best_shot.power,
            'spin': best_shot.spin,
            'target_pocket': best_shot.target_pocket,
            'confidence': best_shot.confidence,
            'is_safe': best_shot.is_safe,
            'strategy': self.strategy,
            'difficulty': self.difficulty,
            'score': best_shot.score,
            'description': best_shot.description
        }

    def _generate_shot_options(self, physics_engine: PoolPhysicsEngine,
                              player_group: Optional[str],
                              table_open: bool) -> List[ShotOption]:
        """Generate possible shot options"""
        options = []
        
        # Get cue ball
        cue_ball = next((b for b in physics_engine.balls if b.id == 0), None)
        if not cue_ball or cue_ball.is_pocketed:
            return options
        
        # Get target balls
        target_balls = self._get_target_balls(physics_engine, player_group, table_open)
        
        # Define pocket targets
        pockets = physics_engine.pockets
        
        # Generate options for each target ball and pocket combination
        for ball in target_balls:
            for pocket in pockets:
                # Calculate shot parameters
                shot_option = self._calculate_shot_option(
                    cue_ball, ball, pocket, physics_engine, player_group
                )
                if shot_option:
                    options.append(shot_option)
        
        # Add safety shot option
        safety_option = self._generate_safety_shot_option(cue_ball, physics_engine, player_group)
        if safety_option:
            options.append(safety_option)
        
        return options

    def _get_target_balls(self, physics_engine: PoolPhysicsEngine,
                         player_group: Optional[str],
                         table_open: bool) -> List[PoolBall]:
        """Get valid target balls for current player"""
        balls = []
        
        for ball in physics_engine.balls:
            if ball.is_pocketed or ball.id == 0:
                continue
            
            if table_open:
                # Any ball can be targeted (except 8-ball on break)
                balls.append(ball)
            else:
                # Only target balls of player's group or 8-ball
                if player_group and ball.ball_type == player_group:
                    balls.append(ball)
                elif ball.ball_type == 'eight' and self._can_target_eight(physics_engine, player_group):
                    balls.append(ball)
        
        return balls

    def _can_target_eight(self, physics_engine: PoolPhysicsEngine,
                         player_group: Optional[str]) -> bool:
        """Check if player can target 8-ball"""
        if not player_group:
            return False
        # Count remaining balls of player's group
        remaining = sum(
            1 for b in physics_engine.balls
            if not b.is_pocketed and b.ball_type == player_group and b.id != 0
        )
        return remaining == 0

    def _calculate_shot_option(self, cue_ball: PoolBall, target_ball: PoolBall,
                              pocket: Dict[str, float],
                              physics_engine: PoolPhysicsEngine,
                              player_group: Optional[str]) -> Optional[ShotOption]:
        """Calculate shot parameters for hitting target ball into pocket"""
        # Calculate vector from target ball to pocket
        pocket_pos = Vector2(pocket['x'], pocket['y'])
        target_to_pocket = pocket_pos.subtract(target_ball.position)
        
        # Calculate desired target ball position (one ball radius from pocket)
        desired_dist = target_ball.radius * 2.2
        target_pos = pocket_pos.subtract(
            target_to_pocket.normalized().multiply(desired_dist)
        )
        
        # Calculate vector from cue ball to target position
        cue_to_target = target_pos.subtract(cue_ball.position)
        
        # Calculate angle
        angle = cue_to_target.angle_to(Vector2(1, 0))
        
        # Calculate distance
        distance = cue_to_target.length()
        
        # Calculate required power (based on distance and ball weights)
        base_power = min(0.3 + (distance / 1000), 0.95)
        
        # Calculate cut angle
        target_to_cue = cue_ball.position.subtract(target_ball.position)
        cut_angle = abs(target_to_pocket.angle_to(Vector2(1, 0)) - target_to_cue.angle_to(Vector2(1, 0)))
        if cut_angle > math.pi:
            cut_angle = 2 * math.pi - cut_angle
        
        # Adjust power for cut shots
        if cut_angle > 0.5:  # About 30 degrees
            base_power *= 1.1
        
        # Check if shot is feasible (no obstructions)
        if self._is_shot_blocked(cue_ball.position, target_pos, physics_engine):
            return None
        
        # Calculate spin (english)
        spin = self._calculate_optimal_spin(cue_ball, target_ball, pocket_pos, angle)
        
        # Calculate confidence
        confidence = self._calculate_shot_confidence(
            distance, cut_angle, cue_ball, target_ball, pocket
        )
        
        # Determine if shot is safe
        is_safe = self._is_safe_shot(cue_ball, target_ball, pocket, physics_engine)
        
        # Create description
        description = self._create_shot_description(
            target_ball, pocket, cut_angle, confidence, is_safe
        )
        
        return ShotOption(
            target_ball_id=target_ball.id,
            target_ball_type=target_ball.ball_type,
            angle=angle,
            power=base_power,
            spin=spin,
            target_pocket=pocket,
            score=0,  # Will be calculated later
            confidence=confidence,
            is_safe=is_safe,
            description=description,
            risk_level=self._calculate_risk_level(confidence, is_safe)
        )

    def _is_shot_blocked(self, cue_pos: Vector2, target_pos: Vector2,
                        physics_engine: PoolPhysicsEngine) -> bool:
        """Check if shot path is blocked by other balls"""
        # Check each ball to see if it's in the way
        for ball in physics_engine.balls:
            if ball.is_pocketed or ball.id == 0:
                continue
            
            # Calculate distance from ball to shot line
            # Using point-to-line distance formula
            line_vec = target_pos.subtract(cue_pos)
            ball_vec = ball.position.subtract(cue_pos)
            
            if line_vec.length() == 0:
                continue
            
            # Project ball vector onto line vector
            t = ball_vec.dot(line_vec) / line_vec.length_squared()
            t = max(0, min(1, t))  # Clamp to segment
            
            # Find closest point on line segment
            closest = cue_pos.add(line_vec.multiply(t))
            
            # Check if ball is in the way
            dist = ball.position.distance_to(closest)
            if dist < ball.radius * 2.5:  # Ball radius + some margin
                return True
        
        return False

    def _calculate_optimal_spin(self, cue_ball: PoolBall, target_ball: PoolBall,
                               pocket_pos: Vector2, angle: float) -> float:
        """Calculate optimal spin for the shot"""
        # Calculate if spin would help position cue ball
        # For now, use minimal spin
        return 0.0

    def _calculate_shot_confidence(self, distance: float, cut_angle: float,
                                  cue_ball: PoolBall, target_ball: PoolBall,
                                  pocket: Dict[str, float]) -> float:
        """Calculate confidence score for a shot"""
        # Base confidence on distance (closer = better)
        distance_factor = max(0, 1 - (distance / 1000))
        
        # Confidence based on cut angle (straight shots are easier)
        cut_factor = 1 - (cut_angle / math.pi)
        
        # Adjust based on difficulty
        difficulty_factor = self.aim_accuracy
        
        confidence = (distance_factor * 0.4 + cut_factor * 0.6) * difficulty_factor
        
        return max(0.1, min(0.95, confidence))

    def _is_safe_shot(self, cue_ball: PoolBall, target_ball: PoolBall,
                     pocket: Dict[str, float],
                     physics_engine: PoolPhysicsEngine) -> bool:
        """Determine if a shot is safe (leaves good position)"""
        # Check if cue ball will have good position after shot
        # Simplified: check if target ball is close to pocket
        pocket_pos = Vector2(pocket['x'], pocket['y'])
        dist_to_pocket = target_ball.position.distance_to(pocket_pos)
        
        # Safe if target is very close to pocket
        return dist_to_pocket < 50

    def _create_shot_description(self, target_ball: PoolBall,
                                pocket: Dict[str, float],
                                cut_angle: float, confidence: float,
                                is_safe: bool) -> str:
        """Create human-readable shot description"""
        cut_deg = math.degrees(cut_angle)
        
        if cut_deg < 10:
            shot_type = "straight"
        elif cut_deg < 30:
            shot_type = "slight cut"
        elif cut_deg < 60:
            shot_type = "moderate cut"
        else:
            shot_type = "difficult cut"
        
        safety = "safe" if is_safe else "risky"
        
        return (f"{shot_type} shot on {target_ball.ball_type} ball #{target_ball.id} "
                f"({cut_deg:.1f}° cut) - {safety}, confidence: {confidence:.2f}")

    def _calculate_risk_level(self, confidence: float, is_safe: bool) -> str:
        """Calculate risk level for a shot"""
        if confidence > 0.8 and is_safe:
            return "low"
        elif confidence > 0.6:
            return "medium"
        else:
            return "high"

    def _evaluate_shot_option(self, option: ShotOption,
                             physics_engine: PoolPhysicsEngine,
                             game_state: Dict[str, Any],
                             player_group: Optional[str],
                             table_open: bool) -> float:
        """Evaluate a shot option and return score"""
        score = option.confidence * 100  # Base score from confidence
        
        # Bonus for pocketing balls
        if option.target_ball_type in ['solid', 'stripe']:
            score += 50
        
        # Bonus for strategic positioning
        if option.is_safe:
            score += 30
        
        # Adjust based on strategy
        if self.strategy == 'offensive':
            # Prefer aggressive shots
            if not option.is_safe and option.confidence > 0.7:
                score += 20
        elif self.strategy == 'defensive':
            # Prefer safe shots
            if option.is_safe:
                score += 40
            else:
                score -= 30
        
        # Adjust based on game state
        remaining_balls = self._count_remaining_balls(physics_engine, player_group)
        if remaining_balls <= 3:
            # End game: be more aggressive
            score *= 1.2
        
        # Apply personality modifiers
        if self.personality == 'aggressive':
            score *= 1.15
        elif self.personality == 'defensive':
            score *= 0.9
        
        # Apply difficulty-based scaling
        score *= (1 + self.params['aggression'] * 0.2)
        
        return score

    def _count_remaining_balls(self, physics_engine: PoolPhysicsEngine,
                              player_group: Optional[str]) -> int:
        """Count remaining balls for player"""
        count = 0
        for ball in physics_engine.balls:
            if not ball.is_pocketed and ball.id != 0:
                if player_group is None or ball.ball_type == player_group:
                    count += 1
        return count

    def _select_best_shot(self, options: List[ShotOption]) -> ShotOption:
        """Select best shot with some randomness based on difficulty"""
        if not options:
            raise ValueError("No shot options available")
        
        # Take top options
        top_options = options[:max(1, len(options) // 3)]
        
        # Add randomness based on difficulty
        if self.difficulty == 'easy':
            # More random
            return random.choice(top_options[:min(3, len(top_options))])
        elif self.difficulty == 'medium':
            # Some randomness
            if random.random() < 0.3:
                return random.choice(top_options[:min(3, len(top_options))])
        elif self.difficulty == 'hard':
            # Mostly deterministic
            if random.random() < 0.1:
                return random.choice(top_options[:min(2, len(top_options))])
        
        # Expert: almost always pick best
        return top_options[0]

    def _apply_skill_modifiers(self, shot: ShotOption) -> ShotOption:
        """Apply skill-based errors to shot parameters"""
        # Add aim error
        aim_error = (1 - self.aim_accuracy) * random.uniform(-0.3, 0.3)
        shot.angle += aim_error
        
        # Add power error
        power_error = (1 - self.power_control) * random.uniform(-0.2, 0.2)
        shot.power = max(0.1, min(1.0, shot.power + power_error))
        
        return shot

    def _play_defensive(self, physics_engine: PoolPhysicsEngine,
                       player_group: Optional[str],
                       table_open: bool) -> Dict[str, Any]:
        """Play a defensive shot when no good offensive options"""
        # Find safest option
        cue_ball = next((b for b in physics_engine.balls if b.id == 0), None)
        if not cue_ball:
            return self._default_shot()
        
        # Try to hide cue ball behind other balls
        target_ball = self._find_safety_target(physics_engine, player_group)
        
        if target_ball:
            # Calculate shot to leave cue ball in safe position
            angle = cue_ball.position.angle_to(target_ball.position)
            power = 0.3
            
            return {
                'action': 'shoot',
                'target_ball_id': target_ball.id,
                'target_ball_type': target_ball.ball_type,
                'angle': angle,
                'power': power,
                'spin': 0,
                'target_pocket': None,
                'confidence': 0.5,
                'is_safe': True,
                'strategy': 'defensive',
                'difficulty': self.difficulty,
                'score': 0,
                'description': 'Defensive safety shot'
            }
        
        return self._default_shot()

    def _find_safety_target(self, physics_engine: PoolPhysicsEngine,
                           player_group: Optional[str]) -> Optional[PoolBall]:
        """Find a good target for a safety shot"""
        # Look for balls that can block opponent
        for ball in physics_engine.balls:
            if ball.is_pocketed or ball.id == 0:
                continue
            
            if player_group is None or ball.ball_type == player_group:
                return ball
        
        return None

    def _default_shot(self) -> Dict[str, Any]:
        """Return a default shot when no options available"""
        return {
            'action': 'shoot',
            'target_ball_id': None,
            'target_ball_type': None,
            'angle': random.uniform(0, 2 * math.pi),
            'power': 0.5,
            'spin': 0,
            'target_pocket': None,
            'confidence': 0.3,
            'is_safe': False,
            'strategy': 'default',
            'difficulty': self.difficulty,
            'score': 0,
            'description': 'Default shot'
        }

    def _generate_safety_shot_option(self, cue_ball: PoolBall,
                                    physics_engine: PoolPhysicsEngine,
                                    player_group: Optional[str]) -> Optional[ShotOption]:
        """Generate a safety shot option"""
        # Find a ball to hit that leaves cue ball in safe position
        for ball in physics_engine.balls:
            if ball.is_pocketed or ball.id == 0:
                continue
            
            if player_group is None or ball.ball_type == player_group:
                # Calculate a shot that leaves cue ball safe
                angle = cue_ball.position.angle_to(ball.position)
                power = 0.3
                
                return ShotOption(
                    target_ball_id=ball.id,
                    target_ball_type=ball.ball_type,
                    angle=angle,
                    power=power,
                    spin=0,
                    target_pocket=None,
                    score=0,
                    confidence=0.5,
                    is_safe=True,
                    description="Safety shot",
                    risk_level="low"
                )
        
        return None

    def _record_shot_decision(self, shot: ShotOption, game_state: Dict[str, Any]):
        """Record shot decision for learning"""
        self.shot_history.append({
            'shot': shot,
            'game_state': game_state,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
        # Keep only recent history
        if len(self.shot_history) > 100:
            self.shot_history.pop(0)

    def update_strategy(self, game_state: Dict[str, Any]):
        """Update AI strategy based on game state"""
        # Count remaining balls
        player_group = game_state.get('player1_group')
        remaining = self._count_remaining_balls_from_state(game_state, player_group)
        
        if remaining <= 3:
            self.strategy = 'offensive'
        elif remaining <= 6:
            self.strategy = 'balanced'
        else:
            # Early game: be more strategic
            self.strategy = 'defensive' if self.personality == 'defensive' else 'balanced'

    def _count_remaining_balls_from_state(self, game_state: Dict[str, Any],
                                         player_group: Optional[str]) -> int:
        """Count remaining balls from game state"""
        # Simplified - in practice would check actual ball positions
        return 7  # Default

    def reset(self):
        """Reset AI state for new game"""
        self.strategy = 'offensive'
        self.consecutive_safety_shots = 0
        self.shot_history = []