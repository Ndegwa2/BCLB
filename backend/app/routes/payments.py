from flask import Blueprint, request, jsonify, g
from ..models import Payment, WalletTransaction, User, db
from ..auth import require_auth
import random
import string
from datetime import datetime

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

@payments_bp.route('/deposit', methods=['POST'])
@require_auth
def deposit():
    user = g.current_user
    data = request.get_json()

    # Validate required fields
    if 'amount' not in data:
        return jsonify({'error': 'Amount is required'}), 400

    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        if amount < 1:
            return jsonify({'error': 'Minimum amount is 1 KES'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount format'}), 400

    # Mock M-Pesa integration - simulate a 85% success rate
    success = random.random() < 0.85
    transaction_id = ''.join(random.choices(string.digits, k=10))

    if success:
        status = 'pending'
        message = 'STK push sent to your phone. Complete the payment to receive funds.'
    else:
        status = 'failed'
        message = 'Payment initialization failed. Please try again.'

    # Create payment record
    payment = Payment(
        status=status,
        message=message,
        user_id=user.id,
        amount=amount,
        phone_number=user.phone_number
    )

    # Create wallet transaction (pending if success)
    if success:
        wallet_tx = WalletTransaction(
            amount=amount,
            direction='credit',
            tx_type='deposit',
            status='pending',
            description='M-Pesa deposit',
            user_id=user.id
        )
        db.session.add(wallet_tx)
        payment.wallet_tx_id = wallet_tx.id

    db.session.add(payment)
    db.session.commit()

    return jsonify({
        'transaction_id': payment.id,
        'status': status,
        'message': message
    }), 200 if success else 402

@payments_bp.route('/withdraw', methods=['POST'])
@require_auth
def withdraw():
    user = g.current_user
    data = request.get_json()

    # Validate required fields
    if 'amount' not in data or 'phone_number' not in data:
        return jsonify({'error': 'Amount and phone_number are required'}), 400

    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        if amount < 10:
            return jsonify({'error': 'Minimum withdrawal is 10 KES'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount format'}), 400

    # Calculate current balance
    from sqlalchemy import func
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

    # Check if sufficient balance
    if balance < amount:
        return jsonify({'error': 'Insufficient balance'}), 400

    # Mock M-Pesa integration - simulate a 80% success rate
    success = random.random() < 0.8
    transaction_id = ''.join(random.choices(string.digits, k=10))

    if success:
        status = 'pending'
        message = 'Withdrawal request processed. You will receive funds shortly.'
    else:
        status = 'failed'
        message = 'Withdrawal failed. Please try again later.'

    # Create payment record
    payment = Payment(
        status=status,
        message=message,
        user_id=user.id,
        amount=amount,
        phone_number=data['phone_number']
    )

    # Create wallet transaction (pending if success)
    if success:
        wallet_tx = WalletTransaction(
            amount=amount,
            direction='debit',
            tx_type='withdrawal',
            status='pending',
            description='M-Pesa withdrawal',
            user_id=user.id
        )
        db.session.add(wallet_tx)
        payment.wallet_tx_id = wallet_tx.id

    db.session.add(payment)
    db.session.commit()

    return jsonify({
        'transaction_id': payment.id,
        'status': status,
        'message': message
    }), 200 if success else 402

@payments_bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """Mock callback endpoint for M-Pesa integration"""
    # In production, this would verify the signature and process the callback
    # For demo purposes, we'll process randomly
    
    data = request.get_json() or {}
    transaction_id = data.get('transaction_id', 'mock_' + ''.join(random.choices(string.digits, k=8)))
    
    # Find the payment by transaction_id or create a mock one
    payment = Payment.query.filter_by(id=int(transaction_id) if transaction_id.isdigit() else 0).first()
    
    if not payment:
        # Create a mock payment for demo
        payment = Payment(
            status='success',
            message='Mock payment completed successfully',
            user_id=1,  # Demo user
            amount=100.00,
            phone_number='+254712345678'
        )
        db.session.add(payment)
    
    # Determine if this is a success or failure (90% success rate for demo)
    success = random.random() < 0.9
    
    if success:
        payment.status = 'success'
        payment.message = 'Payment completed successfully'
        
        # Update wallet transaction if exists
        if payment.wallet_tx_id:
            wallet_tx = WalletTransaction.query.get(payment.wallet_tx_id)
            if wallet_tx:
                wallet_tx.status = 'success'
    else:
        payment.status = 'failed'
        payment.message = 'Payment failed'
        
        # Cancel wallet transaction if exists
        if payment.wallet_tx_id:
            wallet_tx = WalletTransaction.query.get(payment.wallet_tx_id)
            if wallet_tx:
                wallet_tx.status = 'failed'
    
    db.session.commit()
    
    return jsonify({'status': 'processed'}), 200