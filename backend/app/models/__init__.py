# Import db from extensions module to avoid circular imports
from .extensions import db

# Import all models to ensure they're registered with SQLAlchemy
# Note: These imports must come after db is defined to avoid circular imports
from .user import User
from .transaction import WalletTransaction
from .wallet import Payment
from .game import Game, GameEntry
from .tournament import Tournament, TournamentEntry, TournamentMatch

# Export all models for easy import
__all__ = [
    'db',
    'User',
    'WalletTransaction',
    'Payment',
    'Game',
    'GameEntry',
    'Tournament',
    'TournamentEntry',
    'TournamentMatch'
]