from datetime import datetime
from ..models import db

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
            'description': self.description or ''
        }