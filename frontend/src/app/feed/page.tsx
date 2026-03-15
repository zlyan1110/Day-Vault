"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getFeed, interact, submitFeedback } from "@/lib/api";
import FeedCard from "@/components/FeedCard";
import FeedCardSkeleton from "@/components/FeedCardSkeleton";
import { Button } from "@/components/ui/button";

interface Card {
  event_id: number;
  year: number | null;
  title: string;
  reason: string;
  image_url: string | null;
  source_url: string | null;
}

const FEEDBACK_EMOJIS = [
  { rating: 1, emoji: "😞", label: "Poor" },
  { rating: 2, emoji: "😐", label: "Meh" },
  { rating: 3, emoji: "🙂", label: "OK" },
  { rating: 4, emoji: "😊", label: "Good" },
  { rating: 5, emoji: "🤩", label: "Amazing" },
];

export default function FeedPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<
    Record<number, "like" | "dislike">
  >({});
  const [displayDate, setDisplayDate] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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

  const loadFeed = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFeed(uid);
      setCards(data.cards || []);
    } catch {
      setError("Couldn't load your feed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("tags")
        .eq("user_id", session.user.id)
        .limit(1);
      if (!prefs || prefs.length === 0 || !prefs[0].tags?.length) {
        router.replace("/onboarding");
        return;
      }
      setUserId(session.user.id);
      await loadFeed(session.user.id);
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

  const handleFeedback = async (rating: number) => {
    if (!userId || feedbackSubmitted) return;
    setFeedbackRating(rating);
    try {
      await submitFeedback(userId, rating);
      setFeedbackSubmitted(true);
    } catch {
      setFeedbackRating(null);
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
        ) : error ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              onClick={() => userId && loadFeed(userId)}
            >
              Try again
            </Button>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No events for today.</p>
            <p className="text-sm mt-1">Check back tomorrow!</p>
          </div>
        ) : (
          <>
            {cards.map((card, i) => (
              <FeedCard
                key={card.event_id}
                card={card}
                interaction={interactions[card.event_id]}
                onInteract={(action) => handleInteract(card.event_id, action)}
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}

            {/* Feedback widget */}
            <div className="mt-4 mb-8 rounded-xl border bg-muted/40 px-6 py-5 text-center animate-in fade-in-0 duration-700">
              {feedbackSubmitted ? (
                <p className="text-sm font-medium text-muted-foreground">
                  Thanks for your feedback! See you tomorrow.
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium mb-3">
                    How was today&apos;s feed?
                  </p>
                  <div className="flex justify-center gap-2">
                    {FEEDBACK_EMOJIS.map(({ rating, emoji, label }) => (
                      <button
                        key={rating}
                        onClick={() => handleFeedback(rating)}
                        title={label}
                        className={`text-2xl leading-none rounded-lg p-2 transition-all hover:scale-125 focus:outline-none ${
                          feedbackRating === rating
                            ? "scale-125 bg-muted"
                            : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
