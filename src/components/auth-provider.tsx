"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.refresh();
      }
    });

    // Refresh session when window regains focus (handles stale tabs)
    const handleFocus = () => {
      supabase.auth.getSession();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  return <>{children}</>;
}
