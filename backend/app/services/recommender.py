"""
Core recommendation pipeline.

Steps:
  1. Check daily_feeds cache — return immediately if today's feed exists.
  2. Fetch all events for today (month + day).
  3. Fetch user interest tags.
  4. Prioritise candidates (selected > events > births/deaths/holidays).
  5. Call LLM to rank top 8 and generate personalised reasons.
  6. Cache result in daily_feeds.
  7. Return feed.
"""

from datetime import date

from app.db.client import get_supabase
from app.services import llm

MAX_CANDIDATES = 50

# Category priority for candidate selection (highest = best editorial quality)
_CAT_PRIORITY = {"selected": 0, "events": 1, "holidays": 2, "births": 3, "deaths": 4}


def _priority(event: dict) -> int:
    return _CAT_PRIORITY.get(event.get("category", ""), 99)


def _fetch_today_events() -> list[dict]:
    today = date.today()
    result = (
        get_supabase()
        .table("events")
        .select("*")
        .eq("month", today.month)
        .eq("day", today.day)
        .execute()
    )
    return result.data or []


def _fetch_user_tags(user_id: str) -> list[str]:
    result = (
        get_supabase()
        .table("user_preferences")
        .select("tags")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return result.data[0]["tags"] if result.data else []


def _get_cached_feed(user_id: str, today: str) -> list[dict] | None:
    result = (
        get_supabase()
        .table("daily_feeds")
        .select("feed_data")
        .eq("user_id", user_id)
        .eq("feed_date", today)
        .limit(1)
        .execute()
    )
    return result.data[0]["feed_data"] if result.data else None


def _cache_feed(user_id: str, today: str, cards: list[dict]) -> None:
    get_supabase().table("daily_feeds").upsert(
        {"user_id": user_id, "feed_date": today, "feed_data": cards},
        on_conflict="user_id,feed_date",
    ).execute()


async def build_feed(user_id: str) -> dict:
    today = date.today().isoformat()

    # ── 1. Cache hit ──────────────────────────────────────────────────────────
    cached = _get_cached_feed(user_id, today)
    if cached is not None:
        return {"date": today, "cards": cached}

    # ── 2. Fetch events ───────────────────────────────────────────────────────
    all_events = _fetch_today_events()
    if not all_events:
        return {"date": today, "cards": []}

    # ── 3. Fetch user tags ────────────────────────────────────────────────────
    user_tags = _fetch_user_tags(user_id)

    # ── 4. Prioritise candidates ──────────────────────────────────────────────
    candidates = sorted(all_events, key=_priority)[:MAX_CANDIDATES]

    # ── 5. LLM ranking ────────────────────────────────────────────────────────
    if user_tags:
        ranked = await llm.rank_and_reason(candidates, user_tags)
    else:
        # No preferences yet: return top 8 editorial picks
        ranked = [
            {"index": i, "rank": i + 1, "reason": "A notable historical event from this day in history."}
            for i in range(min(8, len(candidates)))
        ]

    # ── 6. Assemble cards ─────────────────────────────────────────────────────
    cards: list[dict] = []
    for item in sorted(ranked, key=lambda x: x.get("rank", 99)):
        idx = item.get("index")
        if idx is None or not (0 <= idx < len(candidates)):
            continue
        event = candidates[idx]
        cards.append(
            {
                "event_id": event["id"],
                "year": event.get("year"),
                "title": event["title"],
                "reason": item.get("reason", ""),
                "image_url": event.get("image_url"),
                "source_url": event.get("source_url"),
            }
        )

    # ── 7. Cache & return ─────────────────────────────────────────────────────
    _cache_feed(user_id, today, cards)
    return {"date": today, "cards": cards}
