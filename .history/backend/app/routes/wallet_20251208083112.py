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

@wallet_bp.route('/deposit', methods=['POST'])
@require_auth
def deposit_funds():
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
def withdraw_funds():
    user = g.current_user
    data = request.get_json()

    if not data or 'amount' not in data or 'phone_number' not in data:
        return jsonify({'error': 'Amount and phone number are required'}), 400

    try:
        amount = float(data['amount'])
        phone_number = data['phone_number']

        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400

        # Calculate current available balance
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

        if amount > balance:
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