"""
8-Ball Pool Rules Engine
Enforces official 8-ball pool rules and validates shots
"""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from .pool_physics import PoolPhysicsEngine, PoolBall
from .vector2 import Vector2

logger = logging.getLogger(__name__)


@dataclass
class RuleViolation:
    """Represents a rule violation"""
    rule: str
    description: str
    severity: str  # 'foul', 'scratch', 'warning'
    penalty: str


class PoolRulesEngine:
    """
    Enforces 8-ball pool rules according to WPA/BCA standards.
    Validates shots and determines fouls.
    """

    def __init__(self):
        self.foul_count = 0
        self.violations: List[RuleViolation] = []

    def validate_shot(self, physics_engine: PoolPhysicsEngine, 
                     shot_data: Dict[str, Any],
                     current_player_group: Optional[str],
                     table_open: bool) -> Dict[str, Any]:
        """
        Validate a shot against 8-ball pool rules.
        Returns validation result with any violations.
        """
        self.violations = []
        
        # Get cue ball
        cue_ball = next((b for b in physics_engine.balls if b.id == 0), None)
        if not cue_ball:
            return self._error_result("Cue ball not found")
        
        # Check if cue ball is pocketed (scratch)
        if cue_ball.is_pocketed:
            self._add_violation(
                rule="cue_ball_pocketed",
                description="Cue ball was pocketed (scratch)",
                severity="scratch",
                penalty="ball_in_hand"
            )
        
        # Get target ball
        target_ball_id = shot_data.get('target_ball_id')
        target_ball = None
        if target_ball_id is not None:
            target_ball = next((b for b in physics_engine.balls if b.id == target_ball_id), None)
        
        # Validate target ball selection
        if not table_open and target_ball:
            violation = self._validate_target_ball(
                target_ball, current_player_group, physics_engine
            )
            if violation:
                self.violations.append(violation)
        
        # Check if any balls were pocketed
        pocketed_balls = shot_data.get('pocketed_balls', [])
        
        # Validate pocketed balls
        for ball_id in pocketed_balls:
            ball = next((b for b in physics_engine.balls if b.id == ball_id), None)
            if ball:
                violation = self._validate_pocketed_ball(
                    ball, current_player_group, table_open, cue_ball
                )
                if violation:
                    self.violations.append(violation)
        
        # Check for double hit (cue ball hits target ball more than once)
        # This would require detailed physics analysis
        
        # Check for push shot (cue ball follows target ball into pocket)
        self._check_push_shot(physics_engine, shot_data)
        
        # Check for illegal jump shot
        self._check_jump_shot(shot_data)
        
        # Determine if it's a foul
        is_foul = any(v.severity in ['foul', 'scratch'] for v in self.violations)
        is_scratch = any(v.severity == 'scratch' for v in self.violations)
        
        # Calculate penalty
        penalty = self._determine_penalty()
        
        return {
            'valid': not is_foul,
            'is_foul': is_foul,
            'is_scratch': is_scratch,
            'violations': [self._violation_to_dict(v) for v in self.violations],
            'penalty': penalty,
            'ball_in_hand': is_scratch or any(v.penalty == 'ball_in_hand' for v in self.violations)
        }

    def _validate_target_ball(self, target_ball: PoolBall, 
                            player_group: Optional[str],
                            physics_engine: PoolPhysicsEngine) -> Optional[RuleViolation]:
        """Validate that the target ball is legal to hit"""
        if not player_group:
            return None  # Table is open, any ball can be targeted
        
        # Check if targeting opponent's ball
        if target_ball.ball_type not in [player_group, 'eight']:
            return RuleViolation(
                rule="wrong_ball_first",
                description=f"Must hit {player_group} ball first, hit {target_ball.ball_type} instead",
                severity="foul",
                penalty="ball_in_hand"
            )
        
        # Check if hitting 8-ball before clearing group
        if target_ball.ball_type == 'eight':
            # Count remaining balls of player's group
            remaining = sum(
                1 for b in physics_engine.balls
                if not b.is_pocketed and b.ball_type == player_group and b.id != 0
            )
            if remaining > 0:
                return RuleViolation(
                    rule="eight_ball_premature",
                    description="Cannot hit 8-ball before clearing your group",
                    severity="foul",
                    penalty="ball_in_hand"
                )
        
        return None

    def _validate_pocketed_ball(self, ball: PoolBall,
                               player_group: Optional[str],
                               table_open: bool,
                               cue_ball: PoolBall) -> Optional[RuleViolation]:
        """Validate a pocketed ball"""
        # Check if cue ball was pocketed
        if ball.id == 0:
            return RuleViolation(
                rule="cue_ball_pocketed",
                description="Cue ball was pocketed",
                severity="scratch",
                penalty="ball_in_hand"
            )
        
        # Check if 8-ball was pocketed prematurely
        if ball.ball_type == 'eight':
            # Count remaining balls
            solids_remaining = sum(
                1 for b in cue_ball.__class__.__bases__[0].__subclasses__()
                if hasattr(b, 'balls')  # This is a hack - need proper access
            )
            # Simplified check - in practice, need to count properly
            # For now, assume premature if table is still open
            if table_open:
                return RuleViolation(
                    rule="eight_ball_premature",
                    description="8-ball pocketed before groups assigned",
                    severity="foul",
                    penalty="loss"
                )
        
        # Check if wrong ball pocketed when table is not open
        if not table_open and player_group:
            if ball.ball_type not in [player_group, 'eight']:
                return RuleViolation(
                    rule="wrong_ball_pocketed",
                    description=f"Pocketed {ball.ball_type} ball, must pocket {player_group}",
                    severity="foul",
                    penalty="ball_in_hand"
                )
        
        return None

    def _check_push_shot(self, physics_engine: PoolPhysicsEngine, 
                        shot_data: Dict[str, Any]):
        """Check for push shot foul"""
        # Simplified check - in practice, would analyze cue ball path
        # after contact with target ball
        pass

    def _check_jump_shot(self, shot_data: Dict[str, Any]):
        """Check for illegal jump shot"""
        # Jump shots are legal if executed properly
        # This would check for scooping (illegal)
        pass

    def _determine_penalty(self) -> str:
        """Determine penalty for violations"""
        if any(v.severity == 'scratch' for v in self.violations):
            return "ball_in_hand"
        if any(v.severity == 'foul' for v in self.violations):
            return "ball_in_hand"
        return "none"

    def _add_violation(self, rule: str, description: str, 
                      severity: str, penalty: str):
        """Add a rule violation"""
        self.violations.append(RuleViolation(
            rule=rule,
            description=description,
            severity=severity,
            penalty=penalty
        ))

    def _violation_to_dict(self, violation: RuleViolation) -> Dict[str, Any]:
        """Convert violation to dictionary"""
        return {
            'rule': violation.rule,
            'description': violation.description,
            'severity': violation.severity,
            'penalty': violation.penalty
        }

    def _error_result(self, message: str) -> Dict[str, Any]:
        """Return error validation result"""
        return {
            'valid': False,
            'is_foul': True,
            'is_scratch': False,
            'violations': [{
                'rule': 'error',
                'description': message,
                'severity': 'error',
                'penalty': 'none'
            }],
            'penalty': 'none',
            'ball_in_hand': False
        }

    def validate_break(self, physics_engine: PoolPhysicsEngine,
                      shot_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate break shot according to 8-ball rules.
        Break is legal if:
        - At least 4 balls hit cushions OR
        - At least one object ball is pocketed
        """
        self.violations = []
        
        pocketed = shot_data.get('pocketed_balls', [])
        
        # Check if cue ball was pocketed on break
        if 0 in pocketed:
            self._add_violation(
                rule="scratch_on_break",
                description="Cue ball pocketed on break",
                severity="scratch",
                penalty="ball_in_hand"
            )
        
        # Check if 8-ball was pocketed on break
        if 8 in pocketed:
            # 8-ball on break is either re-spot or re-break depending on rules
            # We'll treat as re-spot (no foul, but doesn't count as win)
            self._add_violation(
                rule="eight_ball_on_break",
                description="8-ball pocketed on break",
                severity="warning",
                penalty="re_spot"
            )
        
        # Check if break was legal (4 balls to cushion or 1 ball pocketed)
        # Simplified: if no balls pocketed, check if it's a dry break
        if not pocketed:
            # Would need to track cushion hits in physics
            # For now, assume dry break is legal but suboptimal
            pass
        
        is_foul = any(v.severity in ['foul', 'scratch'] for v in self.violations)
        
        return {
            'valid': not is_foul,
            'is_foul': is_foul,
            'is_scratch': any(v.severity == 'scratch' for v in self.violations),
            'violations': [self._violation_to_dict(v) for v in self.violations],
            'penalty': self._determine_penalty(),
            'ball_in_hand': any(v.severity == 'scratch' for v in self.violations)
        }