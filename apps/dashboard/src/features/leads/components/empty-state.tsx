// Generic placeholder for not-yet-implemented sections (Notes, Activities,
// Timeline). Deliberately just a message, not a full empty-state pattern
// with a CTA - there is no action to offer here yet.
export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}
