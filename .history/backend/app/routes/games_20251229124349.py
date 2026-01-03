from flask import Blueprint, request, jsonify, g
from ..models import Game, GameEntry, User, WalletTransaction, db
from ..auth import require_auth
from ..services.ai_opponent import get_ai_opponent
from sqlalchemy import func
import random
import string
from datetime import datetime

games_bp = Blueprint('games', __name__, url_prefix='/api/games')

@games_bp.route('', methods=['POST'])
@require_auth
def create_game():
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

    # Validate AI settings
    if allow_ai and ai_difficulty not in ['easy', 'medium', 'hard']:
        return jsonify({'error': 'Invalid AI difficulty. Must be one of: easy, medium, hard'}), 400

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
        # Calculate current balance
        credit_sum = db.session.query(func.sum(WalletTransaction.amount)).filter(
            WalletTransaction.user_id == user.id,
            WalletTransaction.direction == 'credit',
            WalletTransaction.status == 'success'
        ).scalar() or 0

        debit_sum = db.session.query(func.sum(WalletTransaction.amount)).filter(
            WalletTransaction.user_id == user.id,
            WalletTransaction.direction == 'debit',
            WalletTransaction.status == 'success'
        ).scalar() or 0

        balance = float(credit_sum - debit_sum)

        if balance < stake_amount:
            return jsonify({'error': 'Insufficient balance'}), 402

        # Deduct stake amount (create wallet transaction)
        wallet_tx = WalletTransaction(
            amount=stake_amount,
            direction='debit',
            tx_type='game_stake',
            status='success',
            description=f'Game stake ({game_type})',
            user_id=user.id
        )
        db.session.add(wallet_tx)

    # Generate unique game code
    game_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    # Create game
    game = Game(
        game_code=game_code,
        game_type=game_type,
        stake_amount=stake_amount,
        total_pot=stake_amount if not is_free else 0,
        status='waiting',
        creator_id=user.id
    )

    db.session.add(game)
    db.session.flush()  # Get the game ID

    # Create game entry for creator
    entry = GameEntry(
        user_id=user.id,
        game_id=game.id,
        stake_amount=stake_amount,
        joined_at=datetime.utcnow()
    )

    db.session.add(entry)
    db.session.commit()

    return jsonify({
        'game': game.to_dict(),
        'entry': entry.to_dict()
    }), 201

@games_bp.route('/open', methods=['GET'])
@require_auth
def get_open_games():
    user = g.current_user
    
    # Get query parameters
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    game_type = request.args.get('game_type')

    # Build query
    query = Game.query.filter_by(status='waiting')
    
    if game_type:
        query = query.filter_by(game_type=game_type)
    
    # Exclude games created by current user
    query = query.filter(Game.creator_id != user.id)

    # Order by creation date
    query = query.order_by(Game.created_at.desc())

    # Paginate
    games = query.paginate(page=page, per_page=limit, error_out=False)

    game_list = [game.to_dict() for game in games.items]

    return jsonify({
        'games': game_list,
        'pagination': {
            'page': games.page,
            'per_page': games.per_page,
            'total': games.total,
            'pages': games.pages
        }
    }), 200

@games_bp.route('/<int:game_id>/join', methods=['POST'])
@require_auth
def join_game(game_id):
    user = g.current_user
    
    # Check if game exists and is available
    game = Game.query.get_or_404(game_id)
    
    if game.status != 'waiting':
        return jsonify({'error': 'Game is not available to join'}), 409
    
    if game.creator_id == user.id:
        return jsonify({'error': 'Cannot join your own game'}), 403

    # Check if user already joined
    existing_entry = GameEntry.query.filter_by(user_id=user.id, game_id=game_id).first()
    if existing_entry:
        return jsonify({'error': 'Already joined this game'}), 409

    # Check if game has maximum players (for now, max 2 players)
    player_count = GameEntry.query.filter_by(game_id=game_id).count()
    if player_count >= 2:
        return jsonify({'error': 'Game is full'}), 409

    # If not free game, check balance and deduct stake
    if game.stake_amount > 0:
        # Calculate current balance
        credit_sum = db.session.query(func.sum(WalletTransaction.amount)).filter(
            WalletTransaction.user_id == user.id,
            WalletTransaction.direction == 'credit',
            WalletTransaction.status == 'success'
        ).scalar() or 0

        debit_sum = db.session.query(func.sum(WalletTransaction.amount)).filter(
            WalletTransaction.user_id == user.id,
            WalletTransaction.direction == 'debit',
            WalletTransaction.status == 'success'
        ).scalar() or 0

        balance = float(credit_sum - debit_sum)

        if balance < game.stake_amount:
            return jsonify({'error': 'Insufficient balance'}), 402

        # Deduct stake amount
        wallet_tx = WalletTransaction(
            amount=game.stake_amount,
            direction='debit',
            tx_type='game_stake',
            status='success',
            description=f'Game stake ({game.game_type})',
            user_id=user.id
        )
        db.session.add(wallet_tx)

        # Update game pot
        game.total_pot = float(game.total_pot) + game.stake_amount

    # Create game entry
    entry = GameEntry(
        user_id=user.id,
        game_id=game_id,
        stake_amount=game.stake_amount,
        joined_at=datetime.utcnow()
    )

    db.session.add(entry)
    db.session.commit()

    return jsonify({
        'game': game.to_dict(),
        'entry': entry.to_dict()
    }), 200

@games_bp.route('/<int:game_id>/start', methods=['POST'])
@require_auth
def start_game(game_id):
    user = g.current_user
    
    game = Game.query.get_or_404(game_id)
    
    if game.status != 'waiting':
        return jsonify({'error': 'Game cannot be started'}), 403
    
    # Check if user is participant
    entry = GameEntry.query.filter_by(user_id=user.id, game_id=game_id).first()
    if not entry:
        return jsonify({'error': 'You are not a participant in this game'}), 403
    
    # Check if game has enough players (minimum 2)
    player_count = GameEntry.query.filter_by(game_id=game_id).count()
    if player_count < 2:
        return jsonify({'error': 'Need at least 2 players to start'}), 403
    
    # Start the game and determine winner randomly
    entries = GameEntry.query.filter_by(game_id=game_id).all()
    winner = random.choice(entries)
    
    # Update game status
    game.status = 'in_progress'
    
    # Calculate winnings (85% of pot, 15% house cut)
    house_cut = float(game.total_pot) * 0.15
    winner_amount = float(game.total_pot) - house_cut
    
    # Update winner entry
    winner.result = 'win'
    winner.payout_amount = winner_amount
    
    # Update loser entries
    for entry in entries:
        if entry.id != winner.id:
            entry.result = 'loss'
    
    # Create wallet transactions for winnings
    wallet_tx = WalletTransaction(
        amount=winner_amount,
        direction='credit',
        tx_type='game_win',
        status='success',
        description=f'Game win ({game.game_type})',
        user_id=winner.user_id
    )
    db.session.add(wallet_tx)
    
    # Update game status to completed
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

@games_bp.route('/<int:game_id>', methods=['GET'])
@require_auth
def get_game_details(game_id):
    user = g.current_user
    
    game = Game.query.get_or_404(game_id)
    
    # Check if user has access (participant or admin)
    is_participant = GameEntry.query.filter_by(user_id=user.id, game_id=game_id).first() is not None
    if not is_participant and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get all entries with user info
    entries = db.session.query(GameEntry, User).join(
        User, GameEntry.user_id == User.id
    ).filter(GameEntry.game_id == game_id).all()
    
    entry_list = []
    for entry, user_obj in entries:
        entry_dict = entry.to_dict()
        entry_dict['username'] = user_obj.username
        entry_list.append(entry_dict)
    
    # Get winner info if game is completed
    winner_info = None
    if game.status == 'completed':
        winner_entry = GameEntry.query.filter_by(game_id=game_id, result='win').first()
        if winner_entry:
            winner_user = User.query.get(winner_entry.user_id)
            winner_info = {
                'user_id': winner_entry.user_id,
                'username': winner_user.username,
                'payout_amount': float(winner_entry.payout_amount)
            }
    
    return jsonify({
        'game': game.to_dict(),
        'entries': entry_list,
        'winner': winner_info
    }), 200

@games_bp.route('/<int:game_id>/cancel', methods=['POST'])
@require_auth
def cancel_game(game_id):
    user = g.current_user
    
    game = Game.query.get_or_404(game_id)
    
    # Only creator or admin can cancel
    if game.creator_id != user.id and not user.is_admin:
        return jsonify({'error': 'Only the creator or admin can cancel this game'}), 403
    
    if game.status != 'waiting':
        return jsonify({'error': 'Game cannot be cancelled'}), 403
    
    # Refund all stakes
    entries = GameEntry.query.filter_by(game_id=game_id).all()
    
    for entry in entries:
        if entry.stake_amount > 0:
            # Refund stake
            wallet_tx = WalletTransaction(
                amount=entry.stake_amount,
                direction='credit',
                tx_type='game_refund',
                status='success',
                description=f'Game refund ({game.game_type})',
                user_id=entry.user_id
            )
            db.session.add(wallet_tx)
    
    # Update game status
    game.status = 'cancelled'
    
    db.session.commit()
    
    return jsonify({
        'status': 'cancelled',
        'message': 'Game cancelled and stakes refunded'
    }), 200

@games_bp.route('/mine', methods=['GET'])
@require_auth
def get_my_games():
    user = g.current_user
    
    # Get query parameters
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    status = request.args.get('status')
    
    # Get games where user has entries
    query = db.session.query(Game).join(
        GameEntry, Game.id == GameEntry.game_id
    ).filter(GameEntry.user_id == user.id)
    
    if status:
        query = query.filter(Game.status == status)
    
    # Order by creation date
    query = query.order_by(Game.created_at.desc())
    
    # Paginate
    games = query.paginate(page=page, per_page=limit, error_out=False)
    
    game_list = []
    for game in games.items:
        game_dict = game.to_dict()
        # Add user's entry info
        user_entry = GameEntry.query.filter_by(user_id=user.id, game_id=game.id).first()
        game_dict['my_entry'] = user_entry.to_dict() if user_entry else None
        game_list.append(game_dict)
    
    return jsonify({
        'games': game_list,
        'pagination': {
            'page': games.page,
            'per_page': games.per_page,
            'total': games.total,
            'pages': games.pages
        }
    }), 200