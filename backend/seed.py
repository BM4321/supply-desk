"""
Run once to create the first admin user:
  python seed.py
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import User

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if existing:
        print(f"Admin already exists: {settings.ADMIN_EMAIL}")
        db.close()
        return
    admin = User(
        name=settings.ADMIN_NAME,
        email=settings.ADMIN_EMAIL,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        role="admin",
        is_system=True,
    )
    db.add(admin)
    db.commit()
    print(f"Admin created: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
    db.close()

if __name__ == "__main__":
    seed()
