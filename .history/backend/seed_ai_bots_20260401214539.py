#!/usr/bin/env python3
"""
Seed script to create AI bot users for the game system.
Run this script to populate the database with AI opponents.
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models import db, User

def create_ai_bots():
    """Create AI bot users with different difficulty levels"""
    app = create_app()
    
    with app.app_context():
        # Check if AI bots already exist
        existing_ai = User.query.filter_by(is_ai=True).all()
        if existing_ai:
            print(f"Found {len(existing_ai)} existing AI bots. Skipping creation.")
            return
        
        ai_bots = [
            {
                'username': 'AI_Bot_Easy',
                'email': 'ai.easy@gamebot.com',
                'phone_number': '+1234567890',
                'is_ai': True,
                'ai_difficulty': 'easy'
            },
            {
                'username': 'AI_Bot_Medium',
                'email': 'ai.medium@gamebot.com',
                'phone_number': '+1234567891',
                'is_ai': True,
                'ai_difficulty': 'medium'
            },
            {
                'username': 'AI_Bot_Hard',
                'email': 'ai.hard@gamebot.com',
                'phone_number': '+1234567892',
                'is_ai': True,
                'ai_difficulty': 'hard'
            },
            {
                'username': 'AI_Bot_Expert',
                'email': 'ai.expert@gamebot.com',
                'phone_number': '+1234567893',
                'is_ai': True,
                'ai_difficulty': 'expert'
            }
        ]
        
        for bot_data in ai_bots:
            bot = User(
                username=bot_data['username'],
                email=bot_data['email'],
                phone_number=bot_data['phone_number'],
                is_ai=bot_data['is_ai'],
                ai_difficulty=bot_data['ai_difficulty']
            )
            # Set a dummy password for AI bots
            bot.set_password('ai_bot_password_123')
            db.session.add(bot)
            print(f"Created AI bot: {bot.username} ({bot.ai_difficulty})")
        
        db.session.commit()
        print("AI bots created successfully!")

if __name__ == '__main__':
    create_ai_bots()