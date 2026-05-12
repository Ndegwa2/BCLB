"""
Pool Physics Engine - Headless Implementation
Specialized for 8-ball pool with deterministic, predictable physics.
Replaces general-purpose Matter.js with pool-specific calculations.
"""

import math
from typing import List, Dict, Optional, Any, Union
from .vector2 import Vector2

# Pool Physics Constants - Tuned for realistic 8-ball behavior
POOL_CONFIG = {
    'ball_radius': 20,  # pixels (scaled for game)
    'ball_mass': 1.0,   # relative mass (all balls same)
    'friction': 0.012,  # rolling friction on felt
    'min_velocity': 0.15,  # stop threshold
    'restitution': 0.92,   # ball-to-ball bounce
    'cushion_restitution': 0.78,  # rail bounce
    'cushion_friction': 0.015,    # rail friction
    'spin_decay': 0.02,   # angular velocity decay
    'table_width': 1100,  # playing surface width
    'table_height': 550,  # playing surface height
    'cushion_width': 55,  # rail width
}

class PoolBall:
    """Represents a pool ball with physics properties"""

    def __init__(self, ball_id: int, position: Vector2, ball_type: str = 'solid'):
        self.id = ball_id
        self.position = position.copy()
        self.velocity = Vector2.zero()
        self.angular_velocity = 0.0  # spin (radians per second)
        self.radius = POOL_CONFIG['ball_radius']
        self.mass = POOL_CONFIG['ball_mass']
        self.friction = POOL_CONFIG['friction']
        self.min_velocity = POOL_CONFIG['min_velocity']
        self.ball_type = ball_type  # 'cue', 'solid', 'stripe', 'eight'
        self.is_moving = False
        self.is_pocketed = False
        self.color = self._get_color()
        self.next_position = position.copy()  # Predicted position after physics step

    def _get_color(self) -> str:
        """Get ball color based on ID and type"""
        colors = {
            0: 'white',      # cue ball
            1: 'yellow',     # solid
            2: 'blue',       # solid
            3: 'red',        # solid
            4: 'purple',     # solid
            5: 'orange',     # solid
            6: 'green',      # solid
            7: 'maroon',     # solid
            8: 'black',      # eight ball
            9: 'yellow',     # stripe
            10: 'blue',      # stripe
            11: 'red',       # stripe
            12: 'purple',    # stripe
            13: 'orange',    # stripe
            14: 'green',     # stripe
            15: 'maroon'     # stripe
        }
        return colors.get(self.id, 'white')

    def apply_force(self, force: Vector2, spin: float = 0.0):
        """Apply force and optional spin to the ball"""
        # F = ma, so a = F/m
        acceleration = force.multiply(1.0 / self.mass)
        self.velocity.add_to(acceleration)
        self.angular_velocity += spin
        self.is_moving = True

    def shoot(self, power: float, angle: float, spin: float = 0.0):
        """Shoot the ball with given power, angle, and spin"""
        # Convert polar coordinates to cartesian velocity
        velocity_x = power * math.cos(angle)
        velocity_y = power * math.sin(angle)
        self.velocity = Vector2(velocity_x, velocity_y)
        self.angular_velocity = spin
        self.is_moving = True

    def update(self, delta_time: float = 1.0/60.0):
        """Update ball physics for one frame"""
        if not self.is_moving or self.is_pocketed:
            return

        # Apply linear friction (the "better" physics model)
        friction_factor = 1.0 - (self.friction * delta_time * 60)  # Scale for frame rate
        self.velocity.multiply_by(max(0, friction_factor))

        # Apply spin decay
        spin_decay = 1.0 - (POOL_CONFIG['spin_decay'] * delta_time * 60)
        self.angular_velocity *= max(0, spin_decay)

        # Update position
        self.position.add_to(self.velocity.multiply(delta_time * 60))

        # Check if ball should stop
        if self.velocity.length() < self.min_velocity:
            self.velocity = Vector2.zero()
            self.angular_velocity = 0.0
            self.is_moving = False

    def check_collision_with_ball(self, other: 'PoolBall') -> bool:
        """Check if this ball collides with another ball"""
        distance = self.position.distance_to(other.position)
        return distance < (self.radius + other.radius)

    def check_collision_with_wall(self, table_bounds: Dict[str, float]) -> Optional[str]:
        """Check collision with table boundaries using next_position prediction. Returns wall name if collision detected."""
        # Use predicted next position to prevent tunneling
        next_pos = self.next_position

        # Left wall
        if next_pos.x - self.radius < table_bounds['left']:
            return 'left'
        # Right wall
        elif next_pos.x + self.radius > table_bounds['right']:
            return 'right'
        # Top wall
        elif next_pos.y - self.radius < table_bounds['top']:
            return 'top'
        # Bottom wall
        elif next_pos.y + self.radius > table_bounds['bottom']:
            return 'bottom'

        return None

    def resolve_ball_collision(self, other: 'PoolBall'):
        """Resolve collision between two balls using physics"""
        # Calculate collision normal
        normal = other.position.subtract(self.position).normalized()

        # Calculate relative velocity
        relative_velocity = other.velocity.subtract(self.velocity)

        # Calculate relative velocity along normal
        velocity_along_normal = relative_velocity.dot(normal)

        # Don't resolve if balls are separating
        if velocity_along_normal > 0:
            return

        # Calculate restitution
        restitution = POOL_CONFIG['restitution']

        # Calculate impulse scalar
        impulse_scalar = -(1 + restitution) * velocity_along_normal
        impulse_scalar /= (1/self.mass + 1/other.mass)

        # Apply impulse
        impulse = normal.multiply(impulse_scalar)
        self.velocity.add_to(impulse.multiply(-1/self.mass))
        other.velocity.add_to(impulse.multiply(1/other.mass))

        # Transfer some spin
        spin_transfer = self.angular_velocity * 0.1
        other.angular_velocity += spin_transfer
        self.angular_velocity -= spin_transfer

        # Ensure balls are not overlapping
        overlap = (self.radius + other.radius) - self.position.distance_to(other.position)
        if overlap > 0:
            separation = normal.multiply(overlap * 0.5)
            self.position.add_to(separation.multiply(-1))
            other.position.add_to(separation)

        # Mark both balls as moving
        self.is_moving = True
        other.is_moving = True

    def resolve_wall_collision(self, wall: str, table_bounds: Dict[str, float]):
        """Resolve collision with table wall"""
        if wall == 'left':
            self.position.x = table_bounds['left'] + self.radius
            self.velocity.x *= -POOL_CONFIG['cushion_restitution']
            self.velocity.y *= (1 - POOL_CONFIG['cushion_friction'])
        elif wall == 'right':
            self.position.x = table_bounds['right'] - self.radius
            self.velocity.x *= -POOL_CONFIG['cushion_restitution']
            self.velocity.y *= (1 - POOL_CONFIG['cushion_friction'])
        elif wall == 'top':
            self.position.y = table_bounds['top'] + self.radius
            self.velocity.y *= -POOL_CONFIG['cushion_restitution']
            self.velocity.x *= (1 - POOL_CONFIG['cushion_friction'])
        elif wall == 'bottom':
            self.position.y = table_bounds['bottom'] - self.radius
            self.velocity.y *= -POOL_CONFIG['cushion_restitution']
            self.velocity.x *= (1 - POOL_CONFIG['cushion_friction'])

        # Apply spin effects from wall collision
        if wall in ['left', 'right']:
            self.angular_velocity += self.velocity.y * 0.01  # Side spin from vertical movement
        elif wall in ['top', 'bottom']:
            self.angular_velocity += self.velocity.x * 0.01  # Side spin from horizontal movement

        self.is_moving = True

    def check_pocket(self, pockets: List[Dict[str, float]]) -> bool:
        """Check if ball fell into a pocket"""
        for pocket in pockets:
            distance = self.position.distance_to(Vector2(pocket['x'], pocket['y']))
            if distance < pocket['radius']:
                self.is_pocketed = True
                self.is_moving = False
                self.velocity = Vector2.zero()
                self.angular_velocity = 0.0
                return True
        return False

    def to_dict(self) -> Dict[str, Any]:
        """Convert ball to dictionary for serialization"""
        return {
            'id': self.id,
            'position': {'x': self.position.x, 'y': self.position.y},
            'velocity': {'x': self.velocity.x, 'y': self.velocity.y},
            'angular_velocity': self.angular_velocity,
            'ball_type': self.ball_type,
            'is_moving': self.is_moving,
            'is_pocketed': self.is_pocketed,
            'color': self.color
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PoolBall':
        """Create ball from dictionary"""
        ball = cls(
            ball_id=data['id'],
            position=Vector2(data['position']['x'], data['position']['y']),
            ball_type=data['ball_type']
        )
        ball.velocity = Vector2(data['velocity']['x'], data['velocity']['y'])
        ball.angular_velocity = data['angular_velocity']
        ball.is_moving = data['is_moving']
        ball.is_pocketed = data['is_pocketed']
        return ball

class PoolPhysicsEngine:
    """Headless pool physics engine for server-side calculations"""

    def __init__(self):
        self.balls: List[PoolBall] = []
        self.table_bounds = self._calculate_table_bounds()
        self.pockets = self._create_pockets()
        self.simulation_speed = 60  # FPS
        self.delta_time = 1.0 / self.simulation_speed

    def _calculate_table_bounds(self) -> Dict[str, float]:
        """Calculate table boundaries including cushions"""
        cushion = POOL_CONFIG['cushion_width']
        return {
            'left': cushion,
            'right': POOL_CONFIG['table_width'] - cushion,
            'top': cushion,
            'bottom': POOL_CONFIG['table_height'] - cushion,
            'felt_left': cushion * 2,
            'felt_right': POOL_CONFIG['table_width'] - cushion * 2,
            'felt_top': cushion * 2,
            'felt_bottom': POOL_CONFIG['table_height'] - cushion * 2
        }

    def _create_pockets(self) -> List[Dict[str, float]]:
        """Create pocket positions and radii"""
        # Standard pool table pocket positions
        return [
            {'x': 15, 'y': 15, 'radius': 24},      # Top-left
            {'x': POOL_CONFIG['table_width'] / 2, 'y': 10, 'radius': 20},  # Top-center
            {'x': POOL_CONFIG['table_width'] - 15, 'y': 15, 'radius': 24}, # Top-right
            {'x': 15, 'y': POOL_CONFIG['table_height'] - 15, 'radius': 24}, # Bottom-left
            {'x': POOL_CONFIG['table_width'] / 2, 'y': POOL_CONFIG['table_height'] - 10, 'radius': 20}, # Bottom-center
            {'x': POOL_CONFIG['table_width'] - 15, 'y': POOL_CONFIG['table_height'] - 15, 'radius': 24}  # Bottom-right
        ]

    def add_ball(self, ball: PoolBall):
        """Add a ball to the physics simulation"""
        self.balls.append(ball)

    def setup_standard_game(self):
        """Set up balls for standard 8-ball game"""
        self.balls = []

        # Cue ball position
        cue_ball = PoolBall(0, Vector2(200, POOL_CONFIG['table_height'] / 2), 'cue')
        self.add_ball(cue_ball)

        # Rack positions for 8-ball
        rack_center_x = POOL_CONFIG['table_width'] * 0.73
        rack_center_y = POOL_CONFIG['table_height'] / 2

        # Standard rack order
        rack_order = [1, 9, 2, 10, 8, 11, 3, 12, 4, 13, 5, 14, 6, 15, 7]

        rack_positions = self._get_rack_positions(rack_center_x, rack_center_y, POOL_CONFIG['ball_radius'])

        for i, ball_id in enumerate(rack_order):
            ball_type = 'eight' if ball_id == 8 else ('solid' if ball_id <= 7 else 'stripe')
            ball = PoolBall(ball_id, rack_positions[i], ball_type)
            self.add_ball(ball)

    def _get_rack_positions(self, center_x: float, center_y: float, ball_radius: float) -> List[Vector2]:
        """Calculate positions for racked balls"""
        positions = []
        spacing = ball_radius * 2 + 1

        for row in range(5):
            balls_in_row = row + 1
            row_start_x = center_x - (row * spacing / 2)
            row_y = center_y - ((4 - row) * spacing / 2) + (row * spacing / 2)

            for col in range(balls_in_row):
                x = row_start_x + (col * spacing)
                positions.append(Vector2(x, row_y))

        return positions

    def simulate_shot(self, cue_ball_id: int, power: float, angle: float, spin: float = 0.0, max_frames: int = 1800) -> Dict[str, Any]:
        """
        Simulate a shot and return the final state
        Returns dict with ball positions, pocketed balls, etc.
        """
        # Find cue ball
        cue_ball = next((b for b in self.balls if b.id == cue_ball_id), None)
        if not cue_ball or cue_ball.is_pocketed:
            return {'error': 'Cue ball not found or pocketed'}

        # Apply shot
        cue_ball.shoot(power, angle, spin)

        # Simulate physics until all balls stop
        frame_count = 0
        pocketed_balls = []

        while frame_count < max_frames:
            # Update all balls
            for ball in self.balls:
                if not ball.is_pocketed:
                    ball.update(self.delta_time)

            # Check collisions
            self._resolve_collisions()

            # Check pockets
            for ball in self.balls:
                if not ball.is_pocketed and ball.check_pocket(self.pockets):
                    pocketed_balls.append(ball.id)

            # Check if all balls stopped
            all_stopped = all(not ball.is_moving for ball in self.balls if not ball.is_pocketed)
            if all_stopped:
                break

            frame_count += 1

        # Return final state
        return {
            'balls': [ball.to_dict() for ball in self.balls],
            'pocketed_balls': pocketed_balls,
            'frames_simulated': frame_count,
            'all_stopped': all_stopped
        }

    def _resolve_collisions(self):
        """Resolve all collisions in the current frame"""
        # Check ball-to-ball collisions
        for i, ball1 in enumerate(self.balls):
            if ball1.is_pocketed:
                continue

            for ball2 in self.balls[i+1:]:
                if ball2.is_pocketed:
                    continue

                if ball1.check_collision_with_ball(ball2):
                    ball1.resolve_ball_collision(ball2)

        # Check wall collisions
        for ball in self.balls:
            if ball.is_pocketed:
                continue

            wall = ball.check_collision_with_wall(self.table_bounds)
            if wall:
                ball.resolve_wall_collision(wall, self.table_bounds)

    def get_game_state(self) -> Dict[str, Any]:
        """Get current game state for serialization"""
        return {
            'balls': [ball.to_dict() for ball in self.balls],
            'table_bounds': self.table_bounds,
            'pockets': self.pockets
        }

    def set_game_state(self, state: Dict[str, Any]):
        """Set game state from serialized data"""
        self.balls = [PoolBall.from_dict(ball_data) for ball_data in state['balls']]

    def predict_shot_outcome(self, cue_ball_id: int, power: float, angle: float, spin: float = 0.0) -> Dict[str, Any]:
        """
        Predict shot outcome without modifying current state
        Useful for AI decision making
        """
        # Save current state
        saved_state = self.get_game_state()

        # Simulate shot
        result = self.simulate_shot(cue_ball_id, power, angle, spin)

        # Restore state
        self.set_game_state(saved_state)

        return result

    def find_best_physics_shot(self, current_player_group: str, difficulty: str = 'medium') -> Optional[Dict[str, Any]]:
        """
        Find the best shot using physics simulation and prediction
        Returns shot parameters for AI decision making
        """
        cue_ball = next((b for b in self.balls if b.id == 0), None)
        if not cue_ball or cue_ball.is_pocketed:
            return None

        # Get target balls for current player
        target_balls = [b for b in self.balls if not b.is_pocketed and b.id != 0]

        if current_player_group:
            target_balls = [b for b in target_balls if b.ball_type == current_player_group]

        if not target_balls:
            return None

        best_shot = None
        best_score = -float('inf')

        # Try shots to each target ball
        for target_ball in target_balls:
            # Try multiple angles and powers
            for angle_offset in [-0.5, -0.25, 0, 0.25, 0.5]:  # Test different cut angles
                for power in [0.3, 0.5, 0.7, 0.9]:  # Test different power levels

                    # Calculate angle to target ball
                    base_angle = cue_ball.position.angle_to(target_ball.position)
                    angle = base_angle + angle_offset

                    # Simulate shot
                    prediction = self.predict_shot_outcome(0, power, angle)

                    # Evaluate shot quality
                    score = self._evaluate_shot_quality(prediction, target_ball.id, difficulty)

                    if score > best_score:
                        best_score = score
                        best_shot = {
                            'target_x': target_ball.position.x,
                            'target_y': target_ball.position.y,
                            'angle': angle,
                            'power': power,
                            'ball_number': target_ball.id,
                            'ball_type': target_ball.ball_type,
                            'is_safe': self._is_safe_shot(prediction),
                            'score': score
                        }

        return best_shot

    def _evaluate_shot_quality(self, prediction: Dict[str, Any], target_ball_id: int, difficulty: str) -> float:
        """Evaluate how good a predicted shot is"""
        score = 0

        # Check if target ball was pocketed
        if target_ball_id in prediction.get('pocketed_balls', []):
            score += 100  # Major points for pocketing target

            # Bonus for clean shots (no other balls pocketed)
            pocketed_count = len(prediction['pocketed_balls'])
            if pocketed_count == 1:
                score += 50

        # Penalty for cue ball pocketed
        if 0 in prediction.get('pocketed_balls', []):
            score -= 200

        # Penalty for 8-ball pocketed too early
        if 8 in prediction.get('pocketed_balls', []):
            score -= 500

        # Adjust based on difficulty
        difficulty_multipliers = {
            'easy': 0.7,
            'medium': 1.0,
            'hard': 1.3,
            'expert': 1.5
        }
        score *= difficulty_multipliers.get(difficulty, 1.0)

        return score

    def _is_safe_shot(self, prediction: Dict[str, Any]) -> bool:
        """Determine if a shot is safe (leaves good position)"""
        # Simple safety check: no balls pocketed except intended target
        pocketed = prediction.get('pocketed_balls', [])
        return len(pocketed) <= 1  # Safe if 0 or 1 ball pocketed