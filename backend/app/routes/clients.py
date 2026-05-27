from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.client import Client
from app.models.user import User

router = APIRouter(prefix="/clients", tags=["clients"])

class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class ClientOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    address: Optional[str]
    notes: Optional[str]
    created_by_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

def get_client_query(db: Session, user: User):
    """Admin sees all, staff sees only their own."""
    q = db.query(Client)
    if user.role != "admin":
        q = q.filter(Client.created_by_id == user.id)
    return q

@router.get("/", response_model=List[ClientOut])
def list_clients(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = get_client_query(db, current_user)
    if search:
        term = f"%{search}%"
        q = q.filter(
            Client.name.ilike(term) |
            Client.email.ilike(term) |
            Client.company.ilike(term) |
            Client.phone.ilike(term)
        )
    return q.order_by(Client.created_at.desc()).all()

@router.post("/", response_model=ClientOut)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Client name is required")
    client = Client(**data.dict(), created_by_id=current_user.id)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

@router.get("/{client_id}", response_model=ClientOut)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = get_client_query(db, current_user).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.patch("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = get_client_query(db, current_user).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client

@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = get_client_query(db, current_user).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"detail": "Client deleted"}
