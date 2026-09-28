import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@travio/utils";
import { Input, type InputProps } from "./form";

export interface SearchInputProps extends Omit<InputProps, "type"> {
  containerClassName?: string;
}

// Design System v2.4 (Product-8.1): extracted from CustomersTable/
// LeadsTable/BookingsTable, each of which independently wrote the exact
// same "absolutely-positioned Search icon + pl-9 Input" markup - the
// "elegant filters" brief plus "if several pages need the same
// component, extract it" both point here. Same visual result, one
// implementation.
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <div className={cn("relative", containerClassName)}>
      <Search
        aria-hidden="true"
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input ref={ref} type="search" className={cn("pl-9", className)} {...props} />
    </div>
  ),
);
SearchInput.displayName = "SearchInput";
