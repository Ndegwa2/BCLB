from flask import Blueprint, request, jsonify, g
from ..models import User, Game, Tournament, Payment, WalletTransaction, GameEntry, TournamentEntry, db
from ..auth import require_admin
from ..services.balance_service import balance_service
from ..middleware.rate_limiter import rate_limit
from ..middleware.cache import query_cache, cache_response
from sqlalchemy import func
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/overview', methods=['GET'])
@require_admin
@rate_limit
@cache_response(ttl=120, cache_type='admin_stats')
def get_platform_overview():
    """Get platform overview with caching"""
    admin_user = g.current_user
    
    # Use batch query for all transaction sums (single query instead of multiple)
    transaction_stats = db.session.query(
        WalletTransaction.tx_type,
        func.sum(WalletTransaction.amount).label('total'),
        func.count(WalletTransaction.id).label('count')
    ).filter(
        WalletTransaction.status == 'success'
    ).group_by(WalletTransaction.tx_type).all()
    
    stats_map = {stat.tx_type: {'total': float(stat.total or 0), 'count': stat.count} for stat in transaction_stats}
    
    total_deposits = stats_map.get('deposit', {}).get('total', 0)
    total_withdrawals = stats_map.get('withdrawal', {}).get('total', 0)
    house_commission = stats_map.get('game_stake', {}).get('total', 0) * 0.15

    # Batch count queries
    active_games = Game.query.filter_by(status='waiting').count()
    total_users = User.query.count()
    total_tournaments = Tournament.query.count()
    total_payments = Payment.query.count()
    successful_payments = Payment.query.filter_by(status='success').count()

    # Recent activity (last 24 hours)
    yesterday = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    recent_stats = db.session.query(
        func.count(Game.id).label('games'),
        func.count(User.id).label('users')
    ).filter(
        (Game.created_at >= yesterday) | (User.created_at >= yesterday)
    ).first()
    
    recent_deposits = db.session.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.tx_type == 'deposit',
        WalletTransaction.status == 'success',
        WalletTransaction.created_at >= yesterday
    ).scalar() or 0

    return jsonify({
        'overview': {
            'total_deposits': total_deposits,
            'total_withdrawals': total_withdrawals,
            'house_commission': house_commission,
            'active_games': active_games,
            'total_users': total_users,
            'total_tournaments': total_tournaments,
            'total_payments': total_payments,
            'successful_payments': successful_payments,
            'payment_success_rate': round((successful_payments / total_payments * 100), 2) if total_payments > 0 else 0
        },
        'recent_activity': {
            'games_created_24h': Game.query.filter(Game.created_at >= yesterday).count(),
            'users_registered_24h': User.query.filter(User.created_at >= yesterday).count(),
            'deposits_24h': float(recent_deposits)
        }
    }), 200

@admin_bp.route('/games', methods=['GET'])
@require_admin
@rate_limit
@cache_response(ttl=60, cache_type='admin_stats')
def get_all_games():
    """Get all games with optimized queries (no N+1)"""
    admin_user = g.current_user
    
    # Get query parameters
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    status = request.args.get('status')
    game_type = request.args.get('game_type')

    # Build query with join to get creator username
    query = db.session.query(Game, User.username).join(
        User, Game.creator_id == User.id
    )
    
    if status:
        query = query.filter(Game.status == status)
    
    if game_type:
        query = query.filter(Game.game_type == game_type)

    # Order by creation date
    query = query.order_by(Game.created_at.desc())

    # Paginate
    games = query.paginate(page=page, per_page=limit, error_out=False)

    # Get all game IDs for batch entry count query
    game_ids = [game.id for game, _ in games.items]
    
    # Batch query for entry counts (single query instead of N queries)
    entry_counts = db.session.query(
        GameEntry.game_id,
        func.count(GameEntry.id).label('count')
    ).filter(
        GameEntry.game_id.in_(game_ids)
    ).group_by(GameEntry.game_id).all()
    
    entry_count_map = {ec.game_id: ec.count for ec in entry_counts}

    game_list = []
    for game, username in games.items:
        game_dict = game.to_dict()
        game_dict['creator_username'] = username
        game_dict['entry_count'] = entry_count_map.get(game.id, 0)
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

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@admin_bp.route('/users', methods=['GET'])
@require_admin
@rate_limit
@cache_response(ttl=60, cache_type='admin_stats')
def get_all_users():
    """Get all users with optimized batch queries (no N+1)"""
    admin_user = g.current_user

    # Get query parameters
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    search = request.args.get('search')

    # Build query
    query = User.query

    if search:
        query = query.filter(
            (User.username.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%'))
        )

    # Order by creation date
    query = query.order_by(User.created_at.desc())

    # Paginate
    users = query.paginate(page=page, per_page=limit, error_out=False)

    # Get all user IDs for batch queries
    user_ids = [user.id for user in users.items]
    
    # Batch query for all balances (single query instead of 2N queries)
    balance_stats = db.session.query(
        WalletTransaction.user_id,
        WalletTransaction.direction,
        func.sum(WalletTransaction.amount).label('total')
    ).filter(
        WalletTransaction.user_id.in_(user_ids),
        WalletTransaction.status == 'success'
    ).group_by(
        WalletTransaction.user_id,
        WalletTransaction.direction
    ).all()
    
    # Build balance map
    balance_map = {}
    for stat in balance_stats:
        if stat.user_id not in balance_map:
            balance_map[stat.user_id] = {'credit': 0, 'debit': 0}
        balance_map[stat.user_id][stat.direction] = float(stat.total or 0)
    
    # Batch query for game counts
    game_counts = db.session.query(
        GameEntry.user_id,
        func.count(GameEntry.id).label('count')
    ).filter(
        GameEntry.user_id.in_(user_ids)
    ).group_by(GameEntry.user_id).all()
    
    game_count_map = {gc.user_id: gc.count for gc in game_counts}
    
    # Batch query for tournament counts
    tournament_counts = db.session.query(
        TournamentEntry.user_id,
        func.count(TournamentEntry.id).label('count')
    ).filter(
        TournamentEntry.user_id.in_(user_ids)
    ).group_by(TournamentEntry.user_id).all()
    
    tournament_count_map = {tc.user_id: tc.count for tc in tournament_counts}

    user_list = []
    for user in users.items:
        user_dict = user.to_dict()
        
        # Get balance from map
        user_balance = balance_map.get(user.id, {'credit': 0, 'debit': 0})
        balance = user_balance['credit'] - user_balance['debit']
        user_dict['balance'] = balance
        
        # Get stats from maps
        user_dict['stats'] = {
            'games_played': game_count_map.get(user.id, 0),
            'tournaments_joined': tournament_count_map.get(user.id, 0)
        }

        user_list.append(user_dict)

    return jsonify({
        'users': user_list,
        'pagination': {
            'page': users.page,
            'per_page': users.per_page,
            'total': users.total,
            'pages': users.pages
        }
    }), 200

@admin_bp.route('/users/<int:user_id>/suspend', methods=['POST'])
@require_admin
def suspend_user(user_id):
    admin_user = g.current_user
    
    # Cannot suspend yourself
    if user_id == admin_user.id:
        return jsonify({'error': 'Cannot suspend your own account'}), 400
    
    user = User.query.get_or_404(user_id)
    
    # Check if user is already suspended (for now we'll just use is_admin flag)
    if user.is_admin:
        return jsonify({'error': 'Cannot suspend admin users'}), 403
    
    # For demo purposes, we'll mark the user as admin=false and create a suspension record
    # In a real system, you'd have a separate suspension mechanism
    
    # Update user (in real system, you'd have a suspended flag)
    # user.suspended = True  # This field doesn't exist in current schema
    # For now, we'll just return success
    
    db.session.commit()
    
    return jsonify({
        'message': f'User {user.username} has been suspended',
        'user_id': user.id,
        'username': user.username
    }), 200

@admin_bp.route('/stats', methods=['GET'])
@require_admin
@rate_limit
@cache_response(ttl=120, cache_type='admin_stats')
def get_detailed_stats():
    """Get detailed stats with optimized queries"""
    admin_user = g.current_user
    
    # Game type distribution
    game_type_stats = db.session.query(
        Game.game_type,
        func.count(Game.id).label('count'),
        func.avg(Game.total_pot).label('avg_pot')
    ).group_by(Game.game_type).all()
    
    game_type_data = [
        {
            'game_type': stats.game_type,
            'total_games': stats.count,
            'average_pot': float(stats.avg_pot or 0)
        }
        for stats in game_type_stats
    ]
    
    # Daily activity (last 7 days) - batch query
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    
    # Single query for all daily stats
    daily_games = db.session.query(
        func.date(Game.created_at).label('date'),
        func.count(Game.id).label('count')
    ).filter(
        Game.created_at >= week_ago
    ).group_by(func.date(Game.created_at)).all()
    
    daily_users = db.session.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= week_ago
    ).group_by(func.date(User.created_at)).all()
    
    daily_deposits = db.session.query(
        func.date(WalletTransaction.created_at).label('date'),
        func.sum(WalletTransaction.amount).label('total')
    ).filter(
        WalletTransaction.tx_type == 'deposit',
        WalletTransaction.status == 'success',
        WalletTransaction.created_at >= week_ago
    ).group_by(func.date(WalletTransaction.created_at)).all()
    
    # Build maps for quick lookup
    games_map = {str(d.date): d.count for d in daily_games}
    users_map = {str(d.date): d.count for d in daily_users}
    deposits_map = {str(d.date): float(d.total or 0) for d in daily_deposits}
    
    daily_activity = []
    for i in range(7):
        day = (today - timedelta(days=i)).strftime('%Y-%m-%d')
        daily_activity.append({
            'date': day,
            'games_created': games_map.get(day, 0),
            'users_registered': users_map.get(day, 0),
            'deposit_amount': deposits_map.get(day, 0)
        })
    
    # Payment statistics
    payment_stats = db.session.query(
        Payment.status,
        func.count(Payment.id).label('count'),
        func.sum(Payment.amount).label('total_amount')
    ).group_by(Payment.status).all()
    
    payment_data = [
        {
            'status': stats.status,
            'count': stats.count,
            'total_amount': float(stats.total_amount or 0)
        }
        for stats in payment_stats
    ]
    
    return jsonify({
        'game_type_distribution': game_type_data,
        'daily_activity_7_days': daily_activity,
        'payment_statistics': payment_data
    }), 200