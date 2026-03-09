# DayVault

A personalized "On This Day in History" daily feed powered by LLM-based recommendations. The system learns your interests over time and delivers history through the lens that matters most to you.

## What It Does

Every day, hundreds of historical events share your calendar date. DayVault picks the ones you'll actually care about and tells the story from your perspective:

- A software engineer sees "1991: Tim Berners-Lee releases the first web browser" — framed through the lens of technical architecture
- A music lover sees "1932: Johnny Cash is born" — told through the evolution of country music
- Same date, different stories, tailored to you

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js + Tailwind)        → Vercel      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Backend API (FastAPI)                → Railway     │
│  ├── Feed Service (recommendation pipeline)        │
│  ├── User Service (profiles & preferences)         │
│  └── Inference Gateway (swappable LLM backend)     │
└────┬──────────────┬─────────────────┬───────────────┘
     │              │                 │
     ▼              ▼                 ▼
┌─────────┐  ┌───────────┐  ┌─────────────────────┐
│Supabase │  │  Qdrant   │  │  LLM Inference      │
│(Postgres│  │  Cloud    │  │  V0: OpenAI API     │
│ + Auth) │  │(vectors)  │  │  V2: vLLM / SGLang  │
└─────────┘  └───────────┘  │  V3: TRT-LLM/Triton│
                            └─────────────────────┘
```

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Frontend     | Next.js 14+, TypeScript, Tailwind, shadcn/ui |
| Backend      | FastAPI, Pydantic v2, SQLAlchemy        |
| Database     | Supabase (PostgreSQL + Auth)            |
| Vector DB    | Qdrant Cloud (from V1)                  |
| LLM          | OpenAI API (V0-V1) → self-hosted (V2+) |
| Inference    | vLLM → SGLang → TensorRT-LLM → Triton  |
| Monitoring   | Prometheus + Grafana (from V2)          |
| Deployment   | Vercel (frontend), Railway (backend)    |

## Project Structure

```
dayvault/
├── frontend/                # Next.js app
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   └── lib/                 # API client, utilities
├── backend/                 # FastAPI app
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # Pydantic schemas
│   │   └── db/              # Database client
│   └── scripts/             # Data seeding, migrations
├── docker-compose.yml       # Local development
├── .env.example             # Environment variables template
├── ROADMAP.md               # Development phases
└── PRD.md                   # Product requirements (V0)
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (for local development)
- Supabase account
- OpenAI API key

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/dayvault.git
cd dayvault

# Copy environment variables
cp .env.example .env
# Fill in your Supabase URL, API key, and OpenAI API key

# Start backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Start frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Seed Historical Events Data

```bash
cd backend
python scripts/seed_events.py
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full development plan.

- **V0**: Core feed with OpenAI API (~2-3 weeks)
- **V1**: Embedding retrieval + user profile evolution (~2-3 weeks)
- **V2**: Self-hosted inference with vLLM & SGLang (~3-4 weeks)
- **V3**: TensorRT-LLM + Triton + new features (~3-4 weeks)
- **V4**: Benchmark report + polish (~2 weeks)

## License

MIT
