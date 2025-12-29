from datetime import datetime
from .. import db

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