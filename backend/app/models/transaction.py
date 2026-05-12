from datetime import datetime, timezone
from typing import Optional, Any
from .extensions import db

class WalletTransaction(db.Model):
    __tablename__ = 'wallet_transactions'
    __table_args__ = (
        db.Index('idx_wallet_transactions_user_id', 'user_id'),
        db.Index('idx_wallet_transactions_status', 'status'),
        db.Index('idx_wallet_transactions_tx_type', 'tx_type'),
    )

    id: int = db.Column(db.Integer, primary_key=True)
    amount: float = db.Column(db.Numeric(10, 2), nullable=False)
    direction: str = db.Column(db.String(10), nullable=False)  # 'credit' or 'debit'
    tx_type: str = db.Column(db.String(20), nullable=False)  # 'deposit', 'withdrawal', 'game_win', 'game_loss', 'house_cut', 'game_stake', 'tournament_entry', 'tournament_win', 'game_refund'
    status: str = db.Column(db.String(20), default='pending', index=True)  # 'pending', 'success', 'failed'
    created_at: datetime = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: datetime = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    description: Optional[str] = db.Column(db.String(255))
    user_id: int = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'amount': float(self.amount),
            'direction': self.direction,
            'tx_type': self.tx_type,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else '',
            'description': self.description or ''
        }