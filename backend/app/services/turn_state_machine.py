"""
Turn State Machine for 8-Ball Pool
Manages turn phases and state transitions with production-grade reliability
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class TurnPhase(Enum):
    """Turn phases in 8-ball pool"""
    WAITING = "waiting"           # Waiting for player to start turn
    AIMING = "aiming"             # Player is aiming
    SHOOTING = "shooting"         # Shot is being executed
    BALL_SETTLING = "settling"    # Balls are settling after shot
    EVALUATING = "evaluating"     # Evaluating shot results
    TURN_END = "turn_end"         # Turn is ending, determining next player
    GAME_END = "game_end"         # Game is over


class TurnState(Enum):
    """High-level turn states"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TurnContext:
    """Context data for the current turn"""
    game_id: int
    player_id: int
    player_group: Optional[str] = None  # 'solid' or 'stripe'
    opponent_id: Optional[int] = None
    opponent_group: Optional[str] = None
    shot_number: int = 0
    consecutive_fouls: int = 0
    balls_pocketed_this_turn: int = 0
    foul_occurred: bool = False
    scratch_occurred: bool = False
    eight_ball_pocketed: bool = False
    premature_eight_ball: bool = False
    turn_start_time: Optional[datetime] = None
    turn_end_time: Optional[datetime] = None
    last_shot_result: Optional[Dict[str, Any]] = None
    table_open: bool = True  # Table is open (no groups assigned yet)
    winner: Optional[int] = None
    game_result: Optional[str] = None

    def __post_init__(self):
        if self.turn_start_time is None:
            self.turn_start_time = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'game_id': self.game_id,
            'player_id': self.player_id,
            'player_group': self.player_group,
            'opponent_id': self.opponent_id,
            'opponent_group': self.opponent_group,
            'shot_number': self.shot_number,
            'consecutive_fouls': self.consecutive_fouls,
            'balls_pocketed_this_turn': self.balls_pocketed_this_turn,
            'foul_occurred': self.foul_occurred,
            'scratch_occurred': self.scratch_occurred,
            'eight_ball_pocketed': self.eight_ball_pocketed,
            'premature_eight_ball': self.premature_eight_ball,
            'turn_start_time': self.turn_start_time.isoformat() if self.turn_start_time else None,
            'turn_end_time': self.turn_end_time.isoformat() if self.turn_end_time else None,
            'last_shot_result': self.last_shot_result,
            'table_open': self.table_open,
            'winner': self.winner,
            'game_result': self.game_result
        }


class TurnStateMachine:
    """
    State machine for managing turn progression in 8-ball pool.
    Ensures proper turn flow and rule enforcement.
    """

    def __init__(self, game_id: int, player1_id: int, player2_id: int):
        self.game_id = game_id
        self.current_player_id = player1_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        self.current_phase = TurnPhase.WAITING
        self.current_state = TurnState.NOT_STARTED
        self.context = TurnContext(game_id=game_id, player_id=player1_id)
        self.turn_history: list[Dict[str, Any]] = []
        self._validate_initial_state()

    def _validate_initial_state(self):
        """Validate initial state is correct"""
        if self.player1_id == self.player2_id:
            raise ValueError("Players must be different")
        if self.game_id <= 0:
            raise ValueError("Invalid game ID")

    def transition_to(self, new_phase: TurnPhase, **kwargs) -> bool:
        """
        Transition to a new turn phase with validation.
        Returns True if transition was successful.
        """
        if not self._is_valid_transition(new_phase):
            logger.warning(
                f"Invalid transition from {self.current_phase} to {new_phase} "
                f"for game {self.game_id}"
            )
            return False

        old_phase = self.current_phase
        self.current_phase = new_phase
        self._update_context(**kwargs)
        self._log_transition(old_phase, new_phase)
        return True

    def _is_valid_transition(self, new_phase: TurnPhase) -> bool:
        """Check if transition to new phase is valid"""
        valid_transitions = {
            TurnPhase.WAITING: [TurnPhase.AIMING, TurnPhase.GAME_END],
            TurnPhase.AIMING: [TurnPhase.SHOOTING, TurnPhase.TURN_END],
            TurnPhase.SHOOTING: [TurnPhase.BALL_SETTLING, TurnPhase.TURN_END],
            TurnPhase.BALL_SETTLING: [TurnPhase.EVALUATING, TurnPhase.TURN_END],
            TurnPhase.EVALUATING: [TurnPhase.AIMING, TurnPhase.TURN_END, TurnPhase.GAME_END],
            TurnPhase.TURN_END: [TurnPhase.WAITING, TurnPhase.GAME_END],
            TurnPhase.GAME_END: [],
        }

        return new_phase in valid_transitions.get(self.current_phase, [])

    def _update_context(self, **kwargs):
        """Update turn context with new information"""
        for key, value in kwargs.items():
            if hasattr(self.context, key):
                setattr(self.context, key, value)

    def _log_transition(self, old_phase: TurnPhase, new_phase: TurnPhase):
        """Log phase transition for debugging"""
        logger.info(
            f"Game {self.game_id}: Turn phase transition "
            f"{old_phase.value} -> {new_phase.value} "
            f"(player: {self.context.player_id})"
        )

    def start_turn(self, player_id: int, player_group: Optional[str] = None) -> bool:
        """Start a new turn for the specified player"""
        if self.current_state == TurnState.IN_PROGRESS:
            logger.warning(f"Turn already in progress for game {self.game_id}")
            return False

        if player_id not in [self.player1_id, self.player2_id]:
            logger.error(f"Invalid player {player_id} for game {self.game_id}")
            return False

        self.current_player_id = player_id
        self.current_state = TurnState.IN_PROGRESS
        self.context = TurnContext(
            game_id=self.game_id,
            player_id=player_id,
            player_group=player_group,
            opponent_id=self._get_opponent_id(player_id),
            opponent_group=self._get_opponent_group(player_group),
            turn_start_time=datetime.now(timezone.utc)
        )

        return self.transition_to(TurnPhase.AIMING)

    def _get_opponent_id(self, player_id: int) -> Optional[int]:
        """Get opponent ID for given player"""
        if player_id == self.player1_id:
            return self.player2_id
        elif player_id == self.player2_id:
            return self.player1_id
        return None

    def _get_opponent_group(self, player_group: Optional[str]) -> Optional[str]:
        """Get opponent's ball group"""
        if player_group == 'solid':
            return 'stripe'
        elif player_group == 'stripe':
            return 'solid'
        return None

    def record_shot(self, shot_result: Dict[str, Any]) -> bool:
        """Record a shot result and update turn state"""
        if self.current_state != TurnState.IN_PROGRESS:
            logger.warning(f"Cannot record shot when turn not in progress")
            return False

        self.context.shot_number += 1
        self.context.last_shot_result = shot_result

        # Update shot-specific context
        if shot_result.get('foul', False):
            self.context.foul_occurred = True
            self.context.consecutive_fouls += 1
        else:
            self.context.consecutive_fouls = 0

        if shot_result.get('scratch', False):
            self.context.scratch_occurred = True

        if shot_result.get('eight_ball_pocketed', False):
            self.context.eight_ball_pocketed = True

        if shot_result.get('premature_eight_ball', False):
            self.context.premature_eight_ball = True

        balls_pocketed = shot_result.get('balls_pocketed', [])
        self.context.balls_pocketed_this_turn += len(balls_pocketed)

        return True

    def end_turn(self, winner: Optional[int] = None, game_result: Optional[str] = None) -> bool:
        """End the current turn"""
        if self.current_state != TurnState.IN_PROGRESS:
            logger.warning(f"Cannot end turn when not in progress")
            return False

        self.context.turn_end_time = datetime.now(timezone.utc)
        self.current_state = TurnState.COMPLETED

        # Record turn in history
        turn_record = {
            'player_id': self.context.player_id,
            'shot_number': self.context.shot_number,
            'balls_pocketed': self.context.balls_pocketed_this_turn,
            'foul_occurred': self.context.foul_occurred,
            'scratch_occurred': self.context.scratch_occurred,
            'turn_duration': (
                self.context.turn_end_time - self.context.turn_start_time
            ).total_seconds() if self.context.turn_start_time else 0,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        self.turn_history.append(turn_record)

        if winner is not None:
            self.context.winner = winner
        if game_result is not None:
            self.context.game_result = game_result

        return self.transition_to(TurnPhase.TURN_END)

    def switch_player(self) -> bool:
        """Switch to the other player's turn"""
        if self.current_state != TurnState.COMPLETED:
            logger.warning(f"Cannot switch player when turn not completed")
            return False

        next_player = self._get_opponent_id(self.current_player_id)
        if next_player is None:
            logger.error(f"Cannot determine next player for game {self.game_id}")
            return False

        # Reset for new turn
        self.current_state = TurnState.NOT_STARTED
        self.current_phase = TurnPhase.WAITING

        # Start new turn
        return self.start_turn(
            player_id=next_player,
            player_group=self.context.opponent_group
        )

    def end_game(self, winner: int, game_result: str = "completed") -> bool:
        """End the game"""
        self.context.winner = winner
        self.context.game_result = game_result
        self.current_state = TurnState.COMPLETED
        return self.transition_to(TurnPhase.GAME_END)

    def get_state(self) -> Dict[str, Any]:
        """Get current state of the turn state machine"""
        return {
            'game_id': self.game_id,
            'current_player_id': self.current_player_id,
            'player1_id': self.player1_id,
            'player2_id': self.player2_id,
            'current_phase': self.current_phase.value,
            'current_state': self.current_state.value,
            'context': self.context.to_dict(),
            'turn_history': self.turn_history,
            'is_turn_in_progress': self.current_state == TurnState.IN_PROGRESS,
            'can_shoot': self.current_phase == TurnPhase.AIMING and
                         self.current_state == TurnState.IN_PROGRESS
        }

    def can_player_shoot(self, player_id: int) -> bool:
        """Check if player can shoot"""
        return (
            self.current_player_id == player_id and
            self.current_state == TurnState.IN_PROGRESS and
            self.current_phase == TurnPhase.AIMING
        )

    def reset(self):
        """Reset the state machine for a new game"""
        self.current_player_id = self.player1_id
        self.current_phase = TurnPhase.WAITING
        self.current_state = TurnState.NOT_STARTED
        self.context = TurnContext(game_id=self.game_id, player_id=self.player1_id)
        self.turn_history = []