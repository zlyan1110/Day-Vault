const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(
  path: string,
  userId: string,
  options?: RequestInit
) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getFeed(userId: string) {
  return apiFetch("/api/feed/today", userId);
}

export async function savePreferences(userId: string, tags: string[]) {
  return apiFetch("/api/users/preferences", userId, {
    method: "POST",
    body: JSON.stringify({ tags }),
  });
}

export async function interact(
  userId: string,
  eventId: number,
  action: "like" | "dislike"
) {
  return apiFetch("/api/feed/interact", userId, {
    method: "POST",
    body: JSON.stringify({ event_id: eventId, action }),
  });
}
