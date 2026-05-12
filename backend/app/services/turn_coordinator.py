"""
Turn Coordinator for 8-Ball Pool
Coordinates turn state, game state, rules, and AI decisions
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from .turn_state_machine import TurnStateMachine, TurnPhase
from .game_state_manager import GameStateManager
from .pool_rules_engine import PoolRulesEngine
from .ai_opponent_enhanced import EnhancedAIOpponent

logger = logging.getLogger(__name__)


class TurnCoordinator:
    """
    Coordinates all aspects of turn management in 8-ball pool.
    Integrates turn state, game state, rules validation, and AI decisions.
    """

    def __init__(self, game_id: int, player1_id: int, player2_id: int):
        self.game_id = game_id
        self.turn_state = TurnStateMachine(game_id, player1_id, player2_id)
        self.game_state = GameStateManager(game_id, player1_id, player2_id)
        self.rules_engine = PoolRulesEngine()
        self.ai_opponent: Optional[EnhancedAIOpponent] = None
        
        # Track game progress
        self.break_shot_taken = False
        self.game_over = False
        self.winner: Optional[int] = None

    def set_ai_opponent(self, difficulty: str = 'medium', personality: str = 'balanced'):
        """Configure AI opponent for the game"""
        # Determine which player is AI (assume player2 is AI for now)
        self.ai_opponent = EnhancedAIOpponent(difficulty=difficulty, personality=personality)
        logger.info(f"AI opponent configured for game {self.game_id}: {difficulty} difficulty")

    def start_game(self):
        """Start the game"""
        self.game_state.start_game()
        self.turn_state.start_turn(
            player_id=self.game_state.state.player1_id,
            player_group=None  # Will be determined after break
        )
        logger.info(f"Game {self.game_id} started")

    def take_break_shot(self, shot_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process the break shot"""
        if self.break_shot_taken:
            return {'error': 'Break shot already taken'}
        
        # Validate shot
        validation = self.rules_engine.validate_break(
            self.game_state.physics_engine, shot_data
        )
        
        # Simulate shot
        result = self.game_state.physics_engine.simulate_shot(
            cue_ball_id=shot_data.get('cue_ball_id', 0),
            power=shot_data.get('power', 0.8),
            angle=shot_data.get('angle', 0),
            spin=shot_data.get('spin', 0)
        )
        
        # Update game state
        record_result = self.game_state.record_break_shot(result)
        
        # Determine ball assignment based on break
        self._assign_balls_after_break(result)
        
        self.break_shot_taken = True
        
        # Check if game ended on break
        win_check = self.game_state._check_win_conditions()
        if win_check['game_over']:
            self._end_game(win_check['winner'], win_check['reason'])
            return {
                'success': True,
                'break_result': result,
                'validation': validation,
                'game_over': True,
                'winner': win_check['winner'],
                'reason': win_check['reason']
            }
        
        return {
            'success': True,
            'break_result': result,
            'validation': validation,
            'game_over': False,
            'next_player': self.turn_state.current_player_id,
            'player_groups': {
                'player1': self.game_state.state.player1_group,
                'player2': self.game_state.state.player2_group
            }
        }

    def _assign_balls_after_break(self, break_result: Dict[str, Any]):
        """Assign ball groups to players based on break shot"""
        # Simplified: assign based on first ball pocketed
        pocketed = break_result.get('pocketed_balls', [])
        
        if pocketed:
            # Check first pocketed ball type
            first_ball = next((b for b in self.game_state.physics_engine.balls if b.id == pocketed[0]), None)
            if first_ball and first_ball.ball_type in ['solid', 'stripe']:
                # Player who broke gets the opposite group
                opposite_group = 'stripe' if first_ball.ball_type == 'solid' else 'solid'
                self.game_state.assign_groups(opposite_group)
                return
        
        # If no balls pocketed or unclear, assign solids to breaker
        self.game_state.assign_groups('solid')

    def take_turn(self, shot_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a player's turn (shot)"""
        if self.game_over:
            return {'error': 'Game is over'}
        
        # Validate it's the player's turn
        player_id = shot_data.get('player_id')
        if player_id is None or not self.turn_state.can_player_shoot(player_id):
            return {'error': 'Not your turn or cannot shoot'}
        
        # Validate shot against rules
        current_group = self.game_state._get_player_group(player_id)
        validation = self.rules_engine.validate_shot(
            self.game_state.physics_engine,
            shot_data,
            current_group,
            self.game_state.state.table_open
        )
        
        if not validation['valid']:
            # Foul occurred
            shot_data['foul'] = True
            shot_data['scratch'] = validation.get('is_scratch', False)
        
        # Simulate shot
        result = self.game_state.physics_engine.simulate_shot(
            cue_ball_id=shot_data.get('cue_ball_id', 0),
            power=shot_data.get('power', 0.5),
            angle=shot_data.get('angle', 0),
            spin=shot_data.get('spin', 0)
        )
        
        # Add pocketed balls to result
        result['pocketed_balls'] = [b.id for b in self.game_state.physics_engine.balls if b.is_pocketed]
        result['foul'] = shot_data.get('foul', False)
        result['scratch'] = shot_data.get('scratch', False)
        
        # Record shot in game state
        record_result = self.game_state.record_shot(result)
        
        # Update turn state
        self.turn_state.record_shot(result)
        
        # Check win conditions
        win_check = self.game_state._check_win_conditions()
        
        response = {
            'success': True,
            'shot_result': result,
            'validation': validation,
            'game_state': self.game_state.get_state(),
            'turn_complete': record_result['turn_complete'],
            'win_check': win_check
        }
        
        # Check if turn is complete
        if record_result['turn_complete']:
            self._end_current_turn()
            
            # Check if game is over
            if win_check['game_over']:
                self._end_game(win_check['winner'], win_check['reason'])
                response['game_over'] = True
                response['winner'] = win_check['winner']
                response['reason'] = win_check['reason']
            else:
                # Switch to next player
                self.turn_state.switch_player()
                response['next_player'] = self.turn_state.current_player_id
        
        return response

    def _end_current_turn(self):
        """End the current turn"""
        self.turn_state.end_turn()

    def _end_game(self, winner: int, reason: str):
        """End the game"""
        self.game_over = True
        self.winner = winner
        self.turn_state.end_game(winner, reason)
        self.game_state.state.status = 'completed'
        self.game_state.state.winner = winner
        self.game_state.state.winning_reason = reason
        logger.info(f"Game {self.game_id} ended. Winner: {winner}, Reason: {reason}")

    def get_ai_move(self) -> Dict[str, Any]:
        """Get AI move suggestion"""
        if not self.ai_opponent:
            return {'error': 'No AI opponent configured'}
        
        if self.turn_state.current_player_id != self.game_state.state.player2_id:
            return {'error': 'Not AI turn'}
        
        # Get current game state for AI
        game_state = self.game_state.get_state()
        
        # Update AI strategy
        self.ai_opponent.update_strategy(game_state)
        
        # Get AI decision
        ai_move = self.ai_opponent.decide_shot(
            self.game_state.physics_engine,
            game_state
        )
        
        return {
            'success': True,
            'ai_move': ai_move,
            'strategy': self.ai_opponent.strategy,
            'confidence': ai_move.get('confidence', 0)
        }

    def get_game_status(self) -> Dict[str, Any]:
        """Get current game status"""
        return {
            'game_id': self.game_id,
            'game_over': self.game_over,
            'winner': self.winner,
            'break_shot_taken': self.break_shot_taken,
            'turn_state': self.turn_state.get_state(),
            'game_state': self.game_state.get_state(),
            'has_ai': self.ai_opponent is not None
        }

    def reset(self):
        """Reset coordinator for new game"""
        self.turn_state.reset()
        self.game_state.reset()
        self.ai_opponent = None
        self.break_shot_taken = False
        self.game_over = False
        self.winner = None