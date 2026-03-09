# Product Requirements Document — V0

## Product Overview

DayVault is a personalized daily feed that surfaces historical events matching each user's interests. Unlike generic "On This Day" services, the content, framing, and storytelling are tailored to individual users using LLM-powered recommendations.

## Target User

Individual users who enjoy learning about history but want content filtered and framed for their specific interests (e.g., a programmer who wants tech history, a musician who wants music history).

## V0 Scope

V0 is the minimum viable product: a working feed that demonstrates personalized recommendations.

---

## User Flows

### Flow 1: New User Onboarding

```
Open app → Sign up (email/password or OAuth)
  → Interest tag selection screen
  → Select 3-5 tags from a grid
  → Submit → Redirect to daily feed
```

### Flow 2: Daily Feed Consumption

```
Open app → See today's feed (5-10 cards)
  → Scroll through cards
  → Click card to expand full content
  → Like or mark "Not Interested"
  → Come back tomorrow for new feed
```

### Flow 3: Returning User

```
Open app → Automatically logged in
  → See today's feed (already generated or generated on demand)
```

---

## Feature Specifications

### F1: Authentication

- Email/password registration and login
- Google OAuth (optional, nice-to-have for V0)
- Powered by Supabase Auth
- Persistent sessions (don't require login every visit)

### F2: Interest Tag Selection (Onboarding)

Display a grid of interest tags. User selects 3-5 tags.

**Tag list (initial set)**:

| Tag | Category examples |
| --- | ----------------- |
| Science & Technology | Inventions, computing, space |
| Art & Design | Paintings, architecture, photography |
| War & Politics | Battles, treaties, political events |
| Music | Composers, albums, music movements |
| Sports | Olympics, records, famous matches |
| Literature | Authors, book releases, literary movements |
| Film & TV | Movie releases, actors, Hollywood history |
| Space Exploration | NASA, missions, astronomy |
| Business & Economics | Companies, market events, entrepreneurs |
| Medicine | Discoveries, epidemics, medical pioneers |
| Philosophy | Thinkers, movements, ideas |
| Pop Culture | Trends, viral moments, cultural shifts |

**Behavior**:
- Minimum 3 tags required to proceed
- Maximum 5 tags (soft limit, can show warning)
- Tags are stored as JSONB array in user_preferences table
- User can change tags later from profile (V1)

### F3: Daily Feed

The main screen. Shows 5-10 personalized history event cards for today's date.

**Card layout**:

```
┌──────────────────────────────────────┐
│  [Image]                             │
│                                      │
│  YEAR                                │
│  Event Title                         │
│  Personalized recommendation reason  │
│  (2-3 sentences, tailored to user)   │
│                                      │
│  [👍 Like]         [👎 Not for me]   │
└──────────────────────────────────────┘
```

**Card fields**:
- `image_url`: External URL (Wikipedia/Wikimedia), displayed as background or top image
- `year`: The year the event occurred
- `title`: Event title (from database)
- `reason`: LLM-generated personalized recommendation reason (why this user would find this interesting)
- `expanded_content` (on click): Longer LLM-generated content, told from the user's interest perspective

**Feed behavior**:
- Generated once per user per day (cached after first generation)
- If user visits multiple times in a day, show the same feed
- Scroll vertically through cards
- Loading skeleton while feed generates (may take 5-10 seconds on first load)

### F4: User Interactions

Two simple actions per card:

- **Like** (👍): Positive signal, saved to database
- **Not for me** (👎): Negative signal, saved to database, card visually dimmed

Both are optional. User can scroll past without interacting.

**Data captured per interaction**:
- user_id
- event_id
- action: "like" | "dislike"
- timestamp

(V1 will add: click, read_duration, share)

---

## Recommendation Pipeline (V0)

### Step 1: Candidate Retrieval

```sql
SELECT * FROM events WHERE month = {today.month} AND day = {today.day};
```

Returns all historical events for today's date (typically 100-400 events).

### Step 2: Tag-based Filtering

Filter candidates to those matching user's interest tags. Keep ~30-50 candidates.

If fewer than 20 candidates match, relax the filter (include adjacent categories).

### Step 3: LLM Ranking + Reason Generation

Send to GPT-4o-mini:

```
System: You are a personalized history recommendation engine.

User:
The user is interested in: {user_tags}

Here are historical events from today's date. Select the top 8 most
relevant events for this user and generate a personalized recommendation
reason (2-3 sentences) for each.

Respond in JSON format:
[
  {
    "event_id": 123,
    "rank": 1,
    "reason": "As someone interested in technology, you'll find it
               fascinating that..."
  },
  ...
]

Candidate events:
{candidates as JSON array}
```

### Step 4: Feed Assembly

- Take the top 8 ranked events
- Attach the LLM-generated reasons
- Cache the result for this user + date
- Return to frontend

---

## Data Model

### events

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | uuid | Primary key |
| month | int | 1-12 |
| day | int | 1-31 |
| year | int | Year the event occurred |
| title | text | Event title |
| description | text | Event description (from source) |
| category | text | Primary category tag |
| image_url | text | External image URL (nullable) |
| source_url | text | Source link |
| created_at | timestamptz | Record creation time |

### user_preferences

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| tags | jsonb | Array of selected interest tags |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### user_interactions

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| event_id | uuid | FK to events |
| action | text | "like" or "dislike" |
| created_at | timestamptz | |

### daily_feeds (cache)

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| feed_date | date | The date this feed is for |
| feed_data | jsonb | Array of {event_id, rank, reason} |
| created_at | timestamptz | |

**Unique constraint**: (user_id, feed_date) — one feed per user per day.

---

## API Endpoints (V0)

### POST /api/users/preferences

Save user's interest tags after onboarding.

```json
// Request
{ "tags": ["Science & Technology", "Music", "Space Exploration"] }

// Response
{ "ok": true }
```

### GET /api/feed/today

Get today's personalized feed for the authenticated user.

```json
// Response
{
  "date": "2026-02-26",
  "cards": [
    {
      "event_id": "uuid",
      "year": 1991,
      "title": "Tim Berners-Lee introduces WorldWideWeb",
      "reason": "As a tech enthusiast, you'll appreciate that...",
      "image_url": "https://upload.wikimedia.org/...",
      "source_url": "https://en.wikipedia.org/..."
    }
  ]
}
```

**Behavior**: If feed exists in daily_feeds cache, return it. Otherwise, run the recommendation pipeline, cache, and return.

### POST /api/feed/interact

Record a user interaction with a card.

```json
// Request
{ "event_id": "uuid", "action": "like" }

// Response
{ "ok": true }
```

---

## Non-functional Requirements

### Performance

- Feed generation: < 15 seconds on first load (LLM latency)
- Feed retrieval (cached): < 500ms
- Frontend initial load: < 3 seconds

### Data

- Seed at least 1 month of historical events for testing
- Full 365 days before V0 launch
- Minimum 100 events per date for meaningful recommendations

### Design

- Mobile-first responsive design
- Clean, minimal card-based UI
- Skeleton loading states
- Dark mode (nice-to-have)

---

## Out of Scope for V0

- Embedding-based retrieval (V1)
- User profile evolution from behavior (V1)
- Self-hosted LLM inference (V2)
- Learning Path module (V3)
- Meme of the Day (V3)
- Social features (sharing, following)
- Push notifications
- Native mobile app
