import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { IntroText } from "./intro-text";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // Replace (not push) so "/" never lingers in history: an authenticated
    // visit here (e.g. the browser Back button landing on it) would otherwise
    // push a new /dashboard entry on top instead of reusing this one, leaving
    // "/" in history to bounce forward again on the next Back press.
    redirect("/dashboard", RedirectType.replace);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Next.fm
      </h1>
      <div className="flex flex-col items-center gap-1">
        <p className="max-w-md text-center text-lg text-zinc-600 dark:text-zinc-400">
          Live-music discovery through listening.
        </p>
        <IntroText className="max-w-md text-center text-xs text-gray-500 italic" />
      </div>
      <div className="flex gap-4">
        <Link
          className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          href="/login"
        >
          Log in
        </Link>
        <Link
          className="flex h-12 items-center justify-center rounded-full border border-gray-300 px-6 font-medium transition-colors hover:border-foreground dark:border-gray-700"
          href="/signup"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
