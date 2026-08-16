"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, Skeleton } from "@travio/ui";
import { useLeadNotes, useDeleteLeadNote } from "../../api/leads.api";
import { NoteItem } from "./note-item";
import { CreateNoteDialog } from "./create-note-dialog";

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
      message="No notes yet"
      action={
        <Button size="sm" onClick={onAddClick}>
          Add Note
        </Button>
      }
    />
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
