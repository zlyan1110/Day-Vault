"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { savePreferences } from "@/lib/api";

const INTEREST_TAGS = [
  "Science & Technology",
  "Art & Culture",
  "Politics & Government",
  "War & Military",
  "Exploration & Discovery",
  "Philosophy & Religion",
  "Sports & Olympics",
  "Music & Entertainment",
  "Literature & Writing",
  "Economics & Business",
  "Medicine & Health",
  "Architecture & Engineering",
  "Mathematics",
  "Astronomy & Space",
  "Environmental History",
  "Social Movements",
  "Ancient History",
  "Medieval History",
  "Renaissance",
  "Modern History",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setUserId(session.user.id);
      }
    });
  }, [router]);

  const toggle = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleSave = async () => {
    if (!userId || selected.size === 0) return;
    setSaving(true);
    try {
      await savePreferences(userId, Array.from(selected));
      router.replace("/feed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            What interests you?
          </h1>
          <p className="text-muted-foreground mt-2">
            Select topics to personalize your daily history feed
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {INTEREST_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={selected.has(tag) ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm select-none transition-all hover:scale-105"
              onClick={() => toggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleSave}
            disabled={selected.size === 0 || saving}
            size="lg"
            className="px-8"
          >
            {saving
              ? "Saving..."
              : `Continue with ${selected.size} topic${selected.size === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
