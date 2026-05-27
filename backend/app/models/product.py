from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String, nullable=True)        # e.g. "pcs", "kg", "hrs", "box"
    cost_price = Column(Float, default=0.0)     # what they pay to source it
    sell_price = Column(Float, default=0.0)     # what they charge the client
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
