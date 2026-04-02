"""
Centralized balance service with caching.
Eliminates redundant balance calculations across routes.
"""
from ..models import WalletTransaction, db
from ..middleware.cache import query_cache, cached
from sqlalchemy import func
import logging

logger = logging.getLogger(__name__)

class BalanceService:
    """
    Service for efficient balance calculations.
    Caches results to avoid repeated database queries.
    """
    
    @staticmethod
    @cached(ttl=30, cache_type='user_balance', key_prefix='balance')
    def get_user_balance(user_id):
        """
        Get user's available balance with caching.
        Returns (balance, locked_balance) tuple.
        """
        try:
            # Calculate available balance
            credit_sum = db.session.query(
                func.sum(WalletTransaction.amount)
            ).filter(
                WalletTransaction.user_id == user_id,
                WalletTransaction.direction == 'credit',
                WalletTransaction.status == 'success'
            ).scalar() or 0
            
            debit_sum = db.session.query(
                func.sum(WalletTransaction.amount)
            ).filter(
                WalletTransaction.user_id == user_id,
                WalletTransaction.direction == 'debit',
                WalletTransaction.status == 'success'
            ).scalar() or 0
            
            balance = float(credit_sum - debit_sum)
            
            # Calculate locked balance (pending transactions)
            locked_credit = db.session.query(
                func.sum(WalletTransaction.amount)
            ).filter(
                WalletTransaction.user_id == user_id,
                WalletTransaction.direction == 'credit',
                WalletTransaction.status == 'pending'
            ).scalar() or 0
            
            locked_debit = db.session.query(
                func.sum(WalletTransaction.amount)
            ).filter(
                WalletTransaction.user_id == user_id,
                WalletTransaction.direction == 'debit',
                WalletTransaction.status == 'pending'
            ).scalar() or 0
            
            locked_balance = float(locked_credit - locked_debit)
            
            return {
                'balance': balance,
                'locked_balance': locked_balance,
                'available': balance - locked_balance
            }
            
        except Exception as e:
            logger.error(f"Error calculating balance for user {user_id}: {e}")
            return {'balance': 0, 'locked_balance': 0, 'available': 0}
    
    @staticmethod
    def check_sufficient_balance(user_id, required_amount):
        """Check if user has sufficient balance for a transaction"""
        balance_info = BalanceService.get_user_balance(user_id)
        return balance_info['available'] >= required_amount
    
    @staticmethod
    def invalidate_balance_cache(user_id):
        """Invalidate balance cache for a user"""
        query_cache.invalidate_user(user_id)
        logger.debug(f"Invalidated balance cache for user {user_id}")
    
    @staticmethod
    @cached(ttl=120, key_prefix='balance_stats')
    def get_balance_statistics():
        """Get platform-wide balance statistics (admin)"""
        try:
            total_credits = db.session.query(
                func.sum(WalletTransaction.amount)
            ).filter(
                WalletTransaction.direction == 'credit',
                WalletTransaction.status == 'success'
            ).scalar() or 0
            
            total_debits = db.session.query(
                func.sum(WalletTransaction.amount)
            ).filter(
                WalletTransaction.direction == 'debit',
                WalletTransaction.status == 'success'
            ).scalar() or 0
            
            pending_transactions = WalletTransaction.query.filter_by(
                status='pending'
            ).count()
            
            return {
                'total_credits': float(total_credits),
                'total_debits': float(total_debits),
                'net_balance': float(total_credits - total_debits),
                'pending_transactions': pending_transactions
            }
            
        except Exception as e:
            logger.error(f"Error calculating balance statistics: {e}")
            return {
                'total_credits': 0,
                'total_debits': 0,
                'net_balance': 0,
                'pending_transactions': 0
            }

# Singleton instance
balance_service = BalanceService()