from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import hash_password, require_admin, get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "staff"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    is_system: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(User).order_by(User.created_at).all()

@router.post("/", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if data.role not in ("admin", "staff"):
        raise HTTPException(status_code=400, detail="Role must be admin or staff")
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        created_by_id=admin.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_system:
        raise HTTPException(status_code=403, detail="Cannot modify system user")
    if data.name is not None:
        user.name = data.name
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_system:
        raise HTTPException(status_code=403, detail="Cannot delete system user")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}
