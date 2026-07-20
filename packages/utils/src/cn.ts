import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard shadcn/ui class-merging utility, shared so every app/package
// resolves Tailwind class conflicts identically.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
