from typing import Literal
from pydantic import BaseModel


# ── Users ─────────────────────────────────────────────────────────────────────

class PreferencesRequest(BaseModel):
    tags: list[str]


class PreferencesResponse(BaseModel):
    ok: bool


# ── Feed ──────────────────────────────────────────────────────────────────────

class FeedCard(BaseModel):
    event_id: str
    year: int | None
    title: str
    reason: str
    image_url: str | None
    source_url: str | None


class FeedResponse(BaseModel):
    date: str
    cards: list[FeedCard]


# ── Interactions ──────────────────────────────────────────────────────────────

class InteractRequest(BaseModel):
    event_id: str
    action: Literal["like", "dislike"]


class InteractResponse(BaseModel):
    ok: bool
