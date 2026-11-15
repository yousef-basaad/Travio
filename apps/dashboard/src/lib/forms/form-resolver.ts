import type { FieldValues, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

// zodResolver for a form whose fields already hold the schema's output
// shape (strings, numbers, nulls). @hookform/resolvers 5 types a form by
// the schema's *input*, and z.preprocess() makes that `unknown`, which
// breaks defaultValues and handleSubmit typing. Validation is unchanged:
// the schema still checks and transforms every submit.
export function formResolver<T extends z.ZodType<FieldValues, FieldValues>>(
  schema: T,
): Resolver<z.output<T>, unknown, z.output<T>> {
  return zodResolver(schema) as unknown as Resolver<z.output<T>, unknown, z.output<T>>;
}
