"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@travio/hooks";
import { DEFAULT_PAGE_SIZE } from "@travio/api";

// Page + search state for a server-paged table. `search` is what the
// input shows; `debouncedSearch` is what's sent to the server (300ms
// after typing stops). Any change to the debounced search or to `resetKey`
// (e.g. a status filter) goes back to page 1.
export function useListPaging(resetKey?: string) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, resetKey]);

  return { page, setPage, pageSize: DEFAULT_PAGE_SIZE, search, setSearch, debouncedSearch };
}

// If the list shrank under the current page (rows deleted, or a narrower
// search landed before the page reset), the server returns an empty page
// with the real total; step back to the last page that has rows.
export function usePageClamp(
  page: number,
  setPage: (page: number) => void,
  pageSize: number,
  total: number | undefined,
) {
  useEffect(() => {
    if (total === undefined) return;
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > lastPage) setPage(lastPage);
  }, [page, setPage, pageSize, total]);
}
