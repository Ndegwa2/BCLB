from flask import Blueprint, request, jsonify, g
from ..models import User, db
from ..auth import generate_token, require_auth
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    pattern = r'^\+?1?\d{9,15}$'
    return re.match(pattern, phone) is not None

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validate required fields
    if not data or not data.get('username') or not data.get('phone_number') or not data.get('password'):
        return jsonify({'error': 'username, phone_number, and password are required'}), 400

    username = data['username'].strip()
    email = data.get('email', '').strip()
    phone_number = data['phone_number'].strip()
    password = data['password']

    # Validation
    if len(username) < 3 or len(username) > 50:
        return jsonify({'error': 'Username must be between 3 and 50 characters'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400

    if email and not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400

    if not validate_phone(phone_number):
        return jsonify({'error': 'Invalid phone number format'}), 400

    # Check for existing user
    existing_user = User.query.filter(
        (User.username == username) | 
        (User.email == email if email else False) |
        (User.phone_number == phone_number)
    ).first()

    if existing_user:
        if existing_user.username == username:
            return jsonify({'error': 'Username already taken'}), 409
        elif email and existing_user.email == email:
            return jsonify({'error': 'Email already registered'}), 409
        elif existing_user.phone_number == phone_number:
            return jsonify({'error': 'Phone number already registered'}), 409

    # Create new user
    user = User(
        username=username,
        email=email if email else None,
        phone_number=phone_number,
        is_admin=False
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Generate token
    token = generate_token(user.id)

    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('username_or_email') or not data.get('password'):
        return jsonify({'error': 'username_or_email and password are required'}), 400

    username_or_email = data['username_or_email'].strip()
    password = data['password']

    # Find user by username or email
    user = User.query.filter(
        (User.username == username_or_email) | 
        (User.email == username_or_email)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Generate token
    token = generate_token(user.id)

    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Client-side token invalidation
    # In production, you might want to maintain a blacklist of tokens
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    user = g.current_user
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    return jsonify({
        'token': None,  # Don't return token for /me endpoint
        'user': user.to_dict()
    }), 200