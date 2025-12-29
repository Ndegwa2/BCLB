from flask import Blueprint, request, jsonify, g
from ..models import WalletTransaction, db
from ..auth import require_auth
from sqlalchemy import func

wallet_bp = Blueprint('wallet', __name__, url_prefix='/api/wallet')

@wallet_bp.route('', methods=['GET'])
@require_auth
def get_wallet():
    user = g.current_user
    
    # Get query parameters
    limit = int(request.args.get('limit', 10))
    page = int(request.args.get('page', 1))

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

    # Calculate locked balance (pending transactions)
    locked_credit = db.session.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.user_id == user.id,
        WalletTransaction.direction == 'credit',
        WalletTransaction.status == 'pending'
    ).scalar() or 0

    locked_debit = db.session.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.user_id == user.id,
        WalletTransaction.direction == 'debit',
        WalletTransaction.status == 'pending'
    ).scalar() or 0

    locked_balance = float(locked_credit - locked_debit)

    # Get recent transactions
    transactions = WalletTransaction.query.filter_by(user_id=user.id)\
        .order_by(WalletTransaction.created_at.desc())\
        .paginate(page=page, per_page=limit, error_out=False)

    transaction_list = [tx.to_dict() for tx in transactions.items]

    return jsonify({
        'balance': balance,
        'locked_balance': locked_balance,
        'transactions': transaction_list,
        'pagination': {
            'page': transactions.page,
            'per_page': transactions.per_page,
            'total': transactions.total,
            'pages': transactions.pages
        }
    }), 200