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

_SYSTEM = (
    "You are a personalized history recommendation engine. "
    "Select the most relevant historical events for a user based on their interests "
    "and explain why each event is relevant to them specifically."
)


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
            "description": (e.get("description") or "")[:200],
        }
        for i, e in enumerate(candidates)
    ]

    user_message = f"""The user is interested in: {", ".join(user_tags)}

Here are historical events from today's date in history.
Select the top {top_n} most relevant events and write a personalized recommendation reason (2-3 sentences) for each, explaining why *this* user would find it fascinating.

Respond ONLY with a JSON object in this exact format:
{{"results": [{{"index": 0, "rank": 1, "reason": "As someone interested in..."}}, ...]}}

Candidate events:
{json.dumps(compact, ensure_ascii=False)}"""

    resp = await _get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
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
