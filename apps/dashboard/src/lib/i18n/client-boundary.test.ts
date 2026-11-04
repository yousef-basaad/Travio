import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it, expect } from "vitest";

// useT()/useFormat()/useI18n() are client hooks. A component calling them
// from a file without "use client" works while only client components
// import it, then crashes the page ("Attempted to call useT() from the
// server") as soon as a server component renders it. Typecheck can't see
// that, so this test enforces the directive on every such file.
const SRC = join(__dirname, "..", "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe("i18n hooks", () => {
  it('are only used in "use client" files', () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return /\buse(T|Format|I18n)\(\)/.test(source) && !/^\s*["']use client["'];/.test(source);
      })
      .map((file) => relative(SRC, file).replace(/\\/g, "/"));
    expect(offenders).toEqual([]);
  });
});
