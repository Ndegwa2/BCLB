#!/usr/bin/env python3
"""
Database seeding script to populate initial users (admin, player1, player2)
"""
import sys
import os

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app import create_app
from app.models import db, User

def seed_users():
    """Seed the database with initial users"""
    app = create_app()
    
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        
        print("🌱 Starting database seeding...")
        
        # Check if users already exist
        admin_exists = User.query.filter_by(username='admin').first()
        player1_exists = User.query.filter_by(username='player1').first()
        player2_exists = User.query.filter_by(username='player2').first()
        
        # Create Admin user
        if not admin_exists:
            admin_user = User(
                username='admin',
                email='admin@gamelogic.com',
                phone_number='+254700000001',
                is_admin=True
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            print("✅ Created admin user")
        else:
            print("ℹ️  Admin user already exists")
        
        # Create Player 1
        if not player1_exists:
            player1_user = User(
                username='player1',
                email='player1@gamelogic.com',
                phone_number='+254700000002',
                is_admin=False
            )
            player1_user.set_password('player123')
            db.session.add(player1_user)
            print("✅ Created player1 user")
        else:
            print("ℹ️  Player1 user already exists")
        
        # Create Player 2
        if not player2_exists:
            player2_user = User(
                username='player2',
                email='player2@gamelogic.com',
                phone_number='+254700000003',
                is_admin=False
            )
            player2_user.set_password('player123')
            db.session.add(player2_user)
            print("✅ Created player2 user")
        else:
            print("ℹ️  Player2 user already exists")
        
        # Commit the changes
        try:
            db.session.commit()
            print("🎉 Database seeding completed successfully!")
            
            # Display user information
            print("\n📊 Created users:")
            print("Username    | Email                    | Phone        | Role   ")
            print("-" * 65)
            
            admin = User.query.filter_by(username='admin').first()
            if admin:
                print(f"{admin.username:<12} | {admin.email:<24} | {admin.phone_number:<12} | {'Admin' if admin.is_admin else 'Player'}")
            
            player1 = User.query.filter_by(username='player1').first()
            if player1:
                print(f"{player1.username:<12} | {player1.email:<24} | {player1.phone_number:<12} | {'Admin' if player1.is_admin else 'Player'}")
            
            player2 = User.query.filter_by(username='player2').first()
            if player2:
                print(f"{player2.username:<12} | {player2.email:<24} | {player2.phone_number:<12} | {'Admin' if player2.is_admin else 'Player'}")
                
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during seeding: {str(e)}")
            raise

if __name__ == '__main__':
    seed_users()