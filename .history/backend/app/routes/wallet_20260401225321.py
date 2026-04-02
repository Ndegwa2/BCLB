from flask import Blueprint, request, jsonify, g
from ..models import WalletTransaction, db
from ..auth import require_auth
from ..services.balance_service import balance_service
from ..middleware.rate_limiter import rate_limit
from ..middleware.cache import cache_response
from sqlalchemy import func

wallet_bp = Blueprint('wallet', __name__, url_prefix='/api/wallet')

@wallet_bp.route('', methods=['GET'])
@require_auth
@rate_limit
@cache_response(ttl=30, cache_type='wallet_transactions')
def get_wallet():
    """Get wallet balance and recent transactions with caching"""
    user = g.current_user
    
    # Get query parameters
    limit = int(request.args.get('limit', 10))
    page = int(request.args.get('page', 1))

    # Use centralized balance service (cached)
    balance_info = balance_service.get_user_balance(user.id)

    # Get recent transactions
    transactions = WalletTransaction.query.filter_by(user_id=user.id)\
        .order_by(WalletTransaction.created_at.desc())\
        .paginate(page=page, per_page=limit, error_out=False)

    transaction_list = [tx.to_dict() for tx in transactions.items]

    return jsonify({
        'balance': balance_info['balance'],
        'locked_balance': balance_info['locked_balance'],
        'available': balance_info['available'],
        'transactions': transaction_list,
        'pagination': {
            'page': transactions.page,
            'per_page': transactions.per_page,
            'total': transactions.total,
            'pages': transactions.pages
        }
    }), 200

@wallet_bp.route('/deposit', methods=['POST'])
@require_auth
@rate_limit
def deposit_funds():
    """Create deposit request with balance cache invalidation"""
    user = g.current_user
    data = request.get_json()

    if not data or 'amount' not in data or 'phone_number' not in data:
        return jsonify({'error': 'Amount and phone number are required'}), 400

    try:
        amount = float(data['amount'])
        phone_number = data['phone_number']

        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400

        # Create a pending deposit transaction
        transaction = WalletTransaction(
            user_id=user.id,
            amount=amount,
            direction='credit',
            tx_type='deposit',
            status='pending',
            description=f'Deposit of {amount} USD via {phone_number}'
        )

        db.session.add(transaction)
        db.session.commit()
        
        # Invalidate balance cache
        balance_service.invalidate_balance_cache(user.id)

        return jsonify({
            'message': 'Deposit request created successfully',
            'transaction_id': transaction.id,
            'status': transaction.status
        }), 201

    except ValueError:
        return jsonify({'error': 'Invalid amount format'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to process deposit', 'details': str(e)}), 500

@wallet_bp.route('/withdraw', methods=['POST'])
@require_auth
@rate_limit
def withdraw_funds():
    """Create withdrawal with cached balance check"""
    user = g.current_user
    data = request.get_json()

    if not data or 'amount' not in data or 'phone_number' not in data:
        return jsonify({'error': 'Amount and phone number are required'}), 400

    try:
        amount = float(data['amount'])
        phone_number = data['phone_number']

        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400

        # Use cached balance check
        if not balance_service.check_sufficient_balance(user.id, amount):
            return jsonify({'error': 'Insufficient balance for withdrawal'}), 400

        # Create a pending withdrawal transaction
        transaction = WalletTransaction(
            user_id=user.id,
            amount=amount,
            direction='debit',
            tx_type='withdrawal',
            status='pending',
            description=f'Withdrawal of {amount} USD to {phone_number}'
        )

        db.session.add(transaction)
        db.session.commit()
        
        # Invalidate balance cache
        balance_service.invalidate_balance_cache(user.id)

        return jsonify({
            'message': 'Withdrawal request created successfully',
            'transaction_id': transaction.id,
            'status': transaction.status
        }), 201

    except ValueError:
        return jsonify({'error': 'Invalid amount format'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to process withdrawal', 'details': str(e)}), 500