"""
Game State Manager for 8-Ball Pool
Manages persistent game state including ball positions, scores, and game rules
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from copy import deepcopy

from .pool_physics import PoolPhysicsEngine, PoolBall
from .vector2 import Vector2

logger = logging.getLogger(__name__)


@dataclass
class GameState:
    """Represents the complete state of an 8-ball pool game"""
    game_id: int
    status: str = "setup"  # setup, in_progress, completed, paused
    current_player_id: int = 0
    player1_id: int = 0
    player2_id: int = 0
    player1_group: Optional[str] = None  # 'solid' or 'stripe'
    player2_group: Optional[str] = None
    table_open: bool = True
    break_shot_taken: bool = False
    winner: Optional[int] = None
    winning_reason: Optional[str] = None
    
    # Ball tracking
    balls: Dict[int, Dict[str, Any]] = field(default_factory=dict)
    pocketed_balls: List[Dict[str, Any]] = field(default_factory=list)
    balls_pocketed_this_turn: List[int] = field(default_factory=list)
    
    # Turn tracking
    current_turn: int = 0
    shots_this_turn: int = 0
    fouls_this_turn: int = 0
    consecutive_fouls: int = 0
    
    # Game history
    shot_history: List[Dict[str, Any]] = field(default_factory=list)
    turn_history: List[Dict[str, Any]] = field(default_factory=list)
    
    # Physics state
    physics_state: Optional[Dict[str, Any]] = None
    last_update: Optional[str] = None
    
    def __post_init__(self):
        if self.last_update is None:
            self.last_update = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert game state to dictionary"""
        data = asdict(self)
        data['last_update'] = self.last_update
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GameState':
        """Create GameState from dictionary"""
        # Handle datetime
        if 'last_update' in data and isinstance(data['last_update'], str):
            data['last_update'] = data['last_update']
        return cls(**data)


class GameStateManager:
    """
    Manages game state persistence and updates for 8-ball pool.
    Provides methods to update state, validate moves, and check win conditions.
    """

    def __init__(self, game_id: int, player1_id: int, player2_id: int):
        self.game_id = game_id
        self.state = GameState(
            game_id=game_id,
            player1_id=player1_id,
            player2_id=player2_id,
            current_player_id=player1_id
        )
        self.physics_engine = PoolPhysicsEngine()
        self._setup_initial_state()

    def _setup_initial_state(self):
        """Set up initial game state"""
        self.physics_engine.setup_standard_game()
        self._update_balls_from_physics()
        self.state.status = "setup"
        self._save_physics_state()

    def _update_balls_from_physics(self):
        """Update ball state from physics engine"""
        self.state.balls = {}
        for ball in self.physics_engine.balls:
            self.state.balls[ball.id] = {
                'id': ball.id,
                'position': {'x': ball.position.x, 'y': ball.position.y},
                'velocity': {'x': ball.velocity.x, 'y': ball.velocity.y},
                'ball_type': ball.ball_type,
                'is_pocketed': ball.is_pocketed,
                'is_moving': ball.is_moving
            }

    def _save_physics_state(self):
        """Save current physics state"""
        self.state.physics_state = self.physics_engine.get_game_state()
        self.state.last_update = datetime.now(timezone.utc).isoformat()

    def start_game(self):
        """Start the game"""
        if self.state.status != "setup":
            raise ValueError(f"Cannot start game in status: {self.state.status}")
        
        self.state.status = "in_progress"
        self.state.current_turn = 1
        self._save_physics_state()
        logger.info(f"Game {self.game_id} started")

    def record_break_shot(self, shot_result: Dict[str, Any]) -> Dict[str, Any]:
        """Record the break shot"""
        if self.state.break_shot_taken:
            raise ValueError("Break shot already taken")
        
        self.state.break_shot_taken = True
        return self._record_shot(shot_result, is_break=True)

    def record_shot(self, shot_result: Dict[str, Any]) -> Dict[str, Any]:
        """Record a shot and update game state"""
        if self.state.status != "in_progress":
            raise ValueError(f"Cannot record shot when game status is {self.state.status}")
        
        if not self.state.break_shot_taken:
            raise ValueError("Break shot must be taken first")
        
        return self._record_shot(shot_result, is_break=False)

    def _record_shot(self, shot_result: Dict[str, Any], is_break: bool = False) -> Dict[str, Any]:
        """Internal method to record a shot"""
        # Update shot count
        self.state.shots_this_turn += 1
        
        # Record shot in history
        shot_record = {
            'turn': self.state.current_turn,
            'shot_number': self.state.shots_this_turn,
            'player_id': self.state.current_player_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'is_break': is_break,
            **shot_result
        }
        self.state.shot_history.append(shot_record)
        
        # Update ball positions from physics
        self._update_balls_from_physics()
        
        # Track pocketed balls
        pocketed = shot_result.get('pocketed_balls', [])
        self.state.balls_pocketed_this_turn.extend(pocketed)
        
        # Track fouls
        if shot_result.get('foul', False):
            self.state.fouls_this_turn += 1
            self.state.consecutive_fouls += 1
        else:
            self.state.consecutive_fouls = 0
        
        # Save physics state
        self._save_physics_state()
        
        # Check win conditions
        win_check = self._check_win_conditions()
        
        return {
            'shot_record': shot_record,
            'game_state': self.get_state(),
            'win_check': win_check,
            'turn_complete': self._is_turn_complete(shot_result)
        }

    def _is_turn_complete(self, shot_result: Dict[str, Any]) -> bool:
        """Check if the current turn is complete"""
        # Turn ends on foul, scratch, or failure to pocket a ball
        if shot_result.get('foul', False) or shot_result.get('scratch', False):
            return True
        
        # Turn ends if no balls were pocketed (and it wasn't the break)
        pocketed = shot_result.get('pocketed_balls', [])
        if not pocketed and self.state.shots_this_turn > 1:
            return True
        
        # Turn continues if balls were pocketed and no foul occurred
        return False

    def _check_win_conditions(self) -> Dict[str, Any]:
        """Check if win conditions are met"""
        result = {
            'game_over': False,
            'winner': None,
            'reason': None
        }
        
        # Count pocketed balls by type
        solids_pocketed = 0
        stripes_pocketed = 0
        eight_ball_pocketed = False
        premature_eight_ball = False
        
        for ball_id, ball_data in self.state.balls.items():
            if ball_data['is_pocketed']:
                if ball_data['ball_type'] == 'solid':
                    solids_pocketed += 1
                elif ball_data['ball_type'] == 'stripe':
                    stripes_pocketed += 1
                elif ball_data['ball_type'] == 'eight':
                    eight_ball_pocketed = True
        
        # Check if 8-ball was pocketed prematurely
        if eight_ball_pocketed and (solids_pocketed < 7 or stripes_pocketed < 7):
            premature_eight_ball = True
            result['game_over'] = True
            result['reason'] = 'premature_eight_ball'
            # Player who pocketed 8-ball prematurely loses
            result['winner'] = self._get_opponent_id(self.state.current_player_id)
            return result
        
        # Check if a player has won
        current_player_group = self._get_player_group(self.state.current_player_id)
        
        if current_player_group == 'solid' and solids_pocketed == 7 and eight_ball_pocketed:
            result['game_over'] = True
            result['winner'] = self.state.current_player_id
            result['reason'] = 'all_solids_and_eight'
            return result
        
        if current_player_group == 'stripe' and stripes_pocketed == 7 and eight_ball_pocketed:
            result['game_over'] = True
            result['winner'] = self.state.current_player_id
            result['reason'] = 'all_stripes_and_eight'
            return result
        
        # Check for loss by foul on 8-ball
        if self.state.consecutive_fouls >= 3:
            result['game_over'] = True
            result['winner'] = self._get_opponent_id(self.state.current_player_id)
            result['reason'] = 'three_consecutive_fouls'
            return result
        
        return result

    def end_turn(self) -> Dict[str, Any]:
        """End the current turn"""
        # Record turn in history
        turn_record = {
            'turn_number': self.state.current_turn,
            'player_id': self.state.current_player_id,
            'shots': self.state.shots_this_turn,
            'fouls': self.state.fouls_this_turn,
            'balls_pocketed': len(self.state.balls_pocketed_this_turn),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        self.state.turn_history.append(turn_record)
        
        # Reset turn-specific state
        self.state.shots_this_turn = 0
        self.state.fouls_this_turn = 0
        self.state.balls_pocketed_this_turn = []
        self.state.current_turn += 1
        
        # Switch player
        self.state.current_player_id = self._get_opponent_id(self.state.current_player_id)
        
        self._save_physics_state()
        
        return {
            'turn_record': turn_record,
            'next_player': self.state.current_player_id,
            'game_state': self.get_state()
        }

    def _get_player_group(self, player_id: int) -> Optional[str]:
        """Get the ball group assigned to a player"""
        if player_id == self.state.player1_id:
            return self.state.player1_group
        elif player_id == self.state.player2_id:
            return self.state.player2_group
        return None

    def _get_opponent_id(self, player_id: int) -> int:
        """Get opponent ID"""
        if player_id == self.state.player1_id:
            return self.state.player2_id
        return self.state.player1_id

    def assign_groups(self, breaker_group: str):
        """Assign ball groups to players based on who broke"""
        if breaker_group not in ['solid', 'stripe']:
            raise ValueError("Breaker group must be 'solid' or 'stripe'")
        
        # Player who broke gets the group they didn't make on the break
        # (simplified: breaker gets specified group)
        self.state.player1_group = breaker_group
        self.state.player2_group = 'stripe' if breaker_group == 'solid' else 'solid'
        self.state.table_open = False

    def get_available_balls(self, player_id: int) -> List[Dict[str, Any]]:
        """Get available balls for a player"""
        player_group = self._get_player_group(player_id)
        if not player_group:
            # If table is open, all balls are available
            return [
                ball for ball in self.state.balls.values()
                if not ball['is_pocketed'] and ball['ball_type'] != 'cue'
            ]
        
        # Return only balls of player's group plus 8-ball
        return [
            ball for ball in self.state.balls.values()
            if not ball['is_pocketed'] and (
                ball['ball_type'] == player_group or ball['ball_type'] == 'eight'
            )
        ]

    def get_state(self) -> Dict[str, Any]:
        """Get current game state"""
        return self.state.to_dict()

    def validate_shot(self, shot_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a shot against game rules"""
        errors = []
        
        # Check if it's player's turn
        if shot_data.get('player_id') != self.state.current_player_id:
            errors.append("Not your turn")
        
        # Check if game is in progress
        if self.state.status != "in_progress":
            errors.append("Game is not in progress")
        
        # Check if break shot was taken
        if not self.state.break_shot_taken and not shot_data.get('is_break', False):
            errors.append("Break shot must be taken first")
        
        # Check if cue ball is specified
        if 'cue_ball_id' not in shot_data:
            errors.append("Cue ball must be specified")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }

    def reset(self):
        """Reset game state"""
        self.state = GameState(
            game_id=self.game_id,
            player1_id=self.state.player1_id,
            player2_id=self.state.player2_id,
            current_player_id=self.state.player1_id
        )
        self._setup_initial_state()