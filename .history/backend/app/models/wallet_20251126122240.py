from datetime import datetime
from ..models import db

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