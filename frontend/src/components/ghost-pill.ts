// The ghost-pill treatment for clickable text lines (docs/theme.md's muted
// background hover wash): negative margins cancel the padding so the text
// stays flush with its neighbors while the wash gets a pill to fill.
export const GHOST_PILL_CLASS =
  "-mx-1.5 -my-0.5 flex items-center rounded-md px-1.5 py-0.5 hover:bg-muted dark:hover:bg-muted/50";
