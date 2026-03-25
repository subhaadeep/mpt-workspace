# 🚀 Full Deployment Guide
## Supabase + Railway + Vercel (100% Free)

---

## STEP 1 — Supabase (Database)

### 1.1 Create Project
1. Go to → https://supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Project name:** `mpt-workspace`
   - **Database password:** Choose a strong password (**save this!**)
   - **Region:** Choose closest to you (e.g. `Southeast Asia`)
4. Click **Create new project** — wait ~2 min

### 1.2 Get Your Connection String
1. Go to **Project Settings** (gear icon, bottom left)
2. Click **Database**
3. Scroll to **Connection string** section
4. Select **URI** tab
5. Copy the string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you set
7. **Save this string** — you'll need it for Railway

### 1.3 Create All Database Tables
1. In Supabase → click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. **Copy and paste the entire SQL below** and click **Run** ▶️

```sql
-- ============================================
-- MPT Workspace - Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    can_access_bots BOOLEAN DEFAULT FALSE,
    can_access_youtube BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'bot_user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_id ON users(id);

-- BOTS TABLE
CREATE TABLE IF NOT EXISTS bots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    tags VARCHAR(500),
    priority INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_bots_id ON bots(id);
CREATE INDEX IF NOT EXISTS ix_bots_name ON bots(name);

-- BOT VERSIONS TABLE
CREATE TABLE IF NOT EXISTS bot_versions (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    version_name VARCHAR(50) NOT NULL,
    notes TEXT,
    changes_description TEXT,
    implemented_features JSONB,
    planned_changes JSONB,
    inputs JSONB,
    screenshots JSONB,
    extra_sections JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_bot_versions_id ON bot_versions(id);
CREATE INDEX IF NOT EXISTS ix_bot_versions_bot_id ON bot_versions(bot_id);

-- CODE STORAGE TABLE
CREATE TABLE IF NOT EXISTS code_storage (
    id SERIAL PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES bot_versions(id) ON DELETE CASCADE,
    language VARCHAR(50) DEFAULT 'python',
    filename VARCHAR(255),
    code_content TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_code_storage_id ON code_storage(id);

-- GA DATA TABLE (Genetic Algorithm / ML runs)
CREATE TABLE IF NOT EXISTS ga_data (
    id SERIAL PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES bot_versions(id) ON DELETE CASCADE,
    run_name VARCHAR(200),
    notes TEXT,
    algo_type VARCHAR(100) DEFAULT 'GA',
    parameter_sets JSONB,
    optimization_results JSONB,
    best_chromosomes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_ga_data_id ON ga_data(id);

-- PERFORMANCE DATA TABLE
CREATE TABLE IF NOT EXISTS performance_data (
    id SERIAL PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES bot_versions(id) ON DELETE CASCADE,
    timeframe VARCHAR(50),
    total_trades INTEGER,
    win_rate FLOAT,
    profit_factor FLOAT,
    max_drawdown FLOAT,
    net_profit FLOAT,
    sharpe_ratio FLOAT,
    extra_metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_performance_data_id ON performance_data(id);

-- TEST DATA TABLE
CREATE TABLE IF NOT EXISTS test_data (
    id SERIAL PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES bot_versions(id) ON DELETE CASCADE,
    test_name VARCHAR(200),
    test_type VARCHAR(100) DEFAULT 'backtest',
    results JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_test_data_id ON test_data(id);

-- DOCUMENTATION TABLE
CREATE TABLE IF NOT EXISTS documentation (
    id SERIAL PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES bot_versions(id) ON DELETE CASCADE,
    content TEXT,
    format VARCHAR(50) DEFAULT 'markdown',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_documentation_id ON documentation(id);

-- UPLOADED FILES TABLE
CREATE TABLE IF NOT EXISTS uploaded_files (
    id SERIAL PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES bot_versions(id) ON DELETE CASCADE,
    filename VARCHAR(500),
    file_type VARCHAR(100),
    gdrive_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_uploaded_files_id ON uploaded_files(id);

-- YOUTUBE TABLE
CREATE TABLE IF NOT EXISTS youtube_videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'idea',
    script TEXT,
    tags VARCHAR(1000),
    thumbnail_gdrive_url TEXT,
    scheduled_date TIMESTAMPTZ,
    published_url TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_youtube_videos_id ON youtube_videos(id);

-- ============================================
-- CREATE YOUR FIRST ADMIN USER
-- Replace the values below before running!
-- Password hash below = "admin123" (CHANGE IT!)
-- To generate a real hash, see the note in DEPLOY.md
-- ============================================
INSERT INTO users (
    email, hashed_password, full_name,
    is_active, is_admin, can_access_bots,
    can_access_youtube, role
) VALUES (
    'your@email.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxwGsZTbDDCYAkNDy8OvzBh.ppe',
    'Admin',
    true, true, true, true, 'admin'
) ON CONFLICT (email) DO NOTHING;
-- NOTE: The hash above = password "admin123"
-- IMPORTANT: Change your password immediately after first login!
```

✅ After running — you'll see **"Success. No rows returned"** — that's correct!

---

## STEP 2 — Railway (Backend)

### 2.1 Create Railway Account
1. Go to → https://railway.app
2. Sign up with GitHub (use same GitHub account as your repo)

### 2.2 Deploy Backend
1. Click **"New Project"**
2. Click **"Deploy from GitHub repo"**
3. Select **`mpt-workspace`** repo
4. Railway will ask for **Root Directory** → type: `backend`
5. Click **Deploy**

### 2.3 Add Environment Variables
In Railway → your service → **Variables** tab → add these one by one:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase URI from Step 1.2 |
| `SECRET_KEY` | Any random 32-char string (see below) |
| `FRONTEND_URL` | `https://your-app.vercel.app` (fill after Step 3) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` |

**To generate SECRET_KEY** — open any Python terminal:
```python
import secrets
print(secrets.token_hex(32))
```
Or just use: `a3f9d2e1b8c7f6e5d4c3b2a1908f7e6d5c4b3a2918273645566778899aabbcc`

### 2.4 Get Your Railway URL
1. Go to **Settings** tab → **Domains**
2. Click **Generate Domain**
3. Copy it — looks like: `https://mpt-workspace-production-xxxx.railway.app`
4. **Save this URL** — needed for Vercel

### 2.5 Verify Backend Works
Open in browser:
```
https://your-railway-url.railway.app/docs
```
You should see the **FastAPI Swagger UI** ✅

---

## STEP 3 — Vercel (Frontend)

### 3.1 Create Vercel Account
1. Go to → https://vercel.com
2. Sign up with GitHub

### 3.2 Deploy Frontend
1. Click **"Add New Project"**
2. Click **"Import Git Repository"** → select `mpt-workspace`
3. In **"Configure Project"**:
   - **Root Directory:** click Edit → type `frontend`
   - **Framework Preset:** Next.js (auto-detected)
4. **Environment Variables** — click "Add":

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Railway URL from Step 2.4 |

5. Click **Deploy** — wait ~2 min

### 3.3 Get Your Vercel URL
After deploy → copy your URL: `https://mpt-workspace-xxxx.vercel.app`

### 3.4 Update CORS on Railway
1. Go back to Railway → Variables
2. Update `FRONTEND_URL` = your Vercel URL
3. Railway auto-redeploys

---

## STEP 4 — First Login

1. Open your Vercel URL
2. Login with:
   - **Email:** `your@email.com` (whatever you put in the SQL)
   - **Password:** `admin123`
3. **IMMEDIATELY** go to Profile → Change Password!

---

## STEP 5 — Update vercel.json API Proxy

Open `frontend/vercel.json` and replace the destination URL:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-REAL-RAILWAY-URL.railway.app/api/:path*"
    }
  ]
}
```
Commit and push — Vercel auto-redeploys.

---

## ✅ Final Checklist

- [ ] Supabase project created
- [ ] SQL tables created in Supabase SQL Editor
- [ ] Admin user row inserted (email changed to yours)
- [ ] Railway deployed with `backend` as root directory
- [ ] All 5 environment variables set on Railway
- [ ] Railway URL copied
- [ ] Vercel deployed with `frontend` as root directory
- [ ] `NEXT_PUBLIC_API_URL` set on Vercel
- [ ] `FRONTEND_URL` updated on Railway with Vercel URL
- [ ] `frontend/vercel.json` updated with real Railway URL
- [ ] Logged in and changed password

---

## 🆘 Troubleshooting

| Problem | Fix |
|---|---|
| Backend shows 500 error | Check Railway logs → likely wrong `DATABASE_URL` |
| Login fails | Check admin user was inserted in Supabase SQL |
| CORS error | Make sure `FRONTEND_URL` on Railway matches exact Vercel URL |
| Frontend shows blank page | Check `NEXT_PUBLIC_API_URL` is set correctly on Vercel |
| `/docs` 404 on Railway | Railway build not finished yet, wait 1-2 min |

---

## 💰 Cost Summary

| Service | Free Tier | Limit |
|---|---|---|
| **Supabase** | Free | 500MB DB, 2 projects |
| **Railway** | $5 credit/month | ~500 hours runtime |
| **Vercel** | Free forever | Unlimited deploys |

All **completely free** for personal/small team use.
