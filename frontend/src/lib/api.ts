import "server-only";

import { cache } from "react";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const apiUrl = process.env.API_URL ?? "http://localhost:8000";

// Resolve the Supabase session once per request: a single dashboard render
// issues many apiFetch calls, and each would otherwise rebuild the server
// client and re-read the session cookie.
const currentSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
});

export async function apiFetch(
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> } = {},
): Promise<Response> {
  const session = await currentSession();
  if (!session) {
    // The proxy guards pages, so this only fires on expiry races.
    redirect("/");
  }
  return fetch(`${apiUrl}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
}

// The shared shape of the API-proxy route handlers: forward to the backend
// and reduce any failure - backend error or unreachable backend - to a 502
// with a body the client-side callers can consume as JSON.
export async function proxyJson(
  path: string,
  errorBody: unknown,
): Promise<Response> {
  try {
    const res = await apiFetch(path);
    if (!res.ok) {
      return Response.json(errorBody, { status: 502 });
    }
    return Response.json(await res.json());
  } catch {
    return Response.json(errorBody, { status: 502 });
  }
}
