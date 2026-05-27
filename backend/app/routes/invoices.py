from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.invoice import Invoice, InvoiceItem
from app.models.client import Client
from app.models.product import Product
from app.models.user import User

router = APIRouter(prefix="/invoices", tags=["invoices"])

# ── Schemas ──────────────────────────────────────────────────────────────
class ItemIn(BaseModel):
    product_id: Optional[int] = None
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    cost_price: float = 0.0

class InvoiceCreate(BaseModel):
    client_id: int
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    discount: float = 0.0
    tax: float = 0.0
    items: List[ItemIn] = []

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    discount: Optional[float] = None
    tax: Optional[float] = None
    items: Optional[List[ItemIn]] = None

class ItemOut(BaseModel):
    id: int
    product_id: Optional[int]
    description: str
    quantity: float
    unit_price: float
    cost_price: float

    class Config:
        from_attributes = True

class ClientSnap(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    address: Optional[str]

    class Config:
        from_attributes = True

class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    client_id: int
    client: ClientSnap
    status: str
    issue_date: datetime
    due_date: Optional[datetime]
    notes: Optional[str]
    discount: float
    tax: float
    items: List[ItemOut]
    created_at: datetime

    class Config:
        from_attributes = True

# ── Helpers ───────────────────────────────────────────────────────────────
def generate_invoice_number(db: Session) -> str:
    from datetime import date
    prefix = f"INV-{date.today().strftime('%Y%m')}-"
    last = db.query(Invoice).filter(
        Invoice.invoice_number.like(f"{prefix}%")
    ).order_by(Invoice.id.desc()).first()
    if last:
        try:
            seq = int(last.invoice_number.split("-")[-1]) + 1
        except Exception:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"

def invoice_query(db: Session, user: User):
    q = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.items)
    )
    if user.role != "admin":
        q = q.filter(Invoice.created_by_id == user.id)
    return q

# ── Routes ────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[InvoiceOut])
def list_invoices(
    status: Optional[str] = None,
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = invoice_query(db, current_user)
    if status:
        q = q.filter(Invoice.status == status)
    if client_id:
        q = q.filter(Invoice.client_id == client_id)
    return q.order_by(Invoice.created_at.desc()).all()

@router.post("/", response_model=InvoiceOut)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if not data.items:
        raise HTTPException(status_code=400, detail="Invoice must have at least one item")

    inv = Invoice(
        invoice_number=generate_invoice_number(db),
        client_id=data.client_id,
        created_by_id=current_user.id,
        due_date=data.due_date,
        notes=data.notes,
        discount=data.discount,
        tax=data.tax,
    )
    db.add(inv)
    db.flush()

    for item in data.items:
        db.add(InvoiceItem(invoice_id=inv.id, **item.dict()))

    db.commit()
    db.refresh(inv)
    return db.query(Invoice).options(
        joinedload(Invoice.client), joinedload(Invoice.items)
    ).filter(Invoice.id == inv.id).first()

@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = invoice_query(db, current_user).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv

@router.patch("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(
    invoice_id: int,
    data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = invoice_query(db, current_user).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv.status == "paid" and data.status != "paid":
        pass  # allow un-marking
    for field, value in data.dict(exclude_unset=True, exclude={"items"}).items():
        setattr(inv, field, value)
    if data.items is not None:
        for old in inv.items:
            db.delete(old)
        db.flush()
        for item in data.items:
            db.add(InvoiceItem(invoice_id=inv.id, **item.dict()))
    db.commit()
    db.refresh(inv)
    return db.query(Invoice).options(
        joinedload(Invoice.client), joinedload(Invoice.items)
    ).filter(Invoice.id == inv.id).first()

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = invoice_query(db, current_user).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(inv)
    db.commit()
    return {"detail": "Invoice deleted"}
