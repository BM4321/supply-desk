from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routes import auth, users, clients, products, invoices, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SupplyDesk API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://supplydesk.netlify.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(clients.router)
app.include_router(products.router)
app.include_router(invoices.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {"message": "SupplyDesk API is running"}
