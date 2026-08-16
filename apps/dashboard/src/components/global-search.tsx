"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input, Popover, PopoverAnchor, PopoverContent } from "@travio/ui";

// Design System v2.5 (Product-8.2 Phase 2): the reference's header
// search bar, with real Cmd/Ctrl+K interaction (focuses the input from
// anywhere in the app) and a real open/close results panel - but no
// fabricated results. There's no cross-entity search endpoint anywhere
// in this codebase (each page fetches its own scoped list), and the
// header sits outside any single page's data context, so wiring this to
// "existing available client-side data" isn't honestly possible without
// either a new API (out of scope: "no new APIs") or reading whatever
// happens to already be cached in the query client from whichever page
// the user last visited (unreliable, not a real search). This ships as
// a real, keyboard-accessible shell instead: typing shows a plain
// "search isn't connected yet" state, never invented matches. Wiring a
// real cross-entity search endpoint is a backend decision for a later
// phase.
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full max-w-md">
          <Search
            aria-hidden="true"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search bookings, customers, visa requests…"
            aria-label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            className="h-9 pl-9 pr-14"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-96 p-3"
      >
        <p className="text-sm text-muted-foreground">
          {query
            ? `Search isn't connected yet - "${query}" can't be looked up here.`
            : "Start typing to search across your workspace."}
        </p>
      </PopoverContent>
    </Popover>
  );
}
