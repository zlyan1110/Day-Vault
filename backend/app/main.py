import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env before any app imports so env vars are available at module init
load_dotenv(Path(__file__).parents[2] / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import feed, users

app = FastAPI(
    title="DayVault API",
    version="0.1.0",
    description="Personalised On This Day feed powered by LLM recommendations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(feed.router)


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok", "version": app.version}
