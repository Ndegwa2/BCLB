from flask import Blueprint, request, jsonify
from ..models import User, db
from ..auth import generate_token

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validate required fields
    required_fields = ['username', 'phone_number', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    username = data['username'].strip()
    phone_number = data['phone_number'].strip()
    password = data['password']
    email = data.get('email', '').strip()

    # Validate username length
    if len(username) < 3 or len(username) > 50:
        return jsonify({'error': 'Username must be between 3 and 50 characters'}), 400

    # Validate password length
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400

    # Check if username already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    # Check if email already exists (if provided)
    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    # Create new user
    user = User(username=username, email=email if email else None, phone_number=phone_number)
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

    # Validate required fields
    if 'username_or_email' not in data or 'password' not in data:
        return jsonify({'error': 'username_or_email and password are required'}), 400

    username_or_email = data['username_or_email'].strip()
    password = data['password']

    # Find user by username or email
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
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
    # For JWT, logout is handled client-side by discarding the token
    # Server-side token blacklisting could be implemented if needed
    return jsonify({'message': 'Logged out'}), 200