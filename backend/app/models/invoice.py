from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    overdue = "overdue"

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="draft")
    issue_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    discount = Column(Float, default=0.0)   # percentage
    tax = Column(Float, default=0.0)        # percentage

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    client = relationship("Client")
    created_by = relationship("User")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    description = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)  # snapshot of cost at time of invoice

    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")
