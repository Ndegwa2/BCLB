from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy
db = SQLAlchemy()

# Import all models to ensure they're registered with SQLAlchemy
from .user import User
from .transaction import WalletTransaction
from .wallet import Payment
from .game import Game, GameEntry
from .tournament import Tournament, TournamentEntry

# Export all models for easy import
__all__ = [
    'db',
    'User',
    'WalletTransaction', 
    'Payment',
    'Game',
    'GameEntry',
    'Tournament',
    'TournamentEntry'
]