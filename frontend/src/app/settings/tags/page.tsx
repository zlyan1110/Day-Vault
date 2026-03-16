"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { savePreferences, invalidateFeed } from "@/lib/api";
import TagSelector from "@/components/TagSelector";

export default function EditTagsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("user_preferences")
        .select("tags")
        .eq("user_id", session.user.id)
        .limit(1);

      if (data && data.length > 0 && data[0].tags?.length) {
        setSelected(new Set(data[0].tags as string[]));
      }
      setUserId(session.user.id);
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!userId || selected.size === 0) return;
    setSaving(true);
    try {
      await savePreferences(userId, Array.from(selected));
      // Invalidate today's cached feed so it regenerates with new tags
      await invalidateFeed(userId);
      setSaved(true);
      setTimeout(() => router.replace("/feed"), 800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-lg tracking-tight">Edit Interests</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Update your topics — your feed will regenerate with the new selection.
        </p>

        <div className="mb-8">
          <TagSelector selected={selected} onChange={setSelected} />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleSave}
            disabled={selected.size === 0 || saving || saved}
            size="lg"
            className="px-8"
          >
            {saved
              ? "Saved!"
              : saving
              ? "Saving..."
              : `Save ${selected.size} topic${selected.size === 1 ? "" : "s"}`}
          </Button>
        </div>
      </main>
    </div>
  );
}
