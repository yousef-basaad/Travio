"use client";

import { Sparkles, Send } from "lucide-react";
import { Widget, Badge, Input, Button } from "@travio/ui";

const SUGGESTIONS = ["Sales report", "Today's bookings", "Visa requests", "Performance analysis"];

// Design System v2.5 (Product-8.2 Phase 3): approved scope decision -
// UI shell only, no fake AI responses or functionality. Every control
// here is inert (disabled input/button, non-functional suggestion
// chips) - this is a preview of where the assistant will live, not a
// working (or fake-working) one. Same "Coming soon" framing as the
// dedicated /ai-assistant placeholder page (Phase 2), embedded inline
// here to match the reference's own Operations Center layout.
export function AiAssistantPanel() {
  return (
    <Widget
      title="AI Assistant"
      description="Ask about your bookings, sales, and performance"
      action={<Badge variant="info">Coming soon</Badge>}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg bg-surface-muted p-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Hi! I&rsquo;ll be able to help you with reports, bookings, and insights soon.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <span
              key={suggestion}
              aria-disabled="true"
              className="cursor-not-allowed rounded-full border border-border px-3 py-1 text-xs text-muted-foreground opacity-60"
            >
              {suggestion}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input disabled placeholder="Ask something…" className="flex-1" />
          <Button disabled size="sm" aria-label="Send" className="shrink-0 px-2.5">
            <Send size={14} />
          </Button>
        </div>
      </div>
    </Widget>
  );
}
