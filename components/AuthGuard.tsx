"use client";
import { useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-sm text-zinc-500">Checking authentication…</div>
      </div>
    );
  }

  return <>{children}</>;
}
