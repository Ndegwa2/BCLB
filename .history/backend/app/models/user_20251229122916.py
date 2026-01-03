from datetime import datetime
import bcrypt
from ..models import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone_number = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_ai = db.Column(db.Boolean, default=False)
    ai_difficulty = db.Column(db.String(20), default='medium')  # 'easy', 'medium', 'hard'
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