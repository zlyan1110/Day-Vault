"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";

async function resolveDestination(userId: string): Promise<"/feed" | "/onboarding"> {
  const { data } = await supabase
    .from("user_preferences")
    .select("tags")
    .eq("user_id", userId)
    .limit(1);
  return data && data.length > 0 && data[0].tags?.length ? "/feed" : "/onboarding";
}

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // On mount: if already logged in, redirect immediately
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const dest = await resolveDestination(session.user.id);
        router.replace(dest);
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  // On new sign-in event
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") return;
      if (event === "SIGNED_IN" && session) {
        if (window.location.hash.includes("type=recovery")) return;
        const dest = await resolveDestination(session.user.id);
        router.replace(dest);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">DayVault</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Your personalized daily history feed
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined
          }
        />
      </div>
    </div>
  );
}
