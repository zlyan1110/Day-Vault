"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getFeed, interact } from "@/lib/api";
import FeedCard from "@/components/FeedCard";
import FeedCardSkeleton from "@/components/FeedCardSkeleton";

interface Card {
  event_id: number;
  year: number | null;
  title: string;
  reason: string;
  image_url: string | null;
  source_url: string | null;
}

export default function FeedPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<
    Record<number, "like" | "dislike">
  >({});
  const [displayDate, setDisplayDate] = useState("");

  useEffect(() => {
    setDisplayDate(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUserId(session.user.id);
      try {
        const data = await getFeed(session.user.id);
        setCards(data.cards || []);
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  const handleInteract = async (
    eventId: number,
    action: "like" | "dislike"
  ) => {
    if (!userId) return;
    setInteractions((prev) => ({ ...prev, [eventId]: action }));
    try {
      await interact(userId, eventId, action);
    } catch {
      setInteractions((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg tracking-tight">DayVault</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {displayDate && (
          <div className="pb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              On This Day
            </p>
            <h2 className="text-2xl font-bold mt-0.5">{displayDate}</h2>
          </div>
        )}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <FeedCardSkeleton key={i} />
          ))
        ) : cards.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No events for today.</p>
            <p className="text-sm mt-1">Check back tomorrow!</p>
          </div>
        ) : (
          cards.map((card, i) => (
            <FeedCard
              key={card.event_id}
              card={card}
              interaction={interactions[card.event_id]}
              onInteract={(action) => handleInteract(card.event_id, action)}
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))
        )}
      </main>
    </div>
  );
}
