from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.product import Product

router = APIRouter(prefix="/products", tags=["products"])

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    unit: Optional[str] = None
    cost_price: float = 0.0
    sell_price: float = 0.0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    cost_price: Optional[float] = None
    sell_price: Optional[float] = None
    is_active: Optional[bool] = None

class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    unit: Optional[str]
    cost_price: float
    sell_price: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductOut])
def list_products(
    search: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Product)
    if active_only:
        q = q.filter(Product.is_active == True)
    if search:
        term = f"%{search}%"
        q = q.filter(Product.name.ilike(term) | Product.description.ilike(term))
    return q.order_by(Product.name).all()

@router.post("/", response_model=ProductOut)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
    if data.sell_price < 0 or data.cost_price < 0:
        raise HTTPException(status_code=400, detail="Prices cannot be negative")
    product = Product(**data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"detail": "Product deleted"}
