"use client";

import type { BookingNote } from "../../types/booking";
import { Button } from "@travio/ui";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

type BookingNoteItemProps = {
  note: BookingNote;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

// Mirrors leads/components/notes/note-item.tsx exactly, retargeted at
// BookingNote.
export function BookingNoteItem({ note, onDelete, isDeleting }: BookingNoteItemProps) {
  const t = useT();
  const format = useFormat();
  return (
    <li className="space-y-2 rounded-md border p-3">
      <p className="whitespace-pre-wrap text-sm">{note.body}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {/* Raw id, not a resolved name - no profiles join exists yet,
              same convention as NoteItem/BookingTimelineItem. */}
          <span title={note.createdBy ?? undefined}>
            {note.createdBy ? `${note.createdBy.slice(0, 8)}…` : t("common.unknown")}
          </span>
          {" · "}
          {/* Relative time + absolute-date tooltip - matches
              BookingTimelineItem's timestamp convention (Product-2), so
              the two lists sharing this tab read consistently. */}
          <span title={format.date(note.createdAt)}>{format.relativeTime(note.createdAt)}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
          aria-label={t("bookings.notes.deleteLabel")}
        >
          {isDeleting ? t("common.deleting") : t("common.delete")}
        </Button>
      </div>
    </li>
  );
}
