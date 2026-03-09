from fastapi import APIRouter, Header, HTTPException

from app.db.client import get_supabase
from app.models.schemas import (
    FeedResponse,
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
