# MPT Workspace

A private workspace for managing trading bots and YouTube content pipeline.

## Stack (100% Free)

| Layer | Service | Free Tier |
|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | Free forever |
| **Backend** | [Railway](https://railway.app) or [Render](https://render.com) | $5 credit/month on Railway / free on Render |
| **Database** | [Supabase](https://supabase.com) | 500MB Postgres free |
| **File Storage** | Google Drive | 15GB free |

## Project Structure

```
mpt-workspace/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # Route handlers
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── core/     # Auth, security, deps
│   │   └── db/       # Database session
│   ├── main.py
│   ├── requirements.txt
│   ├── Procfile          # Railway/Render start command
│   ├── runtime.txt       # Python version
│   └── .env.example      # Copy to .env
└── frontend/         # Next.js 14 frontend
    ├── src/
    ├── vercel.json       # Vercel config
    └── .env.example      # Copy to .env.local
```

## Deploy in 3 Steps

### 1. Database — Supabase (2 min)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy the **Connection String (URI)** from Project Settings > Database
3. Keep it for step 2

### 2. Backend — Railway (3 min)
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select this repo, set **Root Directory** to `backend`
3. Add these environment variables:
   ```
   DATABASE_URL=<your supabase connection string>
   SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
   FRONTEND_URL=<your vercel url, add after step 3>
   ```
4. Railway auto-detects `Procfile` and deploys. Copy your Railway URL.

### 3. Frontend — Vercel (2 min)
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=<your railway backend URL>
   ```
4. Deploy. Done.

### 4. Update CORS
Go back to Railway → update `FRONTEND_URL` to your Vercel URL.

## Local Development

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Fill in your values
uvicorn main:app --reload

# Frontend
cd frontend
npm install
cp .env.example .env.local # Fill in your values
npm run dev
```

## First Admin User

After deploying, create the first admin via the backend console or Supabase SQL editor:
```sql
INSERT INTO users (email, full_name, hashed_password, is_admin, is_active, can_access_bots, can_access_youtube)
VALUES (
  'your@email.com',
  'Your Name',
  '<bcrypt hash of your password>',
  true, true, true, true
);
```

---
*Built with FastAPI + Next.js 14 + Supabase + Vercel*
