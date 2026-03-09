"""
fetch_wikipedia_events.py

Fetches "On This Day" historical events from the Wikipedia REST API for a
given month and saves them as a JSON file. Defaults to February for testing.

Usage:
    python backend/scripts/fetch_wikipedia_events.py
    python backend/scripts/fetch_wikipedia_events.py --month 03 --output backend/data/events_march.json
"""

import argparse
import json
import os
import re
import time
import warnings

import requests

BASE_URL = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all"
CATEGORIES = ["selected", "events", "births", "deaths", "holidays"]
HEADERS = {"User-Agent": "DayVault/0.1 (educational project; github.com/dayvault)"}
DELAY = 1.0  # seconds between requests — stay well within 500 req/hour limit

DAYS_PER_MONTH = {
    "01": 31, "02": 28, "03": 31, "04": 30, "05": 31, "06": 30,
    "07": 31, "08": 31, "09": 30, "10": 31, "11": 30, "12": 31,
}


def extract_year(text: str, event_year: int | None) -> int | None:
    """Return the event year.

    For births/deaths/holidays the API provides a `year` field directly.
    For events/selected the year must be parsed from the leading text, e.g.
    "1969 – Neil Armstrong becomes the first person to walk on the Moon."
    """
    if event_year is not None:
        return event_year
    # Match the first 3-4 digit number that could be a year (100–2099)
    match = re.search(r"\b([1-9]\d{2,3})\b", text)
    if match:
        return int(match.group(1))
    return None


def parse_event(event: dict, date_str: str, category: str) -> dict:
    """Convert a raw Wikipedia API event object into our target schema."""
    pages = event.get("pages", [])
    page = pages[0] if pages else {}
    titles = page.get("titles", {})
    thumbnail = page.get("thumbnail", {})

    text = event.get("text", "")
    title = titles.get("normalized") or text[:80]
    image_url = thumbnail.get("source") or None

    return {
        "date": date_str,
        "year": extract_year(text, event.get("year")),
        "title": title,
        "description": text,
        "category": category,
        "image_url": image_url,
    }


def fetch_day(month: str, day: int) -> list[dict]:
    """Fetch all events for a single month/day from the Wikipedia API."""
    url = f"{BASE_URL}/{month}/{day:02d}"
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    data = response.json()

    date_str = f"{month}-{day:02d}"
    results = []
    for cat in CATEGORIES:
        for event in data.get(cat, []):
            results.append(parse_event(event, date_str, cat))
    return results


def fetch_month(month: str) -> list[dict]:
    """Fetch all events for every day in the given month."""
    total_days = DAYS_PER_MONTH.get(month, 30)
    all_events: list[dict] = []

    for day in range(1, total_days + 1):
        label = f"{month}/{day:02d}"
        try:
            events = fetch_day(month, day)
            all_events.extend(events)
            print(f"  {label}: {len(events)} events")
        except requests.HTTPError as exc:
            warnings.warn(f"HTTP error for {label}: {exc}")
        except requests.RequestException as exc:
            warnings.warn(f"Request failed for {label}: {exc}")

        if day < total_days:
            time.sleep(DELAY)

    return all_events


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch Wikipedia On This Day events.")
    parser.add_argument("--month", default="02", help="Two-digit month (default: 02)")
    parser.add_argument(
        "--output",
        default=None,
        help="Output JSON path (default: backend/data/events_<month>.json)",
    )
    args = parser.parse_args()

    month = args.month.zfill(2)
    if month not in DAYS_PER_MONTH:
        raise SystemExit(f"Invalid month: {month!r}. Must be 01–12.")

    output_path = args.output or os.path.join(
        os.path.dirname(__file__), "..", "data", f"events_{month}.json"
    )
    output_path = os.path.normpath(output_path)

    print(f"Fetching Wikipedia On This Day events for month {month}...")
    all_events = fetch_month(month)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(all_events, fh, ensure_ascii=False, indent=2)

    print(f"\nDone. {len(all_events)} events saved to {output_path}")


if __name__ == "__main__":
    main()
