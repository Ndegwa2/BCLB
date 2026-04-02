from app import create_app
from app.models import User

app = create_app()
with app.app_context():
    admin_users = User.query.filter_by(is_admin=True).all()
    print("Admin users found:", len(admin_users))
    for user in admin_users:
        print(f" - {user.username} (ID: {user.id})")