from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone_number = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    wallet_transactions = db.relationship('WalletTransaction', backref='user', lazy=True)
    game_entries = db.relationship('GameEntry', backref='user', lazy=True)
    created_games = db.relationship('Game', backref='creator', lazy=True)
    tournament_entries = db.relationship('TournamentEntry', backref='user', lazy=True)

    def set_password(self, password):
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'phone_number': self.phone_number,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class WalletTransaction(db.Model):
    __tablename__ = 'wallet_transactions'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    direction = db.Column(db.String(10), nullable=False)  # 'credit' or 'debit'
    tx_type = db.Column(db.String(20), nullable=False)  # 'deposit', 'withdrawal', 'game_win', 'game_loss', 'house_cut'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'success', 'failed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    description = db.Column(db.String(255))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'amount': float(self.amount),
            'direction': self.direction,
            'tx_type': self.tx_type,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'description': self.description
        }

class Game(db.Model):
    __tablename__ = 'games'

    id = db.Column(db.Integer, primary_key=True)
    game_code = db.Column(db.String(10), unique=True, nullable=False)
    game_type = db.Column(db.String(20), nullable=False)  # 'draw_1v1', 'pool_8ball', 'card_blackjack', 'tournament_single_elimination'
    stake_amount = db.Column(db.Numeric(10, 2), nullable=False)
    total_pot = db.Column(db.Numeric(10, 2), default=0)
    status = db.Column(db.String(20), default='waiting')  # 'waiting', 'in_progress', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    entries = db.relationship('GameEntry', backref='game', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'game_code': self.game_code,
            'game_type': self.game_type,
            'stake_amount': float(self.stake_amount),
            'total_pot': float(self.total_pot),
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'creator_id': self.creator_id
        }

class GameEntry(db.Model):
    __tablename__ = 'game_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    stake_amount = db.Column(db.Numeric(10, 2), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    result = db.Column(db.String(20))  # 'win', 'loss', 'draw'
    payout_amount = db.Column(db.Numeric(10, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'stake_amount': float(self.stake_amount),
            'joined_at': self.joined_at.isoformat(),
            'result': self.result,
            'payout_amount': float(self.payout_amount)
        }

class Tournament(db.Model):
    __tablename__ = 'tournaments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    game_type = db.Column(db.String(20), nullable=False)
    entry_fee = db.Column(db.Numeric(10, 2), nullable=False)
    max_players = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='open')  # 'open', 'in_progress', 'completed'
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    entries = db.relationship('TournamentEntry', backref='tournament', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'game_type': self.game_type,
            'entry_fee': float(self.entry_fee),
            'max_players': self.max_players,
            'status': self.status,
            'winner_id': self.winner_id,
            'game_id': self.game_id,
            'created_at': self.created_at.isoformat()
        }

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'success', 'failed'
    message = db.Column(db.String(255))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    phone_number = db.Column(db.String(15), nullable=False)
    wallet_tx_id = db.Column(db.Integer, db.ForeignKey('wallet_transactions.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'status': self.status,
            'message': self.message,
            'user_id': self.user_id,
            'amount': float(self.amount),
            'phone_number': self.phone_number,
            'wallet_tx_id': self.wallet_tx_id,
            'created_at': self.created_at.isoformat()
        }

class TournamentEntry(db.Model):
    __tablename__ = 'tournament_entries'

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')  # 'active', 'eliminated', 'winner'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'user_id': self.user_id,
            'joined_at': self.joined_at.isoformat(),
            'status': self.status
        }