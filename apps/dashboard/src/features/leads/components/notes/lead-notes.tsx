"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader } from "@travio/ui";
import { useLeadNotes, useDeleteLeadNote } from "../../api/leads.api";
import { NoteItem } from "./note-item";
import { CreateNoteDialog } from "./create-note-dialog";

function NotesSkeleton() {
  return (
    <div role="status" aria-label="Loading notes" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-16 w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

function NotesErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
    >
      Something went wrong loading notes. Please try again later.
    </div>
  );
}

function NotesEmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">No notes yet</p>
      <Button size="sm" onClick={onAddClick}>
        Add Note
      </Button>
    </div>
  );
}

export function LeadNotes({ leadId }: { leadId: string }) {
  const { data: notes, isLoading, isError } = useLeadNotes(leadId);
  const deleteNote = useDeleteLeadNote();
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
              <NoteItem
                key={note.id}
                note={note}
                onDelete={(id) => deleteNote.mutate({ id, leadId })}
                isDeleting={deleteNote.isPending && deleteNote.variables?.id === note.id}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <CreateNoteDialog leadId={leadId} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </Card>
  );
}
