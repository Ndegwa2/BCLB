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
        """Make a move based on game type and current state with enhanced intelligence"""
        
        # Analyze opponent patterns if we have history
        if len(self.move_history) > 2:
            self._analyze_opponent_patterns()
        
        # Get move based on game type
        if game_type == 'draw_1v1':
            move = self._make_draw_move(game_state)
        elif game_type == 'pool_8ball':
            move = self._make_pool_move(game_state)
        elif game_type == 'card_blackjack':
            move = self._make_blackjack_move(game_state)
        elif game_type == 'poker':
            move = self._make_poker_move(game_state)
        else:
            move = self._make_default_move()
        
        # Store move in history for pattern learning
        self.move_history.append({
            'game_type': game_type,
            'move': move,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Keep only last 20 moves
        if len(self.move_history) > 20:
            self.move_history.pop(0)
        
        return move
    
    def _analyze_opponent_patterns(self):
        """Analyze opponent's move patterns to adapt strategy"""
        if len(self.move_history) < 3:
            return
        
        # Simple pattern detection - can be expanded
        recent_moves = self.move_history[-5:]
        
        # Track move frequencies
        move_types = {}
        for move_data in recent_moves:
            move = move_data.get('move', {})
            action = move.get('action', 'unknown')
            move_types[action] = move_types.get(action, 0) + 1
        
        # Store patterns
        self.opponent_patterns['recent_actions'] = move_types
        self.opponent_patterns['total_moves'] = len(self.move_history)
    
    def _make_draw_move(self, game_state: Dict[str, Any] = None) -> Dict[str, Any]:
        """AI decision for draw game with enhanced strategy"""
        # Get game context if available
        opponent_last_draw = game_state.get('opponent_last_draw') if game_state else None
        round_number = game_state.get('round_number', 1) if game_state else 1
        
        # Base draw calculation with personality influence
        if self.difficulty == 'expert':
            # Expert AI uses advanced strategy
            if round_number <= 2:
                # Conservative start
                base_min, base_max = 55, 75
            elif opponent_last_draw and opponent_last_draw > 80:
                # Opponent is aggressive, play counter-strategy
                base_min, base_max = 70, 90
            else:
                # Adaptive play
                base_min, base_max = 65, 88
        elif self.difficulty == 'hard':
            # Hard AI tries to be unpredictable but competitive
            if random.random() < 0.3:
                base_min, base_max = 80, 95  # High risk, high reward
            else:
                base_min, base_max = 60, 85
        elif self.difficulty == 'medium':
            # Medium AI plays more conservatively
            base_min, base_max = 50, 80
        else:  # easy
            # Easy AI makes more random decisions
            base_min, base_max = 30, 70
        
        # Apply personality modifier
        if self.personality == 'aggressive':
            base_min = min(base_min + 10, 90)
            base_max = min(base_max + 5, 95)
        elif self.personality == 'defensive':
            base_max = max(base_max - 10, base_min + 10)
        
        draw_value = random.randint(base_min, base_max)
        
        # Calculate confidence based on strategy
        confidence = random.uniform(0.65, 0.95)
        if self.difficulty == 'expert':
            confidence = random.uniform(0.75, 0.98)
        
        return {
            'action': 'draw',
            'value': min(draw_value, 100),
            'confidence': confidence,
            'strategy': 'adaptive' if self.difficulty in ['hard', 'expert'] else 'random'
        }
    
    def _make_poker_move(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """AI decision for poker game with hand evaluation"""
        hand_strength = game_state.get('hand_strength', 0.5)
        pot_size = game_state.get('pot_size', 0)
        current_bet = game_state.get('current_bet', 0)
        community_cards = game_state.get('community_cards', [])
        
        # Calculate pot odds
        call_amount = max(0, current_bet - game_state.get('my_bet', 0))
        pot_odds = call_amount / (pot_size + call_amount) if (pot_size + call_amount) > 0 else 0
        
        # Decision based on hand strength and difficulty
        if self.difficulty == 'expert':
            # Expert uses advanced pot odds and position
            if hand_strength > 0.8:
                action = 'raise'
                raise_amount = int(pot_size * 0.75)
            elif hand_strength > 0.6 and pot_odds < 0.3:
                action = 'call'
                raise_amount = 0
            elif hand_strength > 0.4 and len(community_cards) < 3:
                action = 'call'
                raise_amount = 0
            else:
                action = 'fold'
                raise_amount = 0
        elif self.difficulty == 'hard':
            if hand_strength > 0.7:
                action = 'raise'
                raise_amount = int(pot_size * 0.5)
            elif hand_strength > 0.5:
                action = 'call'
                raise_amount = 0
            else:
                action = 'fold'
                raise_amount = 0
        elif self.difficulty == 'medium':
            if hand_strength > 0.6:
                action = 'raise'
                raise_amount = int(pot_size * 0.5)
            elif hand_strength > 0.4:
                action = 'call'
                raise_amount = 0
            else:
                action = random.choice(['call', 'fold'])
                raise_amount = 0
        else:  # easy
            if hand_strength > 0.5:
                action = random.choice(['call', 'raise'])
                raise_amount = int(pot_size * 0.3) if action == 'raise' else 0
            else:
                action = random.choice(['call', 'fold'])
                raise_amount = 0
        
        return {
            'action': action,
            'raise_amount': raise_amount,
            'hand_strength': hand_strength,
            'pot_odds': pot_odds
        }
    
    def get_difficulty_info(self) -> Dict[str, Any]:
        """Get information about current AI difficulty settings"""
        return {
            'difficulty': self.difficulty,
            'personality': self.personality,
            'win_probability': self.win_probability,
            'adaptation_rate': self.adaptation_rate,
            'moves_played': len(self.move_history)
        }
    
    def reset_history(self):
        """Reset move history for new game"""
        self.move_history = []
        self.opponent_patterns = {}
    
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

def get_ai_opponent(ai_user_id: int, difficulty: str = 'medium', personality: str = 'balanced') -> AIOpponent:
    """Get AI opponent instance for a specific AI user with enhanced options"""
    return AIOpponent(difficulty=difficulty, personality=personality)