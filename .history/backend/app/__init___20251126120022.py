import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Import models to ensure they're registered with SQLAlchemy
from . import models
from .routes.auth import auth_bp
from .routes.wallet import wallet_bp
from .routes.payments import payments_bp

def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///game_logic.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    models.db.init_app(app)
    migrate = Migrate(app, models.db)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(wallet_bp)
    app.register_blueprint(payments_bp)

    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'healthy'}

    return app