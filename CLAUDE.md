# CLAUDE.md

Project context and conventions for Claude Code.

## Project Overview

DayVault — a personalized "On This Day in History" daily feed powered by LLM recommendations. Users select interest tags, and the system delivers historical events tailored to their preferences.

## Current Phase

V0 — Core MVP. See PRD.md for detailed requirements and ROADMAP.md for the full plan.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy
- **Database**: Supabase (PostgreSQL + Auth)
- **LLM**: OpenAI API (GPT-4o-mini) via the openai Python package
- **Deployment**: Vercel (frontend), Railway (backend)

## Project Structure

```
dayvault/
├── frontend/          # Next.js app
├── backend/           # FastAPI app
├── docker-compose.yml
├── .env.example
├── README.md
├── ROADMAP.md
├── PRD.md
└── CLAUDE.md          # This file
```

## Code Conventions

- All code and documentation in **English**
- Python: use type hints, async where appropriate, follow PEP 8
- TypeScript: strict mode, prefer interfaces over types for object shapes
- API responses: always use Pydantic models for validation
- Error handling: return proper HTTP status codes with descriptive messages
- Naming: snake_case for Python, camelCase for TypeScript

## Key Design Decisions

- **Inference Gateway pattern**: All LLM calls go through `backend/app/services/llm.py` which abstracts the underlying provider. V0 uses OpenAI, later versions swap in vLLM/SGLang/etc. without changing business logic.
- **Feed caching**: Each user gets one feed per day, cached in the `daily_feeds` table. Regeneration only happens if no cached feed exists for today.
- **User profile as natural language**: Instead of embedding vectors, user preferences are maintained as human-readable text that gets passed directly into LLM prompts (starting V1).

## Environment Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Database

Using Supabase (hosted PostgreSQL). Tables are created via SQL migrations in `backend/scripts/`. Auth is handled by Supabase Auth — do not build custom auth.

## Testing

- Backend: pytest with httpx for async API testing
- Mock OpenAI API calls in tests (never make real API calls in tests)
- Run: `cd backend && pytest`

## Important Notes

- Never commit .env files or API keys
- External image URLs only (no file storage in V0)
- Mobile-first responsive design
- Keep V0 scope minimal — see PRD.md "Out of Scope" section
