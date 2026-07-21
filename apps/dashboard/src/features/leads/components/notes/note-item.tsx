import type { CrmNote } from "@travio/api";
import { Button } from "@travio/ui";
import { formatDate } from "@travio/utils";

type NoteItemProps = {
  note: CrmNote;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

// No profiles join here by design - same convention as lead-details.tsx's
// Assigned To field: show the raw id (or "Unknown") rather than fabricate
// a name we don't have.
export function NoteItem({ note, onDelete, isDeleting }: NoteItemProps) {
  return (
    <li className="space-y-2 rounded-md border p-3">
      <p className="whitespace-pre-wrap text-sm">{note.body}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground" title={note.createdBy ?? undefined}>
          {note.createdBy ? `${note.createdBy.slice(0, 8)}…` : "Unknown"}
          {" · "}
          {formatDate(note.createdAt)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
          aria-label="Delete note"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </li>
  );
}
