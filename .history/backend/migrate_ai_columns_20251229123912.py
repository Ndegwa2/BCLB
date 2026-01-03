#!/usr/bin/env python3
"""
Migration script to add AI-related columns to existing database.
"""

import sys
import sqlite3
import os

def migrate_database():
    """Add AI-related columns to the users and games tables"""
    
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'game_logic.db')
    
    if not os.path.exists(db_path):
        print("Database file not found. Creating new database...")
        return
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Add columns to users table
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN is_ai BOOLEAN DEFAULT 0")
            print("Added is_ai column to users table")
        except sqlite3.OperationalError:
            print("is_ai column already exists in users table")
            
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN ai_difficulty VARCHAR(20) DEFAULT 'medium'")
            print("Added ai_difficulty column to users table")
        except sqlite3.OperationalError:
            print("ai_difficulty column already exists in users table")
        
        # Add columns to games table
        try:
            cursor.execute("ALTER TABLE games ADD COLUMN allow_ai BOOLEAN DEFAULT 0")
            print("Added allow_ai column to games table")
        except sqlite3.OperationalError:
            print("allow_ai column already exists in games table")
            
        try:
            cursor.execute("ALTER TABLE games ADD COLUMN ai_opponent_id INTEGER")
            print("Added ai_opponent_id column to games table")
        except sqlite3.OperationalError:
            print("ai_opponent_id column already exists in games table")
        
        # Commit changes
        conn.commit()
        print("Migration completed successfully!")
        
        # Create AI bots
        create_ai_bots_direct(conn)
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

def create_ai_bots_direct(conn):
    """Create AI bots directly using SQL"""
    
    # Check if AI bots already exist
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users WHERE is_ai = 1")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"Found {count} existing AI bots. Skipping creation.")
        return
    
    # Create AI bots
    ai_bots = [
        ('AI_Bot_Easy', 'ai.easy@gamebot.com', '+1234567890', 1, 'easy'),
        ('AI_Bot_Medium', 'ai.medium@gamebot.com', '+1234567891', 1, 'medium'),
        ('AI_Bot_Hard', 'ai.hard@gamebot.com', '+1234567892', 1, 'hard')
    ]
    
    for username, email, phone, is_ai, difficulty in ai_bots:
        # Hash password for AI bots (simple hash)
        password_hash = f"hashed_password_{username}"
        
        cursor.execute("""
            INSERT INTO users (username, email, phone_number, password, is_admin, is_ai, ai_difficulty)
            VALUES (?, ?, ?, ?, 0, ?, ?)
        """, (username, email, phone, password_hash, is_ai, difficulty))
        
        print(f"Created AI bot: {username} ({difficulty})")
    
    conn.commit()
    print("AI bots created successfully!")

if __name__ == '__main__':
    migrate_database()