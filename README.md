# SupplyDesk — General Supplies Management System

## Prerequisites

Install these on your Mac before starting:

1. **Python 3.11+** — https://www.python.org/downloads/
2. **Node.js 18+** — https://nodejs.org/
3. **PostgreSQL** — easiest via Postgres.app: https://postgresapp.com/

---

## 1. Database Setup

Open the **Postgres.app**, start the server, then open a terminal:

```bash
psql postgres
CREATE DATABASE supplydesk;
\q
```

---

## 2. Backend Setup

```bash
cd supplydesk/backend

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (edit if needed)
cp .env .env.local   # optional — .env works fine locally

# Seed the first admin user
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API is now running at: http://localhost:8000
API docs (auto-generated): http://localhost:8000/docs

---

## 3. Frontend Setup

Open a **new terminal tab**:

```bash
cd supplydesk/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend is now running at: http://localhost:5173

---

## 4. Login

Open http://localhost:5173 and sign in with:
- **Email:** admin@example.com
- **Password:** admin123

> Change these in `backend/.env` before going live.

---

## Project Structure

```
supplydesk/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py       # Environment settings
│   │   │   ├── database.py     # DB connection
│   │   │   └── security.py     # JWT + password hashing
│   │   ├── models/
│   │   │   └── user.py         # User DB model
│   │   ├── routes/
│   │   │   ├── auth.py         # Login endpoint
│   │   │   └── users.py        # User CRUD (admin only)
│   │   └── main.py             # FastAPI app entry point
│   ├── seed.py                 # Creates first admin
│   ├── requirements.txt
│   └── .env
└── frontend/
    └── src/
        ├── App.jsx             # Routes
        ├── api.js              # Axios instance
        ├── context/
        │   └── AuthContext.jsx # Auth state
        ├── components/
        │   ├── Layout.jsx      # Sidebar + shell
        │   └── ComingSoon.jsx  # Placeholder pages
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            └── Users.jsx
```

---

## API Endpoints (Phase 1)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/login | — | Login, returns JWT |
| GET | /auth/me | ✓ | Current user info |
| GET | /users/ | Admin | List all users |
| POST | /users/ | Admin | Create a user |
| PATCH | /users/{id} | Admin | Update user |
| DELETE | /users/{id} | Admin | Delete user |

---

## Coming Next

- **Phase 2** — Client Management
- **Phase 3** — Products & Services catalog
- **Phase 4** — Invoice & Receipt generation (PDF)
- **Phase 5** — Dashboard with revenue reporting
- **Phase 6** — Hosting on Render + Vercel
