import os
from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS

# Import models package to ensure all models are registered
from .models import db
from .routes.auth import auth_bp
from .routes.wallet import wallet_bp
from .routes.payments import payments_bp
from .routes.games import games_bp
from .routes.tournaments import tournaments_bp
from .routes.admin import admin_bp

def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///game_logic.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize CORS - Allow requests from the React frontend
    CORS(app, origins=['http://localhost:3000'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization'])

    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(wallet_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(games_bp)
    app.register_blueprint(tournaments_bp)
    app.register_blueprint(admin_bp)

    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'healthy'}

    return app