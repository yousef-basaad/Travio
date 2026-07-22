// Generic message-only empty state for this feature, matching
// features/leads/components/empty-state.tsx's shape - kept feature-local
// rather than imported cross-feature, same convention as every other CRM
// feature folder.
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
