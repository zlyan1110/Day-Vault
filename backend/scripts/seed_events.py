"""
seed_events.py

Imports historical events from a JSON file into the Supabase `events` table.
Reads credentials from the project .env file.

Usage:
    # From project root:
    python backend/scripts/seed_events.py
    python backend/scripts/seed_events.py --file backend/data/events_03.json
    python backend/scripts/seed_events.py --all    # seed all events_<MM>.json in backend/data/
    python backend/scripts/seed_events.py --clear  # wipe table before seeding
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

# ── Config ────────────────────────────────────────────────────────────────────

ROOT_DIR = Path(__file__).resolve().parents[2]  # dayvault/
load_dotenv(ROOT_DIR / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]  # service role equivalent
DEFAULT_JSON = ROOT_DIR / "backend" / "data" / "events_02.json"
DATA_DIR = ROOT_DIR / "backend" / "data"
BATCH_SIZE = 500  # rows per upsert call


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_date(date_str: str) -> tuple[int, int]:
    """'02-15'  →  (2, 15)"""
    parts = date_str.split("-")
    return int(parts[0]), int(parts[1])


def transform(raw: dict) -> dict:
    """Map scraper JSON record → events table row."""
    month, day = parse_date(raw["date"])
    return {
        "month": month,
        "day": day,
        "year": raw.get("year"),
        "title": raw["title"],
        "description": raw.get("description"),
        "category": raw.get("category"),
        "image_url": raw.get("image_url"),
        "source_url": raw.get("source_url"),  # null for Wikipedia-scraped data
    }


def seed(client: Client, records: list[dict], clear: bool) -> None:
    if clear:
        print("Clearing existing events table...")
        client.table("events").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("Table cleared.")

    total = len(records)
    inserted = 0

    for i in range(0, total, BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        client.table("events").insert(batch).execute()
        inserted += len(batch)
        print(f"  Inserted {inserted}/{total} rows...")

    print(f"\nDone. {inserted} events seeded into Supabase.")


# ── Main ──────────────────────────────────────────────────────────────────────

def load_all_month_files() -> list[dict]:
    """Load and merge all events_<MM>.json files from the data directory."""
    import glob as _glob
    pattern = str(DATA_DIR / "events_??.json")
    files = sorted(_glob.glob(pattern))
    if not files:
        sys.exit(f"No events_<MM>.json files found in {DATA_DIR}")
    combined: list[dict] = []
    for path in files:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        combined.extend(data)
        print(f"  Loaded {len(data):>5} events from {Path(path).name}")
    return combined


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed events into Supabase.")
    parser.add_argument("--file", default=str(DEFAULT_JSON), help="Path to JSON file")
    parser.add_argument(
        "--all",
        action="store_true",
        dest="all_months",
        help="Seed all events_<MM>.json files from backend/data/",
    )
    parser.add_argument("--clear", action="store_true", help="Delete all rows before inserting")
    args = parser.parse_args()

    if args.all_months:
        print(f"Loading all month files from {DATA_DIR}...")
        raw_events = load_all_month_files()
    else:
        json_path = Path(args.file)
        if not json_path.exists():
            sys.exit(f"File not found: {json_path}")
        print(f"Loading {json_path}...")
        with open(json_path, encoding="utf-8") as f:
            raw_events = json.load(f)

    records = [transform(e) for e in raw_events]
    print(f"Loaded {len(records)} events total.")

    client: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
    seed(client, records, clear=args.clear)


if __name__ == "__main__":
    main()
