"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, Skeleton } from "@travio/ui";
import { useBookingNotes, useDeleteBookingNote } from "../../api/bookings.api";
import { BookingNoteItem } from "./booking-note-item";
import { CreateBookingNoteDialog } from "./create-booking-note-dialog";

function NotesSkeleton() {
  return (
    <div role="status" aria-label="Loading notes" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function NotesErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading notes. Please try again later.
    </div>
  );
}

function NotesEmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <EmptyState
      icon={<StickyNote size={20} />}
      title="No notes yet"
      description="Add a note to keep track of calls, requests, or anything worth remembering about this booking."
      action={
        <Button size="sm" onClick={onAddClick}>
          Add Note
        </Button>
      }
    />
  );
}

// Mirrors leads/components/notes/lead-notes.tsx exactly, retargeted at
// bookings - manual agent notes (e.g. "Called customer to confirm
// dietary requirements"), distinct from BookingTimeline's read-only
// system-generated log (booking_created/booking_updated/status_changed).
export function BookingNotes({ bookingId }: { bookingId: string }) {
  const { data: notes, isLoading, isError } = useBookingNotes(bookingId);
  const deleteNote = useDeleteBookingNote();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const hasNotes = !isLoading && !isError && !!notes && notes.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-sm font-medium">Notes</h2>
        {hasNotes && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <NotesSkeleton />
        ) : isError ? (
          <NotesErrorState />
        ) : !hasNotes ? (
          <NotesEmptyState onAddClick={() => setIsCreateOpen(true)} />
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <BookingNoteItem
                key={note.id}
                note={note}
                onDelete={(id) => deleteNote.mutate({ id, bookingId })}
                isDeleting={deleteNote.isPending && deleteNote.variables?.id === note.id}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <CreateBookingNoteDialog bookingId={bookingId} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </Card>
  );
}
