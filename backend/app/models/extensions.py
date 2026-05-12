"""
Extensions module to avoid circular imports.
This file defines the SQLAlchemy instance that is shared across all models.
"""

from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy
db = SQLAlchemy()