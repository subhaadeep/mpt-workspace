# MPT Workspace

> **Modular Platform for Trading & Content** — A centralized, role-based workspace for managing algorithmic trading bots (versions, performance, GA results, code) and YouTube content workflows.

---

## 🗂️ Project Structure

```
mpt-workspace/
├── backend/          # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── api/      # Route handlers (auth, bots, youtube, admin)
│   │   ├── core/     # Config, security, JWT
│   │   ├── db/       # Database models, session
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic
│   ├── alembic/      # DB migrations
│   ├── requirements.txt
│   └── main.py
├── frontend/         # Next.js + Tailwind CSS
│   ├── src/
│   │   ├── app/      # Next.js App Router pages
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/      # API client, auth utils
│   │   └── store/   # Zustand state
│   └── package.json
└── docker-compose.yml
```

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Zustand |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL + SQLAlchemy ORM |
| Auth | JWT (access + refresh tokens) |
| File Storage | Local / S3-compatible |
| Containerization | Docker + Docker Compose |

---

## 🔐 Roles & Permissions

| Role | Bot Module | YouTube Module | Admin Panel |
|---|---|---|---|
| Admin/Manager | ✅ Full | ✅ Full | ✅ Full |
| Bot User | ✅ Assigned | ❌ | ❌ |
| YouTube User | ❌ | ✅ Assigned | ❌ |
| Full User | ✅ | ✅ | ❌ |

---

## 📦 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/subhaadeep/mpt-workspace.git
cd mpt-workspace

# 2. Start with Docker
docker-compose up --build

# 3. Backend runs at: http://localhost:8000
# 4. Frontend runs at: http://localhost:3000
# 5. API Docs at:      http://localhost:8000/docs
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

---

## 🧩 Modules

### Bot Management
- Create bots with descriptions and tags
- Add versions per bot (v1, v2, ...)
- Per version: Performance data, GA results, Backtest logs, Code storage, Documentation

### YouTube Workflow
- Video ideas board
- Script storage per video
- Status pipeline: Planned → Scripted → Edited → Uploaded

### Admin Panel
- User management (create/delete)
- Permission assignment per module
- Activity logs
