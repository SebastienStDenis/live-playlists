import type { Interest, UserArtist } from "@/lib/api-types";

import {
  LOVED_TRACKS_KIND,
  SIMILAR_ARTIST_KIND,
  TOP_ARTIST_KIND,
} from "./artist-kinds";

export function rankOf(userArtist: UserArtist): number {
  const rank = userArtist.interests.find(
    (interest) => interest.kind === TOP_ARTIST_KIND,
  )?.evidence.rank;
  return rank ?? Number.MAX_SAFE_INTEGER;
}

export function playsOf(userArtist: UserArtist): number {
  return (
    userArtist.interests.find((interest) => interest.kind === TOP_ARTIST_KIND)
      ?.evidence.playcount ?? -1
  );
}

export function lovedOf(userArtist: UserArtist): number {
  return (
    userArtist.interests.find((interest) => interest.kind === LOVED_TRACKS_KIND)
      ?.evidence.track_count ?? -1
  );
}

export function suggestionOf(userArtist: UserArtist): Interest | undefined {
  return userArtist.interests.find(
    (interest) => interest.kind === SIMILAR_ARTIST_KIND,
  );
}

export function scoreOf(userArtist: UserArtist): number {
  return suggestionOf(userArtist)?.weight ?? 0;
}

export function compareByName(a: UserArtist, b: UserArtist): number {
  return a.artist.name.localeCompare(b.artist.name);
}
