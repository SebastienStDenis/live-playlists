import { proxyJson } from "@/lib/api";

export async function GET() {
  return proxyJson("/me/sync", null);
}
