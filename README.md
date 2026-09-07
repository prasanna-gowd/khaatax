# KhaataX — Your Shared Money Ledger

> **Tagline:** "Your shared money ledger."

KhaataX is a production-grade full-stack shared financial ledger designed for pair expense management (roommates, couples, friends, business partners). It solves the common problem of tracking who paid, what was spent, how much each person owes, and recording settlements with automated real-time balance calculations.

---

## 🚀 Key Features

- **Pair Shared Ledger**: Exactly 2 active members per group with strict capacity validation.
- **Real-Time Synchronization**: Native FastAPI WebSockets broadcast events (`transaction_created`, `balance_updated`, `settlement_created`, `member_joined`) across devices instantly.
- **Multiple Split Types**: Supports 50/50 Equal splits, Full Amount splits, and Custom Share splits with backend math validation.
- **Exact Decimal Arithmetic**: Uses Python `Decimal` and PostgreSQL `NUMERIC(12, 2)` to eliminate floating-point rounding errors.
- **Clear Terminology**: Prominent **`[ + I Paid ]`** and **`[ ↑ I Received ]`** actions.
- **Settlement Recording**: Record settlements via Cash, UPI (GPay/PhonePe), Bank Transfer, or Other without actual banking integration.
- **Visual Analytics**: Interactive Recharts graphs showing category breakdowns, daily spending trends, and member contribution comparisons.
- **Security & Authorization**: JWT token authentication with bcrypt password hashing and cross-group authorization middleware.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (Mobile-first responsive UI)
- **State & Server Cache:** TanStack Query (React Query v5)
- **Routing:** React Router v6
- **Visualizations:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** Python 3.12 + FastAPI
- **Database ORM:** SQLAlchemy 2.0 (Async/Sync engine)
- **Data Validation:** Pydantic v2
- **Migrations:** Alembic
- **Auth:** PyJWT + Passlib (bcrypt)
- **Realtime:** WebSockets (`ConnectionManager`)
- **Testing:** Pytest + TestClient

### Database & Infrastructure
- **Production DB:** Supabase PostgreSQL / Render PostgreSQL
- **Local Fallback DB:** SQLite (`khaatax.db`)
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render / Docker

---

## 📁 Project Structure

```
khaatax/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app & routes entrypoint
│   │   ├── core/                # Config, Database engine, Security JWT
│   │   ├── models/              # SQLAlchemy User, Group, Transaction, Settlement
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Balance calculation, Auth, Group, Transaction services
│   │   ├── routers/             # API Router endpoints
│   │   ├── websocket/           # WebSocket ConnectionManager
│   │   └── utils/               # Group code generator
│   ├── tests/                   # Pytest automated test suite
│   ├── alembic/                 # Database migrations
│   ├── Dockerfile               # Production Docker container setup
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client with interceptors
│   │   ├── components/          # Reusable UI cards, forms, modals, charts
│   │   ├── context/             # AuthContext, GroupContext
│   │   ├── hooks/               # useWebSocket hook
│   │   ├── pages/               # LandingPage, DashboardPage, AnalyticsPage, etc.
│   │   ├── routes/              # AppRoutes with protected route guards
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json              # Vercel SPA rewrite configuration
├── .gitignore
├── .env.example
└── README.md
```

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js v20+ & npm

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed development database with demo data (Prasanna & Rahul)
python seed.py

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Run Vite development server
npm run dev
```
- App URL: `http://localhost:5173`

---

## 🧪 Automated Testing

Backend tests cover Authentication, Group Creation, 2-Member Capacity Enforcement, Financial Balance Calculation, and Cross-Group Security Isolation.

```bash
cd backend
.venv\Scripts\pytest
```

---

## 🚢 Production Deployment Guide

### STEP 1: GitHub Repository Setup
1. Create a clean GitHub repository named `khaatax`.
2. Push the codebase:
```bash
git init
git add .
git commit -m "Initial commit - KhaataX production release"
git remote add origin https://github.com/YOUR_USERNAME/khaatax.git
git push -u origin main
```

### STEP 2: Supabase PostgreSQL Database Setup
1. Log in to [Supabase](https://supabase.com) and create a new PostgreSQL project.
2. Navigate to **Project Settings -> Database** and copy the Connection String (`URI`).
3. Replace password placeholder and save your `DATABASE_URL` (format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`).

### STEP 3: Database Migrations
Run Alembic migrations against your production Supabase database:
```bash
cd backend
set DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
.venv\Scripts\alembic upgrade head
```

### STEP 4: Backend Deployment on Render
1. Log in to [Render](https://render.com) and click **New -> Web Service**.
2. Connect your GitHub repository `khaatax`.
3. Configure settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3` or `Docker`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `DATABASE_URL` = `postgresql://...` (Supabase URL)
   - `JWT_SECRET` = `[Generate a secure 32+ character random string]`
   - `FRONTEND_URL` = `https://khaatax.vercel.app`
   - `ALGORITHM` = `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `43200`
5. Click **Deploy Web Service** and note your backend URL (e.g., `https://khaatax-api.onrender.com`).

### STEP 5: Frontend Deployment on Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New -> Project**.
2. Import your `khaatax` GitHub repository.
3. Configure settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variables:
   - `VITE_API_URL` = `https://khaatax-api.onrender.com/api/v1`
   - `VITE_WS_URL` = `wss://khaatax-api.onrender.com/ws`
5. Click **Deploy**.

---

## 🤖 AI Extension Roadmap (Phase 2 Architecture)

KhaataX includes a clean boundary interface `backend/app/services/ai_service.py` to support future AI capabilities without modifying core ledger logic:
- **Natural Language Expense Parsing**: Convert *"I paid 650 for dinner yesterday"* into structured transaction drafts.
- **Voice Input**: Speech-to-text integration for quick mobile entry.
- **Financial Insights**: Summarize monthly spending trends using factual database inputs.

---

## 🛡 Security & Privacy

- Passwords securely hashed with bcrypt.
- JWT access tokens with 30-day expiration.
- Database numbers stored as fixed-point `NUMERIC` types to prevent floating-point loss.
- Multi-tenant group authorization enforced on every REST & WebSocket endpoint.
