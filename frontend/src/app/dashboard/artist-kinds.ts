// Interest-kind vocabulary, mirroring backend/app/matching.py. Lives outside
// any "use client" module so server components get real values, not client
// references.
export const TOP_ARTIST_KIND = "lastfm_top_artist";
export const LOVED_TRACKS_KIND = "lastfm_loved_tracks";
export const KNOWN_ARTIST_KINDS = new Set<string>([
  TOP_ARTIST_KIND,
  LOVED_TRACKS_KIND,
]);
export const SIMILAR_ARTIST_KIND = "similar_artist";
