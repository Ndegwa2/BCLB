from flask import Blueprint, request, jsonify, g
from ..models import Tournament, TournamentEntry, User, Game, WalletTransaction, db
from ..auth import require_auth, require_admin
from sqlalchemy import func
import random
import string
from datetime import datetime

tournaments_bp = Blueprint('tournaments', __name__, url_prefix='/api/tournaments')

@tournaments_bp.route('', methods=['POST'])
@require_auth
def create_tournament():
    user = g.current_user
    data = request.get_json()

    # Check if user can create tournaments (admin or premium user)
    if not user.is_admin:
        return jsonify({'error': 'Only admin users can create tournaments'}), 403

    # Validate required fields
    required_fields = ['name', 'game_type', 'entry_fee', 'max_players']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    name = data['name'].strip()
    game_type = data['game_type'].strip().lower()
    entry_fee = data.get('entry_fee', 0)
    max_players = data.get('max_players', 16)
    format_type = data.get('format', 'single_elimination')

    # Validate game type
    valid_game_types = ['draw_1v1', 'pool_8ball', 'card_blackjack']
    if game_type not in valid_game_types:
        return jsonify({'error': f'Invalid game type. Must be one of: {valid_game_types}'}), 400

    try:
        entry_fee = float(entry_fee)
        if entry_fee < 0:
            return jsonify({'error': 'Entry fee must be non-negative'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid entry fee format'}), 400

    try:
        max_players = int(max_players)
        if max_players < 2 or max_players > 64:
            return jsonify({'error': 'Max players must be between 2 and 64'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid max players format'}), 400

    # Validate format
    valid_formats = ['single_elimination', 'double_elimination']
    if format_type not in valid_formats:
        return jsonify({'error': f'Invalid format. Must be one of: {valid_formats}'}), 400

    # Create tournament
    tournament = Tournament(
        name=name,
        game_type=game_type,
        entry_fee=entry_fee,
        max_players=max_players,
        status='open'
    )

    db.session.add(tournament)
    db.session.commit()

    return jsonify({
        'tournament': tournament.to_dict()
    }), 201

@tournaments_bp.route('/open', methods=['GET'])
@require_auth
def get_open_tournaments():
    user = g.current_user
    
    # Get query parameters
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    game_type = request.args.get('game_type')

    # Build query
    query = Tournament.query.filter_by(status='open')
    
    if game_type:
        query = query.filter_by(game_type=game_type)
    
    # Order by creation date
    query = query.order_by(Tournament.created_at.desc())

    # Paginate
    tournaments = query.paginate(page=page, per_page=limit, error_out=False)

    tournament_list = [tournament.to_dict() for tournament in tournaments.items]

    return jsonify({
        'tournaments': tournament_list,
        'pagination': {
            'page': tournaments.page,
            'per_page': tournaments.per_page,
            'total': tournaments.total,
            'pages': tournaments.pages
        }
    }), 200

@tournaments_bp.route('/<int:tournament_id>/join', methods=['POST'])
@require_auth
def join_tournament(tournament_id):
    user = g.current_user
    
    # Check if tournament exists and is available
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.status != 'open':
        return jsonify({'error': 'Tournament is not open for registration'}), 403

    # Check if user already joined
    existing_entry = TournamentEntry.query.filter_by(
        tournament_id=tournament_id, 
        user_id=user.id
    ).first()
    if existing_entry:
        return jsonify({'error': 'Already joined this tournament'}), 409

    # Check if tournament is full
    player_count = TournamentEntry.query.filter_by(tournament_id=tournament_id).count()
    if player_count >= tournament.max_players:
        return jsonify({'error': 'Tournament is full'}), 409

    # If entry fee required, check balance and deduct
    if tournament.entry_fee > 0:
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

        if balance < tournament.entry_fee:
            return jsonify({'error': 'Insufficient balance for entry fee'}), 402

        # Deduct entry fee
        wallet_tx = WalletTransaction(
            amount=tournament.entry_fee,
            direction='debit',
            tx_type='tournament_entry',
            status='success',
            description=f'Tournament entry fee ({tournament.name})',
            user_id=user.id
        )
        db.session.add(wallet_tx)

    # Create tournament entry
    entry = TournamentEntry(
        tournament_id=tournament_id,
        user_id=user.id,
        joined_at=datetime.utcnow(),
        status='active'
    )

    db.session.add(entry)
    db.session.commit()

    return jsonify({
        'tournament': tournament.to_dict(),
        'entry': entry.to_dict()
    }), 200

@tournaments_bp.route('/<int:tournament_id>', methods=['GET'])
@require_auth
def get_tournament_details(tournament_id):
    user = g.current_user
    
    tournament = Tournament.query.get_or_404(tournament_id)
    
    # Check if user has access (participant, creator, or admin)
    is_participant = TournamentEntry.query.filter_by(
        tournament_id=tournament_id, 
        user_id=user.id
    ).first() is not None
    
    if not is_participant and not user.is_admin and tournament.creator_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get all entries with user info
    entries = db.session.query(TournamentEntry, User).join(
        User, TournamentEntry.user_id == User.id
    ).filter(TournamentEntry.tournament_id == tournament_id).all()
    
    entry_list = []
    for entry, user_obj in entries:
        entry_dict = entry.to_dict()
        entry_dict['username'] = user_obj.username
        entry_list.append(entry_dict)
    
    # Create a simple bracket representation (mock for now)
    bracket = []
    if tournament.status in ['in_progress', 'completed']:
        # Group entries by rounds (simple mock bracket)
        round_num = 1
        remaining_entries = entry_list.copy()
        
        while remaining_entries and len(remaining_entries) > 1:
            matches = []
            for i in range(0, len(remaining_entries), 2):
                if i + 1 < len(remaining_entries):
                    matches.append({
                        'player1': remaining_entries[i]['username'],
                        'player2': remaining_entries[i + 1]['username'],
                        'winner': None  # Will be determined when advancing
                    })
                else:
                    # Bye for odd number of players
                    matches.append({
                        'player1': remaining_entries[i]['username'],
                        'player2': None,
                        'winner': remaining_entries[i]['username']
                    })
            
            bracket.append({
                'round': round_num,
                'matches': matches
            })
            
            round_num += 1
            # For simplicity, assume all first matches go to player1
            remaining_entries = [match['player1'] for match in matches if match['winner']]
    
    return jsonify({
        'tournament': tournament.to_dict(),
        'entries': entry_list,
        'bracket': bracket
    }), 200

@tournaments_bp.route('/<int:tournament_id>/advance', methods=['POST'])
@require_auth
def advance_winner(tournament_id):
    user = g.current_user
    
    # Only admin can advance tournament
    if not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.status not in ['open', 'in_progress']:
        return jsonify({'error': 'Tournament cannot be advanced'}), 403
    
    data = request.get_json()
    round_num = data.get('round', 1)
    match_index = data.get('match_index', 0)
    winner_username = data.get('winner')
    
    if not winner_username:
        return jsonify({'error': 'Winner username is required'}), 400
    
    # Find the winner user
    winner_user = User.query.filter_by(username=winner_username).first()
    if not winner_user:
        return jsonify({'error': 'Winner user not found'}), 404
    
    # Update tournament entry status
    winner_entry = TournamentEntry.query.filter_by(
        tournament_id=tournament_id,
        user_id=winner_user.id
    ).first()
    
    if not winner_entry:
        return jsonify({'error': 'Winner is not a tournament participant'}), 404
    
    # For now, just update the tournament status to in_progress if it was open
    if tournament.status == 'open':
        tournament.status = 'in_progress'
        
        # Check if tournament is full and can start
        player_count = TournamentEntry.query.filter_by(tournament_id=tournament_id).count()
        if player_count >= 2:
            # Mark all non-winners as eliminated for simplicity
            other_entries = TournamentEntry.query.filter(
                TournamentEntry.tournament_id == tournament_id,
                TournamentEntry.id != winner_entry.id
            ).all()
            
            for entry in other_entries:
                entry.status = 'eliminated'
            
            # Mark winner as champion
            winner_entry.status = 'winner'
            tournament.winner_id = winner_user.id
            tournament.status = 'completed'
            
            # Calculate prize money (total pot minus 15% house cut)
            total_pot = tournament.entry_fee * player_count
            house_cut = total_pot * 0.15
            prize_money = total_pot - house_cut
            
            # Award prize money to winner
            wallet_tx = WalletTransaction(
                amount=prize_money,
                direction='credit',
                tx_type='tournament_win',
                status='success',
                description=f'Tournament win prize ({tournament.name})',
                user_id=winner_user.id
            )
            db.session.add(wallet_tx)
    
    db.session.commit()
    
    return jsonify({
        'tournament': tournament.to_dict(),
        'message': f'{winner_username} advanced in the tournament'
    }), 200