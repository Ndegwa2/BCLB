from app import create_app
from app.models import User

app = create_app()
with app.app_context():
    admin = User.query.filter_by(username='admin').first()
    if admin:
        print("Admin user found:")
        print(f"Username: {admin.username}")
        print(f"Password hash: {admin.password}")
        print(f"Is admin: {admin.is_admin}")
    else:
        print("Admin user not found")