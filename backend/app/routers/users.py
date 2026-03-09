from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException

from app.db.client import get_supabase
from app.models.schemas import PreferencesRequest, PreferencesResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/preferences", response_model=PreferencesResponse)
async def save_preferences(
    body: PreferencesRequest,
    x_user_id: str = Header(..., alias="X-User-Id", description="Supabase user UUID"),
) -> PreferencesResponse:
    """Save (or replace) a user's interest tags."""
    if not body.tags:
        raise HTTPException(status_code=422, detail="tags must not be empty")

    get_supabase().table("user_preferences").upsert(
        {
            "user_id": x_user_id,
            "tags": body.tags,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="user_id",
    ).execute()

    return PreferencesResponse(ok=True)
