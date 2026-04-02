import os
import logging
from flask import Flask, jsonify, g
from flask_migrate import Migrate
from flask_cors import CORS
from sqlalchemy import event
from sqlalchemy.pool import QueuePool

# Import models package to ensure all models are registered
from .models import db
from .routes.auth import auth_bp
from .routes.wallet import wallet_bp
from .routes.payments import payments_bp
from .routes.games import games_bp
from .routes.tournaments import tournaments_bp
from .routes.admin import admin_bp

# Import middleware
from .middleware.rate_limiter import rate_limiter, rate_limit
from .middleware.cache import query_cache
from .middleware.request_queue import request_queue

logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///game_logic.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Connection pooling configuration
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'poolclass': QueuePool,
        'pool_size': 10,           # Number of connections to maintain
        'max_overflow': 20,        # Max connections beyond pool_size
        'pool_timeout': 30,        # Timeout for getting connection
        'pool_recycle': 1800,      # Recycle connections after 30 minutes
        'pool_pre_ping': True,     # Verify connections before use
    }

    # Initialize CORS - Allow requests from the React frontend
    CORS(app, origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
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
    
    # System stats endpoint (for monitoring)
    @app.route('/api/system/stats')
    def system_stats():
        """Get system performance statistics"""
        return jsonify({
            'rate_limiter': rate_limiter.get_stats(),
            'cache': query_cache.get_stats(),
            'request_queue': request_queue.get_stats()
        })
    
    # Request timing middleware
    @app.before_request
    def before_request():
        g.request_start_time = __import__('time').time()
    
    @app.after_request
    def after_request(response):
        # Add timing header
        if hasattr(g, 'request_start_time'):
            import time
            elapsed = time.time() - g.request_start_time
            response.headers['X-Response-Time'] = f"{elapsed:.3f}s"
        
        # Add cache headers
        response.headers['X-Cache-Status'] = getattr(g, 'cache_status', 'NONE')
        
        return response
    
    # Cleanup on shutdown
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()
    
    logger.info("Application initialized with performance optimizations")
    logger.info(f"Connection pool: size={app.config['SQLALCHEMY_ENGINE_OPTIONS']['pool_size']}, "
                f"overflow={app.config['SQLALCHEMY_ENGINE_OPTIONS']['max_overflow']}")

    return app