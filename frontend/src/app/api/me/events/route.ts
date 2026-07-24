import { proxyJson } from "@/lib/api";
import { userEventsPath } from "@/lib/user-api";

export async function GET(request: Request) {
  const geonameid = new URL(request.url).searchParams.get("geonameid");
  const path = geonameid
    ? `${userEventsPath()}&${new URLSearchParams({ geonameid })}`
    : userEventsPath();
  return proxyJson(path, []);
}
