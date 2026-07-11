export function AttentionDot({ pulse = false }: { pulse?: boolean }) {
  return (
    <span
      title="Action needed"
      className={`mr-1.5 inline-block h-2 w-2 rounded-full bg-destructive align-middle ${
        pulse ? "animate-pulse motion-reduce:animate-none" : ""
      }`}
    />
  );
}
