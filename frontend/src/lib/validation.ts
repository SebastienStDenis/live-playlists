// A deliberately loose shape check for instant client-side hints, not
// authoritative validation: a syntactically valid address still may not exist.
// The real check is the confirmation email Supabase sends. Mirrors the spirit
// of the browser's own `type="email"` regex.
export const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
