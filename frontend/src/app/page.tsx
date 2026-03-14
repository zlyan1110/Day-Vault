"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

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
      if (!data || data.length === 0 || !data[0].tags?.length) {
        router.replace("/onboarding");
      } else {
        router.replace("/feed");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}
