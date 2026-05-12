"""
Updated AI Opponent using the new Turn System
Integrates with TurnCoordinator for production-grade AI decision making
"""

import random
import logging
from typing import Dict, Any, Optional

from .turn_coordinator import TurnCoordinator
from .ai_opponent_enhanced import EnhancedAIOpponent

logger = logging.getLogger(__name__)


class AIOpponentNew:
    """
    Production-grade AI opponent that uses the new turn-based system.
    Wraps the EnhancedAIOpponent and integrates with TurnCoordinator.
    """

    def __init__(self, difficulty: str = 'medium', personality: str = 'balanced'):
        self.difficulty = difficulty
        self.personality = personality
        self.enhanced_ai = EnhancedAIOpponent(
            difficulty=difficulty,
            personality=personality
        )
        self.coordinator: Optional[TurnCoordinator] = None
        self.game_id: Optional[int] = None
        
        logger.info(f"New AI opponent created: {difficulty} difficulty, {personality} personality")

    def setup_for_game(self, game_id: int, player1_id: int, player2_id: int, 
                      is_player1_ai: bool = False):
        """
        Set up AI for a specific game.
        
        Args:
            game_id: The game ID
            player1_id: First player ID
            player2_id: Second player ID
            is_player1_ai: Whether player1 is the AI (default: player2 is AI)
        """
        self.game_id = game_id
        self.coordinator = TurnCoordinator(game_id, player1_id, player2_id)
        
        # Configure AI opponent
        ai_player_id = player1_id if is_player1_ai else player2_id
        self.coordinator.set_ai_opponent(
            difficulty=self.difficulty,
            personality=self.personality
        )
        
        logger.info(f"AI set up for game {game_id} as player {ai_player_id}")

    def make_move(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a move using the enhanced AI system.
        
        Args:
            game_state: Current game state from the coordinator
            
        Returns:
            Dictionary with move details
        """
        if not self.coordinator:
            return {'error': 'AI not set up for a game'}
        
        # Get AI move from coordinator
        ai_move = self.coordinator.get_ai_move()
        
        if not ai_move.get('success'):
            return ai_move
        
        # Format the response to match expected format
        move_details = ai_move.get('ai_move', {})
        
        return {
            'action': move_details.get('action', 'shoot'),
            'target_x': move_details.get('target_x'),
            'target_y': move_details.get('target_y'),
            'angle': move_details.get('angle'),
            'power': move_details.get('power'),
            'ball_number': move_details.get('target_ball_id'),
            'ball_type': move_details.get('target_ball_type'),
            'is_safe': move_details.get('is_safe', False),
            'confidence': move_details.get('confidence', 0.5),
            'strategy': ai_move.get('strategy', 'balanced'),
            'difficulty': self.difficulty
        }

    def process_shot_result(self, shot_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the result of a shot and update game state.
        
        Args:
            shot_result: Result of the shot
            
        Returns:
            Updated game state
        """
        if not self.coordinator:
            return {'error': 'AI not set up for a game'}
        
        # Take turn with the shot result
        result = self.coordinator.take_turn(shot_result)
        
        return result

    def take_break_shot(self, shot_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the break shot.
        
        Args:
            shot_data: Break shot data
            
        Returns:
            Break shot result
        """
        if not self.coordinator:
            return {'error': 'AI not set up for a game'}
        
        return self.coordinator.take_break_shot(shot_data)

    def get_game_status(self) -> Dict[str, Any]:
        """Get current game status"""
        if not self.coordinator:
            return {'error': 'AI not set up for a game'}
        
        return self.coordinator.get_game_status()

    def reset(self):
        """Reset AI for a new game"""
        self.coordinator = None
        self.game_id = None
        self.enhanced_ai.reset()
        logger.info("AI opponent reset")

    # Legacy methods for backward compatibility
    def get_difficulty_info(self) -> Dict[str, Any]:
        """Get AI difficulty information"""
        return {
            'difficulty': self.difficulty,
            'personality': self.personality,
            'type': 'enhanced',
            'system': 'turn-based'
        }

    def reset_history(self):
        """Reset AI history"""
        self.enhanced_ai.reset()
        if self.coordinator:
            self.coordinator.reset()