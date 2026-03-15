"""
Inference Gateway — all LLM calls go through here.

V0: OpenAI GPT-4o-mini
V2+: swap INFERENCE_BACKEND env var → vLLM / SGLang / TRT-LLM without
     changing any business logic in callers.
"""

import json
import os

from openai import AsyncOpenAI

_client: AsyncOpenAI | None = None

_SYSTEM = """\
You are a curator of history who writes vivid, engaging "On This Day" recommendations \
tailored to each reader's passions. Your tone is warm, curious, and authoritative — \
like a knowledgeable friend who can't wait to share something fascinating. \
You always connect the historical moment to why it matters to *this specific reader* \
given their stated interests."""


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


async def rank_and_reason(
    candidates: list[dict],
    user_tags: list[str],
    top_n: int = 8,
) -> list[dict]:
    """
    Rank candidate events by relevance to user_tags and generate a
    personalised recommendation reason for each of the top_n results.

    Returns a list of dicts: [{"index": int, "rank": int, "reason": str}, ...]
    Indices map back to the input `candidates` list.
    """
    compact = [
        {
            "index": i,
            "title": e["title"],
            "year": e.get("year"),
            "category": e.get("category", "events"),
            "description": (e.get("description") or "")[:250],
        }
        for i, e in enumerate(candidates)
    ]

    user_message = f"""\
Reader interests: {", ".join(user_tags)}

Today's "On This Day" candidates are listed below. Your task:
1. Pick the {top_n} events that will resonate most with this reader's interests.
2. For each, write a recommendation reason of 2–3 sentences that:
   - Opens with a vivid hook — a striking fact, number, or consequence
   - Explicitly connects the event to one of the reader's stated interests
   - Ends with why it matters or what makes it surprising/counter-intuitive
   Avoid generic phrases like "As someone interested in...". Be specific.

Respond ONLY with valid JSON matching this schema exactly:
{{"results": [{{"index": <int>, "rank": <1-based int>, "reason": "<string>"}}, ...]}}

Candidate events (index, year, category, title, description):
{json.dumps(compact, ensure_ascii=False)}"""

    resp = await _get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=0.65,
    )

    parsed = json.loads(resp.choices[0].message.content)

    # Normalise: accept {"results": [...]} or bare list at any top-level key
    if isinstance(parsed, list):
        return parsed
    if "results" in parsed:
        return parsed["results"]
    # fallback: grab the first list value in the object
    for v in parsed.values():
        if isinstance(v, list):
            return v
    return []
