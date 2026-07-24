import { proxyJson } from "@/lib/api";

export async function GET(request: Request) {
  const geonameid = new URL(request.url).searchParams.get("geonameid");
  // Known artists are always requested; hiding them is a view-side filter in
  // the events panel, independent of the user's global setting.
  const params = new URLSearchParams({ include_known_artists: "true" });
  if (geonameid) {
    params.set("geonameid", geonameid);
  }
  return proxyJson(`/me/events?${params}`, []);
}
