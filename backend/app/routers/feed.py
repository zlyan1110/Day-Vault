from datetime import date

from fastapi import APIRouter, Header, HTTPException

from app.db.client import get_supabase
from app.models.schemas import (
    FeedResponse,
    FeedbackRequest,
    FeedbackResponse,
    InteractRequest,
    InteractResponse,
)
from app.services.recommender import build_feed

router = APIRouter(prefix="/api/feed", tags=["feed"])


@router.get("/today", response_model=FeedResponse)
async def today_feed(
    x_user_id: str = Header(..., alias="X-User-Id", description="Supabase user UUID"),
) -> FeedResponse:
    """Return today's personalised feed. Generates and caches on first call."""
    try:
        result = await build_feed(x_user_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Feed generation failed: {exc}") from exc
    return FeedResponse(**result)


@router.post("/interact", response_model=InteractResponse)
async def interact(
    body: InteractRequest,
    x_user_id: str = Header(..., alias="X-User-Id", description="Supabase user UUID"),
) -> InteractResponse:
    """Record a like or dislike interaction."""
    get_supabase().table("user_interactions").insert(
        {
            "user_id": x_user_id,
            "event_id": body.event_id,
            "action": body.action,
        }
    ).execute()
    return InteractResponse(ok=True)


@router.delete("/today", status_code=204)
async def invalidate_feed(
    x_user_id: str = Header(..., alias="X-User-Id", description="Supabase user UUID"),
) -> None:
    """Delete today's cached feed so it regenerates on next GET /today."""
    today = date.today().isoformat()
    get_supabase().table("daily_feeds").delete().eq("user_id", x_user_id).eq(
        "feed_date", today
    ).execute()


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    body: FeedbackRequest,
    x_user_id: str = Header(..., alias="X-User-Id", description="Supabase user UUID"),
) -> FeedbackResponse:
    """Save a 1–5 satisfaction rating for today's feed."""
    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=422, detail="rating must be between 1 and 5")
    today = date.today().isoformat()
    get_supabase().table("daily_feeds").upsert(
        {"user_id": x_user_id, "feed_date": today, "rating": body.rating},
        on_conflict="user_id,feed_date",
    ).execute()
    return FeedbackResponse(ok=True)
