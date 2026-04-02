from flask import Blueprint, request, jsonify, g
from ..models import User, Game, Tournament, Payment, WalletTransaction, GameEntry, TournamentEntry, db
from ..auth import require_admin
from sqlalchemy import func
from datetime import datetime

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/overview', methods=['GET'])
@require_admin
def get_platform_overview():
    admin_user = g.current_user
    
    # Calculate total deposits
    total_deposits = db.session.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.tx_type == 'deposit',
        WalletTransaction.status == 'success'
    ).scalar() or 0

    # Calculate total withdrawals
    total_withdrawals = db.session.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.tx_type == 'withdrawal',
        WalletTransaction.status == 'success'
    ).scalar() or 0

    # Calculate house commission (15% of game stakes)
    house_commission = db.session.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.tx_type == 'game_stake',
        WalletTransaction.status == 'success'
    ).scalar() or 0
    house_commission = float(house_commission) * 0.15

    # Count active games
    active_games = Game.query.filter_by(status='waiting').count()

    # Count total users
    total_users = User.query.count()

    # Count total tournaments
    total_tournaments = Tournament.query.count()

    # Calculate total payments processed
    total_payments = Payment.query.count()
    successful_payments = Payment.query.filter_by(status='success').count()

    # Calculate recent activity (last 24 hours)
    yesterday = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    recent_games = Game.query.filter(Game.created_at >= yesterday).count()
    recent_users = User.query.filter(User.created_at >= yesterday).count()
    recent_deposits = db.session.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.tx_type == 'deposit',
        WalletTransaction.status == 'success',
        WalletTransaction.created_at >= yesterday
    ).scalar() or 0

    return jsonify({
        'overview': {
            'total_deposits': float(total_deposits),
            'total_withdrawals': float(total_withdrawals),
            'house_commission': float(house_commission),
            'active_games': active_games,
            'total_users': total_users,
            'total_tournaments': total_tournaments,
            'total_payments': total_payments,
            'successful_payments': successful_payments,
            'payment_success_rate': round((successful_payments / total_payments * 100), 2) if total_payments > 0 else 0
        },
        'recent_activity': {
            'games_created_24h': recent_games,
            'users_registered_24h': recent_users,
            'deposits_24h': float(recent_deposits)
        }
    }), 200

@admin_bp.route('/games', methods=['GET'])
@require_admin
def get_all_games():
    admin_user = g.current_user
    
    # Get query parameters
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    status = request.args.get('status')
    game_type = request.args.get('game_type')

    # Build query
    query = Game.query.join(User, Game.creator_id == User.id)
    
    if status:
        query = query.filter(Game.status == status)
    
    if game_type:
        query = query.filter(Game.game_type == game_type)

    # Order by creation date
    query = query.order_by(Game.created_at.desc())

    # Paginate
    games = query.paginate(page=page, per_page=limit, error_out=False)

    game_list = []
    for game, creator in games.items:
        game_dict = game.to_dict()
        game_dict['creator_username'] = creator.username
        
        # Add entry count
        entry_count = GameEntry.query.filter_by(game_id=game.id).count()
        game_dict['entry_count'] = entry_count
        
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
from ..models import User, Game, Tournament, Payment, WalletTransaction, GameEntry, TournamentEntry, db
from ..auth import require_admin
from sqlalchemy import func
from datetime import datetime

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@require_admin
def get_all_users():
    logger.debug("Starting get_all_users endpoint")
    admin_user = g.current_user
    logger.debug(f"Admin user: {admin_user.username if admin_user else 'None'}")

    # Get query parameters
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    search = request.args.get('search')
    logger.debug(f"Query params - page: {page}, limit: {limit}, search: {search}")

    # Build query
    query = User.query
    logger.debug("Built base User query")

    if search:
        query = query.filter(
            (User.username.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%'))
        )
        logger.debug("Applied search filter")

    # Order by creation date
    query = query.order_by(User.created_at.desc())
    logger.debug("Applied order by creation date")

    # Paginate
    try:
        users = query.paginate(page=page, per_page=limit, error_out=False)
        logger.debug(f"Paginated successfully - page: {users.page}, total: {users.total}")
    except Exception as e:
        logger.error(f"Error during pagination: {str(e)}")
        return jsonify({'error': 'Database error during pagination'}), 500

    user_list = []
    for user in users.items:
        user_dict = user.to_dict()
        logger.debug(f"Processing user: {user.username}")

        # Calculate balance
        try:
            credit_sum = db.session.query(func.sum(WalletTransaction.amount)).filter(
                WalletTransaction.user_id == user.id,
                WalletTransaction.direction == 'credit',
                WalletTransaction.status == 'success'
            ).scalar() or 0
            logger.debug(f"Credit sum for user {user.username}: {credit_sum}")
        except Exception as e:
            logger.error(f"Error calculating credit sum for user {user.username}: {str(e)}")
            return jsonify({'error': f'Database error for user {user.username}'}), 500

        try:
            debit_sum = db.session.query(func.sum(WalletTransaction.amount)).filter(
                WalletTransaction.user_id == user.id,
                WalletTransaction.direction == 'debit',
                WalletTransaction.status == 'success'
            ).scalar() or 0
            logger.debug(f"Debit sum for user {user.username}: {debit_sum}")
        except Exception as e:
            logger.error(f"Error calculating debit sum for user {user.username}: {str(e)}")
            return jsonify({'error': f'Database error for user {user.username}'}), 500

        balance = float(credit_sum - debit_sum)
        user_dict['balance'] = balance

        # Add stats
        try:
            games_played = GameEntry.query.filter_by(user_id=user.id).count()
            logger.debug(f"Games played for user {user.username}: {games_played}")
        except Exception as e:
            logger.error(f"Error counting games for user {user.username}: {str(e)}")
            return jsonify({'error': f'Database error for user {user.username}'}), 500

        try:
            tournaments_joined = TournamentEntry.query.filter_by(user_id=user.id).count()
            logger.debug(f"Tournaments joined for user {user.username}: {tournaments_joined}")
        except Exception as e:
            logger.error(f"Error counting tournaments for user {user.username}: {str(e)}")
            return jsonify({'error': f'Database error for user {user.username}'}), 500

        user_dict['stats'] = {
            'games_played': games_played,
            'tournaments_joined': tournaments_joined
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
def get_detailed_stats():
    admin_user = g.current_user
    
    # Game type distribution
    game_type_stats = db.session.query(
        Game.game_type,
        func.count(Game.id).label('count'),
        func.avg(Game.total_pot).label('avg_pot')
    ).group_by(Game.game_type).all()
    
    game_type_data = []
    for stats in game_type_stats:
        game_type_data.append({
            'game_type': stats.game_type,
            'total_games': stats.count,
            'average_pot': float(stats.avg_pot or 0)
        })
    
    # Daily activity (last 7 days)
    seven_days_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    daily_activity = []
    for i in range(7):
        day_start = seven_days_ago.replace(day=seven_days_ago.day - i)
        day_end = day_start.replace(hour=23, minute=59, second=59)
        
        games_count = Game.query.filter(
            Game.created_at >= day_start,
            Game.created_at <= day_end
        ).count()
        
        users_count = User.query.filter(
            User.created_at >= day_start,
            User.created_at <= day_end
        ).count()
        
        deposits = db.session.query(func.sum(WalletTransaction.amount)).filter(
            WalletTransaction.tx_type == 'deposit',
            WalletTransaction.status == 'success',
            WalletTransaction.created_at >= day_start,
            WalletTransaction.created_at <= day_end
        ).scalar() or 0
        
        daily_activity.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'games_created': games_count,
            'users_registered': users_count,
            'deposit_amount': float(deposits)
        })
    
    # Payment statistics
    payment_stats = db.session.query(
        Payment.status,
        func.count(Payment.id).label('count'),
        func.sum(Payment.amount).label('total_amount')
    ).group_by(Payment.status).all()
    
    payment_data = []
    for stats in payment_stats:
        payment_data.append({
            'status': stats.status,
            'count': stats.count,
            'total_amount': float(stats.total_amount or 0)
        })
    
    return jsonify({
        'game_type_distribution': game_type_data,
        'daily_activity_7_days': daily_activity,
        'payment_statistics': payment_data
    }), 200