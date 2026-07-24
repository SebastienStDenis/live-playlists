import { proxyJson } from "@/lib/api";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return Response.json([]);
  }
  return proxyJson(`/cities?q=${encodeURIComponent(q)}`, []);
}
