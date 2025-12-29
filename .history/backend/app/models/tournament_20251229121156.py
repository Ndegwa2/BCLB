from datetime import datetime
from ..models import db

class Tournament(db.Model):
    __tablename__ = 'tournaments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    game_type = db.Column(db.String(20), nullable=False)
    entry_fee = db.Column(db.Numeric(10, 2), nullable=False)
    max_players = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='open')  # 'open', 'in_progress', 'completed', 'cancelled', 'paused'
    format = db.Column(db.String(30), default='single_elimination')  # 'single_elimination', 'double_elimination'
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=True)
    current_round = db.Column(db.Integer, default=1)
    total_rounds = db.Column(db.Integer, default=0)
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
            'format': self.format,
            'winner_id': self.winner_id,
            'game_id': self.game_id,
            'current_round': self.current_round,
            'total_rounds': self.total_rounds,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
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
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# Tournament Match model for bracket system
class TournamentMatch(db.Model):
    __tablename__ = 'tournament_matches'

    id = db.Column(db.String(50), primary_key=True)  # Format: "round_matchIndex"
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=False)
    round = db.Column(db.Integer, nullable=False)
    match_index = db.Column(db.Integer, nullable=False)
    player1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    player2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'active', 'completed'
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    next_match_id = db.Column(db.String(50), nullable=True)  # ID of the match this winner advances to
    next_match_slot = db.Column(db.Integer, nullable=True)  # 1 or 2 - position in next match
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tournament = db.relationship('Tournament', backref='matches', lazy=True)
    player1 = db.relationship('User', foreign_keys=[player1_id])
    player2 = db.relationship('User', foreign_keys=[player2_id])
    winner = db.relationship('User', foreign_keys=[winner_id])
    next_match = db.relationship('TournamentMatch', foreign_keys=[next_match_id], remote_side=[id])

    def to_dict(self):
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'round': self.round,
            'match_index': self.match_index,
            'player1_id': self.player1_id,
            'player2_id': self.player2_id,
            'winner_id': self.winner_id,
            'status': self.status,
            'game_id': self.game_id,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'next_match_id': self.next_match_id,
            'next_match_slot': self.next_match_slot,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }