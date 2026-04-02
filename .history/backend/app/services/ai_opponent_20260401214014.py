"""
AI opponent service for making intelligent game decisions
"""

import random
import math
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

class AIOpponent:
    """AI opponent that can play different game types with enhanced decision-making"""
    
    def __init__(self, difficulty: str = 'medium', personality: str = 'balanced'):
        self.difficulty = difficulty
        self.personality = personality  # aggressive, defensive, balanced
        self.win_probability = self._get_win_probability()
        self.move_history = []
        self.opponent_patterns = {}
        self.adaptation_rate = self._get_adaptation_rate()
        
    def _get_win_probability(self) -> float:
        """Get win probability based on difficulty level"""
        probabilities = {
            'easy': 0.35,
            'medium': 0.50,
            'hard': 0.65,
            'expert': 0.75
        }
        return probabilities.get(self.difficulty, 0.50)
    
    def _get_adaptation_rate(self) -> float:
        """Get how quickly AI adapts to opponent patterns"""
        rates = {
            'easy': 0.1,
            'medium': 0.3,
            'hard': 0.5,
            'expert': 0.7
        }
        return rates.get(self.difficulty, 0.3)
    
    def _get_personality_modifier(self, base_value: float, context: str = 'default') -> float:
        """Modify values based on AI personality"""
        if self.personality == 'aggressive':
            if context == 'risk':
                return base_value * 1.3
            elif context == 'reward':
                return base_value * 1.2
        elif self.personality == 'defensive':
            if context == 'risk':
                return base_value * 0.7
            elif context == 'reward':
                return base_value * 0.9
        return base_value
    
    def make_move(self, game_type: str, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """Make a move based on game type and current state"""
        
        if game_type == 'draw_1v1':
            return self._make_draw_move()
        elif game_type == 'pool_8ball':
            return self._make_pool_move(game_state)
        elif game_type == 'card_blackjack':
            return self._make_blackjack_move(game_state)
        else:
            return self._make_default_move()
    
    def _make_draw_move(self) -> Dict[str, Any]:
        """AI decision for draw game"""
        # Simple random draw with difficulty-based bias
        base_draw = random.randint(1, 100)
        
        # Add some intelligence based on difficulty
        if self.difficulty == 'hard':
            # Hard AI tries to be unpredictable but competitive
            if random.random() < 0.3:
                draw_value = random.randint(80, 95)  # High risk, high reward
            else:
                draw_value = random.randint(60, 85)
        elif self.difficulty == 'medium':
            # Medium AI plays more conservatively
            draw_value = random.randint(50, 80)
        else:  # easy
            # Easy AI makes more random decisions
            draw_value = random.randint(30, 70)
        
        return {
            'action': 'draw',
            'value': min(draw_value, 100),
            'confidence': random.uniform(0.6, 0.9)
        }
    
    def _make_pool_move(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """AI decision for pool game"""
        # For now, simple strategic moves
        available_balls = game_state.get('available_balls', [])
        current_player = game_state.get('current_player', 1)
        
        if not available_balls:
            return {'action': 'break', 'power': random.uniform(0.7, 1.0)}
        
        # Choose target ball based on difficulty
        if self.difficulty == 'hard':
            # Hard AI tries to pocket balls strategically
            target_ball = random.choice(available_balls)
            power = random.uniform(0.8, 1.0)
        elif self.difficulty == 'medium':
            # Medium AI plays safe
            target_ball = available_balls[0] if available_balls else None
            power = random.uniform(0.6, 0.9)
        else:  # easy
            # Easy AI makes random choices
            target_ball = random.choice(available_balls) if available_balls else None
            power = random.uniform(0.4, 0.8)
        
        return {
            'action': 'shoot',
            'target_ball': target_ball,
            'power': power,
            'angle': random.uniform(0, 360)
        }
    
    def _make_blackjack_move(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """AI decision for blackjack game"""
        hand_value = game_state.get('hand_value', 0)
        dealer_card = game_state.get('dealer_card', 0)
        
        # Basic blackjack strategy with difficulty modification
        if hand_value < 12:
            action = 'hit'
        elif hand_value >= 17:
            action = 'stand'
        elif hand_value >= 13 and hand_value <= 16:
            # Hit or stand based on dealer card and difficulty
            if dealer_card >= 7:
                action = 'hit'
            elif self.difficulty == 'hard' and dealer_card <= 6:
                action = 'stand'
            elif self.difficulty == 'medium':
                action = 'hit' if random.random() < 0.7 else 'stand'
            else:  # easy
                action = 'hit' if random.random() < 0.5 else 'stand'
        else:
            action = 'hit'
        
        return {
            'action': action,
            'hand_value': hand_value,
            'dealer_card': dealer_card
        }
    
    def _make_default_move(self) -> Dict[str, Any]:
        """Default AI move for unknown game types"""
        return {
            'action': 'move',
            'value': random.randint(1, 100),
            'confidence': random.uniform(0.5, 0.8)
        }
    
    def determine_winner(self, game_type: str, player_scores: Dict[int, float]) -> int:
        """Determine winner based on game logic and AI difficulty"""
        
        # Get AI player ID (assuming it's the highest or lowest based on game)
        ai_player_id = max(player_scores.keys()) if player_scores else 1
        
        # Calculate win probability based on scores and AI difficulty
        ai_score = player_scores.get(ai_player_id, 0)
        opponent_score = max(score for pid, score in player_scores.items() if pid != ai_player_id)
        
        # Base win probability
        win_chance = self.win_probability
        
        # Adjust based on current scores
        if ai_score > opponent_score:
            win_chance += 0.2  # AI is ahead, more likely to win
        elif opponent_score > ai_score:
            win_chance -= 0.2  # AI is behind, less likely to win
        
        # Ensure probability is within bounds
        win_chance = max(0.1, min(0.9, win_chance))
        
        # Determine winner
        if random.random() < win_chance:
            return ai_player_id
        else:
            # Return opponent ID
            return next(pid for pid in player_scores.keys() if pid != ai_player_id)

def get_ai_opponent(ai_user_id: int, difficulty: str = 'medium') -> AIOpponent:
    """Get AI opponent instance for a specific AI user"""
    return AIOpponent(difficulty)