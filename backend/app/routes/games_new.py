"""
Updated Game Routes with Turn-Based System Integration
Integrates the new turn coordinator for proper AI turn management
"""

from flask import Blueprint, request, jsonify, g
from ..models import Game, GameEntry, User, WalletTransaction
from ..models.extensions import db
from ..auth import require_auth
from ..services.ai_opponent_new import AIOpponentNew
from ..services.balance_service import balance_service
from ..services.pool_physics import PoolPhysicsEngine
from ..middleware.rate_limiter import rate_limit
from ..middleware.cache import query_cache, cache_response
import random
import string
from datetime import datetime, timezone
from typing import Optional

games_bp = Blueprint('games_new', __name__, url_prefix='/api/v2/games')

# Store active game coordinators (in production, use Redis or database)
active_coordinators = {}


@games_bp.route('', methods=['POST'])
@require_auth
@rate_limit
def create_game():
    """Create game with enhanced turn management"""
    user = g.current_user
    data = request.get_json()

    # Validate required fields
    if 'game_type' not in data or 'stake_amount' not in data:
        return jsonify({'error': 'game_type and stake_amount are required'}), 400

    game_type = data['game_type'].strip().lower()
    stake_amount = data.get('stake_amount', 0)
    is_free = data.get('is_free', False)
    allow_ai = data.get('allow_ai', False)
    ai_difficulty = data.get('ai_difficulty', 'medium')
    ai_personality = data.get('ai_personality', 'balanced')

    # Validate AI settings
    if allow_ai and ai_difficulty not in ['easy', 'medium', 'hard', 'expert']:
        return jsonify({'error': 'Invalid AI difficulty. Must be one of: easy, medium, hard, expert'}), 400

    # Validate game type
    valid_game_types = ['draw_1v1', 'pool_8ball', 'card_blackjack', 'tournament_single_elimination']
    if game_type not in valid_game_types:
        return jsonify({'error': f'Invalid game type. Must be one of: {valid_game_types}'}), 400

    try:
        stake_amount = float(stake_amount)
        if stake_amount < 0:
            return jsonify({'error': 'Stake amount must be non-negative'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid stake amount format'}), 400

    # If not free, check user's balance and deduct stake
    if not is_free and stake_amount > 0:
        if not balance_service.check_sufficient_balance(user.id, stake_amount):
            return jsonify({'error': 'Insufficient balance'}), 402

        # Deduct stake amount
        wallet_tx = WalletTransaction()
        wallet_tx.amount = stake_amount
        wallet_tx.direction = 'debit'
        wallet_tx.tx_type = 'game_stake'
        wallet_tx.status = 'success'
        wallet_tx.description = f'Game stake ({game_type})'
        wallet_tx.user_id = user.id
        db.session.add(wallet_tx)

    # Generate unique game code
    game_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    # Create game
    game = Game(
        game_code=game_code,
        game_type=game_type,
        stake_amount=stake_amount,
        total_pot=stake_amount if (not is_free and stake_amount > 0) else 0,
        status='waiting',
        allow_ai=allow_ai,
        ai_difficulty=ai_difficulty if allow_ai else 'medium',
        opponent_type='ai' if allow_ai else 'human',
        creator_id=user.id
    )

    db.session.add(game)
    db.session.flush()  # Get the game ID

    # Create game entry for creator
    entry = GameEntry(
        user_id=user.id,
        game_id=game.id,
        stake_amount=stake_amount,
        joined_at=datetime.now(timezone.utc)
    )
    db.session.add(entry)
    
    # If AI is allowed, assign an AI opponent
    ai_opponent = None
    if allow_ai:
        ai_bot = User.query.filter_by(is_ai=True, ai_difficulty=ai_difficulty).first()
        if ai_bot:
            ai_entry = GameEntry(
                user_id=ai_bot.id,
                game_id=game.id,
                stake_amount=stake_amount,
                joined_at=datetime.now(timezone.utc)
            )
            db.session.add(ai_entry)
            game.ai_opponent_id = ai_bot.id
            
            # Create turn coordinator for this game
            coordinator_key = f"game_{game.id}"
            active_coordinators[coordinator_key] = {
                'type': 'turn_based',
                'player1_id': user.id,
                'player2_id': ai_bot.id,
                'ai_difficulty': ai_difficulty,
                'ai_personality': ai_personality
            }

    db.session.commit()
    
    # Invalidate caches
    balance_service.invalidate_balance_cache(user.id)
    query_cache.invalidate_game()

    return jsonify({
        'game': game.to_dict(),
        'entry': entry.to_dict(),
        'turn_system': 'enabled' if allow_ai else 'standard'
    }), 201


@games_bp.route('/<int:game_id>/start-turn-based', methods=['POST'])
@require_auth
def start_turn_based_game(game_id: int):
    """Start a game with turn-based system"""
    user = g.current_user
    
    game = Game.query.get_or_404(game_id)
    
    if game.status != 'waiting':
        return jsonify({'error': 'Game cannot be started'}), 403
    
    # Check if user is participant
    entry = GameEntry.query.filter_by(user_id=user.id, game_id=game_id).first()
    if not entry:
        return jsonify({'error': 'You are not a participant in this game'}), 403
    
    # Check if game has enough players
    player_count = GameEntry.query.filter_by(game_id=game_id).count()
    if player_count < 2:
        return jsonify({'error': 'Need at least 2 players to start'}), 403
    
    # Initialize turn coordinator for pool games
    if game.game_type == 'pool_8ball':
        coordinator_key = f"game_{game.id}"
        
        if coordinator_key not in active_coordinators:
            # Get players
            entries = GameEntry.query.filter_by(game_id=game_id).all()
            if len(entries) != 2:
                return jsonify({'error': 'Need exactly 2 players for turn-based pool'}), 400
            
            player1 = entries[0].user
            player2 = entries[1].user
            
            # Create coordinator
            from ..services.turn_coordinator import TurnCoordinator
            coordinator = TurnCoordinator(game.id, player1.id, player2.id)
            
            # Configure AI if needed
            if game.allow_ai and game.ai_opponent_id:
                ai_bot = User.query.get(game.ai_opponent_id)
                if ai_bot and ai_bot.is_ai:
                    coordinator.set_ai_opponent(
                        difficulty=game.ai_difficulty,
                        personality='balanced'
                    )
            
            active_coordinators[coordinator_key] = coordinator
            
            # Start the game
            coordinator.start_game()
            
            # Update game status
            game.status = 'in_progress'
            db.session.commit()
            
            return jsonify({
                'success': True,
                'game': game.to_dict(),
                'turn_system': 'active',
                'current_player': coordinator.turn_state.current_player_id,
                'message': 'Turn-based game started'
            }), 200
    
    # For non-pool games or if turn system not used, use standard start
    return _start_standard_game(game, user)


def _start_standard_game(game, user):
    """Start game using standard logic (fallback)"""
    entries = GameEntry.query.filter_by(game_id=game.id).all()
    
    if game.ai_opponent_id:
        ai_bot = User.query.get(game.ai_opponent_id)
        if ai_bot and ai_bot.is_ai:
            from ..services.ai_opponent import get_ai_opponent
            ai_opponent = get_ai_opponent(ai_bot.id, ai_bot.ai_difficulty)
            
            player_scores = {}
            for entry in entries:
                player_scores[entry.user_id] = random.randint(50, 100)
            
            winner_user_id = ai_opponent.determine_winner(game.game_type, player_scores)
            winner = next(entry for entry in entries if entry.user_id == winner_user_id)
        else:
            winner = random.choice(entries)
    else:
        winner = random.choice(entries)
    
    game.status = 'in_progress'
    
    if float(game.total_pot) > 0:
        house_cut = float(game.total_pot) * 0.15
        winner_amount = float(game.total_pot) - house_cut
        
        winner.result = 'win'
        winner.payout_amount = winner_amount
        
        for entry in entries:
            if entry.id != winner.id:
                entry.result = 'loss'
        
        if not winner.user.is_ai:
            wallet_tx = WalletTransaction(
                amount=winner_amount,
                direction='credit',
                tx_type='game_win',
                status='success',
                description=f'Game win ({game.game_type})',
                user_id=winner.user_id
            )
            db.session.add(wallet_tx)
    else:
        winner.result = 'win'
        winner.payout_amount = 0
        
        for entry in entries:
            if entry.id != winner.id:
                entry.result = 'loss'
        
        house_cut = 0
    
    game.status = 'completed'
    db.session.commit()
    
    return jsonify({
        'game': game.to_dict(),
        'winner': {
            'user_id': winner.user_id,
            'payout_amount': float(winner.payout_amount)
        },
        'house_cut': house_cut
    }), 200


@games_bp.route('/<int:game_id>/pool-shot', methods=['POST'])
@require_auth
def take_pool_shot(game_id: int):
    """Take a shot in a turn-based pool game"""
    user = g.current_user
    
    game = Game.query.get_or_404(game_id)
    
    if game.game_type != 'pool_8ball':
        return jsonify({'error': 'Only available for pool_8ball games'}), 400
    
    # Check if user is participant
    is_participant = GameEntry.query.filter_by(user_id=user.id, game_id=game_id).first()
    if not is_participant and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    coordinator_key = f"game_{game_id}"
    if coordinator_key not in active_coordinators:
        return jsonify({'error': 'Turn system not initialized for this game'}), 400
    
    coordinator = active_coordinators[coordinator_key]
    
    # If it's a TurnCoordinator instance (new system)
    if hasattr(coordinator, 'take_turn'):
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        # Add player_id to shot data
        data['player_id'] = user.id
        
        # Process the turn
        result = coordinator.take_turn(data)
        
        if result.get('error'):
            return jsonify(result), 400
        
        response = {
            'success': True,
            'shot_result': result.get('shot_result'),
            'turn_complete': result.get('turn_complete'),
            'validation': result.get('validation')
        }
        
        # Add game over info if applicable
        if result.get('game_over'):
            response['game_over'] = True
            response['winner'] = result.get('winner')
            response['reason'] = result.get('reason')
            
            # Update game status in database
            game.status = 'completed'
            db.session.commit()
        elif result.get('next_player'):
            response['next_player'] = result.get('next_player')
        
        return jsonify(response), 200
    
    return jsonify({'error': 'Invalid coordinator type'}), 500


@games_bp.route('/<int:game_id>/pool-break', methods=['POST'])
@require_auth
def take_pool_break(game_id: int):
    """Take the break shot in a turn-based pool game"""
    user = g.current_user
    
    game = Game.query.get_or_404(game_id)
    
    if game.game_type != 'pool_8ball':
        return jsonify({'error': 'Only available for pool_8ball games'}), 400
    
    # Check if user is participant
    is_participant = GameEntry.query.filter_by(user_id=user.id, game_id=game_id).first()
    if not is_participant and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    coordinator_key = f"game_{game_id}"
    if coordinator_key not in active_coordinators:
        return jsonify({'error': 'Turn system not initialized for this game'}), 400
    
    coordinator = active_coordinators[coordinator_key]
    
    if hasattr(coordinator, 'take_break_shot'):
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        result = coordinator.take_break_shot(data)
        
        if result.get('error'):
            return jsonify(result), 400
        
        return jsonify(result), 200
    
    return jsonify({'error': 'Invalid coordinator type'}), 500


@games_bp.route('/<int:game_id>/ai-move', methods=['POST'])
@require_auth
def get_ai_move_suggestion(game_id: int):
    """Get AI move suggestion using the new turn system"""
    user = g.current_user
    
    game = Game.query.get_or_404(game_id)
    
    if game.game_type != 'pool_8ball':
        return jsonify({'error': 'AI move suggestions only available for pool_8ball'}), 400
    
    # Verify user is a participant
    is_participant = GameEntry.query.filter_by(user_id=user.id, game_id=game_id).first()
    if not is_participant and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    coordinator_key = f"game_{game_id}"
    if coordinator_key not in active_coordinators:
        return jsonify({'error': 'Turn system not initialized for this game'}), 400
    
    coordinator = active_coordinators[coordinator_key]
    
    if hasattr(coordinator, 'get_ai_move'):
        # Check if it's AI's turn
        if coordinator.turn_state.current_player_id != game.ai_opponent_id:
            return jsonify({'error': 'Not AI turn'}), 400
        
        ai_move = coordinator.get_ai_move()
        
        if not ai_move.get('success'):
            return jsonify(ai_move), 400
        
        return jsonify(ai_move), 200
    
    # Fallback to old AI logic
    return _get_ai_move_fallback(game, user)


def _get_ai_move_fallback(game, user):
    """Fallback AI move calculation (old logic)"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400
    
    # Extract game state from request
    cue_ball = data.get('cue_ball', {})
    balls = data.get('balls', [])
    current_player_group = data.get('current_player_group')
    pockets = data.get('pockets', [])
    difficulty = data.get('difficulty', 'medium')
    
    if not cue_ball or not balls:
        return jsonify({'error': 'cue_ball and balls data required'}), 400
    
    try:
        best_shot = None
        target_balls = [b for b in balls if b.get('active', True) and not b.get('pocketed', False)]
        
        if current_player_group:
            target_balls = [b for b in target_balls if b.get('type') == current_player_group]
        
        if target_balls:
            best_score = -float('inf')
            cue_x = cue_ball.get('x', 0)
            cue_y = cue_ball.get('y', 0)
            
            for ball in target_balls:
                ball_x = ball.get('x', 0)
                ball_y = ball.get('y', 0)
                ball_type = ball.get('type', '')
                ball_number = ball.get('number', 0)
                
                for pocket in pockets:
                    pocket_x = pocket.get('x', 0)
                    pocket_y = pocket.get('y', 0)
                    
                    # Calculate distances
                    cue_to_ball = ((ball_x - cue_x)**2 + (ball_y - cue_y)**2)**0.5
                    ball_to_pocket = ((pocket_x - ball_x)**2 + (pocket_y - ball_y)**2)**0.5
                    cue_to_pocket = ((pocket_x - cue_x)**2 + (pocket_y - cue_y)**2)**0.5
                    
                    # Calculate cut angle
                    angle_to_ball = __import__('math').atan2(ball_y - cue_y, ball_x - cue_x)
                    angle_to_pocket = __import__('math').atan2(pocket_y - ball_y, pocket_x - ball_x)
                    cut_angle = abs(angle_to_pocket - angle_to_ball)
                    if cut_angle > __import__('math').pi:
                        cut_angle = 2 * __import__('math').pi - cut_angle
                    
                    # Score based on factors
                    score = 0
                    score += (500 / cue_to_ball)  # Prefer closer balls
                    score += (300 / ball_to_pocket)  # Prefer balls closer to pockets
                    score += (100 / cut_angle) if cut_angle > 0 else 100  # Bonus for easier shots
                    score += 50 if cue_to_pocket > cue_to_ball * 1.5 else -30  # Avoid scratching
                    
                    # Add randomness based on difficulty
                    if difficulty == 'easy':
                        score *= random.uniform(0.7, 1.3)
                    elif difficulty == 'hard':
                        score *= random.uniform(0.95, 1.05)
                    else:  # medium
                        score *= random.uniform(0.85, 1.15)
                    
                    if not best_shot or score > best_shot['score']:
                        # Calculate angle to ball
                        angle = __import__('math').atan2(ball_y - cue_y, ball_x - cue_x)
                        
                        # Adjust power based on distance and difficulty
                        base_power = 0.7
                        if difficulty == 'easy':
                            power = base_power + random.uniform(-0.2, 0.2)
                        elif difficulty == 'hard':
                            power = base_power + random.uniform(0.05, 0.2)
                        else:
                            power = base_power + random.uniform(-0.1, 0.15)
                        
                        power = max(0.3, min(1.0, power))
                        
                        best_shot = {
                            'score': score,
                            'target_x': ball_x,
                            'target_y': ball_y,
                            'angle': angle,
                            'power': power,
                            'ball_number': ball_number,
                            'ball_type': ball_type,
                            'pocket': pocket,
                            'is_safe': cue_to_pocket > cue_to_ball * 1.5 and cut_angle < 0.5
                        }
        
        if best_shot:
            return jsonify({
                'success': True,
                'shot': {
                    'target_x': best_shot['target_x'],
                    'target_y': best_shot['target_y'],
                    'angle': best_shot['angle'],
                    'power': best_shot['power'],
                    'ball_number': best_shot['ball_number'],
                    'ball_type': best_shot['ball_type'],
                    'is_safe': best_shot['is_safe'],
                    'difficulty': difficulty
                }
            }), 200
        else:
            # No good shot available, suggest defensive shot
            return jsonify({
                'success': True,
                'shot': {
                    'target_x': None,
                    'target_y': None,
                    'angle': None,
                    'power': 0.5,
                    'ball_number': None,
                    'ball_type': None,
                    'is_safe': True,
                    'defensive': True,
                    'message': 'No clear shot available, playing defensive'
                }
            }), 200
            
    except Exception as e:
        return jsonify({'error': f'Failed to calculate AI move: {str(e)}'}), 500


@games_bp.route('/<int:game_id>/status', methods=['GET'])
@require_auth
def get_turn_based_status(game_id: int):
    """Get turn-based game status"""
    user = g.current_user
    
    game = Game.query.get_or_404(game_id)
    
    # Check if user is participant
    is_participant = GameEntry.query.filter_by(user_id=user.id, game_id=game_id).first()
    if not is_participant and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    coordinator_key = f"game_{game_id}"
    if coordinator_key in active_coordinators:
        coordinator = active_coordinators[coordinator_key]
        
        if hasattr(coordinator, 'get_game_status'):
            status = coordinator.get_game_status()
            return jsonify(status), 200
    
    # Fallback to standard game info
    return jsonify({
        'game': game.to_dict(),
        'turn_system': 'not_active'
    }), 200


# Keep original routes for backward compatibility
from .games import *